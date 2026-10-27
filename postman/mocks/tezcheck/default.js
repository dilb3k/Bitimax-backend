// Local contract mock based on the merchant documentation supplied 2026-10-27.
// /__control is test-only. No live credentials are accepted or needed.
const http = require('http');
const crypto = require('crypto');
http.createServer(async (req, res) => {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  let store = await pm.state.get('tezcheck:bills') || {};
  if (req.url === '/__control' && req.method === 'POST') {
    if (body.reset) store = {};
    if (body.id && store[body.id]) Object.assign(store[body.id], body.patch);
    await pm.state.set('tezcheck:bills', store);
    return send(200, { ok: true });
  }
  if (req.url === '/__failure') return send(503, { error: { code: 'server.internal_error', retryable: true } });
  if (req.url === '/__html') { res.writeHead(502); return res.end('<html>gateway failure</html>'); }
  if (req.url === '/__hang') return;
  const timestamp = req.headers['x-tezcheck-timestamp'];
  const digest = crypto.createHash('sha256').update(raw).digest('hex');
  const expected = 'v1=' + crypto.createHmac('sha256', 'aps_local_fixture').update(`${timestamp}.${req.method}./tezcheck${req.url}.${digest}`).digest('hex');
  if (req.headers.authorization !== 'Bearer aps_local_fixture' || req.headers['x-cash-desk-code'] !== 'cdk_local_fixture' ||
      req.headers['x-tezcheck-signature'] !== expected) return send(401, { error: { code: 'request.signature_invalid' } });
  if (req.url === '/api/merchant/v1/me') return send(200, { data: { api_client: { request_signed: true }, cash_desk: { id: '66', currency: 'UZS' } } });
  if (req.url === '/api/merchant/v1/bills') {
    if (!Number.isSafeInteger(body.amount_minor) || body.amount_minor < 100000 || !body.external_reference || !body.title || body.currency) {
      return send(422, { error: { code: 'request.validation_failed' } });
    }
    const id = 'link_' + body.external_reference;
    const old = store[id];
    if (old && old.raw !== raw) return send(409, { error: { code: 'request.idempotency_key_reused' } });
    if (!req.headers['idempotency-key']) return send(400, { error: { code: 'mock.expected_idempotency_key' } });
    if (!old) store[id] = { raw, bill: { id, reference: 'BILL-TEST', external_reference: body.external_reference,
      amount_minor: body.amount_minor, currency: 'UZS', state: 'active', paid: false, environment: 'live', livemode: true }, payment: null };
    await pm.state.set('tezcheck:bills', store);
    return send(201, { data: { bill: store[id].bill, payment_url: `https://checkout.example.test/pay/${id}` } });
  }
  const match = /^\/api\/merchant\/v1\/bills\/([^/]+)(\/cancel)?$/.exec(req.url);
  if (match && req.method === 'POST') {
    const record = store[match[1]];
    if (!record) return send(404, { error: { code: 'resource.not_found' } });
    if (match[2]) {
      if (record.bill.paid) return send(409, { error: { code: 'resource.state_invalid' } });
      record.bill.state = 'revoked';
      await pm.state.set('tezcheck:bills', store);
      return send(200, { data: { bill: record.bill, cancelled: true } });
    }
    return send(200, { data: { bill: record.bill, payment: record.payment, payment_url: null } });
  }
  return send(501, { error: 'Not modeled by this contract fixture' });
}).listen(process.env.PORT || 4500);
