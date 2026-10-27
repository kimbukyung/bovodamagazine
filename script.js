// BOVODA main page interactions
(function () {
  const body = document.body;

  /* ---------- Intro video ---------- */
  const intro = document.getElementById('intro');
  const introVideo = document.getElementById('introVideo');
  const skip = document.getElementById('introSkip');
  let introClosed = false;

  function closeIntro() {
    if (introClosed) return;
    introClosed = true;
    intro.classList.add('is-done');
    body.classList.remove('is-intro');
    setTimeout(() => { try { introVideo.pause(); } catch (e) {} }, 900);
  }

  if (intro && introVideo) {
    introVideo.addEventListener('ended', closeIntro);
    introVideo.addEventListener('error', closeIntro);
    skip.addEventListener('click', closeIntro);
    intro.addEventListener('click', closeIntro);
    // Safety net: never trap the visitor behind the intro (video is 3s)
    setTimeout(closeIntro, 6000);
    const p = introVideo.play();
    if (p && p.catch) p.catch(closeIntro);
  }

  /* ---------- Mobile menu ---------- */
  const menu = document.getElementById('menu');
  const toggle = document.getElementById('menuToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    });
  }

  /* ---------- Magazine film: play only while visible ---------- */
  const film = document.getElementById('filmVideo');
  if (film && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const p = film.play();
          if (p && p.catch) p.catch(() => {});
        } else {
          film.pause();
        }
      });
    }, { threshold: 0.35 });
    io.observe(film);
  } else if (film) {
    film.autoplay = true;
  }
})();

