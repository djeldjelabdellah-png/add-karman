module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    console.log('Incoming body:', JSON.stringify(update));
    
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const callbackData = callbackQuery.data; // مثال: "approve_10" أو "reject_10"
      const [action, id] = callbackData.split('_');

      const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const EDGE_FUNCTION_URL = 'https://qecmpqtzfhovalfndarr.supabase.co/functions/v1/clever-responder';

      // إرسال الطلب إلى Supabase Edge Function
      const updateRes = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: action, id: id }),
      });
      
      const responseText = await updateRes.text();
      console.log('Edge Function Response Status:', updateRes.status);
      console.log('Edge Function Response Text:', responseText);

      const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
      const successText = action === 'approve' ? 'تم قبول الحرفي بنجاح!' : 'تم رفض الحرفي وحذفه.';
      const failText = 'فشلت العملية، حاول مرة أخرى';

      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: updateRes.ok ? successText : failText,
        }),
      });

      if (updateRes.ok) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageReplyMarkup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id,
            reply_markup: { inline_keyboard: [] },
          }),
        });
      }

      return res.status(200).json({ success: updateRes.ok });
    }

    return res.status(400).json({ error: 'Invalid request body' });
  } catch (err) {
    console.error('CRITICAL ERROR DETAILS:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
