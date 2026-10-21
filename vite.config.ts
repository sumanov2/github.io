import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(({ command }) => {
  const base = process.env.VITE_BASE || (command === 'serve' ? '/' : '/github.io/');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'video-upload-handler',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.method === 'POST' && req.url === '/api/upload-video') {
              const videoDir = path.resolve(__dirname, 'public/videos');
              if (!fs.existsSync(videoDir)) {
                fs.mkdirSync(videoDir, { recursive: true });
              }
              const videoPath = path.join(videoDir, 'hero_loop.mp4');
              const writeStream = fs.createWriteStream(videoPath);
              req.pipe(writeStream);
              writeStream.on('finish', () => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, url: '/videos/hero_loop.mp4' }));
              });
              writeStream.on('error', (err) => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              });
              return;
            }
            next();
          });
        },
      },
    ],
    base,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
