exports.handler = async (event) => {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { brand, industry, style, color } = body;
  if (!brand || !industry || !style || !color)
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Thiếu thông tin" }) };

  const styleGuides = {
    Minimalist:    "ultra-clean white space, minimal borders, elegant thin typography, lots of breathing room",
    Corporate:     "professional grid layout, strong hierarchy, trustworthy navy/gray palette, structured sections",
    "Tech-Modern": "dark background, glassmorphism cards, vivid neon accent glows, bold modern fonts, futuristic",
    Creative:      "bold asymmetric layout, expressive large typography, vibrant colors, artistic energy",
  };

  const prompt = `You are a senior UI/UX designer. Generate a complete beautiful HTML homepage mockup.
Brand: ${brand} | Industry: ${industry} | Style: ${style} — ${styleGuides[style] || style} | Primary color: ${color}
Output ONLY raw HTML with ALL styles inline. Include:
1. Sticky navbar: logo "${brand}", nav links (Giới thiệu · Dịch vụ · Liên hệ), CTA button using ${color}
2. Hero: large bold Vietnamese headline for ${industry}, subheadline, 2 buttons (primary filled + outline), decorative CSS shape using ${color}
3. Features: 3 cards — emoji icon + Vietnamese title + short Vietnamese description relevant to ${industry}
4. Stats row: 3 impressive numbers (500+ khách hàng, 10 năm kinh nghiệm, 99% hài lòng) with ${color} accent
5. Footer: "${brand}", short tagline, copyright 2025
Rules: ALL text Vietnamese · NO external resources · inline styles only · apply ${style} aesthetic · max 90 lines`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "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",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1800,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Lỗi AI: " + res.status + " — " + err.slice(0,200) }) };
    }

    const data = await res.json();
    const html = data.content?.[0]?.text || "";
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ html }) };

  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Lỗi server: " + err.message }) };
  }
};
