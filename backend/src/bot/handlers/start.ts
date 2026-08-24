import { Composer, Scenes } from 'telegraf';
import { User } from '../../models/User';
import { LoginRequest } from '../../models/LoginRequest';
import { audit } from '../../models/AuditLog';
import { sha256 } from '../../utils/crypto';
import { botApi } from '../services/api';
import { payoutService, InsufficientBalanceError } from '../../services/payoutService';
import { ledgerService } from '../../services/ledgerService';
import { describeRefundPolicy } from '../../services/refundEngine';
import { config } from '../../config';
import { escapeHtml, formatUzs } from '../../utils/helpers';
import { bailIfCancelled } from '../wizards/guard';
import {
  mainMenu,
  mainMenuKeyboard,
  sellerMenuKeyboard,
  adminMenuKeyboard,
  balanceKeyboard,
  profileSettingsKeyboard,
} from '../keyboards';

export const startHandler = new Composer();

export const PAYOUT_WIZARD = 'payout_request';
export const CARD_WIZARD = 'payout_card';

export function keyboardFor(role: string) {
  return mainMenu(role === 'admin' || role === 'moderator');
}

startHandler.start(async (ctx) => {
  const user = await botApi.getOrCreateUser(ctx.from!.id, ctx);

  if (user.isBlocked) {
    await ctx.reply(`❌ Hisobingiz bloklangan.\n${user.blockReason || ''}`);
    return;
  }

  // Deep link from the web catalog: /start buy_<productId> jumps straight to the listing.
  const payload = (ctx as any).startPayload as string | undefined;

  // Deep link from the website's login screen: /start login_<token>. Approving here is what
  // signs that browser in — the bot chat is the only place Telegram has already proved who
  // the account holder is, which is why the site needs no password of its own.
  if (payload?.startsWith('login_')) {
    await presentLoginRequest(ctx, payload.slice(6));
    return;
  }
  if (payload?.startsWith('buy_')) {
    const productId = payload.slice(4);
    await ctx.replyWithHTML(
      `Tanlangan mahsulotni ochish uchun pastdagi tugmani bosing:`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: '🔍 Mahsulotni ko‘rish', callback_data: `detail_${productId}` }]],
        },
      }
    );
  }

  await ctx.replyWithHTML(
    [
      `<b>🔰 Bitimax — kafil bilan savdo</b>`,
      '',
      `Bitimax ikki ishni qiladi:`,
      '',
      `<b>1️⃣ 🛍 Akkaunt bozori</b>`,
      `Instagram, Telegram, TikTok, o‘yin akkauntlari — katalogdan sotib oling yoki`,
      `o‘zingiznikini sotuvga qo‘ying.`,
      '',
      `<b>2️⃣ 🤝 Kafil bitim (escrow)</b>`,
      `Xaridor va sotuvchi allaqachon kelishgan bo‘lsa, Bitimax o‘rtada turadi.`,
      `Sotuvchi kod oladi, xaridor kodni kiritadi — pul kafilda saqlanadi.`,
      '',
      `<b>🛡 Ikkalasida ham himoya bir xil:</b>`,
      `• Pul siz tasdiqlamaguningizcha sotuvchiga o‘tmaydi`,
      `• Avval akkauntni tekshirasiz, keyin tasdiqlaysiz`,
      `• Muammo bo‘lsa — siyosat bo‘yicha qaytariladi`,
      '',
      `<b>💰 Komissiya:</b> ${config.platformCommission}% (sotuvchidan, faqat muvaffaqiyatli bitimdan)`,
      '',
      `<i>⚠️ Platformadan tashqaridagi kelishuvlarga tizim javob bermaydi.</i>`,
    ].join('\n'),
    keyboardFor(user.role)
  );
});

