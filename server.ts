import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distServer = path.resolve(__dirname, "dist", "server.mjs");

async function start() {
  if (fs.existsSync(distServer)) {
    console.log(`[Atlas Server] Loading bundled server from ${distServer}...`);
    await import(pathToFileURL(distServer).href);
    return;
  }

  console.warn(`[Atlas Server] dist/server.mjs not found. Starting embedded Express static & health server...`);
  const expressModule = await import("express");
  const express = expressModule.default || expressModule;
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  const possibleDistDirs = [
    path.resolve(__dirname, "dist"),
    path.resolve(process.cwd(), "dist"),
    path.resolve(__dirname, "artifacts/study-tracker/dist"),
  ];
  const staticDir = possibleDistDirs.find((d) => fs.existsSync(path.resolve(d, "index.html"))) || possibleDistDirs[0];

  app.get("/healthz", (_req, res) => res.json({ status: "ok" }));
  app.use(express.static(staticDir));
  app.use((_req, res) => {
    const indexPath = path.resolve(staticDir, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send("Atlas Cloud is initializing...");
    }
  });

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`[Atlas Server] Embedded server listening on 0.0.0.0:${port} serving ${staticDir}`);
  });

  const shutdown = (signal: string) => {
    console.log(`[Atlas Server] ${signal} received, shutting down gracefully`);
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("[Atlas Server Critical Error]:", err);
  process.exit(1);
});

