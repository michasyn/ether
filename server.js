const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const BLOCKED_PATHS = new Set([
  '/server.js',
  '/package.json',
  '/package-lock.json',
  '/metadata.json',
]);

app.use((req, res, next) => {
  if (
    BLOCKED_PATHS.has(req.path) ||
    req.path.startsWith('/node_modules')
  ) {
    return res.status(404).end();
  }
  next();
});

app.use(express.static(__dirname, {
  dotfiles: 'ignore',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache');
  },
}));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`ETHER server running at http://${HOST}:${PORT}`);
});
