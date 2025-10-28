
// Переключение темы (light/dark)

(function theme() {
  const btn = document.getElementById('theme-toggle');
  const root = document.documentElement;
  const STORAGE_KEY = 'theme';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) root.setAttribute('data-theme', stored);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.setAttribute('data-theme', 'dark');
  else root.setAttribute('data-theme', 'light');
  btn?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEY, next);
  });
})();


// Кнопка «наверх»

(function toTop() {
  const btn = document.getElementById('to-top');
  const onScroll = () => {
    if (window.scrollY > 400) btn.classList.add('show');
    else btn.classList.remove('show');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  btn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();


// Актуальный год в футере

document.getElementById('year').textContent = new Date().getFullYear();


/* Плавное появление блоков на прокрутке */

(function revealOnScroll(){
  const els = document.querySelectorAll('.reveal-up');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('reveal'); });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));
})();


// Фон: звёзды, свечение и параллакс от мыши

/*(function background(){
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  const globe = document.getElementById('bg-globe');
  const glow = document.getElementById('glow');
  let w, h, stars = [], mx = 0, my = 0;

  function resize() {
    w = canvas.width = window.innerWidth * devicePixelRatio;
    h = canvas.height = window.innerHeight * devicePixelRatio;
    stars = makeStars();
    draw();
  }
  window.addEventListener('resize', resize);
  resize();

  function makeStars() {
    const count = Math.min(300, Math.floor((w / devicePixelRatio) * (h / devicePixelRatio) / 9000));
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.2 + 0.2) * devicePixelRatio,
        a: Math.random() * 0.6 + 0.2, // alpha
        tw: Math.random() * 0.03 + 0.005 // twinkle speed
      });
    }
    return arr;
  }

  let tick = 0;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    tick += 1;
    const offX = mx * 20 * devicePixelRatio;
    const offY = my * 20 * devicePixelRatio;
    ctx.save();
    ctx.translate(offX * 0.3, offY * 0.3);
    for (const s of stars) {
      ctx.globalAlpha = s.a + Math.sin(tick * s.tw) * 0.15;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180, 220, 210, 0.9)';
      ctx.fill();
    }
    ctx.restore();
    requestAnimationFrame(draw);
  }

  // Параллакс от мыши 
  function onPointer(e) {
    const x = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    const y = ('touches' in e) ? e.touches[0].clientY : e.clientY;
    mx = (x / window.innerWidth  - 0.5) * 2;  // -1..1
    my = (y / window.innerHeight - 0.5) * 2;
    const tx = mx * 30;
    const ty = my * 30;
    globe.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;
    glow.style.transform = `translate(calc(-50% + ${tx * 0.6}px), calc(-50% + ${ty * 0.6}px))`;
  }
  window.addEventListener('mousemove', onPointer, { passive: true });
  window.addEventListener('touchmove', onPointer, { passive: true });
})();*/


(() => {
  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  // Mouse target and eased offset for smooth parallax
  let target = { x: 0, y: 0 };
  let offset = { x: 0, y: 0 };

  // DPR-aware sizing
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let vw = 0, vh = 0;

  // Star field
  let stars = [];
  const AREA_DENSITY = 11000; // чем меньше число — тем больше звёзд
  const PARALLAX = 18;        // сила параллакса в px при z=1

  function resize() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(vw * dpr);
    canvas.height = Math.ceil(vh * dpr);
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Пересоздаём звёзды под текущую площадь
    const desired = Math.round((vw * vh) / AREA_DENSITY);
    stars = new Array(desired).fill(0).map(() => ({
      // координаты в относительных долях, чтобы легко сдвигать параллакс
      u: Math.random(),
      v: Math.random(),
      r: Math.random() * 1.3 + 0.3,  // базовый радиус (px)
      z: Math.random() * 0.9 + 0.1,  // глубина 0..1 (влияет на параллакс и мерцание)
      tw: Math.random() * Math.PI * 2 // фаза мерцания
    }));
  }

  // Получаем контрастный цвет из темы (fallback — почти белый)
  function getStarFill() {
    const root = getComputedStyle(document.documentElement);
    const text = root.getPropertyValue('--text')?.trim() || '#e6f0ed';
    // Чуть смягчим яркость
    return text;
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mousemove', (e) => {
    // нормализуем относительно центра экрана (-1..1)
    const nx = (e.clientX / vw) * 2 - 1;
    const ny = (e.clientY / vh) * 2 - 1;
    target.x = nx;
    target.y = ny;
  }, { passive: true });

  // Поддержка тача: берём крайнее касание
  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (!t) return;
    const nx = (t.clientX / vw) * 2 - 1;
    const ny = (t.clientY / vh) * 2 - 1;
    target.x = nx;
    target.y = ny;
  }, { passive: true });

  let last = 0;
  function tick(ts) {
    const dt = Math.min(32, ts - last || 16);
    last = ts;

    // Плавно приближаем offset к target
    const ease = 0.08;
    offset.x += (target.x - offset.x) * ease;
    offset.y += (target.y - offset.y) * ease;

    // Очистка
    ctx.clearRect(0, 0, vw, vh);

    // Цвет звёзд
    const fill = getStarFill();
    ctx.fillStyle = fill;

    // Рисуем звёзды
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];

      // Параллакс: дальние (z ближе к 0) смещаются слабее
      const px = s.u * vw + offset.x * PARALLAX * s.z;
      const py = s.v * vh + offset.y * PARALLAX * s.z;

      // Лёгкое мерцание
      const twinkle = 0.55 + 0.45 * Math.sin(ts * 0.0015 * (0.6 + s.z) + s.tw);
      const r = s.r * twinkle;

      // Если вышли за пределы из-за смещения — «зациклим» координату
      const x = ((px % vw) + vw) % vw;
      const y = ((py % vh) + vh) % vh;

      // Небольшие «мягкие» точки (кружочки)
      ctx.globalAlpha = 0.7 * (0.6 + 0.4 * s.z) * (0.85 + 0.15 * twinkle);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(tick);
  }

  // Инициализация
  resize();
  requestAnimationFrame(tick);

  // Обновляем цвет при смене темы (если меняется CSS-переменная --text)
  const obs = new MutationObserver(resize);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();

// About page: анимация прогресс-баров и счётчиков

(function aboutEnhancements(){
  const bars = document.querySelectorAll('.skill__bar');
  const nums = document.querySelectorAll('.fact__num');
  if (!bars.length && !nums.length) return;

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if (!e.isIntersecting) return;
      const bar = e.target;
      const val = (bar.getAttribute('data-value') || '0') + '%';
      bar.style.setProperty('--val', val);
      io.unobserve(bar);
    });
  }, { threshold: 0.6 });
  bars.forEach(b => io.observe(b));

  const io2 = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = Number(el.getAttribute('data-count') || '0');
      let cur = 0;
      const step = Math.max(1, Math.round(target / 40));
      const t = setInterval(()=>{
        cur += step;
        if (cur >= target){ cur = target; clearInterval(t); }
        el.textContent = cur;
      }, 30);
      io2.unobserve(el);
    });
  }, { threshold: 0.6 });
  nums.forEach(n => io2.observe(n));
})();