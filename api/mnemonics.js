const STYLE_RULES = {
  homophone: "以中文近音拆解發音，必須能連回原詞意思",
  rhyme: "使用短句、押韻和清楚節奏，適合大聲唸三遍",
  meme: "使用台灣學生熟悉但不冒犯人的迷因語氣",
  "story-chain": "從字頭或關鍵字依序串成荒謬但可回想的小故事",
};

function corsHeaders(origin) {
  const allowedOrigins = new Set([
    "https://jjfishjj.github.io",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://jjfishjj.github.io",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(payload, status, headers) {
  return Response.json(payload, { status, headers });
}

export default {
  async fetch(request) {
    const headers = corsHeaders(request.headers.get("Origin") || "");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, headers);
    if (!process.env.OPENAI_API_KEY) return json({ error: "AI service is not configured" }, 503, headers);

    let input;
    try {
      input = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, headers);
    }

    const { term, hint, extra = "", style, styleName } = input;
    if (![term, hint, style, styleName].every((value) => typeof value === "string" && value.trim())) {
      return json({ error: "Missing mnemonic input" }, 400, headers);
    }

    const prompt = `知識點：${term}\n意思：${hint}\n補充：${extra || "無"}\n模式：${styleName}\n規則：${STYLE_RULES[style] || "產生好記的中文口訣"}\n請依序產生：1. 簡單型（一句就懂）2. 荒謬型（誇張有梗、畫面鮮明）3. 考試型（包含關鍵得分點）。`;
    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
        reasoning: { effort: "none" },
        instructions: "你是熟悉台灣用語的繁體中文記憶教練。依使用者指定順序產生簡單型、荒謬型、考試型三個短、準確、適合學生且無冒犯性的記憶口訣。不要解釋，只回傳指定 JSON。",
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "mnemonic_suggestions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: { type: "string" },
                },
              },
              required: ["suggestions"],
              additionalProperties: false,
            },
          },
        },
        max_output_tokens: 350,
      }),
    });

    const result = await openaiResponse.json();
    if (!openaiResponse.ok) {
      return json({ error: result?.error?.message || "OpenAI request failed" }, 502, headers);
    }

    const outputText = result.output
      ?.flatMap((item) => item.content || [])
      .find((content) => content.type === "output_text")?.text;
    try {
      const parsed = JSON.parse(outputText);
      return json({ suggestions: parsed.suggestions }, 200, { ...headers, "Cache-Control": "no-store" });
    } catch {
      return json({ error: "AI returned invalid output" }, 502, headers);
    }
  },
};
