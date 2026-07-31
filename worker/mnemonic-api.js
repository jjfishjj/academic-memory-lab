const STYLE_RULES = {
  homophone: "以中文近音拆解發音，必須能連回原詞意思",
  rhyme: "使用短句、押韻和清楚節奏，適合大聲唸三遍",
  meme: "使用台灣學生熟悉但不冒犯人的迷因語氣",
  "story-chain": "從字頭或關鍵字依序串成荒謬但可回想的小故事",
};

function corsHeaders(origin, allowedOrigin) {
  const allow = origin === allowedOrigin || origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
  return {
    "Access-Control-Allow-Origin": allow ? origin : allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://jjfishjj.github.io";
    const headers = corsHeaders(origin, allowedOrigin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers });
    if (!env.OPENAI_API_KEY) return Response.json({ error: "AI service is not configured" }, { status: 503, headers });

    let input;
    try {
      input = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400, headers });
    }

    const { term, hint, extra = "", style, styleName } = input;
    if (![term, hint, style, styleName].every((value) => typeof value === "string" && value.trim())) {
      return Response.json({ error: "Missing mnemonic input" }, { status: 400, headers });
    }

    const prompt = `知識點：${term}\n意思：${hint}\n補充：${extra || "無"}\n模式：${styleName}\n規則：${STYLE_RULES[style] || "產生好記的中文口訣"}`;
    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-5.6-terra",
        reasoning: { effort: "none" },
        instructions: "你是繁體中文記憶教練。產生三個短、準確、無冒犯性且彼此不同的記憶口訣。不要解釋，只回傳指定 JSON。",
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
      return Response.json({ error: result?.error?.message || "OpenAI request failed" }, { status: 502, headers });
    }

    const outputText = result.output
      ?.flatMap((item) => item.content || [])
      .find((content) => content.type === "output_text")?.text;
    try {
      const parsed = JSON.parse(outputText);
      return Response.json({ suggestions: parsed.suggestions }, { headers: { ...headers, "Cache-Control": "no-store" } });
    } catch {
      return Response.json({ error: "AI returned invalid output" }, { status: 502, headers });
    }
  },
};
