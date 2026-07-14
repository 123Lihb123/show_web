const CACHE_KEY_LATEST = 'adxl345_latest';
const CACHE_KEY_HISTORY = 'adxl345_history';
const CACHE_KEY_GPS_LATEST = 'gps_latest';
const CACHE_KEY_GPS_HISTORY = 'gps_history';
const MAX_HISTORY_SIZE = 200;

export async function onRequestPost(context) {
  const { request, env } = context;
  
  if (!env.STORAGE) {
    return new Response(JSON.stringify({ error: 'KV storage not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const data = await request.json();
    
    if (data.x === undefined || data.y === undefined || data.z === undefined) {
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

    if (data.lat !== undefined || data.lng !== undefined) {
      const gpsRecord = {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lng),
        alt: parseFloat(data.alt) || 0,
        gps_valid: data.gps_valid === true || data.gps_valid === 'true',
        timestamp: timestamp,
      };
      await env.STORAGE.put(CACHE_KEY_GPS_LATEST, JSON.stringify(gpsRecord));
      
      const gpsHistoryStr = await env.STORAGE.get(CACHE_KEY_GPS_HISTORY);
      let gpsHistory = gpsHistoryStr ? JSON.parse(gpsHistoryStr) : [];
      gpsHistory.push(gpsRecord);
      
      if (gpsHistory.length > MAX_HISTORY_SIZE) {
        gpsHistory = gpsHistory.slice(-MAX_HISTORY_SIZE);
      }
      
      await env.STORAGE.put(CACHE_KEY_GPS_HISTORY, JSON.stringify(gpsHistory));
    }

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