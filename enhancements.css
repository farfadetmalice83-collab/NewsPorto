/* ═══════════════════════════════════════════════
   NEWSPORTO — ENHANCEMENTS v2
   Injecté dans chaque page pour upgrade l'UX
═══════════════════════════════════════════════ */

/* ─── VARIABLES ENRICHIES ─── */
:root {
  --blue: #003DA5;
  --blue-mid: #0050CC;
  --blue-light: #4d82d4;
  --blue-glow: rgba(0,61,165,0.4);
  --blue-subtle: rgba(0,61,165,0.1);
  --border: rgba(255,255,255,0.1);
  --border-blue: rgba(0,61,165,0.38);
  --gray: rgba(255,255,255,0.5);
}

/* ─── NAV UPGRADES ─── */
nav {
  border-bottom: 1px solid var(--border-blue) !important;
  box-shadow: 0 1px 0 0 rgba(0,61,165,0.2), 0 4px 24px rgba(0,20,80,0.08) !important;
  background: rgba(0,0,0,0.75) !important;
  backdrop-filter: blur(16px) !important;
}
nav.scrolled {
  background: rgba(0,0,0,0.96) !important;
  box-shadow: 0 1px 0 0 rgba(0,61,165,0.5), 0 8px 40px rgba(0,20,80,0.35) !important;
}
.nav-links a { position: relative; }
.nav-links a::after {
  content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 1.5px;
  background: var(--blue) !important;
  transition: width 0.3s cubic-bezier(.22,1,.36,1);
}
.nav-links a:hover::after, .nav-links a.active::after { width: 100% !important; }
.nav-cta:hover { background: var(--blue) !important; color: #fff !important; border-color: var(--blue) !important; }
.nav-logo:hover .nav-logo-text { animation: glitch2 .35s steps(2) forwards; }
@keyframes glitch2 {
  0%{text-shadow:none} 25%{text-shadow:-2px 0 var(--blue),2px 0 rgba(255,255,255,.3)}
  50%{text-shadow:2px 0 var(--blue),-1px 0 rgba(255,255,255,.3)} 100%{text-shadow:none}
}

/* ─── TICKER BLUE ─── */
.ticker {
  background: rgba(0,20,80,0.14) !important;
  border-top-color: var(--border-blue) !important;
  border-bottom-color: var(--border-blue) !important;
}
.ticker-item b { color: var(--blue-light) !important; }

/* ─── EYEBROW / SECTION LABEL BLUE LINE ─── */
.page-eyebrow::before,
.hero-eyebrow::before,
.section-label::before,
.sec-label::before,
.page-header .page-eyebrow::before { background: var(--blue) !important; }

/* ─── ARTICLE CATEGORY BLUE ─── */
.article-cat { color: var(--blue-light) !important; }
.article-cat::before { background: var(--blue) !important; }
.article-card { border-left: 2px solid transparent !important; }
.article-card:hover { border-left-color: var(--blue) !important; }

/* ─── FILTER BUTTONS BLUE ─── */
.filter-btn.active { background: var(--blue) !important; color: #fff !important; border-color: var(--blue) !important; }
.filter-btn:hover:not(.active) { background: rgba(0,61,165,0.12) !important; color: #fff !important; }

/* ─── STATS CELLS BLUE ACCENTS ─── */
.stat-cell::before {
  content: '' !important;
  position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; height: 2px !important;
  background: var(--blue) !important; transform: scaleX(0) !important; transform-origin: left !important;
  transition: transform .35s cubic-bezier(.22,1,.36,1) !important;
}
.stat-cell:hover::before { transform: scaleX(1) !important; }
.stat-cell:hover { background: rgba(0,20,80,0.2) !important; }
.counting { animation: countColor 1.2s ease forwards !important; }
@keyframes countColor { 0%{color:var(--blue-light)} 100%{color:#fff} }

/* ─── MATCH CARD BLUE BORDER ─── */
.match-card {
  border-color: var(--border-blue) !important;
  background: linear-gradient(135deg, rgba(0,20,80,0.07) 0%, transparent 60%) !important;
}
.match-infos { border-color: var(--border-blue) !important; }
.match-competition { color: var(--blue-light) !important; }
.match-info-label { color: var(--blue-light) !important; }

/* ─── SHOP CARD IMPROVEMENTS ─── */
.shop-card:hover { background: rgba(0,20,80,0.1) !important; }
.shop-card-arrow { border-color: var(--border-blue) !important; color: var(--blue-light) !important; }
.shop-card:hover .shop-card-arrow { background: var(--blue) !important; color: #fff !important; border-color: var(--blue) !important; }
.scb-exclu { background: var(--blue) !important; }

/* ─── FOOTER BLUE BORDER ─── */
footer {
  border-top-color: var(--border-blue) !important;
  box-shadow: 0 -1px 0 0 rgba(0,61,165,0.18), inset 0 1px 60px rgba(0,20,80,0.05) !important;
}

/* ─── MOBILE NAV BLUE ACCENTS ─── */
.mobile-nav-overlay::before {
  background: linear-gradient(90deg, transparent, var(--blue), transparent) !important;
}
.mobile-nav-item.active { color: var(--blue-light) !important; }
.mobile-nav-item:hover { color: #fff !important; letter-spacing: 6px !important; }

/* ─── PLAYER CARDS (effectif) ─── */
.player-card { transition: transform .3s cubic-bezier(.22,1,.36,1), background .2s !important; }
.player-card:hover { transform: translateY(-4px) !important; background: rgba(0,20,80,0.18) !important; }
.player-pos-badge {
  background: rgba(0,61,165,0.8) !important;
  border-color: rgba(0,61,165,0.4) !important;
}

/* ─── PROGRESS BARS (stats) ─── */
.stat-bar-fill { background: linear-gradient(90deg, var(--blue), var(--blue-light)) !important; }

/* ─── CONTACT FORM ─── */
.form-input:focus, .form-textarea:focus {
  border-color: var(--blue) !important;
  box-shadow: 0 0 0 2px rgba(0,61,165,0.15) !important;
}
.form-submit:hover { background: var(--blue) !important; color: #fff !important; }

/* ─── SECTION SEPARATORS ─── */
section { border-bottom-color: var(--border) !important; }
section:last-of-type { border-bottom: none !important; }

/* ─── IMPROVED READABILITY ─── */
.article-excerpt, .hero-lead { color: rgba(255,255,255,0.68) !important; line-height: 1.7 !important; }
.article-title { line-height: 1.25 !important; }
.match-team-name { letter-spacing: 1.5px !important; }

/* ─── LIVE BADGE RED PULSE ─── */
@keyframes livePulse { 0%,100%{box-shadow: 0 0 0 0 rgba(255,68,68,0.4)} 70%{box-shadow: 0 0 0 6px rgba(255,68,68,0)} }
#live-badge span { animation: livePulse 2s ease-out infinite !important; border-radius: 2px; }

/* ─── HERO VISUAL GLOW ─── */
.hero-visual::before {
  background: radial-gradient(ellipse at center 80%, rgba(0,61,165,0.65) 0%, rgba(0,20,90,0.3) 45%, transparent 100%) !important;
}

/* ─── POPUPS / MODALS BLUE ACCENTS ─── */
.popup-box, #live-modal > div, #lineup-modal > div {
  border-color: var(--border-blue) !important;
  background: #050508 !important;
}
.popup-box::before {
  content: '' !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; height: 2px !important;
  background: linear-gradient(90deg, transparent, var(--blue), transparent) !important;
}
.popup-title span, .popup-submit { background: var(--blue) !important; }

/* ─── PAGE LOADER BLUE ─── */
.loader-bar-fill { background: var(--blue) !important; }
.loader-text { color: rgba(255,255,255,0.6) !important; letter-spacing: 8px !important; }

/* ─── NEWSLETTER / DISCORD SECTION ─── */
.newsletter-section::before {
  background: radial-gradient(ellipse at center, rgba(0,61,165,0.1) 0%, transparent 70%) !important;
}

/* ─── SCROLL INDICATOR ─── */
.scroll-indicator {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  animation: scrollBounce 2s ease-in-out infinite;
}
.scroll-indicator span {
  font-family: 'Barlow Condensed', sans-serif; font-size: 8px; font-weight: 700;
  letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.2);
}
.scroll-indicator::after {
  content: ''; display: block; width: 1px; height: 40px;
  background: linear-gradient(to bottom, rgba(0,61,165,0.6), transparent);
}
@keyframes scrollBounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(6px)} }

/* ─── NAV PROGRESS BAR ─── */
#nav-progress {
  position: fixed; top: 0; left: 0; height: 2px; z-index: 200;
  background: linear-gradient(90deg, var(--blue), var(--blue-light));
  width: 0%; transition: width .1s linear;
  box-shadow: 0 0 8px rgba(0,61,165,0.6);
}

/* ─── CARD SHINE EFFECT ─── */
.shop-card { overflow: hidden; }
.shop-card::before {
  content: ''; position: absolute; top: -50%; left: -60%; width: 40%; height: 200%;
  background: linear-gradient(105deg, transparent, rgba(255,255,255,0.04), transparent);
  transform: skewX(-20deg); transition: left 0.6s ease; z-index: 3;
}
.shop-card:hover::before { left: 120%; }

/* ─── IMPROVED FOCUS STATES (accessibilité) ─── */
a:focus-visible, button:focus-visible {
  outline: 2px solid var(--blue) !important;
  outline-offset: 2px !important;
}

/* ─── MOBILE TOUCH OPTIMIZATIONS ─── */
@media (hover: none) and (pointer: coarse) {
  .article-card:hover { transform: none !important; box-shadow: none !important; }
  .video-card:hover { transform: none !important; }
  .shop-card:hover { transform: none !important; box-shadow: none !important; }
  .stat-cell:hover { transform: none !important; }
  #cursor-glow { display: none !important; }
}

/* ─── BETTER MOBILE PADDING ─── */
@media (max-width: 768px) {
  .articles-section, .match-section, .videos-section { padding: 36px 20px !important; }
  .shop-header { padding: 32px 20px 20px !important; flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
  .shop-grid { grid-template-columns: 1fr !important; border-left: none !important; }
  .newsletter-section { padding: 56px 20px !important; }
  .articles-grid { grid-template-columns: 1fr !important; }
  .article-card.featured .article-title { font-size: 22px !important; }
  .videos-grid { grid-template-columns: repeat(2, 1fr) !important; }
  footer { flex-direction: column !important; align-items: center !important; gap: 16px !important; text-align: center !important; padding: 32px 20px !important; }
  .footer-links { flex-wrap: wrap !important; justify-content: center !important; }
}
@media (max-width: 480px) {
  .videos-grid { grid-template-columns: 1fr !important; }
}

/* ─── SCHEMA.ORG BREADCRUMB VISUAL ─── */
.breadcrumb {
  padding: 12px 48px; display: flex; align-items: center; gap: 8px;
  font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.25);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.breadcrumb a { color: rgba(255,255,255,0.35); text-decoration: none; transition: color .2s; }
.breadcrumb a:hover { color: var(--blue-light); }
.breadcrumb-sep { color: rgba(255,255,255,0.15); }
@media (max-width: 768px) { .breadcrumb { padding: 10px 20px; } }