function helpText(): string {
  return [
      `<b>❓ Yordam</b>`,
      '',
      `<b>🤝 Kafil bitim — kelishilgan savdo</b>`,
      `Xaridor va sotuvchi bir-birini topgan bo‘lsa, Bitimax faqat kafil bo‘ladi:`,
      `1. Sotuvchi: “🤝 Kafil bitim” → “Men sotyapman” → 4 ta savol`,
      `2. Sotuvchi <b>kod</b> oladi va xaridorga yuboradi`,
      `3. Xaridor: “🤝 Kafil bitim” → “Men sotib olyapman” → kodni kiritadi`,
      `4. To‘laydi → akkauntni tekshiradi → tasdiqlaydi`,
      `<i>Katalogda ko‘rinmaydi, moderatsiya kutilmaydi — darhol ishlaydi.</i>`,
      '',
      `<b>🛍 Katalogdan sotib olish</b>`,
      `1. Mahsulotni tanlang → “Sotib olish”`,
      `2. Ko‘rsatilgan <b>aniq</b> summani kartaga o‘tkazing`,
      `3. To‘lov avtomatik tasdiqlanadi (bank SMS orqali)`,
      `4. “🔑 Ma’lumotlarni ochish” tugmasini bosing`,
      `5. Akkauntni tekshiring → “✅ Tasdiqlayman”`,
      `6. Faqat shundan keyin parolni o‘zgartiring`,
      '',
      `<b>💼 Bozorga sotuvga qo‘yish</b>`,
      `1. “💼 Akkaunt sotish” ni bosing`,
      `2. Ma’lumotlarni kiriting (nom, tavsif, narx, kategoriya, login/parol)`,
      `3. Moderator tasdiqlaydi va e’lon katalogda paydo bo‘ladi`,
      `4. Xaridor tasdiqlagach yoki ${config.autoReleaseHours} soatdan keyin pul balansingizga tushadi`,
      '',
      `<b>⏱ Qaytarish shartlari</b> (ma’lumotni ochgan vaqtdan):`,
      describeRefundPolicy(),
      '',
      `<b>💰 Komissiya:</b> ${config.platformCommission}%`,
      `<b>💸 Minimal pul yechish:</b> ${formatUzs(config.minPayoutAmount)}`,
      '',
    `<b>🆘 Qo‘llab-quvvatlash:</b> ${botApi.supportLink()}`,
  ].join('\n');
}

startHandler.help((ctx) => ctx.replyWithHTML(helpText()));
startHandler.hears('❓ Yordam', (ctx) => ctx.replyWithHTML(helpText()));

async function showBalance(ctx: any) {
  const user = await User.findOne({ telegramId: ctx.from!.id });
  if (!user) {
    await ctx.reply('Foydalanuvchi topilmadi. /start bosing.');
    return;
  }

  await ctx.replyWithHTML(
    [
      `<b>💰 Balans</b>`,
      '',
      `Mavjud: <b>${formatUzs(user.balance)}</b>`,
      `Umumiy daromad: ${formatUzs(user.totalEarned)}`,
      `Umumiy xarajat: ${formatUzs(user.totalSpent)}`,
      '',
      user.payoutCard?.masked
        ? `💳 Karta: <code>${user.payoutCard.masked}</code>`
        : `💳 Karta saqlanmagan — pul yechish uchun kerak`,
      '',
      `<i>Minimal yechish: ${formatUzs(config.minPayoutAmount)}</i>`,
    ].join('\n'),
    balanceKeyboard
  );
}

startHandler.hears(['💰 Balans'], showBalance);
startHandler.command('balance', showBalance);

