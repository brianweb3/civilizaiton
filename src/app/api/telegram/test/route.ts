import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = '8174197921:AAHyxQDKIyj5455rhEX6rd9vAtnT2Lx2j7g';
const TELEGRAM_CHAT_ID = '@civilizaition_logs';

// Test endpoint to verify Telegram bot is working
export async function GET() {
  try {
    // Test 1: Check bot info
    const botInfoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`;
    const botInfoResponse = await fetch(botInfoUrl);
    const botInfo = await botInfoResponse.json();
    
    if (!botInfo.ok) {
      return NextResponse.json({ 
        error: 'Bot token invalid',
        details: botInfo 
      }, { status: 400 });
    }

    // Test 2: Try to send a test message
    const testMessage = '🧪 TEST MESSAGE\n\nThis is a test from Clawtown API. If you see this, the bot is working!';
    
    const sendUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const sendResponse = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: testMessage,
        parse_mode: 'HTML',
      }),
    });

    const sendResult = await sendResponse.json();
    
    return NextResponse.json({
      botInfo: botInfo.result,
      testMessage: sendResult.ok ? 'Message sent successfully!' : 'Failed to send',
      sendResult,
      chatId: TELEGRAM_CHAT_ID,
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed',
      details: String(error)
    }, { status: 500 });
  }
}
