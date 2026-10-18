import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPublicSupabaseConfig } from '../src/lib/publicConfig.js';

test('configuración pública: bloquea secretos, JWT privilegiados y proyectos incorrectos antes de compilar', () => {
  const url = 'https://fixtureproject.supabase.co';
  const jwt = (claims) => 'fixture.' + Buffer.from(JSON.stringify(claims)).toString('base64url') + '.signature';
  assert.doesNotThrow(() => assertPublicSupabaseConfig(url, 'sb_publishable_fixture'));
  assert.doesNotThrow(() => assertPublicSupabaseConfig(url, jwt({ role: 'anon', ref: 'fixtureproject' })));
  for (const key of ['sb_secret_fixture', jwt({ role: 'service_role', ref: 'fixtureproject' }), jwt({ role: 'anon', ref: 'otherproject' }), 'invalid', 'a.b.c']) {
    assert.throws(() => assertPublicSupabaseConfig(url, key), /clave publishable o anon/);
  }
  assert.throws(() => assertPublicSupabaseConfig('', ''), /Faltan/);
  for (const address of ['https://supabase.co.attacker.invalid', 'https://user:pass@fixtureproject.supabase.co', 'http://fixtureproject.supabase.co']) {
    assert.throws(() => assertPublicSupabaseConfig(address, 'sb_publishable_fixture'), /URL/);
  }
});
