// Local only: uses Postman HTTP simulation and an isolated Mongo replica set.
import assert from 'node:assert/strict';
import crypto from 'crypto';
import express from 'express';
import mongoose from 'mongoose';

async function main() {
  // Set BEFORE importing config, overriding any local/live configuration.
  Object.assign(process.env, { NODE_ENV: 'test', PAYMENT_PROVIDER: 'tezcheck',
    TEZCHECK_API_KEY: 'aps_local_fixture', TEZCHECK_CASH_DESK_CODE: 'cdk_local_fixture',
    TEZCHECK_WEBHOOK_SECRET: 'wbs_local_fixture', TEZCHECK_BASE_URL: 'http://127.0.0.1:4919/tezcheck/api/merchant/v1',
    BOT_TOKEN: '', ADMIN_CHAT_ID: '', ALLOW_SELF_PURCHASE: 'false', JOBS_ENABLED: 'false' });
  const { config } = await import('../config');
  const { paymentService } = await import('../services/paymentService');
  const { reconcileTezcheckPayment, processTezcheckEvents } = await import('../services/tezcheckPayments');
  const { tezcheckClient } = await import('../services/tezcheckClient');
  const { tezcheckWebhook } = await import('../routes/tezcheckWebhook');
  const { Transaction } = await import('../models/Transaction');
  const { TezcheckEvent } = await import('../models/TezcheckEvent');
  const { Product } = await import('../models/Product');
  const { User } = await import('../models/User');
  const { EscrowHold } = await import('../models/EscrowHold');
  const { LedgerEntry } = await import('../models/LedgerEntry');
  const { expirePendingTransactions } = await import('../jobs/scheduler');
  const control = async (body: unknown) => {
    const r = await fetch('http://127.0.0.1:4919/tezcheck/__control', { method: 'POST', body: JSON.stringify(body) });
    assert.equal(r.status, 200);
  };
  const dbName = `tezcheck_test_${Date.now()}`;
  await mongoose.connect(`mongodb://127.0.0.1:27919/${dbName}?replicaSet=tezchecktest`);
  await Promise.all([Transaction.init(), TezcheckEvent.init(), Product.init(), User.init(), EscrowHold.init(), LedgerEntry.init()]);
  const app = express(); app.use(tezcheckWebhook); app.use(express.json());
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  try {
    await control({ reset: true });
    assert.equal((await tezcheckClient.me()).api_client.request_signed, true);
    const seller = await User.create({ telegramId: 101 });
    const buyer = await User.create({ telegramId: 102 });
    async function order() {
      const product = await Product.create({ sellerId: seller._id, title: 'Sinov akkaunt', description: 'Local fixture',
        price: 150000, category: 'Boshqa', status: 'active', sensitiveData: { login: 'test', password: 'test' } });
      const result = await paymentService.createPaymentTransaction(String(product._id), String(buyer._id));
      assert.ok(result.paymentUrl);
      return result.transaction;
    }
    async function paid(t: any, environment = 'live', amount = 15000000) {
      const current = await tezcheckClient.getBill(t.tezcheckBillId!);
      await control({ id: t.tezcheckBillId, patch: { bill: { ...current.bill, state: 'exhausted', paid: true, environment, livemode: environment === 'live' },
        payment: { id: `pay_${t._id}`, state: 'succeeded', amount_minor: amount, fee_minor: 150000, net_minor: amount - 150000,
          refunded_amount_minor: 0, currency: 'UZS', environment, livemode: environment === 'live' } } });
    }
    async function deliver(t: any, eventId: string, delivery: string, type = 'payment.succeeded', valid = true) {
      const raw = JSON.stringify({ id: eventId, type, schema_version: 1, mode: 'test', data: {
        external_reference: String(t._id), bill_id: t.tezcheckBillId, environment: 'live' } });
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signature = 'v1=' + crypto.createHmac('sha256', valid ? 'wbs_local_fixture' : 'wrong').update(`${timestamp}.${delivery}.${raw}`).digest('hex');
      return fetch(`${base}/api/tezcheck/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json',
        'X-Checkout-Timestamp': timestamp, 'X-Checkout-Delivery': delivery, 'X-Checkout-Signature': signature,
        'X-Checkout-Event-Id': `different-header-${delivery}` }, body: raw });
    }
    const t = await order();
    const again = await paymentService.createPaymentTransaction(String(t.productId), String(buyer._id));
    assert.equal(String(again.transaction._id), String(t._id));
    assert.equal(again.paymentUrl, t.paymentUrl);
    assert.equal((await deliver(t, 'oev_1', 'whd_bad', 'payment.succeeded', false)).status, 401);
    assert.equal(await TezcheckEvent.countDocuments(), 0);
    await paid(t);
    assert.equal((await deliver(t, 'oev_1', 'whd_1')).status, 200);
    assert.equal((await deliver(t, 'oev_1', 'whd_2')).status, 200);
    assert.equal(await TezcheckEvent.countDocuments(), 1);
    await processTezcheckEvents();
    await Promise.all([reconcileTezcheckPayment(String(t._id)), reconcileTezcheckPayment(String(t._id))]);
    assert.equal(await EscrowHold.countDocuments({ transactionId: t._id }), 1);
    assert.equal(await LedgerEntry.countDocuments({ key: `payment:${t._id}` }), 1);
    assert.equal((await Transaction.findById(t._id))!.tezcheckNetMinor, 14850000);
    assert.equal((await User.findById(buyer._id))!.totalSpent, 150000);
    console.log('PASS: signed client, owned order reuse, raw webhook, body-ID deduplication, single escrow and ledger');

    const concurrent = await order(); await paid(concurrent);
    await Promise.all([reconcileTezcheckPayment(String(concurrent._id)), reconcileTezcheckPayment(String(concurrent._id))]);
    assert.equal(await EscrowHold.countDocuments({ transactionId: concurrent._id }), 1);
    assert.equal(await LedgerEntry.countDocuments({ key: `payment:${concurrent._id}` }), 1);
    const recovery = await order();
    const oldBill = recovery.tezcheckBillId;
    await Transaction.updateOne({ _id: recovery._id }, { $unset: { tezcheckBillId: '', paymentUrl: '' } });
    const recovered = await paymentService.createPaymentTransaction(String(recovery.productId), String(buyer._id));
    assert.equal(recovered.transaction.tezcheckBillId, oldBill);
    assert.equal(recovered.paymentUrl, recovery.paymentUrl);
    const realBase = config.tezcheck.baseUrl;
    config.tezcheck.baseUrl = 'http://127.0.0.1:4918';
    const unavailableProduct = await Product.create({ sellerId: seller._id, title: 'Retry order', description: 'Fixture',
      price: 100000, category: 'Boshqa', status: 'active', sensitiveData: { login: 'test', password: 'test' } });
    const unavailable = await paymentService.createPaymentTransaction(String(unavailableProduct._id), String(buyer._id));
    assert.equal(unavailable.paymentUrl, undefined);
    assert.equal((await Product.findById(unavailableProduct._id))!.status, 'reserved');
    config.tezcheck.baseUrl = realBase;
    const retry = await paymentService.createPaymentTransaction(String(unavailableProduct._id), String(buyer._id));
    assert.equal(String(retry.transaction._id), String(unavailable.transaction._id));
    assert.ok(retry.paymentUrl);
    console.log('PASS: concurrent settlement, lost creation response recovery, outage preserves one resumable order');

    const test = await order(); await paid(test, 'test');
    await reconcileTezcheckPayment(String(test._id));
    assert.equal(await EscrowHold.countDocuments({ transactionId: test._id }), 0);
    assert.ok((await Transaction.findById(test._id))!.paymentReview);
    const wrong = await order(); await paid(wrong, 'live', 14000000);
    await assert.rejects(reconcileTezcheckPayment(String(wrong._id)));
    assert.equal(await EscrowHold.countDocuments({ transactionId: wrong._id }), 0);
    console.log('PASS: test funds and mismatched amounts never fund escrow');

    const expired = await order();
    await Transaction.updateOne({ _id: expired._id }, { $set: { expireAt: new Date(0) } });
    await expirePendingTransactions();
    assert.equal((await Transaction.findById(expired._id))!.status, 'pending_payment');
    await reconcileTezcheckPayment(String(expired._id));
    assert.equal((await Transaction.findById(expired._id))!.status, 'expired');
    assert.equal((await Product.findById(expired.productId))!.status, 'active');
    const uncertain = await order();
    await Transaction.updateOne({ _id: uncertain._id }, { $set: { expireAt: new Date(0) } });
    await paid(uncertain);
    const status = await tezcheckClient.getBill(uncertain.tezcheckBillId!);
    await control({ id: uncertain.tezcheckBillId, patch: { bill: { ...status.bill, paid: false }, payment: {
      ...status.payment, state: 'processing', problem: { unknown_reason: 'provider_timeout' },
    } } });
    await reconcileTezcheckPayment(String(uncertain._id));
    assert.equal((await Transaction.findById(uncertain._id))!.status, 'pending_payment');
    assert.equal((await Product.findById(uncertain.productId))!.status, 'reserved');
    console.log('PASS: cancel remotely before expiry; unknown outcome preserves reservation');

    await deliver(t, 'oev_chargeback', 'whd_3', 'payment.charged_back');
    await processTezcheckEvents();
    assert.equal((await EscrowHold.findOne({ transactionId: t._id }))!.status, 'disputed');
    console.log('PASS: provider chargeback freezes unsettled escrow');

    const smsForHosted = await paymentService.confirmPaymentBySms(`Hisobingizga ${uncertain.uniqueAmount} so'm tushdi`, 'test', Date.now());
    assert.equal(smsForHosted.matched, false);
    config.paymentProvider = 'sms';
    const smsProduct = await Product.create({ sellerId: seller._id, title: 'SMS regression', description: 'Fixture',
      price: 120000, category: 'Boshqa', status: 'active', sensitiveData: { login: 'test', password: 'test' } });
    const sms = await paymentService.createPaymentTransaction(String(smsProduct._id), String(buyer._id));
    const confirmed = await paymentService.confirmPaymentBySms(`Hisobingizga ${sms.uniqueAmount} so'm tushdi`, 'test', Date.now());
    assert.equal(confirmed.matched, true);
    assert.equal(await EscrowHold.countDocuments({ transactionId: sms.transaction._id }), 1);
    config.paymentProvider = 'tezcheck';
    console.log('PASS: existing SMS settlement works and cannot settle a TezCheck order');

    const original = config.tezcheck.baseUrl;
    config.tezcheck.baseUrl = 'http://127.0.0.1:4919/tezcheck';
    await assert.rejects(tezcheckClient.request('POST', '/__failure'), /503/);
    await assert.rejects(tezcheckClient.request('POST', '/__html'), /502/);
    await assert.rejects(tezcheckClient.request('POST', '/__hang'));
    config.tezcheck.baseUrl = 'http://127.0.0.1:4918';
    await assert.rejects(tezcheckClient.me());
    config.tezcheck.baseUrl = original;
    console.log('PASS: JSON failure, HTML gateway failure, timeout and unavailable provider fail safely');
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}
main().catch(err => { console.error(err); process.exitCode = 1; });
