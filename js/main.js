/* ============================================================
   OLIMP GYM — логіка сторінки
   ============================================================ */
(() => {
  'use strict';
  const D = window.OLIMP_DATA;
  const C = window.OLIMP_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fmt = n => Math.round(n).toLocaleString('uk-UA');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const monthsWord = n => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return `${n} місяць`;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} місяці`;
    return `${n} місяців`;
  };

  /* ---------- Час Києва та статус ---------- */
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  function kyivNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Kyiv', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[get('weekday')];
    return { day, minutes: (+get('hour') % 24) * 60 + +get('minute') };
  }
  function getStatus() {
    const { day, minutes } = kyivNow();
    const t = D.schedule[day];
    if (minutes >= toMin(t.open) && minutes < toMin(t.close)) return { open: true, text: `Відчинено до ${t.close}`, day };
    if (minutes < toMin(t.open)) return { open: false, text: `Зачинено · відкриємось о ${t.open}`, day };
    return { open: false, text: `Зачинено · завтра о ${D.schedule[(day + 1) % 7].open}`, day };
  }
  function renderStatus() {
    const s = getStatus();
    $$('[data-status]').forEach(el => {
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
      const short = innerWidth < 520 && el.closest('.header');
      el.querySelector('span').textContent = short ? (s.open ? 'Відчинено' : 'Зачинено') : s.text;
    });
    const today = D.schedule[s.day];
    $$('[data-today-hours]').forEach(el => { el.textContent = `${today.open} – ${today.close}`; });
    $$('[data-schedule] li').forEach((li, i) => li.classList.toggle('is-today', i === s.day));
  }

  /* ---------- Графік у контактах ---------- */
  function renderSchedule() {
    const ul = $('[data-schedule]');
    // кожен день окремим рядком, щоб підсвічувати «сьогодні»
    ul.innerHTML = D.schedule.map(d => `<li><span>${d.full}</span><b>${d.open} – ${d.close}</b></li>`).join('');
  }

  /* ---------- Header, меню, активний пункт ---------- */
  const header = $('.header');
  const burger = $('.burger');
  const nav = $('#nav');
  const dock = $('.dock');
  function closeMenu() { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  const navLinks = $$('.nav a');
  const navIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['hall', 'prices', 'trainers', 'contacts', 'join', 'light'].forEach(id => { const el = document.getElementById(id); if (el) navIO.observe(el); });

  /* ---------- Reveal ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('[data-reveal]').forEach(el => revealIO.observe(el));

  /* ---------- Блок «Без світла» ---------- */
  const bo = $('#light');
  function updateBlackout() {
    if (reduceMotion.matches) { bo.dataset.state = 'on'; return; }
    const r = bo.getBoundingClientRect();
    const total = bo.offsetHeight - innerHeight;
    const p = clamp(-r.top / total, 0, 1);
    bo.dataset.state = p < 0.12 ? 'dim' : p < 0.42 ? 'off' : 'on';
  }

  /* ---------- Галерея залу ---------- */
  const hall = $('#hall');
  const track = $('.hall__track', hall);
  const viewport = $('.hall__viewport', hall);
  const progress = $('.hall__progress span', hall);
  const pinMQ = matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
  let hallDist = 0;
  function setupHall() {
    if (pinMQ.matches) {
      hall.classList.add('is-pinned');
      hallDist = Math.max(0, track.scrollWidth - innerWidth);
      hall.style.height = `${innerHeight + hallDist}px`;
    } else {
      hall.classList.remove('is-pinned');
      hall.style.height = '';
      track.style.transform = '';
      hallDist = 0;
    }
    updateHall();
  }
  function updateHall() {
    let p;
    if (hall.classList.contains('is-pinned')) {
      const r = hall.getBoundingClientRect();
      p = clamp(-r.top / (hall.offsetHeight - innerHeight || 1), 0, 1);
      track.style.transform = `translate3d(${-p * hallDist}px,0,0)`;
    } else {
      const max = viewport.scrollWidth - viewport.clientWidth;
      p = max > 0 ? viewport.scrollLeft / max : 1;
    }
    progress.style.setProperty('--hp', (0.08 + p * 0.92).toFixed(3));
  }
  viewport.addEventListener('scroll', updateHall, { passive: true });
  $$('img', track).forEach(img => { if (!img.complete) img.addEventListener('load', setupHall, { once: true }); });

  /* ---------- Ціни ---------- */
  const board = $('[data-board]');
  const boardNote = $('[data-board-note]');
  const sw = $('.switch');
  const planId = (kind, months) => `${kind}-${months}`;

  function renderPlans(kind) {
    const plan = D.plans[kind];
    const rows = plan.items.map(it => {
      const perMonth = it.price / it.months;
      const saving = D.baseMonthly * it.months - it.price;
      return { ...it, perMonth, saving };
    });
    const best = rows.length > 1 ? rows.reduce((a, b) => (b.perMonth < a.perMonth ? b : a)) : null;

    board.innerHTML = rows.map(r => `
      <li>
        <button type="button" class="row${r === best ? ' is-best' : ''}" data-plan="${planId(kind, r.months)}"
          aria-label="${plan.label} абонемент, ${monthsWord(r.months)}, ${fmt(r.price)} гривень. Обрати">
          <span class="row__term">${monthsWord(r.months)}<small>${plan.hours}</small>${r === best ? '<span class="row__badge">Найвигідніше</span>' : ''}</span>
          <span class="row__price">${fmt(r.price)}<sub>грн</sub></span>
          <span class="row__month">
            ${r.months > 1 ? `<span>${fmt(r.perMonth)} грн/міс</span>` : ''}
            ${r.saving > 0 ? `<span class="row__save">−${fmt(r.saving)} грн</span>` : ''}
          </span>
          <span class="row__go" aria-hidden="true"><svg><use href="#i-arrow"/></svg></span>
        </button>
      </li>`).join('');

    boardNote.textContent = kind === 'morning'
      ? `Ранковий абонемент діє з 07:00 до 16:00 і продається на 1 місяць. Економія — порівняно з повним (${fmt(D.baseMonthly)} грн).`
      : `Економія рахується від ціни місячного абонемента: ${fmt(D.baseMonthly)} грн × кількість місяців.`;
  }

  sw.addEventListener('click', e => {
    const btn = e.target.closest('button[data-kind]');
    if (!btn) return;
    $$('button', sw).forEach(b => b.setAttribute('aria-checked', String(b === btn)));
    sw.dataset.kind = btn.dataset.kind;
    renderPlans(btn.dataset.kind);
  });
  sw.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const btns = $$('button', sw);
    const next = btns[(btns.indexOf(document.activeElement) + 1) % btns.length];
    next.focus(); next.click();
  });

  board.addEventListener('click', e => {
    const row = e.target.closest('[data-plan]');
    if (row) goToForm({ plan: row.dataset.plan });
  });

  $('[data-extras]').innerHTML = D.extras.map(x => `<li><span>${x.name}</span><b>${fmt(x.price)} грн</b></li>`).join('');

  /* ---------- Тренери ---------- */
  const initials = name => name.split(' ').map(w => w[0]).join('');
  const media = t => t.photo
    ? `<img src="${t.photo}" alt="${t.name}" loading="lazy">`
    : `<div class="trainer__ph" aria-hidden="true"><span>${initials(t.name)}</span><svg><use href="#i-torch"/></svg></div>`;

  $('[data-trainers]').innerHTML = D.trainers.map(t => `
    <li>
      <button type="button" class="trainer" data-trainer="${t.id}" aria-haspopup="dialog">
        <div class="trainer__media">${media(t)}</div>
        <div class="trainer__body">
          ${t.experience ? `<span class="trainer__exp">${t.experience}</span>` : ''}
          <h3 class="trainer__name">${t.name.replace(' ', '<br>')}</h3>
          ${t.tags.length ? `<ul class="trainer__tags">${t.tags.slice(0, 4).map(g => `<li class="tag">${g}</li>`).join('')}</ul>` : ''}
          <span class="trainer__more">Детальніше <svg aria-hidden="true"><use href="#i-arrow"/></svg></span>
        </div>
      </button>
    </li>`).join('');

  const drawer = $('#trainer-drawer');
  const drawerBody = $('[data-drawer-body]');
  $('[data-trainers]').addEventListener('click', e => {
    const card = e.target.closest('[data-trainer]');
    if (!card) return;
    const t = D.trainers.find(x => x.id === card.dataset.trainer);
    drawerBody.innerHTML = `
      <div class="drawer__media">${media(t)}</div>
      <div class="drawer__content">
        ${t.experience ? `<span class="trainer__exp">${t.experience}</span>` : ''}
        <h3 id="drawer-name">${t.name}</h3>
        ${t.tags.length
          ? `<ul class="tags">${t.tags.map(g => `<li class="tag">${g}</li>`).join('')}</ul>`
          : '<p class="muted">Про напрямки тренувань розповість адміністратор — або запишіться, і тренер зв\'яжеться з вами.</p>'}
        <div class="drawer__actions">
          <button type="button" class="btn btn--accent btn--block" data-book="${t.id}">Записатися до тренера</button>
          ${t.instagram ? `<a class="btn btn--ghost btn--block" href="https://www.instagram.com/${t.instagram}/" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-insta"/></svg>@${t.instagram}</a>` : ''}
        </div>
      </div>`;
    drawer.showModal();
  });
  drawer.addEventListener('click', e => {
    if (e.target === drawer || e.target.closest('[data-close]')) drawer.close();
    const book = e.target.closest('[data-book]');
    if (book) { drawer.close(); goToForm({ trainer: book.dataset.book }); }
  });

  /* ---------- Форма ---------- */
  const form = $('#join-form');
  const fName = $('#f-name'), fPhone = $('#f-phone'), fPlan = $('#f-plan'), fTrainer = $('#f-trainer'), fTime = $('#f-time');

  const planOptions = [['trial', 'Ще не вирішив(-ла)']];
  Object.entries(D.plans).forEach(([kind, p]) => p.items.forEach(it =>
    planOptions.push([planId(kind, it.months), `${p.label} · ${monthsWord(it.months)} — ${fmt(it.price)} грн`])));
  D.extras.filter(x => x.id === 'single').forEach(x => planOptions.push([x.id, `${x.name} — ${fmt(x.price)} грн`]));
  fPlan.innerHTML = planOptions.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  fTrainer.innerHTML = '<option value="">Без тренера</option>' + D.trainers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

  function goToForm({ plan, trainer } = {}) {
    if (plan) fPlan.value = plan;
    if (trainer) fTrainer.value = trainer;
    $('#join').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    setTimeout(() => fName.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 700);
  }

  // Маска телефону: +380 XX XXX XX XX
  const localDigits = v => {
    let d = v.replace(/\D/g, '');
    if (d.startsWith('380')) d = d.slice(3);
    else if (d.startsWith('80')) d = d.slice(2);
    else if (d.startsWith('0')) d = d.slice(1);
    return d.slice(0, 9);
  };
  const formatPhone = d => {
    let out = '+380';
    if (d.length) out += ' ' + d.slice(0, 2);
    if (d.length > 2) out += ' ' + d.slice(2, 5);
    if (d.length > 5) out += ' ' + d.slice(5, 7);
    if (d.length > 7) out += ' ' + d.slice(7, 9);
    return out;
  };
  fPhone.addEventListener('focus', () => { if (!fPhone.value) fPhone.value = '+380 '; });
  fPhone.addEventListener('blur', () => { if (!localDigits(fPhone.value).length) fPhone.value = ''; });
  fPhone.addEventListener('input', () => { fPhone.value = formatPhone(localDigits(fPhone.value)); });

  function setError(input, msg) {
    const field = input.closest('.field');
    field.classList.toggle('is-invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    const err = $(`#${input.id}-err`);
    err.textContent = msg || '';
    input.setAttribute('aria-describedby', err.id);
  }
  function validate() {
    let ok = true;
    if (fName.value.trim().length < 2) { setError(fName, 'Вкажіть ім\'я'); ok = false; } else setError(fName);
    if (localDigits(fPhone.value).length !== 9) { setError(fPhone, 'Номер має бути у форматі +380 XX XXX XX XX'); ok = false; } else setError(fPhone);
    return ok;
  }
  [fName, fPhone].forEach(i => i.addEventListener('input', () => { if (i.closest('.field').classList.contains('is-invalid')) validate(); }));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) { form.querySelector('[aria-invalid="true"]').focus(); return; }

    const text = [
      'Нова заявка — Olimp Gym',
      `Ім'я: ${fName.value.trim()}`,
      `Телефон: ${fPhone.value}`,
      `Абонемент: ${fPlan.selectedOptions[0].text}`,
      `Тренер: ${fTrainer.selectedOptions[0].text}`,
      `Зручний час: ${fTime.value}`
    ].join('\n');

    const { botToken, chatId } = C.telegram || {};
    if (!botToken || !chatId) {
      try { await navigator.clipboard.writeText(text); } catch (_) { /* буфер недоступний — не критично */ }
      form.dataset.state = 'fallback';
      return;
    }

    form.dataset.state = 'sending';
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text })
      });
      if (!res.ok) throw new Error(res.status);
      form.dataset.state = 'success';
      form.reset();
    } catch (err) {
      form.dataset.state = 'error';
    }
  });

  /* ---------- Мобільна панель ---------- */
  const hero = $('.hero');
  const joinSection = $('#join');
  let joinVisible = false;
  new IntersectionObserver(([en]) => { joinVisible = en.isIntersecting; updateDock(); }, { threshold: 0.15 }).observe(joinSection);
  function updateDock() {
    dock.classList.toggle('is-visible', scrollY > hero.offsetHeight * 0.6 && !joinVisible);
  }

  /* ---------- Скрол ---------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', scrollY > 20);
      updateBlackout();
      updateHall();
      updateDock();
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { setupHall(); onScroll(); });
  pinMQ.addEventListener('change', setupHall);

  /* ---------- Старт ---------- */
  renderSchedule();
  renderStatus();
  setInterval(renderStatus, 30000);
  renderPlans('full');
  setupHall();
  onScroll();
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
