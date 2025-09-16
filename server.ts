import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNodeHttpEndpoint,
} from '@copilotkit/runtime';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MIME type mapping
const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'font/eot'
};

const serviceAdapter = new ExperimentalEmptyAdapter();

const runtime = new CopilotRuntime({
  remoteEndpoints: [
    { url: "http://localhost:8000/copilotkit" },
  ],
});

const handler = copilotRuntimeNodeHttpEndpoint({
  endpoint: '/copilotkit',
  runtime,
  serviceAdapter,
});

const server = createServer((req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle CopilotKit requests
  if (req.url?.startsWith('/copilotkit')) {
    return handler(req, res);
  }

  // Serve static files from React build
  const url = req.url || '/';
  let requestPath = url === '/' ? '/index.html' : url;

  // Remove query parameters for file path resolution
  requestPath = requestPath.split('?')[0];

  const filePath = join(__dirname, 'client', 'dist', requestPath);

  if (existsSync(filePath)) {
    try {
      const content = readFileSync(filePath);
      const ext = extname(filePath);
      const mimeType = mimeTypes[ext] || 'application/octet-stream';

      res.setHeader('Content-Type', mimeType);
      res.writeHead(200);
      res.end(content);
    } catch (error) {
      console.error('Error reading file:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  } else {
    // For SPA routing, serve index.html for any non-API routes
    try {
      const fallback = readFileSync(join(__dirname, 'client', 'dist', 'index.html'));
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      res.end(fallback);
    } catch (error) {
      console.error('Error reading index.html:', error);
      res.writeHead(404);
      res.end('Not Found');
    }
  }
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from client/dist`);
  console.log(`🤖 CopilotKit endpoint available at /copilotkit`);
});

