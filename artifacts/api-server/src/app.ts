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

let distPath = path.resolve(__dirname, "../../..", "dist");
if (fs.existsSync(path.resolve(__dirname, "index.html"))) {
  distPath = __dirname;
}

app.use(express.static(distPath));
app.use((req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});

export default app;
