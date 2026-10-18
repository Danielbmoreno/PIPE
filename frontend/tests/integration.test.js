import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { build } from 'vite';
import { createTestServer } from './viteTestServer.js';

test('gráfica e historial: usan seguimientos confirmados y diferencian citas programadas', async (t) => {
  const server = await createTestServer({ server: { middlewareMode: true }, appType: 'custom' });
  t.after(() => server.close());
  const { AcademicEvolution, RecordTimeline } = await server.ssrLoadModule('/src/components/ui/AccompanimentWidgets.jsx');
  const empty = renderToStaticMarkup(React.createElement(AcademicEvolution, { records: [{ estado: 'pendiente' }, { estado: 'completado', realizado_en: null }] }));
  assert.ok(empty.includes('efectivamente completados'));
  assert.ok(!empty.includes('<svg'));
  const chart = renderToStaticMarkup(React.createElement(AcademicEvolution, { records: [{ estado: 'completado', realizado_en: '2026-10-15T22:00:00Z' }] }));
  assert.ok(chart.includes('<svg'));
  assert.ok(chart.includes('1 completados'));
  const originalError = console.error;
  t.mock.method(console, 'error', (...args) => {
    if (!String(args[0]).includes('useLayoutEffect does nothing on the server')) originalError(...args);
  });
  const timeline = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(RecordTimeline, { events: [{ event_id: 'citas-1', tipo: 'citas', estado: 'programada', fecha: '2026-10-21', titulo: 'Encuentro pendiente', estudiante_id: 101 }] })));
  assert.ok(timeline.includes('programada'));
  assert.ok(!timeline.includes('realizada'));
  assert.ok(timeline.includes('/app/estudiantes/101'));
});

test('build original: incluye Supabase y excluye rutas, perfiles y componentes de demostración', async (t) => {
  // Public, invalid fixture values are confined to this offline module-graph
  // test. A production build must receive the actual deployment variables.
  const previous = [process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY];
  process.env.VITE_SUPABASE_URL = 'https://fixtureproject.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'sb_publishable_fixture';
  t.after(() => {
    for (const [i, name] of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].entries()) {
      if (previous[i] === undefined) delete process.env[name]; else process.env[name] = previous[i];
    }
  });
  const modules = new Set();
  const result = await build({ logLevel: 'silent', build: { write: false }, plugins: [{ name: 'pipe-check-module-graph', generateBundle() { for (const id of this.getModuleIds()) modules.add(id.replaceAll('\\', '/')); } }] });
  const files = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output);
  const script = files.filter((r) => r.type === 'chunk').map((r) => r.code).join('\n');
  assert.ok([...modules].some((id) => id.includes('@supabase/supabase-js')));
  for (const path of ['/src/pages/StudentRecord.jsx', '/src/pages/AccompanimentRecords.jsx', '/src/pages/ProcessOverview.jsx', '/src/pages/Citas.jsx', '/src/lib/pipeRepository.js']) assert.ok([...modules].some((id) => id.endsWith(path)), path);
  assert.ok(![...modules].some((id) => id.includes('/src/demo/') || id.endsWith('/ProductionApp.jsx')));
  for (const marker of ['DemoApp', 'demo-perfil-', 'pipe:demo:', 'Entorno de demostración', 'Cambiar perfil demo']) assert.ok(!script.includes(marker), marker);
  assert.ok(script.includes('pipe_access_context'));
  assert.ok(files.some((r) => r.fileName === 'index.html'));
});
