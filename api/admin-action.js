const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qecmpqtzfhovalfndarr.supabase.co'; // الرابط الظاهر في سجلاتك
      const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlY21wcXR6ZmhvdmFsZm5kYXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzIyOTE4MywiZXhwIjoyMTAyODA1MTgzfQ.jSLaG5b5vuL6ntTWTaXov3Oysha1OfowmrRVe9Q78-I'; 
      const TELEGRAM_TOKEN = '8610113650:AAGk36aIJM3WdlpZSMM2R5HFLg9MrlQ3-MQ'; // التוكن الظاهر في محادثاتك السابقة
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const callbackData = callbackQuery.data; // مثل: "approve_7" أو "reject_7"
      
      // فصل الإجراء عن معرف الحرفي بناءً على الشرطة السفلى _
      const [action, id] = callbackData.split('_');

      const SUPABASE_URL = process.env.SUPABASE_URL;
      const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const SB_HEADERS = {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      };

      if (action === 'approve') {
        await fetch(`${SUPABASE_URL}/rest/v1/craftsmen?id=eq.${id}`, {
          method: 'PATCH',
          headers: SB_HEADERS,
          body: JSON.stringify({ status: 'approved' }),
        });
      } else if (action === 'reject') {
        await fetch(`${SUPABASE_URL}/rest/v1/craftsmen?id=eq.${id}`, {
          method: 'DELETE',
          headers: SB_HEADERS,
        });
      }

      // الرد على تليجرام لإيقاف علامة التحميل على الزر
      const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
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
    console.error('Admin action error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
