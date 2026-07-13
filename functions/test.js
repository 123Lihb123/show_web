export async function onRequest(context) {
  const { env } = context;
  
  return new Response(JSON.stringify({
    status: 'ok',
    hasStorage: !!env.STORAGE
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}