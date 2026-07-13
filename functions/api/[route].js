const CACHE_KEY_LATEST = 'adxl345_latest';
const CACHE_KEY_HISTORY = 'adxl345_history';
const MAX_HISTORY_SIZE = 200;

export async function onRequest(context) {
  const { request, env } = context;
  const { method, url } = request;
  const path = new URL(url).pathname;

  if (!env.STORAGE) {
    return new Response(JSON.stringify({ error: 'KV storage not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (path === '/api/upload' && method === 'POST') {
    return await handleUpload(request, env);
  } else if (path === '/api/latest' && method === 'GET') {
    return await handleGetLatest(env);
  } else if (path === '/api/history' && method === 'GET') {
    return await handleGetHistory(env);
  }

  return new Response(JSON.stringify({ error: 'API not found' }), { 
    status: 404,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

async function handleUpload(request, env) {
  try {
    const data = await request.json();
    
    if (!data.x || !data.y || !data.z) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const timestamp = Date.now();
    const record = {
      x: parseFloat(data.x),
      y: parseFloat(data.y),
      z: parseFloat(data.z),
      timestamp: timestamp,
    };

    await env.STORAGE.put(CACHE_KEY_LATEST, JSON.stringify(record));

    const historyStr = await env.STORAGE.get(CACHE_KEY_HISTORY);
    let history = historyStr ? JSON.parse(historyStr) : [];
    history.push(record);
    
    if (history.length > MAX_HISTORY_SIZE) {
      history = history.slice(-MAX_HISTORY_SIZE);
    }

    await env.STORAGE.put(CACHE_KEY_HISTORY, JSON.stringify(history));

    return new Response(JSON.stringify({ success: true, timestamp: timestamp }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

async function handleGetLatest(env) {
  try {
    const data = await env.STORAGE.get(CACHE_KEY_LATEST);
    if (!data) {
      return new Response(JSON.stringify({ error: 'No data available' }), {
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

async function handleGetHistory(env) {
  try {
    const data = await env.STORAGE.get(CACHE_KEY_HISTORY);
    if (!data) {
      return new Response(JSON.stringify([]), {
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