startHandler.action('balance_statement', async (ctx) => {
  const user = await User.findOne({ telegramId: ctx.from!.id });
  if (!user) return void ctx.answerCbQuery('Topilmadi');

  const entries = await ledgerService.statement(String(user._id), 15);
  if (entries.length === 0) {
    await ctx.answerCbQuery('Tranzaksiyalar yo‘q');
    return;
  }

  const labels: Record<string, string> = {
    escrow_release: 'Sotuvdan daromad',
    escrow_refund: 'Qaytarish',
    payout_reserved: 'Pul yechish',
    payout_reverted: 'Yechish bekor qilindi',
    manual_adjustment: 'Admin tuzatishi',
  };

  await ctx.replyWithHTML(
    [
      `<b>📜 So‘nggi tranzaksiyalar</b>`,
      '',
      ...entries.map((entry) => {
        const sign = entry.amount > 0 ? '➕' : '➖';
        return (
          `${sign} <b>${formatUzs(Math.abs(entry.amount))}</b> — ${labels[entry.type] || entry.type}\n` +
          `   <i>${entry.createdAt.toLocaleString('uz-UZ')}</i>`
        );
      }),
    ].join('\n')
  );
  await ctx.answerCbQuery();
});

startHandler.action('payout_card', async (ctx) => {
  await ctx.answerCbQuery();
  await (ctx as any).scene?.enter(CARD_WIZARD);
});

startHandler.action('payout_request', async (ctx) => {
  await ctx.answerCbQuery();
  const user = await User.findOne({ telegramId: ctx.from!.id });
  if (!user) return;

  if (!user.payoutCard?.encrypted) {
    await ctx.reply('Avval kartangizni saqlang: “💳 Kartani saqlash”.');
    return;
  }
  if (user.balance < config.minPayoutAmount) {
    await ctx.replyWithHTML(
      `Balansingiz yetarli emas.\nMavjud: <b>${formatUzs(user.balance)}</b>\n` +
        `Minimal: ${formatUzs(config.minPayoutAmount)}`
    );
    return;
  }

  await (ctx as any).scene?.enter(PAYOUT_WIZARD);
});

startHandler.hears('⚙️ Sozlamalar', async (ctx) => {
  const user = await User.findOne({ telegramId: ctx.from!.id });
  if (!user) return;

  await ctx.replyWithHTML(
    [
      `<b>⚙️ Sozlamalar</b>`,
      '',
      `Rol: <b>${user.role}</b>`,
      `Daraja: <b>${user.trustLevel}</b>`,
      `Til: ${user.language}`,
      `Referal kod: <code>${user.referralCode}</code>`,
      '',
      `<b>Bildirishnomalar</b>`,
      `• Yangi buyurtma: ${user.notificationSettings.newOrder ? '✅' : '❌'}`,
      `• To‘lov: ${user.notificationSettings.paymentConfirm ? '✅' : '❌'}`,
      `• Qaytarish: ${user.notificationSettings.refundUpdate ? '✅' : '❌'}`,
    ].join('\n'),
    profileSettingsKeyboard()
  );
});

startHandler.action('settings_become_seller', async (ctx) => {
  const user = await User.findOne({ telegramId: ctx.from!.id });
  if (!user) return void ctx.answerCbQuery('Topilmadi');

  if (user.role === 'seller' || user.role === 'admin') {
    await ctx.answerCbQuery('Siz allaqachon sotuvchisiz');
    return;
  }

  user.role = 'seller';
  await user.save();

  await ctx.answerCbQuery('✅ Sotuvchi bo‘ldingiz');
  await ctx.replyWithHTML(
    [
      `✅ <b>Endi siz sotuvchisiz!</b>`,
      '',
      `Daraja: <b>${user.trustLevel}</b>`,
    ].join('\n'),
    sellerMenuKeyboard
  );
});

startHandler.action('settings_language', async (ctx) => {
  const user = await User.findOne({ telegramId: ctx.from!.id });
  if (!user) return void ctx.answerCbQuery('Topilmadi');

  user.language = user.language === 'uz' ? 'ru' : 'uz';
  await user.save();
  await ctx.answerCbQuery(user.language === 'uz' ? "O'zbekcha" : 'Русский');
});

startHandler.hears('🏠 Asosiy menu', async (ctx) => {
  const user = await User.findOne({ telegramId: ctx.from!.id });
  await ctx.reply('Asosiy menu', keyboardFor(user?.role || 'buyer'));
});

