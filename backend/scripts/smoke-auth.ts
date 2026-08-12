import { createApp } from '../src/app.js';
import { once } from 'node:events';
import type { Server } from 'node:http';

async function main() {
  const app = createApp();
  const server = app.listen(0) as Server;
  await once(server, 'listening');
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('no port');
  const base = `http://127.0.0.1:${addr.port}/api/v1/auth`;
  const email = `smoke-${Date.now()}@example.com`;
  const password = 'SenhaForte!99';
  let failed = false;

  const jar = new Map<string, string>();

  async function request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    if (jar.size > 0) {
      headers.set(
        'cookie',
        [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; '),
      );
    }
    const res = await fetch(`${base}${path}`, { ...init, headers });
    const setCookies = res.headers.getSetCookie?.() ?? [];
    for (const raw of setCookies) {
      const [pair] = raw.split(';');
      const eq = pair.indexOf('=');
      if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  }

  const signup = await request('/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      clinicName: 'Clinica Smoke',
      ownerName: 'Owner Smoke',
    }),
  });
  console.log('signup', signup.status, signup.body?.data?.membership?.role);
  if (signup.status !== 201) failed = true;

  const login = await request('/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  console.log('login', login.status, Boolean(login.body?.data?.accessToken));
  if (login.status !== 200) failed = true;

  const refresh = await request('/refresh', { method: 'POST' });
  console.log('refresh', refresh.status, Boolean(refresh.body?.data?.accessToken));
  if (refresh.status !== 200) failed = true;

  const logout = await request('/logout', { method: 'POST' });
  console.log('logout', logout.status, logout.body?.data);
  if (logout.status !== 200) failed = true;

  const login2 = await request('/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const token = login2.body?.data?.accessToken as string | undefined;
  const logoutAll = await request('/logout-all', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  });
  console.log('logout-all', logoutAll.status, logoutAll.body?.data);
  if (logoutAll.status !== 200) failed = true;

  const dup = await request('/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      clinicName: 'Outra',
      ownerName: 'Outro',
    }),
  });
  console.log('duplicate', dup.status, dup.body?.error?.code);
  if (dup.status !== 409) failed = true;

  server.close();
  if (failed) process.exit(1);
  console.log('OK: auth smoke passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
