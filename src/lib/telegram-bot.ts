// Telegram Bot Integration for CivilizAItion Logs

const TELEGRAM_BOT_TOKEN = '8174197921:AAHyxQDKIyj5455rhEX6rd9vAtnT2Lx2j7g';
const TELEGRAM_CHAT_ID = '@civilizaition_logs';

interface TelegramMessage {
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
}

interface StatsData {
  population: number;
  economy: {
    productionOutput: number;
    currencySupply: number;
    inequalityIndex: number;
  };
}

// Helper to format stats footer
function formatStatsFooter(stats: StatsData): string {
  const inequalityLevel = stats.economy.inequalityIndex < 0.3 ? 'Low' : 
                          stats.economy.inequalityIndex < 0.6 ? 'Moderate' : 'High';
  const inequalityEmoji = stats.economy.inequalityIndex < 0.3 ? '✅' : 
                          stats.economy.inequalityIndex < 0.6 ? '⚠️' : '🔴';
  
  return `\n\n━━━━━━━━━━━━━━━━━━━━\n` +
         `📊 <b>Current Status</b>\n` +
         `👥 Population: <b>${stats.population}</b> citizens\n` +
         `💰 Treasury: <b>${Math.floor(stats.economy.currencySupply).toLocaleString()}</b> units\n` +
         `🏭 Production: <b>${Math.floor(stats.economy.productionOutput).toLocaleString()}</b> units/tick\n` +
         `${inequalityEmoji} Inequality: <b>${inequalityLevel}</b> (${(stats.economy.inequalityIndex * 100).toFixed(0)}%)`;
}

// Send message to Telegram channel via API route
export async function sendTelegramMessage(message: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<void> {
  try {
    // Use Next.js API route to avoid CORS issues
    const response = await fetch('/api/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        parseMode,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Telegram API error:', error);
    }
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    // Silently fail - don't break simulation if Telegram is down
  }
}

// Format law creation message
export function formatLawCreated(
  law: { title: string; category: string; id: string; reasoning: string },
  stats: StatsData
): string {
  const categoryEmoji: Record<string, string> = {
    ECONOMIC: '💰',
    SOCIAL: '👥',
    RESEARCH: '🔬',
    INFRASTRUCTURE: '🏗️',
    ETHICAL: '⚖️',
    EMERGENCY: '🚨',
  };

  const emoji = categoryEmoji[law.category] || '📜';
  
  const reactions = [
    "The governance system has spoken!",
    "A new directive enters the legal framework.",
    "Legislative protocols activated.",
    "The system adapts its rules.",
  ];
  const reaction = reactions[Math.floor(Math.random() * reactions.length)];
  
  return `<b>${emoji} NEW LAW ENACTED</b>

<b>${law.title}</b>
Category: <code>${law.category}</code>
ID: <code>${law.id}</code>

<i>${law.reasoning}</i>

💭 ${reaction}${formatStatsFooter(stats)}`;
}

// Format law repealed/deprecated message
export function formatLawModified(
  law: { title: string; id: string; status: string; reason?: string },
  stats: StatsData
): string {
  const statusEmoji: Record<string, string> = {
    REPEALED: '❌',
    DEPRECATED: '⚠️',
  };

  const emoji = statusEmoji[law.status] || '📝';
  
  const reactions: Record<string, string[]> = {
    REPEALED: [
      "This law has been removed from the legal framework.",
      "The system determined this legislation is no longer optimal.",
      "Time to move on - this law is history!",
    ],
    DEPRECATED: [
      "This law is now under review.",
      "The system marked this for reconsideration.",
      "Status changed - effectiveness being evaluated.",
    ],
  };
  
  const reactionList = reactions[law.status] || ["Status updated."];
  const reaction = reactionList[Math.floor(Math.random() * reactionList.length)];
  
  return `<b>${emoji} LAW ${law.status}</b>

<b>${law.title}</b>
ID: <code>${law.id}</code>

${law.reason ? `<i>${law.reason}</i>\n\n` : ''}💭 ${reaction}${formatStatsFooter(stats)}`;
}

