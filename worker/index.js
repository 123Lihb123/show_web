const CACHE_KEY_LATEST = 'adxl345_latest';
const CACHE_KEY_HISTORY = 'adxl345_history';
const MAX_HISTORY_SIZE = 200;

async function handleRequest(request) {
  const { method, url } = request;
  const path = new URL(url).pathname;

  if (path === '/upload' && method === 'POST') {
    return handleUpload(request);
  } else if (path === '/latest' && method === 'GET') {
    return handleGetLatest();
  } else if (path === '/history' && method === 'GET') {
    return handleGetHistory();
  } else if (path === '/clear' && method === 'POST') {
    return handleClearCache();
  }

  return new Response('ADXL345 Data Server API\n\nEndpoints:\nPOST /upload - Upload sensor data\nGET /latest - Get latest data\nGET /history - Get history data\nPOST /clear - Clear cache', {
    headers: { 'Content-Type': 'text/plain' },
  });
}

async function handleUpload(request) {
  try {
    const data = await request.json();
    
    if (!data.x || !data.y || !data.z) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const timestamp = Date.now();
    const record = {
      x: parseFloat(data.x),
      y: parseFloat(data.y),
      z: parseFloat(data.z),
      timestamp: timestamp,
    };

    await STORAGE.put(CACHE_KEY_LATEST, JSON.stringify(record));

    const historyStr = await STORAGE.get(CACHE_KEY_HISTORY);
    let history = historyStr ? JSON.parse(historyStr) : [];
    history.push(record);
    
    if (history.length > MAX_HISTORY_SIZE) {
      history = history.slice(-MAX_HISTORY_SIZE);
    }

    await STORAGE.put(CACHE_KEY_HISTORY, JSON.stringify(history));

    return new Response(JSON.stringify({ success: true, timestamp: timestamp }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleGetLatest() {
  try {
    const data = await STORAGE.get(CACHE_KEY_LATEST);
    if (!data) {
      return new Response(JSON.stringify({ error: 'No data available' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(data, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleGetHistory() {
  try {
    const data = await STORAGE.get(CACHE_KEY_HISTORY);
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
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleClearCache() {
  try {
    await STORAGE.delete(CACHE_KEY_LATEST);
    await STORAGE.delete(CACHE_KEY_HISTORY);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});