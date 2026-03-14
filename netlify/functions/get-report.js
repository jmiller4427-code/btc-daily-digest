export default async (request) => {
  const SUPABASE_URL = Netlify.env.get('SUPABASE_URL');
  const SUPABASE_KEY = Netlify.env.get('SUPABASE_SERVICE_KEY');
  const headers = { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=300' };
  if (!SUPABASE_URL || !SUPABASE_KEY) return new Response(JSON.stringify({error:'Supabase not configured'}),{status:500,headers});
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.latest&select=data,created_at`,{headers:{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`}});
    const rows = await res.json();
    if (!rows || rows.length === 0) return new Response(JSON.stringify({error:'No report yet'}),{status:404,headers});
    return new Response(JSON.stringify({report:rows[0].data,cachedAt:rows[0].created_at}),{status:200,headers});
  } catch(err) { return new Response(JSON.stringify({error:err.message}),{status:500,headers}); }
};
export const config = { path: '/api/report' };