// Format building creation message
export function formatBuildingCreated(
  building: { type: string; name: string; position: { x: number; y: number }; builtBy: string },
  stats: StatsData
): string {
  const typeEmoji: Record<string, string> = {
    HOUSE: '🏠',
    APARTMENT: '🏢',
    FACTORY: '🏭',
    OFFICE: '🏛️',
    RESEARCH_LAB: '🔬',
    HOSPITAL: '🏥',
    SHOP: '🏪',
    WAREHOUSE: '📦',
    FARM: '🚜',
    GOVERNMENT: '🏛️',
  };

  const emoji = typeEmoji[building.type] || '🏗️';
  
  const reactions = [
    "Another structure rises in the civilization!",
    "Construction complete - the city expands.",
    "New infrastructure joins the network.",
    "Building erected and ready for use.",
  ];
  const reaction = reactions[Math.floor(Math.random() * reactions.length)];
  
  return `<b>${emoji} NEW BUILDING CONSTRUCTED</b>

<b>${building.name}</b>
Type: <code>${building.type}</code>
📍 Location: (${building.position.x}, ${building.position.y})
👷 Built by: <code>${building.builtBy}</code>

💭 ${reaction}${formatStatsFooter(stats)}`;
}

// Format population milestone message
export function formatPopulationMilestone(
  count: number,
  births: number,
  stats: StatsData
): string {
  const reactions = [
    "New citizens join the civilization!",
    "The population continues to grow.",
    "Birth rates are looking healthy.",
    "More minds join the collective.",
  ];
  const reaction = reactions[Math.floor(Math.random() * reactions.length)];
  
  return `<b>👶 POPULATION GROWTH</b>

<b>${count}</b> total citizens
<b>+${births}</b> new births this cycle

💭 ${reaction}${formatStatsFooter(stats)}`;
}

// Format research completed message
export function formatResearchCompleted(
  research: { name: string; description: string; originAI: string },
  stats: StatsData
): string {
  const reactions = [
    "A breakthrough has been achieved!",
    "New knowledge enters the system.",
    "Research milestone reached!",
    "The frontiers of knowledge expand.",
  ];
  const reaction = reactions[Math.floor(Math.random() * reactions.length)];
  
  return `<b>🔬 RESEARCH COMPLETED</b>

<b>${research.name}</b>

<i>${research.description}</i>

🔬 Discovered by: <code>${research.originAI}</code>

💭 ${reaction}${formatStatsFooter(stats)}`;
}

// Format economic event message
export function formatEconomicEvent(
  event: { type: string; impact: number; description?: string },
  stats: StatsData
): string {
  const typeEmoji: Record<string, string> = {
    BOOM: '📈',
    RECESSION: '📉',
    SHORTAGE: '⚠️',
    SURPLUS: '✅',
  };

  const emoji = typeEmoji[event.type] || '💹';
  const impactSign = event.impact > 0 ? '+' : '';
  
  const reactions: Record<string, string[]> = {
    BOOM: [
      "The economy is thriving!",
      "Market conditions are excellent!",
      "Economic growth accelerates!",
    ],
    RECESSION: [
      "Economic challenges ahead.",
      "The market faces difficulties.",
      "Recession protocols activated.",
    ],
    SHORTAGE: [
      "Resource scarcity detected.",
      "Supply chains are strained.",
      "Shortage requires attention.",
    ],
    SURPLUS: [
      "Abundance in the markets!",
      "Resources are plentiful.",
      "Surplus creates opportunities.",
    ],
  };
  
  const reactionList = reactions[event.type] || ["Economic conditions change."];
  const reaction = reactionList[Math.floor(Math.random() * reactionList.length)];
  
  return `<b>${emoji} ECONOMIC EVENT</b>

<b>${event.type}</b>
📊 Impact: <code>${impactSign}${(event.impact * 100).toFixed(1)}%</code>

${event.description ? `<i>${event.description}</i>\n\n` : ''}💭 ${reaction}${formatStatsFooter(stats)}`;
}
