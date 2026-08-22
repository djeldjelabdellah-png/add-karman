module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, name, phone, craft, hood, exp, bio, imagesCount } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://addl-karman.vercel.app';

  const imagesNote = imagesCount > 0 ? `\n📸 **مرفق:** ${imagesCount} صور للأعمال` : '';
  const message =
    `🛠 **تسجيل حرفي جديد بانتظار الموافقة!**\n\n` +
    `👤 **الاسم الكامل:** ${name}\n` +
    `📞 **رقم الهاتف:** ${phone}\n` +
    `🧰 **الحرفة:** ${craft}\n` +
    `📍 **المنطقة/الحي:** ${hood}\n` +
    `⭐ **خبرة:** ${exp} سنوات\n` +
    `📝 **الوصف:** ${bio}` + imagesNote;

  // أزرار القبول والرفض التفاعلية
  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: '✅ قبول',
          callback_data: JSON.stringify({ action: 'approve', id: id })
        },
        {
          text: '❌ رفض',
          callback_data: JSON.stringify({ action: 'reject', id: id })
        }
      ]
    ]
  };

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard
      }),
    });

    if (!tgRes.ok) throw new Error('Telegram API error');
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Telegram notify failed:', err);
    return res.status(500).json({ success: false });
  }
}
