import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.get("/healthz", (req, res) => res.json({ status: "ok" }));

const possiblePaths = [
  path.resolve(process.cwd(), "dist"),
  path.resolve(__dirname, "dist"),
  __dirname,
  path.resolve(__dirname, "../../..", "dist"),
  path.resolve(process.cwd(), "artifacts/study-tracker/dist"),
];
const distPath = possiblePaths.find((p) => fs.existsSync(path.resolve(p, "index.html"))) || path.resolve(process.cwd(), "dist");

app.use(express.static(distPath));
app.use((req, res) => {
  const indexFile = path.resolve(distPath, "index.html");
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(200).send("Atlas Cloud is running.");
  }
});

export default app;
