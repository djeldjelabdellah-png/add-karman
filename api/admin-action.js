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

      const SERVICE_ROLE_KEY = 'ضع_مفتاح_service_role_هنا'; 
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

      // الرد على تليجرام لإنهاء علامة التحميل على الزر
      const TELEGRAM_TOKEN = '8610113650:AAGk36aIJM3WdlpZSMM2R5HFLg9MrlQ3-MQ';
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: action === 'approve' ? 'تم قبول الحرفي بنجاح!' : 'تم رفض الحرفي وحذفه.',
        }),
      });

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid request body' });
  } catch (err) {
    console.error('CRITICAL ERROR DETAILS:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
