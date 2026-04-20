/* ═══════════════════════════════════════
   NEWSPORTO — SHARED JS ENHANCEMENTS v2
═══════════════════════════════════════ */
(function() {
  // ── NAV PROGRESS BAR ──────────────────
  const prog = document.createElement('div');
  prog.id = 'nav-progress';
  document.body.prepend(prog);
  window.addEventListener('scroll', () => {
    const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    prog.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });

  // ── NAV SCROLL EFFECT ─────────────────
  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // ── CURSOR GLOW (desktop only) ────────
  let cg = document.getElementById('cursor-glow');
  if (!cg) {
    cg = document.createElement('div');
    cg.id = 'cursor-glow';
    document.body.appendChild(cg);
  }
  if (window.matchMedia('(hover:hover)').matches) {
    document.addEventListener('mousemove', e => {
      cg.style.left = e.clientX + 'px';
      cg.style.top = e.clientY + 'px';
    }, { passive: true });
    cg.style.opacity = '1';
  }

  // ── SCROLL REVEAL ────────────────────
  const ro = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); ro.unobserve(e.target); }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px 300px 0px' });
  document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale,.reveal-fade').forEach(el => ro.observe(el));

  // ── MOBILE HAMBURGER ────────────────
  const hamburger = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
    // Close on nav item click
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ── COUNTER ANIMATION ───────────────
  window.animateCount = function(el, target) {
    if (el.dataset.animated) return;
    el.dataset.animated = '1';
    const isFloat = String(target).includes('.');
    const dur = Math.min(1400, Math.max(500, target * 140));
    const t0 = performance.now();
    const suffix = el.dataset.suffix || '';
    el.classList.add('counting');
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = (isFloat ? (target * ease).toFixed(1) : Math.floor(target * ease)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else { el.textContent = (isFloat ? target.toFixed(1) : target) + suffix; el.classList.remove('counting'); }
    };
    requestAnimationFrame(tick);
  };

  // ── TICKER ────────────────────────────
  function initTicker(inner) {
    if (!inner || inner.children.length === 0) return;
    const items = Array.from(inner.children);
    items.forEach(item => inner.appendChild(item.cloneNode(true)));
    inner.classList.add('ready');
  }
  const tickerInner = document.getElementById('ticker-inner');
  if (tickerInner) {
    const obs = new MutationObserver(() => {
      if (tickerInner.children.length > 0) { initTicker(tickerInner); obs.disconnect(); }
    });
    obs.observe(tickerInner, { childList: true });
    // If already populated
    if (tickerInner.children.length > 0) initTicker(tickerInner);
  }

  // ── PAGE LOADER HIDE ─────────────────
  const loader = document.getElementById('page-loader');
  if (loader) {
    const hide = () => loader.classList.add('hidden');
    if (document.readyState === 'complete') hide();
    else window.addEventListener('load', hide);
    setTimeout(hide, 1200);
  }

  // ── ACTIVE NAV LINK ──────────────────
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav-item').forEach(a => {
    if (a.getAttribute('href') && a.getAttribute('href').includes(path)) {
      a.classList.add('active');
    }
  });

  // ── ARTICLE CARD 3D TILT (desktop) ──
  if (window.matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.article-card').forEach(card => {
      card.style.transformStyle = 'preserve-3d';
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        const maxDeg = card.classList.contains('featured') ? 5 : 7;
        card.style.transform = `perspective(900px) rotateX(${-y*maxDeg}deg) rotateY(${x*maxDeg*2}deg) translateZ(6px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.5s cubic-bezier(.22,1,.36,1)';
        card.style.transform = '';
        setTimeout(() => card.style.transition = '', 500);
      });
      card.addEventListener('mouseenter', () => { card.style.transition = 'transform 0.08s ease'; });
    });

    // Match card spotlight
    const mc = document.getElementById('match-card');
    if (mc) {
      mc.addEventListener('mousemove', e => {
        const r = mc.getBoundingClientRect();
        mc.style.setProperty('--spotlight-x', ((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
        mc.style.setProperty('--spotlight-y', ((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
        mc.classList.add('spotlight');
      });
      mc.addEventListener('mouseleave', () => mc.classList.remove('spotlight'));
    }
  }

  // ── SMOOTH PAGE TRANSITIONS ──────────
  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a || !a.href || a.target === '_blank' || a.href.startsWith('mailto') || a.href.startsWith('tel') || a.href.startsWith('#') || a.href.includes('discord') || a.href.includes('fourthwall')) return;
    const url = new URL(a.href);
    if (url.origin !== window.location.origin) return;
    e.preventDefault();
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.25s ease';
    setTimeout(() => { window.location.href = a.href; }, 250);
  });
  // Restore on back
  window.addEventListener('pageshow', () => {
    document.body.style.opacity = '';
    document.body.style.transition = '';
  });

})();