startHandler.hears('🛡 Admin panel', async (ctx) => {
  const user = await User.findOne({ telegramId: ctx.from!.id });
  if (user?.role !== 'admin' && user?.role !== 'moderator') return;
  await ctx.reply('🛡 Admin paneli', adminMenuKeyboard);
});

/** Two short wizards for the withdrawal flow. */
export function createPayoutWizards() {
  const cardWizard = new Scenes.WizardScene<any>(
    CARD_WIZARD,
    async (ctx: any) => {
      await ctx.replyWithHTML(
        '<b>💳 Karta raqami</b>\n\n16 xonali karta raqamingizni kiriting:\n\n' +
          '<i>Shifrlangan holda saqlanadi, faqat pul o‘tkazish uchun ishlatiladi.</i>'
      );
      return ctx.wizard.next();
    },
    async (ctx: any) => {
      if (await bailIfCancelled(ctx, ['cardNumber'])) return;

      const digits = String(ctx.message?.text || '').replace(/\D/g, '');
      if (digits.length !== 16) {
        await ctx.reply('Karta raqami 16 xonali bo‘lishi kerak. Qaytadan kiriting:');
        return;
      }
      ctx.session.cardNumber = digits;
      await ctx.reply('Karta egasining to‘liq ismini kiriting (kartada yozilgani kabi):');
      return ctx.wizard.next();
    },
    async (ctx: any) => {
      if (await bailIfCancelled(ctx, ['cardNumber'])) return;

      const holder = String(ctx.message?.text || '').trim();
      if (holder.length < 3) {
        await ctx.reply('Ismni to‘liq kiriting:');
        return;
      }

      const user = await User.findOne({ telegramId: ctx.from!.id });
      if (!user) return ctx.scene.leave();

      await payoutService.setPayoutCard(String(user._id), ctx.session.cardNumber, holder);
      ctx.session.cardNumber = undefined;

      await ctx.replyWithHTML('✅ <b>Karta saqlandi.</b> Endi pul yechish so‘rovi yuborishingiz mumkin.');
      return ctx.scene.leave();
    }
  );

  const payoutWizard = new Scenes.WizardScene<any>(
    PAYOUT_WIZARD,
    async (ctx: any) => {
      const user = await User.findOne({ telegramId: ctx.from!.id });
      if (!user) return ctx.scene.leave();

      await ctx.replyWithHTML(
        `<b>💸 Pul yechish</b>\n\nMavjud: <b>${formatUzs(user.balance)}</b>\n` +
          `Karta: <code>${user.payoutCard?.masked}</code>\n\n` +
          `Qancha yechmoqchisiz? (so‘mda, minimal ${formatUzs(config.minPayoutAmount)}):`
      );
      return ctx.wizard.next();
    },
    async (ctx: any) => {
      if (await bailIfCancelled(ctx)) return;

      const amount = parseInt(String(ctx.message?.text || '').replace(/\D/g, ''), 10);
      const user = await User.findOne({ telegramId: ctx.from!.id });
      if (!user) return ctx.scene.leave();

      if (isNaN(amount) || amount < config.minPayoutAmount) {
        await ctx.reply(`Minimal ${formatUzs(config.minPayoutAmount)}. Qaytadan kiriting:`);
        return;
      }

      try {
        const payout = await payoutService.requestPayout(String(user._id), amount);
        await ctx.replyWithHTML(
          [
            `✅ <b>So‘rov qabul qilindi</b>`,
            '',
            `Summa: <b>${formatUzs(payout.amount)}</b>`,
            `Kartaga: ${formatUzs(payout.netAmount)}`,
            `Karta: <code>${payout.destinationMasked}</code>`,
            '',
            `<i>Admin tasdiqlagach pul kartangizga o‘tkaziladi (odatda 24 soat ichida).</i>`,
          ].join('\n'),
          keyboardFor(user.role)
        );
      } catch (error: any) {
        const message =
          error instanceof InsufficientBalanceError
            ? 'Balansda yetarli mablag‘ yo‘q.'
            : escapeHtml(error.message || 'Xatolik yuz berdi');
        await ctx.reply(`❌ ${message}`);
      }

      return ctx.scene.leave();
    }
  );

  return [cardWizard, payoutWizard];
}


