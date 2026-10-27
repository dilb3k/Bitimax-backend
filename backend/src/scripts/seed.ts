/**
 * Fills a LOCAL database with demo data so the website and the bot can be walked end to end
 * without touching production.
 *
 * Run with:  npm run seed
 *
 * The guard below refuses anything that is not a local MongoDB, because this wipes the
 * collections it seeds. Point MONGODB_URI at localhost first, e.g.
 *   MONGODB_URI=mongodb://127.0.0.1:27017/bitmax_local npm run seed
 */
import mongoose from 'mongoose';
import { config } from '../config';
import { connectDatabase } from '../db/mongoose';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Transaction } from '../models/Transaction';
import { EscrowHold } from '../models/EscrowHold';
import { LedgerEntry } from '../models/LedgerEntry';
import { PaymentInbox } from '../models/PaymentInbox';
import { Payout } from '../models/Payout';
import { ledgerService, accounts } from '../services/ledgerService';
import { generateDealCode } from '../utils/helpers';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', 'mongo', 'host.docker.internal'];

interface Seed {
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  attributes: Record<string, string>;
}

const LISTINGS: Seed[] = [
  {
    title: 'Telegram kanal — 12 400 obunachi (IT/texnologiya)',
    description:
      'Uch yildan beri yuritiladigan IT kanali. Obunachilar asosan Toshkent va Samarqanddan, ' +
      'reklama post o‘rtacha 4 000 ko‘rish oladi. Egalik to‘liq o‘tkaziladi: kanal huquqi, ' +
      'admin panel va statistika. Obunachilar organik, bot yo‘q.',
    price: 2_400_000,
    category: 'Telegram',
    tags: ['kanal', 'IT', 'organik'],
    attributes: { Obunachilar: '12 400', 'O‘rtacha ko‘rish': '4 000', Yoshi: '3 yil' },
  },
  {
    title: 'Instagram sahifa — 34 000 obunachi (moda)',
    description:
      'Ayollar kiyimi bo‘yicha moda sahifasi. Auditoriya 88% ayollar, 18–34 yosh. ' +
      'Reels o‘rtacha 20 000 ko‘rish. Sahifa bilan birga elektron pochta va parol beriladi, ' +
      'ikki qadamli tekshiruv xaridor nomiga qayta ulanadi.',
    price: 5_800_000,
    category: 'Instagram',
    tags: ['moda', 'reels'],
    attributes: { Obunachilar: '34 000', Qamrov: '20 000 / reels', Hudud: 'O‘zbekiston' },
  },
  {
    title: 'TikTok akkaunt — 78 000 obunachi',
    description:
      'Ko‘ngilochar kontent, oxirgi 30 kunda 1,2 mln ko‘rish. Akkaunt bloklanmagan, ' +
      'ogohlantirish yo‘q. Pochta almashtirilishi mumkin, TikTok Shop ulanmagan.',
    price: 3_150_000,
    category: 'TikTok',
    tags: ['tiktok', 'kontent'],
    attributes: { Obunachilar: '78 000', 'Oylik ko‘rish': '1,2 mln' },
  },
  {
    title: 'YouTube kanal — 4 200 obunachi, monetizatsiya yoqilgan',
    description:
      'Monetizatsiya faol, oxirgi 28 kunda 1 800 soat ko‘rish. AdSense xaridor nomiga ' +
      'ulanadi. Mualliflik huquqi ogohlantirishi yo‘q, barcha videolar o‘zimizniki.',
    price: 7_500_000,
    category: 'YouTube',
    tags: ['youtube', 'monetizatsiya'],
    attributes: { Obunachilar: '4 200', Monetizatsiya: 'Yoqilgan', 'Ko‘rish soati': '1 800' },
  },
  {
    title: 'Steam akkaunt — 42 o‘yin, CS2 Prime',
    description:
      'CS2 Prime, GTA V, RDR2 va yana 39 o‘yin. Steam Guard pochtasi bilan to‘liq beriladi, ' +
      'VAC ban yo‘q. Akkaunt 2016 yildan.',
    price: 1_250_000,
    category: 'Steam / Gaming',
    tags: ['steam', 'cs2'],
    attributes: { 'O‘yinlar': '42', 'VAC ban': 'Yo‘q', Yoshi: '2016' },
  },
  {
    title: 'Netflix Premium — 11 oy qolgan',
    description:
      'To‘lov muddati oldindan yopilgan, 4K va 4 ekran. Pochta va parol beriladi, ' +
      'profillar tozalangan.',
    price: 420_000,
    category: 'Netflix / Streaming',
    tags: ['netflix', 'premium'],
    attributes: { Tarif: 'Premium 4K', Muddat: '11 oy', Ekran: '4' },
  },
];

