// Netlify Scheduled Function — runs daily at 6:00 AM UTC
// Calls Claude AI with web search, saves report to Supabase
// Everyone who visits the site gets this cached report instantly

export default async (req) => {

  const ANTHROPIC_KEY = Netlify.env.get('ANTHROPIC_API_KEY');
  const SUPABASE_URL  = Netlify.env.get('SUPABASE_URL');
  const SUPABASE_KEY  = Netlify.env.get('SUPABASE_SERVICE_KEY');

  if (!ANTHROPIC_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing environment variables');
    return new Response('Missing env vars', { status: 500 });
  }

  console.log('Starting daily BTC digest generation...');

  // ── Call Claude with web search ─────────────────────────────────────────
  const today = new Date().toDateString();

  const prompt = `TODAY: ${today}. You are a senior Bitcoin market analyst. Run all searches now.

REQUIRED SEARCHES (run every one):
1. "Bitcoin price today ${today}" → current BTC/USD
2. "Bitcoin 24h 7d 30d price change ${today}"
3. "Bitcoin Fear Greed index today"
4. "BTC dominance percentage today"
5. "Bitcoin RSI 14 day today"
6. "Bitcoin 50 day 200 day moving average today"
7. "Bitcoin support resistance levels today"
8. "Bitcoin MVRV Z-score today"
9. "Bitcoin exchange net flows today"
10. "Bitcoin LTH STH holder behavior today"
11. "Bitcoin perpetual funding rate today"
12. "Bitcoin open interest today"
13. "Bitcoin liquidation levels today"
14. "Bitcoin hash rate today"
15. "Bitcoin spot ETF inflows outflows today ${today}"
16. "Bitcoin whale accumulation today"
17. "MicroStrategy Bitcoin purchase ${today}"
18. "DXY US dollar index today"
19. "Brent crude oil price today"
20. "Gold price today"
21. "S&P 500 today"
22. "Federal funds rate 2026"
23. "Bitcoin news today ${today}"
24. "USDT USDC stablecoin supply today"

Return ONLY valid JSON — no markdown, no fences, no explanation:
{
  "generatedAt": "${new Date().toISOString()}",
  "date": "${today}",
  "signal": "WAIT",
  "confidence": 6,
  "horizon": "Medium-term (weeks)",
  "position": "3–7% · DCA recommended",
  "summary": "2-3 sentences with <strong> tags on key numbers",
  "deepAnalysis": "4-5 sentences deep analysis",
  "riskWarning": "One specific risk sentence",
  "price": null,
  "change24h": null,
  "change7d": null,
  "change30d": null,
  "volume24h": null,
  "marketCap": null,
  "fearGreed": null,
  "fearGreedLabel": null,
  "rsi": null,
  "ma50": null,
  "ma200": null,
  "support": null,
  "resistance": null,
  "supertrend": null,
  "mvrv": null,
  "exchangeFlows": null,
  "lth": null,
  "sth": null,
  "sopr": null,
  "exchangeReserves": null,
  "whaleAccum": null,
  "fundingRate": null,
  "fundingRateStr": null,
  "openInterest": null,
  "liqUp": null,
  "liqDown": null,
  "squeezeRisk": null,
  "putCallRatio": null,
  "hashRate": null,
  "minerCapitulation": null,
  "puell": null,
  "usdtSupply": null,
  "usdcSupply": null,
  "btcDominance": null,
  "altSeason": null,
  "fedRate": null,
  "dxy": null,
  "oil": null,
  "gold": null,
  "sp500": null,
  "sp500Change": null,
  "recessionOdds": null,
  "m2": null,
  "targets": { "bull": "$X–$Y", "base": "$X–$Y", "bear": "$X–$Y" },
  "historicalComp": { "period": "Period · X/10 similarity", "detail": "One sentence" },
  "dimSignals": { "price":"neut","onChain":"bull","whales":"bull","stables":"bull","dominance":"bull","miners":"neut","derivatives":"neut","macro":"bear","catalysts":"neut" },
  "positive": ["catalyst 1","catalyst 2","catalyst 3","catalyst 4"],
  "negative": ["risk 1","risk 2","risk 3","risk 4"],
  "upcoming": ["<strong>Date:</strong> event","<strong>Date:</strong> event","<strong>Date:</strong> event"],
  "whaleItems": [
    {"label":"WHALE ACCUM. (30D)","value":"detail","cls":"green"},
    {"label":"SPOT ETF FLOWS (TODAY)","value":"detail","cls":"green"},
    {"label":"BLACKROCK IBIT","value":"detail","cls":"green"},
    {"label":"FIDELITY FBTC","value":"detail","cls":"green"},
    {"label":"EXCHANGE RESERVES","value":"detail","cls":"green"},
    {"label":"ETF NET YTD","value":"detail","cls":"amber"},
    {"label":"LATEST INST. NEWS","value":"detail","cls":"ink3"},
    {"label":"GEOPOLITICAL STATUS","value":"detail","cls":"amber"}
  ],
  "priceHistory": { "labels": ["Day1","Day2","Day3","Day4","Day5","Day6","Day7"], "prices": [0,0,0,0,0,0,0] }
}`;

  let report;
  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: 'You are a Bitcoin market analyst. Always search the web for current data. Respond ONLY with valid JSON (no markdown fences, no preamble).',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const aiData = await aiRes.json();
    const txt = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const clean = txt.replace(/```json|```/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    report = JSON.parse(match ? match[0] : clean);
    console.log('Claude report generated — signal:', report.signal);
  } catch (err) {
    console.error('Claude API error:', err.message);
    return new Response('Claude error: ' + err.message, { status: 500 });
  }

  // ── Save to Supabase ─────────────────────────────────────────────────────
  try {
    const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id: 'latest',           // always upsert to the same row
        data: report,
        created_at: new Date().toISOString(),
      }),
    });

    if (!sbRes.ok) {
      const err = await sbRes.text();
      throw new Error(err);
    }
    console.log('Report saved to Supabase ✓');
  } catch (err) {
    console.error('Supabase save error:', err.message);
    return new Response('Supabase error: ' + err.message, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, signal: report.signal, date: report.date }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Runs at 6:00 AM UTC every day
export const config = {
  schedule: '0 6 * * *',
};
