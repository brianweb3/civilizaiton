import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = '8174197921:AAHyxQDKIyj5455rhEX6rd9vAtnT2Lx2j7g';
const TELEGRAM_CHAT_ID = '@civilizaition_logs';

export async function POST(request: NextRequest) {
  try {
    const { message, parseMode = 'HTML' } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

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

    if (!response.ok) {
      const error = await response.text();
      console.error('Telegram API error:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
