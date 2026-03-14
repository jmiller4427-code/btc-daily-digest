// Netlify Scheduled Function — runs daily at 6:00 AM UTC
export default async (req) => {
  const ANTHROPIC_KEY = Netlify.env.get('ANTHROPIC_API_KEY');
  const SUPABASE_URL  = Netlify.env.get('SUPABASE_URL');
  const SUPABASE_KEY  = Netlify.env.get('SUPABASE_SERVICE_KEY');
  if (!ANTHROPIC_KEY || !SUPABASE_URL || !SUPABASE_KEY) return new Response('Missing env vars', { status: 500 });
  const today = new Date().toDateString();
  const prompt = 'TODAY: '+today+'. You are a senior Bitcoin market analyst. Search the web for all data.\n\nRun these 24 searches:\n1. Bitcoin price today\n2. Bitcoin 24h 7d 30d change today\n3. Bitcoin Fear Greed index today\n4. BTC dominance today\n5. Bitcoin RSI 14 day today\n6. Bitcoin 50 200 day moving average today\n7. Bitcoin support resistance today\n8. Bitcoin MVRV Z-score today\n9. Bitcoin exchange net flows today\n10. Bitcoin LTH STH behavior today\n11. Bitcoin funding rate today\n12. Bitcoin open interest today\n13. Bitcoin liquidation levels today\n14. Bitcoin hash rate today\n15. Bitcoin spot ETF flows today\n16. Bitcoin whale accumulation today\n17. MicroStrategy Bitcoin today\n18. DXY today\n19. Brent crude today\n20. Gold price today\n21. SP500 today\n22. Federal funds rate 2026\n23. Bitcoin news today\n24. USDT USDC supply today\n\nReturn ONLY valid JSON no markdown: {"generatedAt":"ISO","date":"today","signal":"WAIT","confidence":6,"horizon":"Medium-term (weeks)","position":"3-7% DCA","summary":"summary","deepAnalysis":"analysis","riskWarning":"risk","price":null,"change24h":null,"change7d":null,"change30d":null,"volume24h":null,"marketCap":null,"fearGreed":null,"fearGreedLabel":null,"rsi":null,"ma50":null,"ma200":null,"support":null,"resistance":null,"supertrend":null,"mvrv":null,"exchangeFlows":null,"lth":null,"sth":null,"sopr":null,"exchangeReserves":null,"whaleAccum":null,"fundingRate":null,"fundingRateStr":null,"openInterest":null,"liqUp":null,"liqDown":null,"squeezeRisk":null,"putCallRatio":null,"hashRate":null,"minerCapitulation":null,"puell":null,"usdtSupply":null,"usdcSupply":null,"btcDominance":null,"altSeason":null,"fedRate":null,"dxy":null,"oil":null,"gold":null,"sp500":null,"sp500Change":null,"recessionOdds":null,"m2":null,"targets":{"bull":"$X-$Y","base":"$X-$Y","bear":"$X-$Y"},"historicalComp":{"period":"Period","detail":"detail"},"dimSignals":{"price":"neut","onChain":"bull","whales":"bull","stables":"bull","dominance":"bull","miners":"neut","derivatives":"neut","macro":"bear","catalysts":"neut"},"positive":["cat1","cat2","cat3","cat4"],"negative":["risk1","risk2","risk3","risk4"],"upcoming":["event1","event2","event3"],"whaleItems":[{"label":"WHALE ACCUM. (30D)","value":"detail","cls":"green"},{"label":"SPOT ETF FLOWS (TODAY)","value":"detail","cls":"green"},{"label":"BLACKROCK IBIT","value":"detail","cls":"green"},{"label":"FIDELITY FBTC","value":"detail","cls":"green"},{"label":"EXCHANGE RESERVES","value":"detail","cls":"green"},{"label":"ETF NET YTD","value":"detail","cls":"amber"},{"label":"LATEST INST. NEWS","value":"detail","cls":"ink3"},{"label":"GEOPOLITICAL STATUS","value":"detail","cls":"amber"}],"priceHistory":{"labels":["D1","D2","D3","D4","D5","D6","D7"],"prices":[0,0,0,0,0,0,0]}}';
  let report;
  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'web-search-2025-03-05' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, tools: [{ type: 'web_search_20250305', name: 'web_search' }], system: 'You are a Bitcoin market analyst. Always search the web for current data. Respond ONLY with valid JSON (no markdown fences).', messages: [{ role: 'user', content: prompt }] }),
    });
    const aiData = await aiRes.json();
    const txt = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const match = txt.replace(/```json|```/g,'').trim().match(/{[\s\S]*}/);
    report = JSON.parse(match ? match[0] : txt);
  } catch (err) { return new Response('Claude error: ' + err.message, { status: 500 }); }
  try {
    const sbRes = await fetch(SUPABASE_URL+'/rest/v1/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer '+SUPABASE_KEY, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ id: 'latest', data: report, created_at: new Date().toISOString() }),
    });
    if (!sbRes.ok) throw new Error(await sbRes.text());
  } catch (err) { return new Response('Supabase error: ' + err.message, { status: 500 }); }
  return new Response(JSON.stringify({ ok: true, signal: report.signal }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
export const config = { schedule: '0 6 * * *' };
