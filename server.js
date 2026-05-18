const express = require('express');
const fs = require('fs');
const path = require('path');
const RateLimit = require('express-rate-limit');
const app = express();
const port = process.env.PORT || 8080;

const HEADER_SOURCE_FILE = 'header-nav.html';
const GLOBAL_STATE_STORE_TAG = '<script defer src="global-state-store.js"></script>';
const HEADER_LOADER_TAG = '<script defer src="global-header-loader.js"></script>';
const HEADER_MOUNT_TAG = '<div data-global-header></div>';

// set up rate limiter: maximum of 100 requests per 15 minutes
const limiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Apply rate limiter to all requests
app.use(limiter);

function injectGlobalHeader(html) {
  let output = html;

  // Remove any existing nav tags (keep only the content inside body)
  output = output.replace(/<nav\s+[^>]*>[\s\S]*?<\/nav>/gi, '');

  // Inject global state store first
  if (!output.includes('global-state-store.js')) {
    output = output.replace(/<\/head>/i, `  ${GLOBAL_STATE_STORE_TAG}\n</head>`);
  }

  // Inject header loader
  if (!output.includes('global-header-loader.js')) {
    output = output.replace(/<\/head>/i, `  ${HEADER_LOADER_TAG}\n</head>`);
  }

  // Inject header mount point
  if (!output.includes('data-global-header')) {
    output = output.replace(/<body([^>]*)>/i, `<body$1>\n  ${HEADER_MOUNT_TAG}`);
  }

  return output;
}

function serveInjectedHtml(req, res, next) {
  const normalizedPath = req.path === '/' ? '/index.html' : req.path;
  if (!normalizedPath.toLowerCase().endsWith('.html')) {
    return next();
  }

  const relativePath = normalizedPath.replace(/^\/+/, '');
  if (relativePath.toLowerCase() === HEADER_SOURCE_FILE) {
    return res.sendFile(path.join(__dirname, HEADER_SOURCE_FILE));
  }

  const filePath = path.join(__dirname, relativePath);
  fs.readFile(filePath, 'utf8', (error, html) => {
    if (error) {
      return next();
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(injectGlobalHeader(html));
  });
}

app.get('/', serveInjectedHtml);
app.get(/.*\.html$/, serveInjectedHtml);

// 현재 폴더(루트)에서 정적 파일 제공
app.use(express.static('.'));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
