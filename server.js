/**
 * Production server for cPanel / shared hosting.
 *
 * On shared hosting (cPanel + Passenger/Node.js), the app must listen on
 * the port assigned by the environment (PORT or NODE_PORT). This file:
 *   1. Starts the Next.js server in production mode
 *   2. Listens on the correct port
 *   3. Handles graceful shutdown
 *
 * Usage:
 *   NODE_ENV=production node server.js
 *
 * Before running:
 *   npm install
 *   npm run build
 */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const port = process.env.PORT || process.env.NODE_PORT || 3000;
const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> PlayBeat Digital ready on http://${hostname}:${port}`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    server.close(() => process.exit(0));
  });
  process.on("SIGINT", () => {
    server.close(() => process.exit(0));
  });
});
