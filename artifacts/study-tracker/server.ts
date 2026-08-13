import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  app.use(express.static(join(__dirname, 'dist')));
  app.get('*', (req, res) => res.sendFile(join(__dirname, 'dist/index.html')));
} else {
  // In dev, let Vite handle frontend routing
  import('vite').then(async (vite) => {
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(viteServer.middlewares);
  }).catch(err => {
    console.error("Failed to start Vite dev server:", err);
  });
}

const port = 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server started at http://0.0.0.0:${port}`);
});
