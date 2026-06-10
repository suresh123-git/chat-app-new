(async () => {
  const base = 'http://localhost:3001/api';
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`${base}/health/live`);
      if (r.ok) {
        const j = await r.json();
        if (j.status === 'ok') {
          console.log('health OK');
          break;
        }
      }
    } catch (e) {}
    await new Promise((res) => setTimeout(res, 1000));
  }

  const regBody = { name: 'CI Test', email: 'ci_test@example.com', password: 'Test1234' };
  try {
    const r = await fetch(`${base}/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(regBody) });
    if (r.ok) console.log('register OK'); else console.log('register status', r.status);
  } catch (e) {
    console.log('register error', e.message);
  }

  const loginBody = { email: 'ci_test@example.com', password: 'Test1234' };
  try {
    const r = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(loginBody) });
    if (!r.ok) { console.error('login failed', r.status, await r.text()); process.exit(1); }
    const j = await r.json();
    console.log('token length', j.accessToken?.length ?? 'none');
    const me = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${j.accessToken}` } });
    console.log('me status', me.status);
    console.log(await me.text());
  } catch (e) {
    console.error('login error', e.message);
    process.exit(1);
  }
})();
