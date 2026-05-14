/**
 * Vite server configuration
 * Contains server-specific settings like port, proxy, and filesystem options
 */
export const serverConfig = {
  port: 7100,
  // Fix for file change detection (HMR/live reload) on some environments like Windows/WSL
  watch: {
    usePolling: true,
  },
  // Allow ngrok URLs for external access
  host: true, // Allow external connections
  allowedHosts: [
    'localhost',
    '.ngrok.io',
    '.ngrok-free.app',
    'b218d07f9611.ngrok-free.app'
  ],
  // Get rid of the CORS error
  proxy: {
    "/api": {
      target: "http://localhost:5000", // Backend port
      changeOrigin: true,
      secure: false,
      configure: (proxy, options) => {
        proxy.on('error', (err, req, res) => {
          console.log('Proxy error:', err);
        });
        /*
        proxy.on('proxyReq', (proxyReq, req, res) => {
          console.log('Proxying request:', req.method, req.url);
        });
        proxy.on('proxyRes', (proxyRes, req, res) => {
          console.log('Proxy response:', proxyRes.statusCode, req.url);
        });
        */
      },
    },
    "/socket.io": {
      target: "http://localhost:5000",
      changeOrigin: true,
      secure: false,
      ws: true, // Enable WebSocket proxying
    },
  },
  // Allow serving files from one level up to the project root
  fs: {
    allow: ["../.."],
  },
};
