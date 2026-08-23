import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const lead = await request.json();

    // 🔴 IMPORTANT: Paste your actual Bot Token and Chat ID here!
    const BOT_TOKEN = "8865516840:AAFTZlgWeke9V5usQphkDhb55dYdPf9hvQ8";
    const CHAT_ID = "7888362991";

    // Format the alert message using emojis and line breaks
    const message = `
🚨 *NEW CORPORATE LEAD!* 🚨

🏢 *Company:* ${lead.company_name}
👤 *Contact:* ${lead.contact_person}
📞 *Phone:* ${lead.phone_number}
✉️ *Email:* ${lead.email}

👥 *Team Size:* ${lead.team_size}
🎯 *Experience:* ${lead.experience_type}
📅 *Date:* ${lead.tentative_date || 'Not specified'}

📝 *Notes:* 
${lead.special_requirements || 'None provided'}
    `;

    // Fire the request directly to Telegram's official API
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown', // This allows the bold text and formatting!
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send Telegram alert');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Telegram Webhook Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}