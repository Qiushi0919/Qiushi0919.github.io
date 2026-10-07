/* Password unlock for encrypted static documents; no plaintext password is shipped. */
(() => {
  'use strict';
  const payload = JSON.parse(document.getElementById('gate-payload').textContent);
  const form = document.getElementById('access-form');
  const field = document.getElementById('access-password');
  const show = document.getElementById('access-show');
  const message = document.getElementById('access-message');
  const submit = form.querySelector('[type="submit"]');
  const zh = document.documentElement.dataset.language === 'zh';
  const name = 'portfolio.side-project-access.v1';
  const lifetime = payload.days * 24 * 60 * 60 * 1000;
  const fromBase64 = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));
  const toBase64 = value => btoa(String.fromCharCode(...new Uint8Array(value)));
  const storage = [];
  try { storage.push(localStorage); } catch (_) {}
  try { storage.push(sessionStorage); } catch (_) {}
  const clearRecord = () => storage.forEach(store => { try { store.removeItem(name); } catch (_) {} });
  const readRecord = () => {
    for (const store of storage) {
      try {
        const record = JSON.parse(store.getItem(name));
        if (record && record.id === payload.id && typeof record.key === 'string' &&
            Number.isFinite(record.expires) && record.expires > Date.now() &&
            record.expires <= Date.now() + lifetime) return record;
        store.removeItem(name);
      } catch (_) { try { store.removeItem(name); } catch (_) {} }
    }
    return null;
  };
  const saveRecord = record => {
    clearRecord();
    for (const store of storage) {
      try { store.setItem(name, JSON.stringify(record)); return; } catch (_) {}
    }
  };
  const decrypt = async raw => {
    const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
    const data = await crypto.subtle.decrypt({name:'AES-GCM', iv:fromBase64(payload.nonce),
      additionalData:new TextEncoder().encode(payload.context)}, key, fromBase64(payload.ciphertext));
    return new TextDecoder().decode(data);
  };
  const reveal = async content => {
    // Automatic restore can decrypt while the gate document is still parsing.
    // Replacing it earlier lets its parser append the old navigation again.
    if (document.readyState === 'loading') await new Promise(resolve =>
      document.addEventListener('DOMContentLoaded', resolve, {once:true}));
    field.value = '';
    document.open();
    document.write(content);
    document.close();
  };
  const busy = value => { submit.disabled = value; field.disabled = value; form.setAttribute('aria-busy', String(value)); };
  show.addEventListener('click', () => {
    const visible = field.type === 'password';
    field.type = visible ? 'text' : 'password';
    show.setAttribute('aria-pressed', String(visible));
    show.setAttribute('aria-label', visible ? (zh ? '隐藏密码' : 'Hide password') : (zh ? '显示密码' : 'Show password'));
  });
  field.addEventListener('input', () => { field.removeAttribute('aria-invalid'); message.textContent = ''; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled || !field.value) return;
    busy(true); message.textContent = ''; field.removeAttribute('aria-invalid');
    if (!globalThis.crypto?.subtle) {
      message.textContent = zh ? '请使用 HTTPS 地址或更新浏览器后重试。' : 'Use HTTPS or an updated browser to continue.';
      busy(false); return;
    }
    try {
      const secret = await crypto.subtle.importKey('raw', new TextEncoder().encode(field.value), 'PBKDF2', false, ['deriveBits']);
      const raw = await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt:fromBase64(payload.salt), iterations:payload.iterations}, secret, 256);
      const content = await decrypt(raw);
      saveRecord({id:payload.id, key:toBase64(raw), expires:Date.now() + lifetime});
      await reveal(content);
    } catch (_) {
      message.textContent = zh ? '密码不正确，请重新输入。' : 'Incorrect password. Please try again.';
      field.setAttribute('aria-invalid', 'true'); busy(false); field.focus(); field.select();
    }
  });
  (async () => {
    const record = readRecord();
    if (!record || !globalThis.crypto?.subtle) return;
    busy(true); document.body.dataset.restoring = '';
    try { await reveal(await decrypt(fromBase64(record.key))); }
    catch (_) { clearRecord(); busy(false); delete document.body.dataset.restoring; }
  })();
})();
