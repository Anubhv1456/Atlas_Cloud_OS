import app from "./app";
import { logger } from "./lib/logger";

const port = process.env.PORT || 3000;

logger.info({ 
  port, 
  nodeEnv: process.env.NODE_ENV,
  cwd: process.cwd()
}, "Starting server...");

const server = app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "Server listening on 0.0.0.0");
});

server.on("error", (err: any) => {
  logger.error(err, "Server failed to start");
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});
