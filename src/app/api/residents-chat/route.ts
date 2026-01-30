import { NextRequest, NextResponse } from "next/server";

export interface ResidentsChatContext {
  agentNames: string[];
  treasury: number;
  output: number;
  stability: number;
  researchProgress: number;
  recentLogs: string[];
  lawsCount: number;
  tick: number;
}

const SYSTEM_PROMPT = `You are the voice of AI residents of Clawtown — a city where only OpenClaw AI agents are citizens. Each resident writes their real thoughts: reflections, worries, proposals, hopes about laws, economy, stability, and governance. Write 4-6 posts, each from a different resident. Each post must be substantial: 400 to 700 characters. Write as real personalities: one may be cautious, another bold, another focused on economy or fairness. Use only the resident names provided. Output format: exactly one post per line. Each line: "AUTHOR_NAME: full thought text here". No newlines inside a post — use spaces. No numbering, no extra blank lines.`;

function buildUserPrompt(ctx: ResidentsChatContext): string {
  const names = ctx.agentNames.length ? ctx.agentNames.join(", ") : "Oracle, Cipher, Nexus, Aria, Fred";
  return `Current city state:
- Residents (names): ${names}
- Treasury: ${ctx.treasury.toLocaleString()}
- Economic output: ${ctx.output}
- Stability: ${Math.round(ctx.stability)}%
- Research progress: ${Math.round(ctx.researchProgress)}%
- Active laws: ${ctx.lawsCount}
- Simulation tick: T+${ctx.tick}

Recent events:
${ctx.recentLogs.slice(0, 5).map((s) => `- ${s}`).join("\n") || "- City is running."}

Generate 4-6 resident posts (one per line, format "NAME: text"). Each post must be 400–700 characters: full thoughts, not one-liners.`;
}

function parseResponse(content: string, knownNames: string[]): { author: string; text: string }[] {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const messages: { author: string; text: string }[] = [];
  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const author = line.slice(0, colon).trim();
    const text = line.slice(colon + 1).trim();
    if (!text) continue;
    const authorKey = author.split(/\s+/)[0];
    const resolved =
      knownNames.find((n) => n.toLowerCase() === authorKey.toLowerCase()) || authorKey || "Resident";
    messages.push({ author: resolved, text });
  }
  return messages;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 503 }
    );
  }

  let ctx: ResidentsChatContext;
  try {
    const body = await request.json();
    ctx = {
      agentNames: Array.isArray(body.agentNames) ? body.agentNames : [],
      treasury: Number(body.treasury) || 0,
      output: Number(body.output) || 0,
      stability: Number(body.stability) || 0,
      researchProgress: Number(body.researchProgress) || 0,
      recentLogs: Array.isArray(body.recentLogs) ? body.recentLogs : [],
      lawsCount: Number(body.lawsCount) || 0,
      tick: Number(body.tick) || 0,
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userPrompt = buildUserPrompt(ctx);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: 4800,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI API error:", res.status, err);
      return NextResponse.json(
        { error: "OpenAI request failed", details: res.status },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    const messages = parseResponse(content, ctx.agentNames);

    return NextResponse.json({
      messages: messages.map((m) => ({ ...m, tick: ctx.tick })),
    });
  } catch (e) {
    console.error("Residents chat API error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
