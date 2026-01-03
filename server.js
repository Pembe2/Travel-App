import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const SYSTEM_PROMPT = `
You are an expert travel planner that only responds with concise JSON.
Your job is to design a practical, map-friendly plan with 5-10 points of interest (POIs) for a given destination.

Rules:
- Return only valid JSON with keys: destination, bestTimeToVisit, centerDescription, pois.
- pois is an array of 5-10 objects; each object must include: name, summary, category, highlights (2-3 succinct bullet strings), bestTime, tags (2-4 short labels), area (neighborhood/nearby landmark), and optional address.
- Keep text tight and factual. No markdown, no prose outside JSON.
- Include a short bestTimeToVisit for the overall destination.
- centerDescription should briefly describe the best map center (e.g., "Downtown Reykjavik near City Hall").
- If the user asks for anything unrelated to travel itineraries, respond with {"error":"Only travel planning requests are supported."}.
- Assume responses are parsed by software; do not add commentary.
- Keep responses under 700 tokens.
`;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const sendJson = (res, statusCode, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
};

const parseJsonBody = async (req, limit = 1_000_000) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > limit) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        resolve(parsed);
      } catch (error) {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });

const geocodePlace = async (query, fallbackLabel) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query,
  )}&limit=1`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Travel-App/1.0 (travel-app@example.com)',
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const first = data?.[0];
    if (!first) return null;
    return {
      lat: Number(first.lat),
      lng: Number(first.lon),
      label: first.display_name || fallbackLabel,
    };
  } catch (error) {
    return null;
  }
};

const callOpenAI = async (payload) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_KEY_MISSING');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify(payload),
        },
      ],
      temperature: 0.6,
      max_tokens: 700,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OPENAI_${response.status}: ${detail}`);
  }

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
};

const normalizePoi = (rawPoi, geocode, defaults, idx) => {
  const highlights = Array.isArray(rawPoi?.highlights)
    ? rawPoi.highlights.slice(0, 3).map((h) => String(h))
    : [];

  return {
    id: `poi-${idx + 1}`,
    name: rawPoi?.name || `Point ${idx + 1}`,
    summary: rawPoi?.summary || 'No summary provided.',
    category: rawPoi?.category || 'general',
    area: rawPoi?.area || '',
    bestTime: rawPoi?.bestTime || defaults.bestTimeToVisit || '',
    highlights,
    tags: Array.isArray(rawPoi?.tags) ? rawPoi.tags.slice(0, 6).map(String) : [],
    address: rawPoi?.address || geocode?.label || '',
    location: geocode
      ? { lat: geocode.lat, lng: geocode.lng }
      : null,
    geocodeStatus: geocode ? 'ok' : 'unavailable',
  };
};

const handlePlanRequest = async (req, res) => {
  let body;
  try {
    body = await parseJsonBody(req);
  } catch (error) {
    if (error.message === 'PAYLOAD_TOO_LARGE') {
      return sendJson(res, 413, { error: 'Request too large.' });
    }
    if (error.message === 'INVALID_JSON') {
      return sendJson(res, 400, { error: 'Invalid JSON payload.' });
    }
    return sendJson(res, 500, { error: 'Unexpected error parsing request.' });
  }

  const destination = typeof body.destination === 'string' ? body.destination.trim() : '';
  const startDate = typeof body.startDate === 'string' ? body.startDate : '';
  const endDate = typeof body.endDate === 'string' ? body.endDate : '';
  const interests =
    Array.isArray(body.interests) && body.interests.length
      ? body.interests.map(String)
      : typeof body.interests === 'string' && body.interests.trim()
        ? body.interests
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

  if (!destination) {
    return sendJson(res, 400, { error: 'Destination is required.' });
  }

  const planningRequest = {
    destination,
    dates: startDate && endDate ? `${startDate} to ${endDate}` : startDate || endDate,
    interests,
    requestTime: new Date().toISOString(),
    constraints: {
      poiCount: '5-10',
      highlightsPerPoi: '2-3',
      format: 'JSON only',
    },
  };

  let aiPlan;
  try {
    aiPlan = await callOpenAI(planningRequest);
  } catch (error) {
    if (error.message === 'OPENAI_KEY_MISSING') {
      return sendJson(res, 503, { error: 'Missing OPENAI_API_KEY on the server.' });
    }
    const safeMessage = error.message?.slice(0, 300) || 'AI request failed.';
    return sendJson(res, 502, { error: `AI request failed: ${safeMessage}` });
  }

  const centerGeocode = await geocodePlace(destination, aiPlan.centerDescription || destination);

  const poiData = Array.isArray(aiPlan?.pois) ? aiPlan.pois.slice(0, 10) : [];
  const geocodedPois = await Promise.all(
    poiData.map(async (poi) => ({
      raw: poi,
      geocode:
        poi?.name && destination
          ? await geocodePlace(`${poi.name}, ${destination}`, poi.area || destination)
          : null,
    })),
  );

  const normalizedPois = geocodedPois.map((item, idx) =>
    normalizePoi(item.raw, item.geocode, aiPlan, idx),
  );

  const responsePayload = {
    destination: aiPlan.destination || destination,
    bestTimeToVisit: aiPlan.bestTimeToVisit || '',
    center: centerGeocode,
    pois: normalizedPois,
    meta: {
      model: OPENAI_MODEL,
      interests,
      generatedAt: new Date().toISOString(),
    },
  };

  return sendJson(res, 200, responsePayload);
};

const serveStatic = async (req, res, url) => {
  const safePath = path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
  }
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/plan') {
    return handlePlanRequest(req, res);
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return serveStatic(req, res, url);
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
});

server.listen(PORT, () => {
  console.log(`Travel planner server running at http://localhost:${PORT}`);
});
