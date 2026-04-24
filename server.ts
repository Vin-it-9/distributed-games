// Custom Next.js server so we can attach a persistent Socket.IO instance on
// the same HTTP server. This keeps WebSocket sessions alive across page
// navigations and avoids the serverless-style cold starts.

import { createServer } from "http";
import next from "next";
import { parse } from "url";
import { registerSocketHandlers } from "./src/server/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();
  const httpServer = createServer((req, res) => {
    // Socket.IO handles /api/socket/* on its own via upgrade.
    const parsed = parse(req.url ?? "", true);
    handle(req, res, parsed);
  });

  registerSocketHandlers(httpServer);

  httpServer.listen(port, hostname, () => {
    // eslint-disable-next-line no-console
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
