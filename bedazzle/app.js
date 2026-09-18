/* ══════════════════════════════════════════════════════════════
   Bedazzle & Bloom — workshop registration
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── config ─────────────────────────────────────────────── */

  const UPI = {
    vpa:  '8744000846@sbi',
    name: 'Akshya',
    note: 'Bedazzle and Bloom Workshop'
  };

  /* Where a completed registration should be POSTed (FormData:
     name, phone, email, items, total, proof). Leave null and the
     form just shows the confirmation screen without sending. */
  const ENDPOINT = const ENDPOINT = "/.netlify/functions/register";

  /* ─── helpers ────────────────────────────────────────────── */

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const rupees = n => '₹' + n.toLocaleString('en-IN');

  function shake(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;          // restart the animation
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 500);
  }

  /* ─── selection + totals ─────────────────────────────────── */

  const inputs   = $$('.opt-input');
  const totalEls = ['#total-1', '#total-2', '#total-3'].map(s => $(s));

  /* A row's follow-up is either a text field (free text, no effect on
     price) or a <select> whose chosen option carries its own price. */
  const followup = option => $('.followup select, .followup input', option);

  function selection() {
    return inputs.filter(i => i.checked).map(i => {
      const option = i.closest('.option');
      const extra  = followup(option);
      const picked = extra && extra.tagName === 'SELECT' && extra.selectedIndex > 0
        ? extra.options[extra.selectedIndex]
        : null;

      return {
        key:   option.dataset.key,
        label: $('.name', option).textContent.trim(),
        price: picked ? Number(picked.dataset.price) : Number(i.dataset.price),
        note:  extra ? extra.value.trim() : ''
      };
    });
  }

  const total = () => selection().reduce((sum, item) => sum + item.price, 0);

  function paint() {
    const sum   = total();
    const label = sum ? rupees(sum) : 'pick an option';

    totalEls.forEach(el => {
      if (!el) return;
      el.textContent = label;
      el.classList.toggle('is-empty', !sum);
    });

    const link = $('#upi-link');
    if (link) {
      link.href =
        'upi://pay?pa=' + encodeURIComponent(UPI.vpa) +
        '&pn='  + encodeURIComponent(UPI.name) +
        '&am='  + sum +
        '&cu=INR' +
        '&tn='  + encodeURIComponent(UPI.note);
    }
  }

  inputs.forEach(input => {
    const option = input.closest('.option');

    const extra = followup(option);

    input.addEventListener('change', () => {
      option.classList.toggle('is-on', input.checked);
      if (input.checked && extra) extra.focus();
      paint();
    });

    /* a <select> changes the price, so repaint on every pick */
    if (extra && extra.tagName === 'SELECT') {
      extra.addEventListener('change', () => {
        extra.classList.toggle('is-placeholder', !extra.value);
        option.classList.remove('needs-pick');
        paint();
      });
    }

    /* clicks on the row's padding (outside the <label>) toggle too.
       The <label> handles its own children, and the click it forwards
       to the hidden checkbox bubbles through here — skip both. */
    option.addEventListener('click', e => {
      if (e.target === input) return;
      if (e.target.closest('label') || e.target.closest('.followup')) return;
      input.checked = !input.checked;
      input.dispatchEvent(new Event('change'));
    });
  });

  paint();

  /* ─── steps ──────────────────────────────────────────────── */

  const steps    = { 1: $('#step-1'), 2: $('#step-2'), 3: $('#step-3'), done: $('#step-done') };
  const masthead = $('#masthead');

  function goStep(n) {
    Object.entries(steps).forEach(([key, el]) => { el.hidden = String(key) !== String(n); });
    masthead.hidden = String(n) !== '1';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  $$('.back').forEach(btn =>
    btn.addEventListener('click', () => goStep(btn.dataset.back))
  );

  /* step 1 → 2 */
  $('#go-details').addEventListener('click', () => {
    if (!total()) { shake($('#bar-1')); return; }

    /* a ticked row with a drink list needs an actual drink */
    const unpicked = inputs
      .filter(i => i.checked)
      .map(i => i.closest('.option'))
      .find(option => {
        const extra = followup(option);
        return extra && extra.tagName === 'SELECT' && !extra.value;
      });

    if (unpicked) {
      unpicked.classList.add('needs-pick');
      shake(unpicked);
      followup(unpicked).focus();
      return;
    }

    goStep(2);
  });

  /* step 2 → 3 */
  const fields = {
    name:  $('#f-name'),
    phone: $('#f-phone'),
    email: $('#f-email')
  };

  const checks = {
    name:  v => v.trim().length > 1,
    phone: v => /^[6-9]\d{9}$/.test(v.trim()),
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
  };

  fields.phone.addEventListener('input', () => {
    fields.phone.value = fields.phone.value.replace(/\D/g, '').slice(0, 10);
  });

  Object.entries(fields).forEach(([key, el]) => {
    el.addEventListener('input', () => {
      if (checks[key](el.value)) el.closest('.field').classList.remove('invalid');
    });
  });

  $('#go-payment').addEventListener('click', () => {
    let firstBad = null;

    Object.entries(fields).forEach(([key, el]) => {
      const wrap = el.closest('.field');
      const ok   = checks[key](el.value);
      wrap.classList.toggle('invalid', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstBad) firstBad = wrap;
    });

    if (firstBad) { shake(firstBad); $('input', firstBad).focus(); return; }
    goStep(3);
  });

  /* ─── upload ─────────────────────────────────────────────── */

  const proof     = $('#f-proof');
  const dropzone  = proof.closest('.dropzone');
  const proofName = $('#proof-name');

  proof.addEventListener('change', () => {
    const file = proof.files && proof.files[0];
    dropzone.classList.toggle('has-file', !!file);
    proofName.textContent = file ? '✓ ' + file.name : '';
  });

  /* ─── submit ─────────────────────────────────────────────── */

  const submitBtn = $('#submit-reg');

  submitBtn.addEventListener('click', async () => {
    if (!proof.files || !proof.files.length) { shake(dropzone); return; }

    const items = selection();
    const sum   = total();

    if (ENDPOINT) {
      const body = new FormData();
      body.append('name',  fields.name.value.trim());
      body.append('phone', fields.phone.value.trim());
      body.append('email', fields.email.value.trim());
      body.append('items', JSON.stringify(items));
      body.append('total', String(sum));
      body.append('proof', proof.files[0]);

      submitBtn.disabled = true;
      submitBtn.textContent = 'sending…';
      try {
        const response = await fetch(ENDPOINT, {
  method: "POST",
  body
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error(errorText || "Registration failed");
}
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Registration';
        shake(dropzone);
        console.error('registration failed', err);
        return;
      }
    }

    $('#done-name').textContent = fields.name.value.trim().split(' ')[0] || 'friend';

    const receipt = $('#done-receipt');
    receipt.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      const left  = document.createElement('span');
      const right = document.createElement('span');
      left.textContent  = item.label + (item.note ? ' — ' + item.note : '');
      right.textContent = rupees(item.price);
      li.append(left, right);
      receipt.appendChild(li);
    });

    const li    = document.createElement('li');
    const left  = document.createElement('span');
    const right = document.createElement('span');
    li.className = 'total';
    left.textContent  = 'total paid';
    right.textContent = rupees(sum);
    li.append(left, right);
    receipt.appendChild(li);

    goStep('done');
  });

  $('#start-over').addEventListener('click', () => {
    inputs.forEach(i => {
      i.checked = false;
      i.closest('.option').classList.remove('is-on');
    });
    $$('.followup input').forEach(i => { i.value = ''; });
    $$('.followup select').forEach(s => {
      s.selectedIndex = 0;
      s.classList.add('is-placeholder');
    });
    $$('.option.needs-pick').forEach(o => o.classList.remove('needs-pick'));
    Object.values(fields).forEach(el => {
      el.value = '';
      el.closest('.field').classList.remove('invalid');
    });
    proof.value = '';
    dropzone.classList.remove('has-file');
    proofName.textContent = '';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Registration';
    paint();
    goStep(1);
  });

  /* ─── views (register / about) ───────────────────────────── */

  const views = { register: $('#view-register'), about: $('#view-about') };

  function showView(name) {
    if (!views[name]) name = 'register';

    Object.entries(views).forEach(([key, el]) => { el.hidden = key !== name; });

    $$('.tab').forEach(tab => {
      const on = tab.dataset.view === name;
      tab.classList.toggle('is-active', on);
      if (on) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });

    /* the about page always shows the masthead; register keeps
       whichever step it was on */
    masthead.hidden = name === 'register' && steps[1].hidden;

    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  $$('[data-view]').forEach(el =>
    el.addEventListener('click', () => {
      const name = el.dataset.view;
      if (history.replaceState) history.replaceState(null, '', '#' + name);
      else location.hash = name;
      showView(name);
    })
  );

  window.addEventListener('hashchange', () => showView(location.hash.slice(1)));

  if (location.hash.slice(1) === 'about') showView('about');
})();
