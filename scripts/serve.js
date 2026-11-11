import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};
const port = Number(process.env.PORT || 4173);
http
  .createServer(async (req, res) => {
    try {
      const requested = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const filename = path.resolve(
        root,
        "." + (requested.endsWith("/") ? requested + "index.html" : requested),
      );
      const relative = path.relative(root, filename);
      if (
        relative.startsWith("..") ||
        relative.split(path.sep).some((p) => p.startsWith("."))
      ) {
        res.writeHead(403);
        res.end();
        return;
      }
      const content = await fs.readFile(filename);
      res.writeHead(200, {
        "Content-Type":
          types[path.extname(filename)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(port, "0.0.0.0", () =>
    console.log(`Wordle development server: port ${port}`),
  );
