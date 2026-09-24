import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

test('rutas: espacio para admin y estudiante; navegación y permisos anteriores conservados', async (t) => {
  // Test-only provider: no login, network request or production authentication change.
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    plugins: [{
      name: 'pipe-test-auth', enforce: 'pre',
      resolveId(source) { if (source.endsWith('/contexts/AuthContext.jsx')) return '\0pipe-test-auth'; },
      load(id) { if (id === '\0pipe-test-auth') return 'export const useAuth = () => globalThis.__pipeRouteTestAuth;'; }
    }]
  });
  t.after(async () => { delete globalThis.__pipeRouteTestAuth; await server.close(); });
  // MemoryRouter emits its expected server-side useLayoutEffect notice during SSR.
  const originalError = console.error;
  t.mock.method(console, 'error', (...args) => {
    if (String(args[0]).includes('useLayoutEffect does nothing on the server')) return;
    originalError(...args);
  });
  const { default: Router } = await server.ssrLoadModule('/src/router/index.jsx');
  const { ToastProvider } = await server.ssrLoadModule('/src/components/ui/ToastContext.jsx');
  const render = (role, path) => {
    globalThis.__pipeRouteTestAuth = { user: { id: 'route-test', nombre: 'Estudiante de prueba', rol_id: role }, loading: false, logout() {} };
    return renderToString(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(ToastProvider, null, React.createElement(Router))));
  };
  const space = render('estudiante', '/app/mi-espacio');
  for (const text of ['Mi espacio PIPE', 'Frase del día', 'Reto del día', 'Racha PIPE', 'Pausa PIPE', 'Algo para leer', 'Minu · imagen pendiente']) assert.ok(space.includes(text), text);
  assert.equal((space.match(/class="pipe-memory-card /g) || []).length, 12);
  assert.ok(space.includes('href="/app/mis-citas"'));
  assert.ok(space.includes('href="/app/profile"'));
  assert.ok(render('estudiante', '/app/proximamente').includes('Módulo en construcción'));
  const adminSpace = render('admin', '/app/mi-espacio');
  for (const text of ['Frase del día', 'Reto del día', 'Racha PIPE', 'Pausa PIPE', 'Algo para leer', 'pipe-minu-dock']) assert.ok(adminSpace.includes(text), text);
  assert.ok(adminSpace.includes('href="/app/citas"'));
  assert.ok(!adminSpace.includes('href="/app/mis-citas"'));
  assert.ok(!adminSpace.includes('href="/app/profile"'));
  assert.ok(adminSpace.includes('href="/app/mi-espacio"'));
  assert.ok(render('admin', '/app/proximamente').includes('Módulo en construcción'));
  for (const role of ['consejero', 'docente']) {
    for (const path of ['/app/mi-espacio', '/app/proximamente']) {
      const page = render(role, path);
      assert.ok(page.includes('No autorizado'));
      assert.ok(!page.includes('pipe-minu-dock'));
      assert.ok(!page.includes('href="/app/mi-espacio"'));
    }
  }
  for (const path of ['/app/estudiantes', '/app/alertas', '/app/casos', '/app/citas', '/app/intervenciones']) assert.ok(!render('admin', path).includes('No autorizado'), path);
  assert.ok(render('consejero', '/app/intervenciones').includes('No autorizado'));
  assert.ok(render('admin', '/app/profile').includes('No autorizado'));
  assert.ok(render('admin', '/app/mis-citas').includes('No autorizado'));
  assert.ok(render('estudiante', '/app/alertas').includes('No autorizado'));
});
