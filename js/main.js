/* ============================================================
   OLIMP GYM — логіка сторінки
   ============================================================ */
(() => {
  'use strict';
  document.documentElement.classList.remove('no-js');

  const D = window.OLIMP_DATA;
  const C = window.OLIMP_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = n => Math.round(n).toLocaleString('uk-UA');
  const pad = n => String(n).padStart(2, '0');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smooth = reduceMotion ? 'auto' : 'smooth';

  const plural = (n, one, few, many) => {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
    return many;
  };
  const monthsWord = n => `${n} ${plural(n, 'місяць', 'місяці', 'місяців')}`;
  const ARROW = '<svg aria-hidden="true"><use href="#i-arrow"/></svg>';

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

  $('[data-hours]').innerHTML = D.schedule.map(d =>
    `<li><span>${d.full}</span><span>${d.open} – ${d.close}</span></li>`).join('');

  function renderStatus() {
    const { day, minutes } = kyivNow();
    const t = D.schedule[day];
    const open = minutes >= toMin(t.open) && minutes < toMin(t.close);
    let long;
    if (open) long = `Відчинено · до ${t.close}`;
    else if (minutes < toMin(t.open)) long = `Зачинено · відкриємось о ${t.open}`;
    else long = `Зачинено · завтра з ${D.schedule[(day + 1) % 7].open}`;

    $$('[data-dot]').forEach(el => { el.classList.toggle('is-open', open); el.classList.toggle('is-closed', !open); });
    $('[data-status]').textContent = open ? 'Відчинено зараз' : 'Сьогодні';
    $('[data-today]').textContent = `${t.open} – ${t.close}`;
    $('[data-status-long]').textContent = long;
    $$('[data-hours] li').forEach((li, i) => li.classList.toggle('is-today', i === day));
  }
  renderStatus();
  setInterval(renderStatus, 30000);

  /* ---------- Header і меню ---------- */
  const header = $('.header');
  const nav = $('#nav');
  const burger = $('.burger');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    document.body.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  const navLinks = $$('.nav > a');
  const navIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['club', 'prices', 'trainers', 'booking', 'contacts'].forEach(id => navIO.observe(document.getElementById(id)));

  /* ---------- Абонементи ---------- */
  const full = D.plans.full;
  const rows = full.items.map(it => ({ ...it, per: it.price / it.months, saving: D.baseMonthly * it.months - it.price }));
  const best = rows.reduce((a, b) => (b.per < a.per ? b : a));

  $('[data-plans]').innerHTML = rows.map((r, i) => `
    <article class="plan reveal${r === best ? ' plan--best' : ''}" style="--d:${i * 80}ms">
      ${r === best ? '<span class="plan__badge">Найвигідніше</span>' : ''}
      <h3 class="plan__term">${monthsWord(r.months)}</h3>
      <p class="plan__price">${fmt(r.price)}<small>₴</small></p>
      <p class="plan__per">${r.months > 1 ? `${fmt(r.per)} ₴ на місяць` : 'Щоб спробувати клуб'}</p>
      <p class="plan__save">${r.saving > 0 ? `Економія ${fmt(r.saving)} ₴` : ''}</p>
      <button type="button" class="btn ${r === best ? 'btn--gold' : 'btn--line'} btn--block" data-plan="full-${r.months}"
        aria-label="Обрати абонемент на ${monthsWord(r.months)} за ${fmt(r.price)} гривень">Обрати</button>
    </article>`).join('');

  const morning = D.plans.morning.items[0];
  $('[data-morning]').innerHTML = `
    <div>
      <p class="morning__title">Ранковий абонемент</p>
      <p class="morning__sub">${D.plans.morning.hours} · ${monthsWord(morning.months)}</p>
    </div>
    <p class="morning__price">${fmt(morning.price)}<small>₴</small></p>
    <button type="button" class="btn btn--line btn--sm" data-plan="morning-${morning.months}"
      aria-label="Обрати ранковий абонемент за ${fmt(morning.price)} гривень">Обрати</button>`;

  $('[data-extras]').innerHTML = D.extras.map(x => `<li><span>${x.name}</span><b>${fmt(x.price)} ₴</b></li>`).join('');

  $('#prices').addEventListener('click', e => {
    const b = e.target.closest('[data-plan]');
    if (b) goToForm({ plan: b.dataset.plan });
  });

  /* ---------- Тренери ---------- */
  const initials = name => name.split(' ').map(w => w[0]).join('');
  // Фон-заглушка, поки немає фото тренера (TODO: додати фото в data.js)
  const PH = ['assets/photos/dumbbells.webp', 'assets/photos/hero.webp', 'assets/photos/functional.webp'];
  $('[data-trainers]').innerHTML = D.trainers.map((t, i) => `
    <li class="coach reveal" style="--d:${i * 100}ms">
      <div class="coach__photo${t.photo ? '' : ' coach__photo--empty'}" ${t.photo ? '' : `style="--ph:url('${new URL(PH[i % PH.length], document.baseURI).href}')"`}>
        ${t.photo
          ? `<img src="${t.photo}" alt="${t.name}" loading="lazy">`
          : `<span class="coach__mono" aria-hidden="true"><svg><use href="#i-torch"/></svg>${initials(t.name)}</span>`}
      </div>
      <div class="coach__body">
        <p class="coach__exp">${t.experience || 'Тренер клубу'}</p>
        <h3 class="coach__name">${t.name}</h3>
        ${t.tags.length ? `<p class="coach__tags">${t.tags.join(', ')}</p>` : ''}
        <div class="coach__actions">
          <button type="button" class="coach__book" data-trainer="${t.id}">Записатися ${ARROW}</button>
          ${t.instagram ? `<a class="coach__ig" href="https://www.instagram.com/${t.instagram}/" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-insta"/></svg>@${t.instagram}</a>` : ''}
        </div>
      </div>
    </li>`).join('');
  $('[data-trainers]').addEventListener('click', e => {
    const b = e.target.closest('[data-trainer]');
    if (b) goToForm({ trainer: b.dataset.trainer });
  });

  /* ---------- Форма ---------- */
  const form = $('#booking-form');
  const fName = $('#f-name'), fPhone = $('#f-phone'), fPlan = $('#f-plan'), fTrainer = $('#f-trainer');

  const planOptions = [['', 'Ще не вирішив(-ла)']];
  full.items.forEach(it => planOptions.push([`full-${it.months}`, `${monthsWord(it.months)} — ${fmt(it.price)} ₴`]));
  D.plans.morning.items.forEach(it => planOptions.push([`morning-${it.months}`, `Ранковий, ${monthsWord(it.months)} — ${fmt(it.price)} ₴`]));
  D.extras.filter(x => x.id === 'single').forEach(x => planOptions.push([x.id, `${x.name} — ${fmt(x.price)} ₴`]));
  fPlan.innerHTML = planOptions.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  fTrainer.innerHTML = '<option value="">Без тренера</option>' + D.trainers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

  function goToForm({ plan, trainer } = {}) {
    if (plan) fPlan.value = plan;
    if (trainer) fTrainer.value = trainer;
    $('#booking').scrollIntoView({ behavior: smooth });
    setTimeout(() => fName.focus({ preventScroll: true }), reduceMotion ? 0 : 800);
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
    if (fName.value.trim().length < 2) { setError(fName, "Вкажіть ваше ім'я"); ok = false; } else setError(fName);
    if (localDigits(fPhone.value).length !== 9) { setError(fPhone, 'Вкажіть номер у форматі +380 XX XXX XX XX'); ok = false; } else setError(fPhone);
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

  /* ---------- Лайтбокс ---------- */
  const shots = $$('[data-gallery] .shot');
  const lb = $('#lightbox');
  const lbImg = $('[data-lb-img]', lb);
  const lbCap = $('[data-lb-cap]', lb);
  let lbIndex = 0;
  function showShot(i) {
    lbIndex = (i + shots.length) % shots.length;
    const img = $('img', shots[lbIndex]);
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = `${$('span', shots[lbIndex]).textContent} · ${lbIndex + 1} / ${shots.length}`;
  }
  shots.forEach((s, i) => s.addEventListener('click', () => { showShot(i); lb.showModal(); }));
  lb.addEventListener('click', e => {
    const act = e.target.closest('[data-lb]')?.dataset.lb;
    if (act === 'close' || e.target === lb) lb.close();
    if (act === 'prev') showShot(lbIndex - 1);
    if (act === 'next') showShot(lbIndex + 1);
  });
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') showShot(lbIndex - 1);
    if (e.key === 'ArrowRight') showShot(lbIndex + 1);
  });

  /* ---------- Поява при скролі ---------- */
  $$('.features li').forEach((el, i) => el.style.setProperty('--d', `${(i % 3) * 90}ms`));
  $$('.gallery .shot').forEach((el, i) => el.style.setProperty('--d', `${(i % 3) * 90}ms`));
  $$('.hero .reveal').forEach((el, i) => el.style.setProperty('--d', `${200 + i * 120}ms`));
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  $$('.reveal').forEach(el => revealIO.observe(el));

  /* ---------- Скрол: header і мобільна панель ---------- */
  const dock = $('.dock');
  const hero = $('.hero');
  let bookingVisible = false;
  new IntersectionObserver(([en]) => { bookingVisible = en.isIntersecting; onScroll(); }, { threshold: 0.1 }).observe($('#booking'));
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', scrollY > 24);
      dock.classList.toggle('is-visible', scrollY > hero.offsetHeight * 0.7 && !bookingVisible);
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
