import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = '8174197921:AAHyxQDKIyj5455rhEX6rd9vAtnT2Lx2j7g';
const TELEGRAM_CHAT_ID = '@civilizaition_logs';

export async function POST(request: NextRequest) {
  try {
    const { message, parseMode = 'HTML' } = await request.json();

    if (!message) {
      console.error('[Telegram API] No message provided');
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('[Telegram API] Sending message to Telegram:', message.substring(0, 50) + '...');
    console.log('[Telegram API] Chat ID:', TELEGRAM_CHAT_ID);

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    const responseText = await response.text();
    console.log('[Telegram API] Response status:', response.status);
    console.log('[Telegram API] Response:', responseText);

    if (!response.ok) {
      console.error('[Telegram API] Error response:', responseText);
      return NextResponse.json({ error: 'Failed to send message', details: responseText }, { status: 500 });
    }

    const data = JSON.parse(responseText);
    console.log('[Telegram API] Success:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Telegram API] Exception:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