/**
 * Shows a pending web-login request for confirmation.
 *
 * The request token travels in the button's callback_data rather than a database id.
 * callback_data is attacker-controllable, so anything guessable there would let a stranger
 * approve *their own* account into somebody else's waiting browser — a reverse session
 * fixation, where the victim then types their card details into the attacker's cabinet.
 * The token is 32 random bytes and never displayed, so only the person who opened this exact
 * link can act on it.
 */
async function presentLoginRequest(ctx: any, token: string) {
  const request = await LoginRequest.findOne({ tokenHash: sha256(token) });

  if (!request || request.expiresAt.getTime() < Date.now() || request.status !== 'pending') {
    await ctx.replyWithHTML(
      '⌛ <b>Kirish so‘rovi eskirgan.</b>\n\nSaytda “Kirish” tugmasini qaytadan bosing.'
    );
    return;
  }

  await ctx.replyWithHTML(
    [
      `<b>🌐 Saytga kirishga ruxsat berasizmi?</b>`,
      '',
      `Brauzerda ko‘rsatilgan kod bilan solishtiring:`,
      `<code>${request.pairCode}</code>`,
      '',
      request.userAgent ? `<i>Qurilma: ${escapeHtml(request.userAgent.slice(0, 80))}</i>` : '',
      request.ip ? `<i>IP: ${escapeHtml(request.ip)}</i>` : '',
      '',
      `⚠️ <b>Kod mos kelmasa — “Yo‘q” ni bosing.</b> Bu so‘rovni siz boshlamagan bo‘lsangiz, ` +
        `kimdir sizning hisobingiz bilan kirmoqchi bo‘lyapti.`,
    ]
      .filter(Boolean)
      .join('\n'),
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Ha, bu men', callback_data: `wl_ok_${token}` },
            { text: '❌ Yo‘q', callback_data: `wl_no_${token}` },
          ],
        ],
      },
    }
  );
}

startHandler.action(/^wl_(ok|no)_(.+)$/, async (ctx: any) => {
  const decision = ctx.match[1];
  const token = ctx.match[2];

  const user = await User.findOne({ telegramId: ctx.from!.id });
  if (!user) return void ctx.answerCbQuery('Avval /start bosing');
  if (user.isBlocked) return void ctx.answerCbQuery('Hisobingiz bloklangan');

  if (decision === 'no') {
    await LoginRequest.findOneAndUpdate(
      { tokenHash: sha256(token), status: 'pending' },
      { $set: { status: 'denied' } }
    );
    await ctx.editMessageText('❌ Kirish rad etildi.', { parse_mode: 'HTML' });
    return void ctx.answerCbQuery('Rad etildi');
  }

  // Conditional on both `pending` and an unexpired deadline, so a link found later in the
  // chat history cannot be tapped into a live session.
  const approved = await LoginRequest.findOneAndUpdate(
    { tokenHash: sha256(token), status: 'pending', expiresAt: { $gt: new Date() } },
    { $set: { status: 'approved', userId: user._id, approvedAt: new Date() } },
    { new: true }
  );

  if (!approved) {
    await ctx.editMessageText('⌛ So‘rov eskirgan. Saytda qaytadan urinib ko‘ring.', { parse_mode: 'HTML' });
    return void ctx.answerCbQuery('Eskirgan');
  }

  await audit({
    actorId: user._id as any,
    actorTelegramId: user.telegramId,
    action: 'web.login_approved',
    targetType: 'User',
    targetId: user._id as any,
    ip: approved.ip,
  });

  await ctx.editMessageText(
    `✅ <b>Kirishga ruxsat berildi.</b>\n\nBrauzerga qayting — sahifa o‘zi ochiladi.`,
    { parse_mode: 'HTML' }
  );
  await ctx.answerCbQuery('Ruxsat berildi');
});
