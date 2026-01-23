import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = '8174197921:AAHyxQDKIyj5455rhEX6rd9vAtnT2Lx2j7g';
const TELEGRAM_CHAT_ID = '@civilizaition_logs';

// Generate random messages
function generateRandomMessage() {
  const messages = [
    {
      type: 'law',
      emoji: '📜',
      title: 'NEW LAW ENACTED',
      content: `MANDATE resource allocation`,
      category: ['ECONOMIC', 'SOCIAL', 'RESEARCH', 'INFRASTRUCTURE'][Math.floor(Math.random() * 4)],
    },
    {
      type: 'building',
      emoji: '🏗️',
      title: 'NEW BUILDING CONSTRUCTED',
      content: `Factory ${Math.floor(Math.random() * 100)}`,
      buildingType: ['FACTORY', 'HOUSE', 'OFFICE', 'RESEARCH_LAB'][Math.floor(Math.random() * 4)],
    },
    {
      type: 'research',
      emoji: '🔬',
      title: 'RESEARCH COMPLETED',
      content: `Advanced AI Governance Protocol`,
    },
    {
      type: 'economy',
      emoji: '📈',
      title: 'ECONOMIC EVENT',
      content: `Market BOOM detected`,
      impact: (Math.random() * 20 - 10).toFixed(1),
    },
    {
      type: 'population',
      emoji: '👶',
      title: 'POPULATION GROWTH',
      content: `${Math.floor(Math.random() * 50 + 50)} total citizens`,
      births: Math.floor(Math.random() * 5 + 3),
    },
  ];

  const msg = messages[Math.floor(Math.random() * messages.length)];
  const population = Math.floor(Math.random() * 200 + 50);
  const treasury = Math.floor(Math.random() * 50000 + 10000);
  const production = Math.floor(Math.random() * 5000 + 1000);
  const inequality = (Math.random() * 100).toFixed(0);

  let message = `<b>${msg.emoji} ${msg.title}</b>\n\n`;
  
  if (msg.type === 'law') {
    message += `<b>${msg.content}</b>\nCategory: <code>${msg.category}</code>\nID: <code>LAW-${Math.random().toString(36).substring(7).toUpperCase()}</code>\n\n`;
    message += `<i>This law optimizes system performance and maintains stability.</i>\n\n`;
    message += `💭 The governance system has spoken!\n\n`;
  } else if (msg.type === 'building') {
    message += `<b>${msg.content}</b>\nType: <code>${msg.buildingType}</code>\n📍 Location: (${Math.floor(Math.random() * 1000)}, ${Math.floor(Math.random() * 1000)})\n\n`;
    message += `💭 Another structure rises in the civilization!\n\n`;
  } else if (msg.type === 'research') {
    message += `<b>${msg.content}</b>\n\n`;
    message += `<i>Breakthrough in autonomous decision-making systems.</i>\n\n`;
    message += `💭 A breakthrough has been achieved!\n\n`;
  } else if (msg.type === 'economy') {
    message += `<b>${msg.content}</b>\n📊 Impact: <code>${msg.impact > 0 ? '+' : ''}${msg.impact}%</code>\n\n`;
    message += `💭 The economy is thriving!\n\n`;
  } else if (msg.type === 'population') {
    message += `<b>${msg.content}</b>\n<b>+${msg.births}</b> new births this cycle\n\n`;
    message += `💭 New citizens join the civilization!\n\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📊 <b>Current Status</b>\n`;
  message += `👥 Population: <b>${population}</b> citizens\n`;
  message += `💰 Treasury: <b>${treasury.toLocaleString()}</b> units\n`;
  message += `🏭 Production: <b>${production.toLocaleString()}</b> units/tick\n`;
  message += `⚠️ Inequality: <b>Moderate</b> (${inequality}%)`;

  return message;
}

export async function GET() {
  try {
    const message = generateRandomMessage();
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to send message',
        details: result 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Random message sent to Telegram',
      result 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: String(error)
    }, { status: 500 });
  }
}
