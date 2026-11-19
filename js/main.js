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
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = n => String(n).padStart(2, '0');

  const plural = (n, one, few, many) => {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
    return many;
  };
  const monthsUnit = n => plural(n, 'місяць', 'місяці', 'місяців');
  const monthsWord = n => `${n} ${monthsUnit(n)}`;

  /* ---------- Час Києва ---------- */
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  function kyivNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Kyiv', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[get('weekday')];
    const h = +get('hour') % 24, m = +get('minute');
    return { day, h, m, minutes: h * 60 + m };
  }
  function getStatus() {
    const now = kyivNow();
    const t = D.schedule[now.day];
    const open = toMin(t.open), close = toMin(t.close);
    if (now.minutes >= open && now.minutes < close) {
      const left = close - now.minutes;
      return { ...now, open: true, left, short: `Відчинено · ще ${Math.floor(left / 60)}:${pad(left % 60)}`,
        long: `до закриття ${Math.floor(left / 60)} год ${left % 60} хв` };
    }
    if (now.minutes < open) return { ...now, open: false, short: `Зачинено до ${t.open}`, long: `зачинено · відкриємось о ${t.open}` };
    const next = D.schedule[(now.day + 1) % 7].open;
    return { ...now, open: false, short: `Зачинено до ${next}`, long: `зачинено · завтра відкриємось о ${next}` };
  }
  function renderStatus() {
    const s = getStatus();
    const narrow = innerWidth < 520;
    $$('[data-status]').forEach(el => {
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
      const inHeader = !!el.closest('.header');
      el.querySelector('span').textContent = inHeader && narrow ? (s.open ? 'Відчинено' : 'Зачинено') : s.short;
    });
    $('[data-clock]').textContent = `Васильків, ${pad(s.h)}:${pad(s.m)}`;
    $('[data-countdown]').textContent = s.long;
    $$('[data-schedule] tr').forEach((tr, i) => tr.classList.toggle('is-today', i === s.day));
    const marker = $('[data-now]');
    if (marker) {
      marker.style.setProperty('--t', (s.minutes / 1440).toFixed(4));
      marker.classList.toggle('is-late', s.minutes / 1440 > 0.8);
    }
    return s;
  }

  /* ---------- Розклад у контактах ---------- */
  $('[data-schedule]').innerHTML = D.schedule.map(d => `<tr><td>${d.full}</td><td>${d.open} – ${d.close}</td></tr>`).join('');

  /* ---------- Графік відключень ---------- */
  // Умовний графік міста для ілюстрації (години без світла)
  const CITY_OFF = [1, 2, 3, 4, 9, 10, 11, 12, 17, 18, 19, 20];
  function renderOutage() {
    const { day } = kyivNow();
    const t = D.schedule[day];
    const openH = toMin(t.open) / 60, closeH = toMin(t.close) / 60;
    const hours = [...Array(24).keys()];
    $('[data-hours]').innerHTML = hours.map(h => `<span>${pad(h)}</span>`).join('');
    $('[data-city]').innerHTML = hours.map(h => `<i class="cell ${CITY_OFF.includes(h) ? 'off' : 'on'}" style="--i:${h}"></i>`).join('');
    $('[data-gym]').innerHTML = hours.map(h => `<i class="cell ${h >= openH && h < closeH ? 'gym' : 'closed'}" style="--i:${h}"></i>`).join('');
  }
  renderOutage();
  const outage = $('[data-outage]');
  if (reduceMotion) outage.classList.add('is-run');
  else new IntersectionObserver(([en], obs) => {
    if (en.isIntersecting) { outage.classList.add('is-run'); obs.disconnect(); }
  }, { threshold: 0.5 }).observe(outage);

  /* ---------- Header, меню ---------- */
  const header = $('.header');
  const burger = $('.burger');
  const nav = $('#nav');
  const closeMenu = () => { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); };
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
      if (en.isIntersecting) navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['light', 'hall', 'prices', 'trainers', 'join', 'contacts'].forEach(id => navIO.observe(document.getElementById(id)));

  /* ---------- Абонементи-квитки ---------- */
  const tickets = $('[data-tickets]');
  const toggle = $('.toggle');
  const ROT = ['-1.6deg', '1.1deg', '-0.7deg', '1.6deg'];
  const planId = (kind, months) => `${kind}-${months}`;

  function renderTickets(kind) {
    const plan = D.plans[kind];
    const rows = plan.items.map(it => ({ ...it, per: it.price / it.months, saving: D.baseMonthly * it.months - it.price }));
    const best = rows.length > 1 ? rows.reduce((a, b) => (b.per < a.per ? b : a)) : null;

    tickets.innerHTML = rows.map((r, i) => {
      let per;
      if (kind === 'morning') per = `${plan.hours}<br>на ${fmt(r.saving)} ₴ дешевше за повний`;
      else if (r.months === 1) per = plan.hours;
      else per = `${fmt(r.per)} ₴ / міс${r !== best && r.saving > 0 ? ` · −${fmt(r.saving)} ₴` : ''}`;
      return `
      <li class="ticket-wrap" style="--n:${i}">
        <button type="button" class="ticket" style="--r:${ROT[i % ROT.length]}" data-plan="${planId(kind, r.months)}"
          aria-label="${plan.label === 'Повний' ? 'Повний день' : 'Ранок'}, ${monthsWord(r.months)}, ${fmt(r.price)} гривень. Обрати">
          <span class="ticket__main">
            <span class="ticket__top"><span>Olimp Gym</span><span>${kind === 'full' ? 'Повний день' : 'Ранок'}</span></span>
            <span class="ticket__num">${r.months}</span>
            <span class="ticket__unit">${monthsUnit(r.months)}</span>
            <span class="ticket__price">${fmt(r.price)} ₴</span>
            <span class="ticket__per">${per}</span>
            ${r === best ? `<span class="stamp">Вигода<b>${fmt(r.saving)}</b>гривень</span>` : ''}
          </span>
          <span class="ticket__stub"><span class="barcode"></span><span class="ticket__go">Обрати <svg aria-hidden="true"><use href="#i-arrow"/></svg></span></span>
        </button>
      </li>`;
    }).join('');

    $('[data-prices-note]').textContent = kind === 'morning'
      ? 'Ранковий абонемент — з 07:00 до 16:00, продається на 1 місяць. Для жайворонків і тих, хто встигає до роботи.'
      : `Вигоду рахуємо від місячного абонемента: ${fmt(D.baseMonthly)} ₴ × кількість місяців. Натисніть на квиток — і він потрапить у заявку.`;
  }

  toggle.addEventListener('click', e => {
    const btn = e.target.closest('[data-kind]');
    if (!btn || btn.getAttribute('aria-checked') === 'true') return;
    $$('[data-kind]', toggle).forEach(b => b.setAttribute('aria-checked', String(b === btn)));
    renderTickets(btn.dataset.kind);
  });
  toggle.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const btns = $$('[data-kind]', toggle);
    const next = btns[(btns.indexOf(document.activeElement) + 1) % btns.length];
    next.focus(); next.click();
  });
  tickets.addEventListener('click', e => {
    const t = e.target.closest('[data-plan]');
    if (t) goToForm({ plan: t.dataset.plan });
  });
  $('[data-extras]').innerHTML = D.extras.map(x => `<li><span>${x.name}</span><b>${fmt(x.price)} ₴</b></li>`).join('');

  /* ---------- Тренери ---------- */
  const initials = name => name.split(' ').map(w => w[0]).join('');
  const roster = $('[data-trainers]');
  roster.innerHTML = D.trainers.map((t, i) => `
    <li>
      <button type="button" class="roster__row" data-trainer="${t.id}" aria-haspopup="dialog">
        <span class="roster__n">${pad(i + 1)}</span>
        <span class="roster__name">${t.name}</span>
        <span class="roster__meta">
          <span class="roster__exp">${t.experience || 'Тренер залу'}</span>
          ${t.tags.length ? `<span class="roster__tags">${t.tags.join(' · ')}</span>` : ''}
        </span>
        <span class="roster__arrow" aria-hidden="true"><svg><use href="#i-arrow"/></svg></span>
      </button>
    </li>`).join('');

  // Картка, що їде за курсором
  const peek = $('[data-peek]');
  roster.addEventListener('pointerover', e => {
    const row = e.target.closest('[data-trainer]');
    if (!row || e.pointerType !== 'mouse') return;
    const t = D.trainers.find(x => x.id === row.dataset.trainer);
    peek.innerHTML = t.photo ? `<img src="${t.photo}" alt="">` : `<span>${initials(t.name)}</span>`;
    peek.classList.add('is-on');
  });
  roster.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
  roster.addEventListener('pointermove', e => {
    peek.style.setProperty('--x', `${e.clientX + 28}px`);
    peek.style.setProperty('--y', `${e.clientY - 150}px`);
  });

  const drawer = $('#trainer-drawer');
  const drawerBody = $('[data-drawer-body]');
  roster.addEventListener('click', e => {
    const row = e.target.closest('[data-trainer]');
    if (!row) return;
    const t = D.trainers.find(x => x.id === row.dataset.trainer);
    drawerBody.innerHTML = `
      <div class="drawer__media">${t.photo ? `<img src="${t.photo}" alt="${t.name}">` : `<span aria-hidden="true">${initials(t.name)}</span>`}</div>
      <div class="drawer__content">
        <span class="roster__exp">${t.experience || 'Тренер Olimp Gym'}</span>
        <h3 id="drawer-name">${t.name}</h3>
        ${t.tags.length
          ? `<ul class="tags">${t.tags.map(g => `<li class="tag">${g}</li>`).join('')}</ul>`
          : `<p class="small">Про напрямки й формат тренувань розповість адміністратор — або залиште заявку, і тренер зв'яжеться з вами.</p>`}
        <div class="drawer__actions">
          <button type="button" class="btn btn--flame btn--block" data-book="${t.id}">Записатися до тренера</button>
          ${t.instagram ? `<a class="btn btn--line btn--block" href="https://www.instagram.com/${t.instagram}/" target="_blank" rel="noopener">@${t.instagram}</a>` : ''}
        </div>
      </div>`;
    peek.classList.remove('is-on');
    drawer.showModal();
  });
  drawer.addEventListener('click', e => {
    if (e.target === drawer || e.target.closest('[data-close]')) drawer.close();
    const book = e.target.closest('[data-book]');
    if (book) { drawer.close(); goToForm({ trainer: book.dataset.book }); }
  });

  /* ---------- Форма ---------- */
  const form = $('#join-form');
  const fName = $('#f-name'), fPhone = $('#f-phone'), fPlan = $('#f-plan'), fTrainer = $('#f-trainer');
  $('[data-form-no]').textContent = pad(Math.floor(Date.now() / 1000) % 10000).padStart(4, '0');

  const planOptions = [['trial', 'Ще не вирішив(-ла)']];
  Object.entries(D.plans).forEach(([kind, p]) => p.items.forEach(it =>
    planOptions.push([planId(kind, it.months), `${kind === 'full' ? 'Повний' : 'Ранок'} · ${monthsWord(it.months)} — ${fmt(it.price)} ₴`])));
  D.extras.filter(x => x.id === 'single').forEach(x => planOptions.push([x.id, `${x.name} — ${fmt(x.price)} ₴`]));
  fPlan.innerHTML = planOptions.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  fTrainer.innerHTML = '<option value="">Без тренера</option>' + D.trainers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

  function goToForm({ plan, trainer } = {}) {
    if (plan) fPlan.value = plan;
    if (trainer) fTrainer.value = trainer;
    $('#join').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(() => fName.focus({ preventScroll: true }), reduceMotion ? 0 : 700);
  }

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
    input.closest('.field').classList.toggle('is-invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    const err = $(`#${input.id}-err`);
    err.textContent = msg || '';
    input.setAttribute('aria-describedby', err.id);
  }
  function validate() {
    let ok = true;
    if (fName.value.trim().length < 2) { setError(fName, "Вкажіть ім'я"); ok = false; } else setError(fName);
    if (localDigits(fPhone.value).length !== 9) { setError(fPhone, 'Номер у форматі +380 XX XXX XX XX'); ok = false; } else setError(fPhone);
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
      `Зручний час: ${form.querySelector('input[name="time"]:checked').value}`
    ].join('\n');

    const { botToken, chatId } = C.telegram || {};
    if (!botToken || !chatId) {
      try { await navigator.clipboard.writeText(text); } catch (_) { /* буфер недоступний */ }
      form.dataset.state = 'fallback';
      return;
    }
    form.dataset.state = 'sending';
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text })
      });
      if (!res.ok) throw new Error(res.status);
      form.dataset.state = 'success';
      form.reset();
    } catch (_) {
      form.dataset.state = 'error';
    }
  });

  /* ---------- Reveal ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  if (!reduceMotion) $$('.h2, .ph, .perks li, .roster li, .steps li, .contacts__addr, .hall__quote').forEach(el => { el.classList.add('rv'); revealIO.observe(el); });

  /* ---------- Паралакс фото залу ---------- */
  const phImgs = $$('.ph__img');
  function parallax() {
    if (reduceMotion) return;
    const vh = innerHeight;
    phImgs.forEach(box => {
      const r = box.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const off = (r.top + r.height / 2 - vh / 2) / vh;
      box.firstElementChild.style.setProperty('--py', `${(-off * r.height * 0.09).toFixed(1)}px`);
    });
  }

  /* ---------- Мобільна панель ---------- */
  const dock = $('.dock');
  const hero = $('.hero');
  let joinVisible = false;
  new IntersectionObserver(([en]) => { joinVisible = en.isIntersecting; updateDock(); }, { threshold: 0.1 }).observe($('#join'));
  function updateDock() { dock.classList.toggle('is-visible', scrollY > hero.offsetHeight * 0.6 && !joinVisible); }

  /* ---------- Скрол ---------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', scrollY > 20);
      parallax();
      updateDock();
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  /* ---------- Старт ---------- */
  renderTickets('full');
  renderStatus();
  setInterval(renderStatus, 20000);
  onScroll();
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
