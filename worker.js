// ============================================================
//  AI Web-Design — Cloudflare Worker Proxy
//  Deploy tại: https://workers.cloudflare.com
//  Sau khi deploy: copy URL worker vào index.html
// ============================================================

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON' }, 400); }

    const { brand, industry, style, color } = body;
    if (!brand || !industry || !style || !color) {
      return json({ error: 'Thiếu thông tin đầu vào' }, 400);
    }

    const styleGuides = {
      Minimalist:    'ultra-clean white space, minimal borders, elegant thin typography, lots of breathing room',
      Corporate:     'professional grid layout, strong hierarchy, trustworthy navy/gray palette, structured sections',
      'Tech-Modern': 'dark background, glassmorphism cards, vivid neon accent glows, bold modern fonts, futuristic',
      Creative:      'bold asymmetric layout, expressive large typography, vibrant colors, artistic energy',
    };

    const prompt = `You are a senior UI/UX designer. Generate a complete beautiful HTML homepage mockup.
Brand: ${brand} | Industry: ${industry} | Style: ${style} — ${styleGuides[style] || style} | Primary color: ${color}
Output ONLY raw HTML with ALL styles inline. Include:
1. Sticky navbar: logo "${brand}", nav links (Giới thiệu · Dịch vụ · Liên hệ), CTA button using ${color}
2. Hero: large bold Vietnamese headline for ${industry}, subheadline, 2 buttons (primary filled + outline), decorative CSS shape/gradient using ${color}
3. Features: 3 cards — emoji icon + Vietnamese title + short Vietnamese description relevant to ${industry}
4. Stats row: 3 impressive numbers (500+ khách hàng, 10 năm kinh nghiệm, 99% hài lòng) with ${color} accent
5. Footer: "${brand}", short tagline, copyright 2025
Rules: ALL text Vietnamese · NO external resources · inline styles only · apply ${style} aesthetic · max 90 lines`;

    try {
      // API key lưu trong Cloudflare Worker Environment Variable: ANTHROPIC_API_KEY
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1800,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Anthropic error:', err);
        return json({ error: 'Lỗi AI service: ' + res.status }, 502);
      }

      const data = await res.json();
      const html = data.content?.[0]?.text || '';
      return json({ html });

    } catch (err) {
      return json({ error: 'Lỗi server: ' + err.message }, 500);
    }
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
