import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareRecoveryRoute } from '../src/lib/recoveryCallback.js';
import { emailRecoveryEnabled } from '../src/lib/accessPolicy.js';

test('acceso sin SMTP: la recuperación por correo queda deshabilitada por defecto', () => {
  assert.equal(emailRecoveryEnabled, false);
});

test('recuperación: Supabase consume el fragmento antes del router y se eliminan los tokens de la URL', async () => {
  const calls = [];
  const client = { auth: { async getSession() { calls.push('session'); return { data: { session: {} } }; } } };
  const history = { replaceState(_state, _title, url) { calls.push(url); } };
  const result = await prepareRecoveryRoute(client, { hash: '#access_token=fixture&refresh_token=fixture&type=recovery', pathname: '/PIPE/', search: '?unused=1' }, history);
  assert.equal(result, true);
  assert.deepEqual(calls, ['session', '/PIPE/#/restablecer-contrasena']);
});
test('recuperación: enlaces inválidos también limpian los tokens sin ocultar la ruta de recuperación', async () => {
  let address;
  await prepareRecoveryRoute({ auth: { async getSession() { throw new Error('Fixture expired'); } } }, { hash:'#error=expired&error_code=otp_expired',pathname:'/PIPE/' }, { replaceState(_state,_title,url) { address=url; } });
  assert.equal(address,'/PIPE/#/restablecer-contrasena');
});
test('recuperación: no altera la navegación o las sesiones ordinarias', async () => {
  const forbidden = () => { throw new Error('No debe ejecutarse'); };
  assert.equal(await prepareRecoveryRoute({ auth:{getSession:forbidden} },{hash:'#/app/dashboard',pathname:'/PIPE/'},{replaceState:forbidden}),false);
});
