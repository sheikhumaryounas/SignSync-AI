// Metro config: Expo defaults plus a development proxy to the sign-recognition server.
//
// The phone already reaches this laptop on Metro's port (8081) to load the app. Requests to
// /sign-api/* are forwarded to the Python server on this laptop (port 8000), so recognition works
// wherever the app itself loads, even on networks or firewalls that block port 8000.
const fs = require('fs');
const http = require('http');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const SIGN_API_PREFIX = '/sign-api';
const SIGN_API_PORT = Number(process.env.SIGN_API_PORT || 8000);

const config = getDefaultConfig(__dirname);

// One line per proxied request, to see whether the phone's requests arrive and what they got back.
const LOG_FILE = path.join(__dirname, '.expo', 'sign-api.log');
function log(line) {
  const text = `${new Date().toISOString()} ${line}`;
  console.log(`[sign-api] ${line}`);
  fs.mkdir(path.dirname(LOG_FILE), { recursive: true }, () => fs.appendFile(LOG_FILE, `${text}\n`, () => {}));
}

function signApiProxy(req, res) {
  const started = Date.now();
  const who = `${req.socket.remoteAddress} ${req.method} ${req.url}`;
  res.on('finish', () => log(`${who} -> ${res.statusCode} in ${Date.now() - started} ms`));
  res.on('close', () => {
    if (!res.writableFinished) log(`${who} -> closed by the phone before the answer was sent`);
  });
  const upstream = http.request(
    {
      host: '127.0.0.1',
      port: SIGN_API_PORT,
      method: req.method,
      path: req.url.slice(SIGN_API_PREFIX.length) || '/',
      headers: { ...req.headers, host: `127.0.0.1:${SIGN_API_PORT}` },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    }
  );
  upstream.on('error', (err) => {
    log(`${who} -> upstream error: ${err.message}`);
    if (res.headersSent) return res.end();
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: {
          code: 'server_down',
          message: `The sign-recognition server is not running on this computer (port ${SIGN_API_PORT}).`,
        },
      })
    );
  });
  req.pipe(upstream);
}

const previous = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const next = previous ? previous(middleware, server) : middleware;
  return (req, res, nextFn) => {
    if (req.url === SIGN_API_PREFIX || req.url.startsWith(`${SIGN_API_PREFIX}/`)) return signApiProxy(req, res);
    return next(req, res, nextFn);
  };
};

module.exports = config;
