import { createServer } from 'node:http';

const upstreamBase = process.argv[2];
if (!upstreamBase) throw new Error('Pass the built website preview URL.');
const mountPrefix = process.argv[3] ?? '';
const normalizedMount = mountPrefix === '' ? '' : `/${mountPrefix.replace(/^\/+|\/+$/g, '')}/`;
const upstreamBaseUrl = new URL(upstreamBase);
const upstreamPathPrefix = upstreamBaseUrl.pathname;

let adminRequests = 0;
let adminResponses = 0;

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
  if (requestUrl.pathname === '/__test_status') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ adminRequests, adminResponses }));
    return;
  }

  try {
    const mountedPath = normalizedMount && requestUrl.pathname.startsWith(normalizedMount)
      ? requestUrl.pathname.slice(normalizedMount.length - 1)
      : requestUrl.pathname;
    const relativePath = mountedPath.startsWith(upstreamPathPrefix)
      ? mountedPath.slice(upstreamPathPrefix.length)
      : mountedPath.replace(/^\/+/, '');
    const upstreamUrl = new URL(`${relativePath}${requestUrl.search}`, upstreamBaseUrl);
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: { accept: request.headers.accept ?? '*/*' },
    });
    const body = Buffer.from(await upstream.arrayBuffer());
    if (/\/_astro\/admin\.[^/]+\.js$/.test(requestUrl.pathname)) {
      adminRequests += 1;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      adminResponses += 1;
    }

    const headers = Object.fromEntries(upstream.headers.entries());
    delete headers['content-encoding'];
    delete headers['content-length'];
    delete headers.connection;
    response.writeHead(upstream.status, headers);
    response.end(body);
  } catch (error) {
    response.writeHead(502, { 'content-type': 'text/plain' });
    response.end(error instanceof Error ? error.message : 'Preview proxy failed.');
  }
});

server.listen(0, '127.0.0.1', () => {
  const address = server.address();
  process.stdout.write(`${JSON.stringify({ port: address.port })}\n`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
