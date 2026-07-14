const CACHE_KEY_GPS_LATEST = 'gps_latest';

export async function onRequestGet(context) {
  const { env } = context;
  
  if (!env.STORAGE) {
    return new Response(JSON.stringify({ error: 'KV storage not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const data = await env.STORAGE.get(CACHE_KEY_GPS_LATEST);
    if (!data) {
      return new Response(JSON.stringify({ error: 'No GPS data available' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    return new Response(data, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}