async function wipe() {
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Transaction.deleteMany({}),
    EscrowHold.deleteMany({}),
    LedgerEntry.deleteMany({}),
    PaymentInbox.deleteMany({}),
    Payout.deleteMany({}),
  ]);
}

async function main() {
  const uri = config.mongodbUri;
  const host = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, 'http://')).hostname;
  if (!LOCAL_HOSTS.includes(host)) {
    throw new Error(
      `Xavfsizlik to‘sig‘i: seed faqat lokal MongoDB bilan ishlaydi (hozirgi host: "${host}"). ` +
        'MONGODB_URI=mongodb://127.0.0.1:27017/bitmax_local qilib qayta urinib ko‘ring.'
    );
  }

  await connectDatabase();
  await wipe();

  const seller = await User.create({
    telegramId: 900000001,
    username: 'demo_sotuvchi',
    firstName: 'Aziz',
    role: 'seller',
    trustLevel: 'trusted',
    sellerStats: { listed: LISTINGS.length, sold: 14, refunded: 1, disputesLost: 0, ratingSum: 66, ratingCount: 14 },
    referralCode: 'DEMOSELL',
  });

  const buyer = await User.create({
    telegramId: 900000002,
    username: 'demo_xaridor',
    firstName: 'Nodira',
    role: 'buyer',
    buyerStats: { purchased: 3, refunded: 0, refundsLast30d: 0 },
    referralCode: 'DEMOBUY',
  });

  // Seller balance has to come from the ledger, not a bare field write, or the reconciliation
  // job would immediately flag the cached balance as drifted.
  await ledgerService.postAndSync({
    key: 'seed:demo-seller-balance',
    type: 'manual_adjustment',
    postings: [
      { account: accounts.externalBank, amount: -1_500_000 },
      { account: accounts.userAvailable(String(seller._id)), amount: 1_500_000 },
    ],
    meta: { reason: 'demo seed — sotuvchi boshlang‘ich balansi' },
  });

  let created = 0;
  for (const item of LISTINGS) {
    const product = new Product({
      sellerId: seller._id,
      title: item.title,
      description: item.description,
      price: item.price,
      category: item.category,
      tags: item.tags,
      attributes: item.attributes,
      listingType: 'public',
      status: 'active',
      moderatedAt: new Date(),
      viewCount: 20 + created * 13,
    });
    product.setCredentials({
      login: `demo${created}@example.com`,
      password: `Demo-parol-${created}!`,
      recoveryCode: '1111-2222',
      additionalInfo: 'Bu demo ma’lumot — haqiqiy akkaunt emas.',
    });
    await product.save();
    created++;
  }

  // One listing still awaiting moderation, so the seller cabinet shows every status.
  const pending = new Product({
    sellerId: seller._id,
    title: 'Email akkaunt — 5 yillik Gmail',
    description: 'Moderatsiya kutayotgan e’lon. Demo ma’lumot.',
    price: 300_000,
    category: 'Email',
    listingType: 'public',
    status: 'pending_review',
  });
  pending.setCredentials({ login: 'demo-pending@example.com', password: 'Demo-parol!' });
  await pending.save();

  // A private deal with a live code, so the "Kod bilan sotib olish" flow can be tried.
  const dealCode = generateDealCode();
  const deal = new Product({
    sellerId: seller._id,
    title: 'Kelishilgan bitim — Telegram kanal 3 000 obunachi',
    description: 'Xaridor bilan oldindan kelishilgan bitim. Demo ma’lumot.',
    price: 900_000,
    category: 'Telegram',
    listingType: 'private',
    dealCode,
    dealExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: 'active',
  });
  deal.setCredentials({ login: 'demo-deal@example.com', password: 'Demo-parol!' });
  await deal.save();

  console.log('\n✅ Demo ma’lumot tayyor');
  console.log(`   Sotuvchi : @${seller.username}  telegramId=${seller.telegramId}  id=${seller._id}`);
  console.log(`   Xaridor  : @${buyer.username}  telegramId=${buyer.telegramId}  id=${buyer._id}`);
  console.log(`   E’lonlar : ${created} faol, 1 moderatsiyada`);
  console.log(`   Bitim kodi: ${dealCode}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('\n❌ Seed muvaffaqiyatsiz:', err instanceof Error ? err.message : err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
