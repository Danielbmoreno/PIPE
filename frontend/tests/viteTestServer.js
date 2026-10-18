import { createServer } from 'vite';

// SSR tests need transformation only: no dependency scan, watchers or HMR port.
export const createTestServer = (config) => createServer({
  ...config,
  server: { ...config.server, watch: null, hmr: false, ws: false },
  plugins: [...(config.plugins || []), {
    name: 'pipe-test-no-optimizer',
    configResolved(resolved) {
      resolved.optimizeDeps.noDiscovery = true;
      resolved.optimizeDeps.include = [];
      resolved.ssr.optimizeDeps.noDiscovery = true;
      resolved.ssr.optimizeDeps.include = [];
    }
  }]
});
