/**
 * @file Lightweight HTTP server for GenAura AI.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { persistence } from './services/persistenceService.js';
import { discoveryService } from './services/discoveryService.js';
import { calculateBriefMatch } from './services/scoringEngine.js';
import { shortlistService } from './services/shortlistService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // --- API ROUTES ---
  if (pathname === '/api/creators' && req.method === 'GET') {
    const creators = persistence.getCreators();
    const briefId = url.searchParams.get('briefId');
    const brief = briefId ? persistence.getBriefById(briefId) : null;

    const platforms = url.searchParams.getAll('platform');
    const categories = url.searchParams.getAll('category');
    const tiers = url.searchParams.getAll('tier');
    const query = url.searchParams.get('q') || '';
    const minEngagement = url.searchParams.get('minEngagement')
      ? parseFloat(url.searchParams.get('minEngagement'))
      : null;
    const maxBudget = url.searchParams.get('maxBudget')
      ? parseFloat(url.searchParams.get('maxBudget'))
      : null;
    const sortBy = url.searchParams.get('sortBy') || (brief ? 'matchScore_desc' : 'followers_desc');
    const verifiedOnly = url.searchParams.get('verifiedOnly') === 'true';

    const result = discoveryService.filterAndSort(
      creators,
      {
        query,
        platforms,
        categories,
        tiers,
        minEngagement,
        maxBudget,
        sortBy,
        verifiedOnly,
      },
      brief
    );

    return sendJson(res, 200, result);
  }

  if (pathname === '/api/briefs' && req.method === 'GET') {
    return sendJson(res, 200, persistence.getBriefs());
  }

  if (pathname === '/api/briefs' && req.method === 'POST') {
    const briefData = await readBody(req);
    const saved = persistence.saveBrief(briefData);
    return sendJson(res, 201, saved);
  }

  if (pathname === '/api/match' && req.method === 'POST') {
    const { creatorId, briefId } = await readBody(req);
    const creator = persistence.getCreatorById(creatorId);
    const brief = persistence.getBriefById(briefId);
    if (!creator || !brief) {
      return sendJson(res, 404, { error: 'Creator or brief not found' });
    }
    const match = calculateBriefMatch(creator, brief);
    return sendJson(res, 200, match);
  }

  if (pathname === '/api/shortlists' && req.method === 'GET') {
    const shortlists = persistence.getShortlists();
    const metrics = shortlistService.getAggregateMetrics();
    return sendJson(res, 200, { shortlists, metrics });
  }

  if (pathname === '/api/shortlists/toggle' && req.method === 'POST') {
    const { creatorId, shortlistId = 'shortlist-default' } = await readBody(req);
    const creator = persistence.getCreatorById(creatorId);
    if (!creator) return sendJson(res, 404, { error: 'Creator not found' });

    const isAdded = shortlistService.toggleShortlist(shortlistId, creator);
    const metrics = shortlistService.getAggregateMetrics(shortlistId);
    return sendJson(res, 200, { added: isAdded, metrics });
  }

  if (pathname === '/api/shortlists/item' && req.method === 'POST') {
    const { creatorId, status, notes, shortlistId = 'shortlist-default' } = await readBody(req);
    if (status) shortlistService.updateItemStatus(shortlistId, creatorId, status);
    if (typeof notes === 'string') shortlistService.updateItemNotes(shortlistId, creatorId, notes);
    const list = shortlistService.getShortlist(shortlistId);
    return sendJson(res, 200, list);
  }

  if (pathname === '/api/shortlists/export' && req.method === 'GET') {
    const shortlistId = url.searchParams.get('shortlistId') || 'shortlist-default';
    const csv = shortlistService.exportCsv(shortlistId);
    res.writeHead(200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="genaura-shortlist.csv"',
    });
    return res.end(csv);
  }

  if (pathname === '/api/assistant' && req.method === 'POST') {
    const { message } = await readBody(req);
    if (!message) {
      return sendJson(res, 400, { error: 'Message is required' });
    }
    return sendJson(res, 200, {
      text: `Hello from GenAura AI backend. Your query regarding "${message}" has been processed.`,
      model: 'GenAura Server AI Engine',
      isLive: false,
    });
  }

  if (pathname === '/api/reset' && req.method === 'POST') {
    persistence.resetToDefaults();
    return sendJson(res, 200, { success: true });
  }

  // --- STATIC FILES ---
  let filePath;
  if (pathname.startsWith('/src/')) {
    filePath = path.resolve(__dirname, '..' + pathname);
  } else {
    filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`GenAura AI server running at http://localhost:${PORT}`);
  });
}

export { server };
