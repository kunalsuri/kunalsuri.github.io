import fs from 'node:fs/promises';
import path from 'node:path';

const BLOG_DIR = path.resolve(process.cwd(), 'src/content/blog');
const ASSETS_MOUNT = '/api/studio/assets/';

const CONTENT_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.json': 'application/json',
  '.excalidraw': 'application/json',
};

function safeResolveUnderBlogDir(rawRelativePath) {
  const targetPath = path.resolve(BLOG_DIR, rawRelativePath);
  if (targetPath !== BLOG_DIR && !targetPath.startsWith(BLOG_DIR + path.sep)) {
    return null;
  }
  return targetPath;
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function readJsonBody(req) {
  const buffer = await readRequestBody(req);
  const raw = buffer.toString('utf-8');
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function serveAsset(req, res) {
  const rawPath = decodeURIComponent(req.url.slice(ASSETS_MOUNT.length).split('?')[0]);
  const targetPath = safeResolveUnderBlogDir(rawPath);
  if (!targetPath) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }
  try {
    const buffer = await fs.readFile(targetPath);
    const ext = path.extname(targetPath).toLowerCase();
    res.setHeader('Content-Type', CONTENT_TYPES[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.statusCode = 200;
    res.end(buffer);
  } catch {
    res.statusCode = 404;
    res.end('Asset not found');
  }
}

// Builds a real Fetch Request from the raw Node request/body so an existing
// Astro APIRoute handler function can be invoked directly and correctly —
// see the big comment below for why that's necessary.
function toFetchRequest(req, bodyBuffer) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  const url = `http://${req.headers.host || 'localhost'}${req.url}`;
  const init = { method: req.method, headers };
  if (bodyBuffer && bodyBuffer.length > 0 && req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = bodyBuffer;
  }
  return new Request(url, init);
}

async function sendFetchResponse(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}

/**
 * All of Studio's dev-only backend (posts CRUD, stock-image search/
 * download, local asset serving) runs as Vite dev-server middleware
 * instead of Astro page/API routes.
 *
 * Why: this repo has no server adapter (it deploys as pure static files to
 * GitHub Pages). Under `output: 'static'` with no adapter, `astro dev`
 * treats any API route lacking `export const prerender = false` as
 * build-time-prerenderable by default — and simulates that in dev by
 * invoking the handler with a *reconstructed* Request that has an empty
 * query string, empty headers, and an empty body, regardless of what the
 * client actually sent (confirmed directly: a raw request with a JSON body
 * and Content-Type header arrives at the handler as zero headers and a
 * zero-length body). `prerender = false` would fix that, but it's a
 * static, unconditional build-time signal — Astro sees it regardless of
 * what the runtime code does — so adding it here would make `astro build`
 * fail with `NoAdapterInstalled` and break the real site's deployment.
 *
 * `configureServer` middleware sits in front of all of that: it receives
 * the actual incoming request untouched, and this hook only ever runs
 * under `astro dev`/`vite dev` — never during `astro build` — so it can't
 * affect or break the production build in any way. Posts CRUD is
 * implemented directly against studio-fs.ts (loaded through Vite's own
 * `ssrLoadModule`, so the real TypeScript source runs, not a duplicate);
 * the image search/download routes are more self-contained business logic
 * out of this rebuild's scope, so instead of reimplementing them here they
 * are invoked as-is by constructing a real Fetch Request and calling their
 * exported handler function directly — same handler code, correct request.
 */
export function studioServerPlugin() {
  return {
    name: 'studio-server-middleware',
    configureServer(server) {
      const loadStudioFs = () => server.ssrLoadModule('/src/utils/studio-fs.ts');

      // Intercept Vite WebSocket server messages to suppress full-reload triggers
      // caused by content file modifications inside src/content/blog when working in Studio.
      const originalSend = server.ws.send;
      server.ws.send = function (first, second) {
        let payload = typeof first === 'string' ? { type: first, ...second } : first;
        if (payload && payload.type === 'full-reload') {
          const rawPath = typeof payload.path === 'string' ? payload.path.replace(/\\/g, '/') : '';
          if (!rawPath || rawPath === '*' || rawPath.includes('src/content/blog') || rawPath.includes('src/content')) {
            return;
          }
        }
        return originalSend.apply(this, arguments);
      };

      server.middlewares.use(async (req, res, next) => {
        if (!req.url) {
          next();
          return;
        }
        const pathname = req.url.split('?')[0];

        if (pathname.startsWith(ASSETS_MOUNT)) {
          await serveAsset(req, res);
          return;
        }

        if (pathname === '/api/studio/posts') {
          try {
            const { getAllStudioPosts, saveStudioPost, deleteStudioPost } = await loadStudioFs();

            if (req.method === 'GET') {
              const posts = await getAllStudioPosts();
              sendJson(res, 200, { success: true, posts });
              return;
            }
            if (req.method === 'POST') {
              const body = await readJsonBody(req);
              if (!body.frontmatter || !body.frontmatter.title) {
                sendJson(res, 400, { error: 'Title is required' });
                return;
              }
              const result = await saveStudioPost(body.slug, body.frontmatter, body.content || '', body.oldSlug);
              sendJson(res, 200, result);
              return;
            }
            if (req.method === 'DELETE') {
              const body = await readJsonBody(req);
              if (!body.slug) {
                sendJson(res, 400, { error: 'Slug is required' });
                return;
              }
              const success = await deleteStudioPost(body.slug);
              sendJson(res, success ? 200 : 500, { success });
              return;
            }
            next();
          } catch (err) {
            console.error('[studio-server] posts error:', err);
            sendJson(res, 500, { error: err instanceof Error ? err.message : 'Server error' });
          }
          return;
        }

        if (pathname === '/api/studio/images/search' && req.method === 'GET') {
          try {
            const mod = await server.ssrLoadModule('/src/pages/api/studio/images/search.ts');
            const fetchReq = toFetchRequest(req);
            const response = await mod.GET({ request: fetchReq, url: new URL(fetchReq.url), params: {} });
            await sendFetchResponse(res, response);
          } catch (err) {
            console.error('[studio-server] image search error:', err);
            sendJson(res, 500, { error: 'Image search failed' });
          }
          return;
        }

        if (pathname === '/api/studio/images/download' && req.method === 'POST') {
          try {
            const bodyBuffer = await readRequestBody(req);
            const mod = await server.ssrLoadModule('/src/pages/api/studio/images/download.ts');
            const fetchReq = toFetchRequest(req, bodyBuffer);
            const response = await mod.POST({ request: fetchReq, url: new URL(fetchReq.url), params: {} });
            await sendFetchResponse(res, response);
          } catch (err) {
            console.error('[studio-server] image download error:', err);
            sendJson(res, 500, { error: 'Image download failed' });
          }
          return;
        }

        next();
      });
    },
  };
}