/* ---------- About slider ---------- */
(function () {
  const slider = document.getElementById('aboutSlider');
  if (!slider) return;
  const track = slider.querySelector('.slider__track');
  const slides = slider.querySelectorAll('.slider__slide');
  const dots = slider.querySelectorAll('.slider__dots button');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0, timer = null;

  function go(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(calc(${-index} * (100% + var(--gap))))`;
    dots.forEach((d, n) => d.setAttribute('aria-selected', String(n === index)));
  }
  function start() { if (!reduce) { stop(); timer = setInterval(() => go(index + 1), 4500); } }
  function stop() { clearInterval(timer); }

  slider.querySelector('.slider__arrow--prev').addEventListener('click', () => { go(index - 1); start(); });
  slider.querySelector('.slider__arrow--next').addEventListener('click', () => { go(index + 1); start(); });
  dots.forEach((d, n) => d.addEventListener('click', () => { go(n); start(); }));
  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);

  // swipe
  let x0 = null;
  slider.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  slider.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); start(); }
  });

  go(0); start();
})();

/* ---------- Marquee: keep the strip filled edge to edge ---------- */
(function () {
  const track = document.getElementById('marqueeTrack');
  if (!track) return;
  const unit = track.querySelector('.marquee__group').innerHTML;
  const SPEED = 60; // px per second

  function build() {
    track.style.animation = 'none';
    track.innerHTML = '<span class="marquee__group">' + unit + '</span>';
    const group = track.firstElementChild;
    const need = track.parentElement.offsetWidth + 50;
    let guard = 0;
    while (group.offsetWidth < need && guard++ < 50) group.innerHTML += unit;
    track.appendChild(group.cloneNode(true));       // two identical halves → seamless -50% loop
    track.style.setProperty('--marquee-dur', (group.offsetWidth / SPEED) + 's');
    void track.offsetWidth;                          // restart animation
    track.style.animation = '';
  }

  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(build, 200); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build); else build();
  build();
})();

/* ---------- Campaign: tap to reveal a story (touch screens) ---------- */
(function () {
  const stories = document.querySelectorAll('.story:not(.story--next)');
  if (!stories.length) return;
  stories.forEach((story) => {
    story.querySelector('.story__inner').addEventListener('click', () => {
      const open = !story.classList.contains('is-open');
      stories.forEach((s) => s.classList.remove('is-open'));
      if (open) story.classList.add('is-open');
    });
  });
})();

/* ---------- Campaign: join form ---------- */
(function () {
  const form = document.getElementById('joinForm');
  if (!form) return;

  // Where submissions are sent. Leave empty until a form service / server is connected
  // (e.g. a Formspree endpoint like "https://formspree.io/f/xxxxxxx").
  const FORM_ENDPOINT = '';
  const MAX_BYTES = 10 * 1024 * 1024;

  const upload = document.getElementById('upload');
  const input = document.getElementById('uploadInput');
  const preview = document.getElementById('uploadPreview');
  const change = document.getElementById('uploadChange');
  const error = document.getElementById('joinError');
  const done = document.getElementById('joinDone');
  const submit = form.querySelector('.join__submit');
  let file = null;

  function setFile(f) {
    if (!f) return;
    if (!/^image\/(jpeg|png)$/.test(f.type)) { showError('JPG 또는 PNG 이미지만 올릴 수 있어요.'); return; }
    if (f.size > MAX_BYTES) { showError('이미지는 10MB 이하로 올려주세요.'); return; }
    file = f;
    const url = URL.createObjectURL(f);
    preview.onload = () => URL.revokeObjectURL(url);
    preview.src = url;
    preview.hidden = false; change.hidden = false;
    upload.classList.add('has-image');
    showError('');
  }
  input.addEventListener('change', () => setFile(input.files[0]));
  ['dragenter', 'dragover'].forEach((ev) => upload.addEventListener(ev, (e) => { e.preventDefault(); upload.classList.add('is-drag'); }));
  ['dragleave', 'drop'].forEach((ev) => upload.addEventListener(ev, (e) => { e.preventDefault(); upload.classList.remove('is-drag'); }));
  upload.addEventListener('drop', (e) => setFile(e.dataTransfer.files[0]));

  function showError(msg) { error.textContent = msg; }

  form.addEventListener('input', (e) => {
    const holder = e.target.closest('.field, .consent');
    if (holder) holder.classList.remove('is-invalid');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nick = form.nickname, story = form.story, consent = form.consent;
    const problems = [];
    if (!nick.value.trim()) { problems.push('닉네임'); nick.closest('.field').classList.add('is-invalid'); }
    if (!story.value.trim()) { problems.push('이야기'); story.closest('.field').classList.add('is-invalid'); }
    if (problems.length) { showError(problems.length === 2 ? '닉네임과 이야기를 입력해주세요.' : (problems[0] === '닉네임' ? '닉네임을 입력해주세요.' : '이야기를 입력해주세요.')); (nick.value.trim() ? story : nick).focus(); return; }
    if (!consent.checked) { consent.closest('.consent').classList.add('is-invalid'); showError('개인정보 수집 및 이용에 동의해주세요.'); return; }
    showError('');

    submit.disabled = true; submit.textContent = '등록 중…';
    try {
      if (FORM_ENDPOINT) {
        const data = new FormData();
        data.append('nickname', nick.value.trim());
        data.append('story', story.value.trim());
        data.append('consent', 'yes');
        if (file) data.append('image', file);
        const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('send failed');
      }
      form.querySelector('.join__fields').style.visibility = 'hidden';
      done.hidden = false;
    } catch (err) {
      showError('등록에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      submit.disabled = false; submit.textContent = '이야기 등록하기';
    }
  });
})();

/* ---------- Cart ---------- */
(function () {
  const list = document.getElementById('cartList');
  if (!list) return;

  // Catalogue — edit prices here.
  const PRODUCTS = {
    shape:   { name: 'SHAPE',   meta: 'Issue No.001 Spring 2026', img: 'assets/img/cover1.png', price: 18000 },
    curve:   { name: 'CURVE',   meta: 'Issue No.002 Summer 2026', img: 'assets/img/cover2.png', price: 18000 },
    pattern: { name: 'PATTERN', meta: 'Issue No.003 Autumn 2026', img: 'assets/img/cover3.png', price: 18000 },
    scent:   { name: 'SCENT',   meta: 'Issue No.004 Winter 2026', img: 'assets/img/cover4.png', price: 18000 },
  };
  const SHIPPING = 3000, FREE_OVER = 50000, KEY = 'bovoda-cart';
  const won = (n) => n.toLocaleString('ko-KR') + '원';

  let cart;
  try { cart = JSON.parse(localStorage.getItem(KEY)); } catch (e) { cart = null; }
  if (!Array.isArray(cart)) cart = [{ id: 'shape', qty: 1 }];   // sample item for first visit
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} };

  const empty = document.getElementById('cartEmpty');
  const head = document.getElementById('cartHead');
  const orderBtn = document.getElementById('orderBtn');
  const msg = document.getElementById('orderMsg');

  function render() {
    cart = cart.filter((it) => PRODUCTS[it.id] && it.qty > 0);
    list.innerHTML = cart.map((it) => {
      const p = PRODUCTS[it.id];
      return `<li class="cart-item" data-id="${it.id}">
        <div class="cart-item__thumb"><img src="${p.img}" alt="${p.name} 표지"></div>
        <div class="cart-item__info"><p class="cart-item__name">${p.name}</p><p class="cart-item__meta">bovoda magazine ${p.meta}</p></div>
        <div class="qty"><button type="button" data-act="dec" aria-label="${p.name} 수량 줄이기">−</button><output aria-label="수량">${it.qty}</output><button type="button" data-act="inc" aria-label="${p.name} 수량 늘리기">+</button></div>
        <p class="cart-item__price">${won(p.price * it.qty)}</p>
        <button class="cart-item__remove" type="button" data-act="remove" aria-label="${p.name} 삭제">×</button>
      </li>`;
    }).join('');
    const items = cart.reduce((s, it) => s + PRODUCTS[it.id].price * it.qty, 0);
    const ship = items === 0 || items >= FREE_OVER ? 0 : SHIPPING;
    document.getElementById('sumItems').textContent = won(items);
    document.getElementById('sumShip').textContent = won(ship);
    document.getElementById('sumTotal').textContent = won(items + ship);
    const isEmpty = cart.length === 0;
    list.hidden = isEmpty; empty.hidden = !isEmpty; head.hidden = isEmpty;
    orderBtn.disabled = isEmpty;
    save();
  }

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const it = cart.find((x) => x.id === btn.closest('.cart-item').dataset.id);
    if (btn.dataset.act === 'inc') it.qty = Math.min(it.qty + 1, 20);
    if (btn.dataset.act === 'dec') it.qty = Math.max(it.qty - 1, 1);
    if (btn.dataset.act === 'remove') it.qty = 0;
    msg.textContent = '';
    render();
  });
  orderBtn.addEventListener('click', () => { msg.textContent = '온라인 결제는 준비 중이에요. 곧 열릴 예정입니다.'; });

  render();
})();
