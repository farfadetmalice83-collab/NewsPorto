// auth-nav.js — NewsPorto v3
// <script type="module" src="auth-nav.js"></script> avant </body>

import { supabase, signOut, sendFriendRequest, getFriends, acceptFriendRequest, getConversation, sendMessage, markMessagesRead, startPresence, stopPresence, addXp, addWeeklyPoints, XP_REWARDS, checkStreak, claimDailyChest } from './supabase-client.js'

const RANKS = [
  { id:'Supporter',  emoji:'⚪', cost:0,      color:'rgba(255,255,255,0.7)', border:'rgba(255,255,255,0.25)' },
  { id:'Dragon',  emoji:'🔵', cost:2000,   color:'#4d82d4', border:'#003DA5' },
  { id:'Socio',  emoji:'🟡', cost:8000,   color:'#f0a500', border:'#f0a500' },
  { id:'Légende',   emoji:'🔴', cost:40000,  color:'#e74c3c', border:'#e74c3c' },
  { id:'Invicta', emoji:'💎', cost:300000, color:'#c9a84c', border:'#c9a84c' },
]

// ─── CSS ───────────────────────────────────────────────────────────────────
const CSS = `
/* TRIGGER BUTTON */
#an-trigger-btn {
  display:flex; align-items:center; gap:9px; cursor:pointer;
  background:rgba(255,255,255,0.05);
  border:none; border-radius:24px;
  padding:4px 12px 4px 4px;
  transition:background .2s, transform .1s;
  position:relative; flex-shrink:0;
}
#an-trigger-btn:hover { background:rgba(255,255,255,0.1); }
#an-trigger-btn:active { transform:scale(0.97); }
#an-avatar-pill {
  width:32px; height:32px; border-radius:50%;
  background:linear-gradient(135deg,#003DA5,#4d82d4);
  border:2px solid rgba(0,61,165,0.6);
  display:flex; align-items:center; justify-content:center;
  font-family:'Bebas Neue',sans-serif; font-size:14px; color:#fff;
  flex-shrink:0; overflow:hidden;
}
#an-avatar-pill img { width:100%; height:100%; object-fit:cover; }
#an-pill-info { display:flex; flex-direction:column; gap:0; }
#an-pill-name { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#fff; line-height:1.1; }
#an-pill-pts  { font-family:'Bebas Neue',sans-serif; font-size:12px; letter-spacing:1px; color:#4d82d4; line-height:1.1; }
#an-notif-dot { position:absolute; top:-3px; right:-3px; width:10px; height:10px; border-radius:50%; background:#e74c3c; border:2px solid #000; display:none; }
#an-notif-dot.on { display:block; }

/* Pulse sur le bouton profil quand notif non lue */
@keyframes anPulse { 0%,100%{box-shadow:0 0 0 0 rgba(231,76,60,0.6)} 50%{box-shadow:0 0 0 6px rgba(231,76,60,0)} }
#an-trigger-btn.has-notif { animation: anPulse 1.8s ease-in-out infinite; }

/* Badge count sur tab notifs */
.an-tab-notif-count {
  display:inline-flex; align-items:center; justify-content:center;
  min-width:16px; height:16px; padding:0 4px;
  border-radius:8px; background:#e74c3c;
  font-family:'Barlow Condensed',sans-serif; font-size:9px; font-weight:700;
  color:#fff; margin-left:4px; vertical-align:middle; line-height:16px;
}

/* SIGN IN BUTTON */
#an-signin-btn {
  font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700;
  letter-spacing:2px; text-transform:uppercase;
  border:1px solid rgba(255,255,255,0.3); color:rgba(255,255,255,0.8);
  background:transparent; padding:8px 18px; cursor:pointer; transition:.2s; white-space:nowrap;
}
#an-signin-btn:hover { border-color:#fff; color:#fff; }

/* SIDE PANEL */
#an-panel {
  position:fixed; top:0; right:0; width:360px; height:100vh;
  background:#04070d; border-left:1px solid rgba(0,61,165,0.3);
  z-index:800; display:flex; flex-direction:column;
  transform:translateX(100%); transition:transform .35s cubic-bezier(.22,1,.36,1);
  overflow:hidden;
}
#an-panel.open { transform:translateX(0); }
#an-overlay {
  position:fixed; inset:0; z-index:799; background:rgba(0,0,0,0.5);
  backdrop-filter:blur(4px); display:none; cursor:pointer;
  pointer-events:none;
}
#an-overlay.on { display:block; pointer-events:all; }

/* PANEL HEADER */
.an-panel-head {
  padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.07);
  display:flex; align-items:center; gap:12px; flex-shrink:0;
}
.an-head-avatar {
  width:44px; height:44px; border-radius:50%;
  background:rgba(0,61,165,0.3); border:2px solid rgba(0,61,165,0.6);
  display:flex; align-items:center; justify-content:center;
  font-family:'Bebas Neue',sans-serif; font-size:20px; color:#4d82d4;
  flex-shrink:0; overflow:hidden; cursor:pointer; transition:border-color .2s;
}
.an-head-avatar:hover { border-color:#4d82d4; }
.an-head-avatar img { width:100%; height:100%; object-fit:cover; }
.an-head-info { flex:1; min-width:0; }
.an-head-name { font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.an-head-rank { font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; margin-top:1px; }
.an-head-pts  { font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:1px; color:#4d82d4; }
.an-head-close { background:none; border:none; color:rgba(255,255,255,0.3); font-family:'Bebas Neue',sans-serif; font-size:22px; cursor:pointer; transition:color .2s; flex-shrink:0; }
.an-head-close:hover { color:#fff; }

/* PANEL TABS */
.an-tabs { display:flex; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
.an-tab {
  flex:1; padding:10px 4px; background:none; border:none; border-bottom:2px solid transparent;
  font-family:'Barlow Condensed',sans-serif; font-size:9px; font-weight:700;
  letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.35);
  cursor:pointer; transition:color .2s,border-color .2s; position:relative;
}
.an-tab:hover { color:rgba(255,255,255,0.7); }
.an-tab.active { color:#fff; border-bottom-color:#003DA5; }
.an-tab-dot { position:absolute; top:6px; right:6px; width:6px; height:6px; border-radius:50%; background:#e74c3c; display:none; }
.an-tab-dot.on { display:block; }

/* PANEL BODY */
.an-body { flex:1; overflow:hidden; padding:0; display:flex; flex-direction:column; min-height:0; }
.an-section { display:none; flex:1; flex-direction:column; min-height:0; overflow-y:auto; }
.an-section.active { display:flex; }
#an-sec-mp { overflow:hidden; }

/* SHARED COMPONENTS */
.an-row-label { font-family:'Barlow Condensed',sans-serif; font-size:9px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,0.3); padding:14px 20px 6px; }
.an-field { padding:0 20px 12px; }
.an-label { font-family:'Barlow Condensed',sans-serif; font-size:9px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,0.35); display:block; margin-bottom:5px; }
.an-input { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:#fff; padding:10px 12px; font-family:'Barlow',sans-serif; font-size:13px; outline:none; transition:border-color .2s; }
.an-input:focus { border-color:#003DA5; }
.an-input::placeholder { color:rgba(255,255,255,0.2); }
.an-btn { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; background:#003DA5; color:#fff; border:1px solid #003DA5; padding:10px 20px; cursor:pointer; transition:.2s; }
.an-btn:hover { background:#0050CC; }
.an-btn:disabled { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.1); color:rgba(255,255,255,0.3); cursor:not-allowed; }
.an-btn-ghost { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; background:transparent; color:rgba(255,255,255,0.5); border:1px solid rgba(255,255,255,0.15); padding:10px 20px; cursor:pointer; transition:.2s; }
.an-btn-ghost:hover { color:#fff; border-color:#fff; }
.an-divider { height:1px; background:rgba(255,255,255,0.06); margin:4px 0; }
.an-empty { padding:28px 20px; text-align:center; font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.2); }
.an-error { font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:1.5px; color:#e74c3c; padding:0 20px 10px; display:none; }
.an-error.on { display:block; }

/* ── PROFIL TAB ── */
.an-avatar-upload { padding:16px 20px; display:flex; align-items:center; gap:16px; }
.an-avatar-big { width:64px; height:64px; border-radius:50%; border:2px solid rgba(0,61,165,0.5); background:rgba(0,61,165,0.2); display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:28px; color:#4d82d4; flex-shrink:0; overflow:hidden; cursor:pointer; transition:border-color .2s; }
.an-avatar-big:hover { border-color:#4d82d4; }
.an-avatar-big img { width:100%; height:100%; object-fit:cover; }
.an-avatar-hint { font-family:'Barlow Condensed',sans-serif; font-size:9px; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.25); margin-top:4px; }
#an-avatar-input { display:none; }
.an-save-row { padding:12px 20px 20px; }

/* ── AMIS TAB ── */
.an-search-wrap { padding:12px 20px; }
.an-search { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; padding:9px 12px; font-family:'Barlow',sans-serif; font-size:13px; outline:none; transition:border-color .2s; }
.an-search:focus { border-color:#003DA5; }
.an-search::placeholder { color:rgba(255,255,255,0.2); }
.an-friend-row { display:flex; align-items:center; gap:10px; padding:10px 20px; transition:background .15s; }
.an-friend-row:hover { background:rgba(255,255,255,0.02); }
.an-friend-av { width:32px; height:32px; border-radius:50%; background:rgba(0,61,165,0.3); border:1px solid rgba(0,61,165,0.5); display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:14px; color:#4d82d4; flex-shrink:0; overflow:hidden; position:relative; }
.an-friend-av img { width:100%; height:100%; object-fit:cover; }
.an-online-pip { position:absolute; bottom:0; right:0; width:8px; height:8px; border-radius:50%; background:#00c87a; border:2px solid #04070d; }
.an-friend-info { flex:1; min-width:0; }
.an-friend-name { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.an-friend-sub  { font-family:'Barlow Condensed',sans-serif; font-size:9px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.3); }
.an-friend-acts { display:flex; gap:5px; flex-shrink:0; }
.an-micro-btn { font-family:'Barlow Condensed',sans-serif; font-size:9px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; border:1px solid rgba(255,255,255,0.15); color:rgba(255,255,255,0.5); padding:4px 9px; cursor:pointer; background:none; transition:.2s; white-space:nowrap; }
.an-micro-btn:hover { border-color:#fff; color:#fff; }
.an-micro-btn.blue { border-color:#003DA5; color:#4d82d4; }
.an-micro-btn.blue:hover { background:#003DA5; color:#fff; }
.an-micro-btn.green { border-color:#00c87a; color:#00c87a; }

/* ── RANGS TAB ── */
.an-rank-row { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:1px solid rgba(255,255,255,0.05); transition:background .15s; }
.an-rank-row:hover { background:rgba(255,255,255,0.02); }
.an-rank-row.current { background:rgba(0,61,165,0.06); }
.an-rank-left { display:flex; align-items:center; gap:12px; }
.an-rank-emoji { font-size:24px; }
.an-rank-name  { font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:1px; }
.an-rank-price { font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.3); margin-top:1px; }

/* ── MP TAB ── */
.an-conv-list { padding:0; }
.an-conv-row { display:flex; align-items:center; gap:10px; padding:12px 20px; cursor:pointer; transition:background .15s; border-bottom:1px solid rgba(255,255,255,0.04); }
.an-conv-row:hover { background:rgba(0,61,165,0.06); }
.an-conv-row.active { background:rgba(0,61,165,0.1); }
.an-conv-av { width:34px; height:34px; border-radius:50%; background:rgba(0,61,165,0.3); border:1px solid rgba(0,61,165,0.5); display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:15px; color:#4d82d4; flex-shrink:0; overflow:hidden; }
.an-conv-av img { width:100%; height:100%; object-fit:cover; }
.an-conv-name { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#fff; }
.an-conv-preview { font-family:'Barlow',sans-serif; font-size:11px; color:rgba(255,255,255,0.3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.an-unread-pip { width:8px; height:8px; border-radius:50%; background:#003DA5; flex-shrink:0; }
/* Chat */
.an-chat-wrap { display:flex; flex-direction:column; height:100%; }
.an-chat-header { padding:10px 20px; border-bottom:1px solid rgba(255,255,255,0.07); display:flex; align-items:center; gap:8px; flex-shrink:0; }
.an-chat-back { background:none; border:none; color:rgba(255,255,255,0.4); font-size:18px; cursor:pointer; transition:color .2s; }
.an-chat-back:hover { color:#fff; }
.an-chat-name { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#fff; }
.an-chat-msgs { flex:1; overflow-y:auto; padding:12px 16px; display:flex; flex-direction:column; gap:6px; }
.an-msg { max-width:82%; padding:7px 11px; font-family:'Barlow',sans-serif; font-size:12px; line-height:1.5; }
.an-msg.mine { align-self:flex-end; background:#003DA5; color:#fff; }
.an-msg.theirs { align-self:flex-start; background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.85); }
.an-msg-time { font-family:'Barlow Condensed',sans-serif; font-size:8px; letter-spacing:1px; color:rgba(255,255,255,0.3); margin-top:3px; display:block; }
.an-chat-input-row { padding:10px 12px; border-top:1px solid rgba(255,255,255,0.07); display:flex; gap:6px; flex-shrink:0; }
.an-chat-input { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:#fff; padding:8px 10px; font-family:'Barlow',sans-serif; font-size:13px; outline:none; transition:border-color .2s; }
.an-chat-input:focus { border-color:#003DA5; }
.an-chat-input::placeholder { color:rgba(255,255,255,0.2); }
.an-chat-send { background:#003DA5; border:none; color:#fff; padding:8px 14px; font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:.2s; }
.an-chat-send:hover { background:#0050CC; }

/* ── NOTIFS TAB ── */
.an-notif-item { display:flex; align-items:flex-start; gap:10px; padding:12px 20px; border-bottom:1px solid rgba(255,255,255,0.04); cursor:pointer; transition:background .15s; }
.an-notif-item:hover { background:rgba(255,255,255,0.02); }
.an-notif-item.unread { background:rgba(0,61,165,0.05); border-left:2px solid #003DA5; }
.an-notif-icon { font-size:16px; flex-shrink:0; margin-top:1px; }
.an-notif-body { flex:1; }
.an-notif-txt  { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:1px; color:rgba(255,255,255,0.75); line-height:1.4; }
.an-notif-txt strong { color:#fff; }
.an-notif-sub  { font-family:'Barlow Condensed',sans-serif; font-size:9px; letter-spacing:1px; color:rgba(255,255,255,0.3); margin-top:2px; }
.an-notif-time { font-family:'Barlow Condensed',sans-serif; font-size:9px; letter-spacing:1px; color:rgba(255,255,255,0.25); flex-shrink:0; margin-top:2px; }
.an-mark-all { font-family:'Barlow Condensed',sans-serif; font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.3); background:none; border:none; cursor:pointer; padding:10px 20px; transition:color .2s; width:100%; text-align:right; }
.an-mark-all:hover { color:#fff; }

/* AUTH MODAL */
#an-auth-modal { display:none; position:fixed; inset:0; z-index:900; background:rgba(0,0,0,0.92); backdrop-filter:blur(14px); align-items:center; justify-content:center; }
#an-auth-modal.open { display:flex; }
.an-auth-box { background:#05090f; border:1px solid rgba(0,61,165,0.35); width:100%; max-width:420px; padding:40px; position:relative; animation:anFadeUp .3s cubic-bezier(.22,1,.36,1); }
@keyframes anFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
.an-auth-close { position:absolute; top:14px; right:18px; background:none; border:none; color:rgba(255,255,255,0.3); font-family:'Bebas Neue',sans-serif; font-size:22px; cursor:pointer; transition:color .2s; }
.an-auth-close:hover { color:#fff; }
.an-auth-eyebrow { font-family:'Barlow Condensed',sans-serif; font-size:9px; font-weight:700; letter-spacing:4px; text-transform:uppercase; color:rgba(255,255,255,0.3); margin-bottom:8px; }
.an-auth-title { font-family:'Bebas Neue',sans-serif; font-size:38px; letter-spacing:2px; margin-bottom:24px; }
.an-auth-tabs { display:flex; margin-bottom:24px; border-bottom:1px solid rgba(255,255,255,0.1); }
.an-auth-tab { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,0.4); padding:9px 18px; cursor:pointer; background:none; border:none; border-bottom:2px solid transparent; margin-bottom:-1px; transition:.2s; }
.an-auth-tab.active { color:#fff; border-bottom-color:#003DA5; }
.an-auth-field { margin-bottom:14px; }
.an-auth-label { font-family:'Barlow Condensed',sans-serif; font-size:9px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,0.4); display:block; margin-bottom:5px; }
.an-auth-input { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:#fff; padding:11px 13px; font-family:'Barlow',sans-serif; font-size:14px; outline:none; transition:border-color .2s; }
.an-auth-input:focus { border-color:#003DA5; background:rgba(0,20,80,0.1); }
.an-auth-input::placeholder { color:rgba(255,255,255,0.2); }
.an-auth-check { display:flex; align-items:center; gap:9px; margin-bottom:18px; cursor:pointer; }
.an-auth-check input { accent-color:#003DA5; width:14px; height:14px; }
.an-auth-check span { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.4); }
.an-auth-btn { width:100%; background:#003DA5; color:#fff; border:none; padding:13px; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:3px; text-transform:uppercase; cursor:pointer; transition:.2s; margin-bottom:10px; }
.an-auth-btn:hover { background:#0050CC; }
.an-auth-btn:disabled { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.3); cursor:not-allowed; }
.an-google-btn { width:100%; background:transparent; color:rgba(255,255,255,0.7); border:1px solid rgba(255,255,255,0.2); padding:11px; font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; cursor:pointer; transition:.2s; margin-bottom:14px; display:flex; align-items:center; justify-content:center; gap:8px; }
.an-google-btn:hover { border-color:#fff; color:#fff; }
.an-auth-sep { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
.an-auth-sep::before,.an-auth-sep::after { content:''; flex:1; height:1px; background:rgba(255,255,255,0.1); }
.an-auth-sep span { font-family:'Barlow Condensed',sans-serif; font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.3); }
.an-auth-error { font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:1.5px; color:#e74c3c; margin-bottom:10px; display:none; }
.an-auth-error.on { display:block; }
.an-auth-bonus { font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#4d82d4; text-align:center; }

/* TOAST */
#an-toast { position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(10px); background:#05090f; border:1px solid rgba(0,61,165,0.4); padding:9px 22px; z-index:1000; font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#fff; opacity:0; transition:opacity .25s,transform .25s; pointer-events:none; white-space:nowrap; }
#an-toast.on { opacity:1; transform:translateX(-50%) translateY(0); }
#an-toast.ok { border-color:#00c87a; color:#00c87a; }
#an-toast.err { border-color:#e74c3c; color:#e74c3c; }

/* MINI FICHE PROFIL */
#an-profile-card {
  display:none; position:fixed; z-index:2000;
  background:#05090f; border:1px solid rgba(0,61,165,0.4);
  width:280px; padding:20px;
  animation:anFadeUp .2s cubic-bezier(.22,1,.36,1);
  box-shadow:0 8px 40px rgba(0,0,0,0.6);
}
#an-profile-card.open { display:block; }
#an-profile-card-close {
  position:absolute; top:10px; right:12px;
  background:none; border:none; color:rgba(255,255,255,0.3);
  font-family:'Bebas Neue',sans-serif; font-size:18px; cursor:pointer; line-height:1;
}
#an-profile-card-close:hover { color:#fff; }
.an-pcard-head { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
.an-pcard-av {
  width:44px; height:44px; border-radius:50%;
  background:linear-gradient(135deg,#003DA5,#4d82d4);
  border:2px solid rgba(0,61,165,0.5);
  display:flex; align-items:center; justify-content:center;
  font-family:'Bebas Neue',sans-serif; font-size:19px; color:#fff;
  overflow:hidden; flex-shrink:0;
}
.an-pcard-av img { width:100%; height:100%; object-fit:cover; }
.an-pcard-name { font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#fff; }
.an-pcard-rank { font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; margin-top:2px; }
.an-pcard-bio { font-family:'Barlow',sans-serif; font-size:12px; color:rgba(255,255,255,0.45); margin-bottom:12px; line-height:1.5; min-height:16px; }
.an-pcard-badges { display:flex; gap:6px; margin-bottom:14px; min-height:44px; align-items:center; }
.an-pcard-actions { display:flex; gap:6px; }
.an-pcard-btn { flex:1; font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:9px 8px; cursor:pointer; transition:.15s; border-radius:2px; }
.an-pcard-btn.primary { background:#003DA5; color:#fff; border:1px solid #003DA5; }
.an-pcard-btn.primary:hover { background:#0050CC; }
.an-pcard-btn.ghost { background:transparent; color:rgba(255,255,255,0.5); border:1px solid rgba(255,255,255,0.15); }
.an-pcard-btn.ghost:hover { color:#fff; border-color:#fff; }
@media(max-width:768px){
  #an-profile-card { width:calc(100vw - 32px); left:16px !important; right:16px; }
}


/* ── ADMIN TAB ── */
.an-admin-badge { display:inline-block; background:#e74c3c; color:#fff; font-family:'Barlow Condensed',sans-serif; font-size:8px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:2px 5px; margin-left:4px; vertical-align:middle; }
.an-admin-row { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; border-bottom:1px solid rgba(255,255,255,0.05); transition:background .15s; }
.an-admin-row:hover { background:rgba(255,255,255,0.02); }
.an-admin-row-info { flex:1; }
.an-admin-row-title { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#fff; }
.an-admin-row-sub { font-family:'Barlow Condensed',sans-serif; font-size:10px; letter-spacing:1px; color:rgba(255,255,255,0.35); margin-top:2px; }
.an-admin-acts { display:flex; gap:5px; flex-shrink:0; }
.an-micro-btn.red { border-color:#e74c3c; color:#e74c3c; }
.an-micro-btn.red:hover { background:#e74c3c; color:#fff; border-color:#e74c3c; }
.an-micro-btn.orange { border-color:#f0a500; color:#f0a500; }
.an-micro-btn.orange:hover { background:#f0a500; color:#000; }
.an-admin-section { padding:0; }
.an-admin-sub-tabs { display:flex; border-bottom:1px solid rgba(255,255,255,0.06); }
.an-admin-sub-tab { flex:1; padding:9px 4px; background:none; border:none; border-bottom:2px solid transparent; font-family:'Barlow Condensed',sans-serif; font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.3); cursor:pointer; transition:.2s; margin-bottom:-1px; }
.an-admin-sub-tab.active { color:#fff; border-bottom-color:#e74c3c; }
.an-admin-sub-content { display:none; }
.an-admin-sub-content.active { display:block; }
/* Custom bet form */
.an-admin-form { padding:12px 20px; }
.an-admin-form .an-label { margin-top:10px; }
.an-odds-row { display:grid; grid-template-columns:1fr 1fr; gap:8px; }

/* ── BOTTOM NAV MOBILE ── */
.an-bottom-nav {
  display:none;
  position:fixed; bottom:0; left:0; right:0;
  height:56px;
  background:#04070d;
  border-top:1px solid rgba(0,61,165,0.25);
  z-index:801;
  padding-bottom:env(safe-area-inset-bottom,0px);
}
.an-bottom-nav-inner {
  display:flex; height:56px; align-items:stretch;
}
.an-bnav-btn {
  flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:3px; background:none; border:none; cursor:pointer;
  color:rgba(255,255,255,0.35); transition:color .15s;
  position:relative; padding:0;
}
.an-bnav-btn.active { color:#4d82d4; }
.an-bnav-btn svg { width:20px; height:20px; stroke:currentColor; fill:none; stroke-width:1.8; }
.an-bnav-label { font-family:'Barlow Condensed',sans-serif; font-size:8px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
.an-bnav-dot { position:absolute; top:8px; right:calc(50% - 14px); width:6px; height:6px; border-radius:50%; background:#e74c3c; display:none; border:1.5px solid #04070d; }
.an-bnav-dot.on { display:block; }

@media(max-width:768px) {
  /* Panel : full screen, pas de header, navigation par bottom nav */
  #an-panel {
    width:100%; border-left:none;
    top:0; right:0; bottom:0;
    transform:translateX(100%);
  }
  #an-panel.open { transform:translateX(0); }

  /* Cacher les tabs horizontales sur mobile, remplacées par bottom nav */
  .an-tabs { display:none; }

  /* Panel head compact */
  .an-panel-head { padding:10px 14px; min-height:54px; }
  .an-head-avatar { width:36px; height:36px; font-size:16px; }
  .an-head-name { font-size:13px; }
  .an-head-pts { font-size:16px; }
  #an-pill-info { display:none; }
  #an-trigger-btn { padding:4px 8px 4px 4px; gap:6px; }
  #an-avatar-pill { width:28px; height:28px; font-size:12px; }

  /* Body : prend tout l'espace, bottom nav réserve 56px */
  .an-body {
    padding-bottom:calc(56px + env(safe-area-inset-bottom,0px));
  }

  /* Sections : scroll interne correct, pas de débordement */
  .an-section {
    position:absolute; top:0; left:0; right:0; bottom:0;
    overflow-y:auto; -webkit-overflow-scrolling:touch;
    display:none; flex-direction:column;
  }
  .an-section.active { display:flex; }

  /* Body wrapper doit être relative pour que position:absolute fonctionne */
  .an-body { position:relative; overflow:hidden; }

  /* MP : chat prend toute la hauteur disponible */
  #an-sec-mp { overflow:hidden; }
  #an-mp-convs, #an-mp-groupes {
    position:absolute; top:0; left:0; right:0; bottom:0;
    display:none; flex-direction:column; overflow:hidden;
  }
  #an-mp-convs.active, #an-mp-groupes.active { display:flex; }
  #an-conv-view { overflow-y:auto; flex:1; -webkit-overflow-scrolling:touch; }
  #an-chat-view { flex:1; min-height:0; display:flex; flex-direction:column; }
  .an-chat-wrap { flex:1; min-height:0; display:flex; flex-direction:column; }
  .an-chat-msgs { flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; padding:10px 12px; }
  .an-chat-input-row {
    flex-shrink:0; padding:8px 12px;
    padding-bottom:max(8px, env(safe-area-inset-bottom));
    background:#04070d;
  }

  /* Bottom nav visible sur mobile */
  .an-bottom-nav { display:block; z-index:802; }

  /* Inputs 16px pour éviter zoom iOS */
  .an-input, .an-search, .an-chat-input { font-size:16px; padding:12px; }
  .an-auth-input { font-size:16px; }
  .an-btn, .an-auth-btn { padding:14px; font-size:12px; }

  /* Touch targets */
  .an-friend-row { padding:14px 14px; min-height:56px; }
  .an-notif-item { padding:12px 14px; }
  .an-admin-row { padding:12px 14px; }
  .an-conv-row { padding:14px 14px; min-height:56px; }
  .an-rank-row { padding:16px 14px; min-height:56px; }

  /* Labels & champs */
  .an-row-label { padding:12px 14px 4px; }
  .an-field { padding:0 14px 10px; }
  .an-save-row { padding:10px 14px 14px; }
  .an-search-wrap { padding:10px 14px; }
  .an-admin-sub-tab { font-size:9px; padding:10px 6px; letter-spacing:1px; }
  .an-admin-form { padding:10px 14px; }
  .an-rank-emoji { font-size:22px; }
  .an-rank-name { font-size:19px; }

  /* Auth modal slide from bottom */
  #an-auth-modal { align-items:flex-end; }
  .an-auth-box {
    border-radius:16px 16px 0 0; border-bottom:none;
    padding:24px 18px calc(24px + env(safe-area-inset-bottom,0px));
    max-width:100%;
  }
  .an-auth-box::before {
    content:''; display:block; width:36px; height:4px;
    background:rgba(255,255,255,0.15); border-radius:2px;
    margin:0 auto 20px;
  }

  /* Profile card pleine largeur */
  #an-profile-card {
    width:calc(100vw - 24px) !important;
    left:12px !important; right:12px;
    top:50% !important; transform:translateY(-50%) !important;
    max-height:90vh; overflow-y:auto;
  }
  #an-profile-card.open { display:block; }

  /* Admin acts wrap */
  .an-admin-acts { flex-wrap:wrap; gap:4px; max-width:160px; justify-content:flex-end; }
  .an-micro-btn { padding:6px 8px; font-size:9px; min-height:32px; }
}
/* Safe area for panel */
@supports(padding-bottom: env(safe-area-inset-bottom)){
  .an-chat-input-row { padding-bottom:calc(10px + env(safe-area-inset-bottom)); }
  .an-save-row { padding-bottom:calc(16px + env(safe-area-inset-bottom)); }
}


/* ── BADGES TAB ── */
.an-invite-btn { width:calc(100% - 40px); margin:12px 20px 4px; background:rgba(0,61,165,0.15); border:1px solid rgba(0,61,165,0.4); color:#4d82d4; font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:10px; cursor:pointer; transition:.2s; display:block; }
.an-invite-btn:hover { background:rgba(0,61,165,0.3); color:#fff; }

/* ── CROPPER MODAL ── */
#an-crop-modal { display:none; position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,0.95); align-items:center; justify-content:center; flex-direction:column; gap:16px; }
#an-crop-modal.open { display:flex; }
#an-crop-wrap { position:relative; width:300px; height:300px; overflow:hidden; border-radius:50%; border:2px solid #003DA5; cursor:move; touch-action:none; }
#an-crop-img { position:absolute; transform-origin:0 0; pointer-events:none; }
.an-crop-hint { font-family:'Barlow Condensed',sans-serif; font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.4); }
.an-crop-actions { display:flex; gap:10px; }
.an-crop-zoom { display:flex; align-items:center; gap:10px; }
.an-crop-zoom input { accent-color:#003DA5; width:120px; }
.an-crop-zoom span { font-family:'Barlow Condensed',sans-serif; font-size:10px; letter-spacing:1px; color:rgba(255,255,255,0.4); }

/* STREAK MODAL */
#an-streak-modal { position:fixed; inset:0; z-index:2000; background:rgba(0,0,0,0.75); backdrop-filter:blur(8px); display:none; align-items:center; justify-content:center; padding:20px; }
#an-streak-modal.open { display:flex; }
.an-streak-box { background:#04070d; border:1px solid rgba(0,61,165,0.4); padding:32px 24px; max-width:340px; width:100%; text-align:center; position:relative; }
.an-streak-fire { font-size:56px; line-height:1; margin-bottom:8px; }
.an-streak-title { font-family:'Bebas Neue',sans-serif; font-size:36px; letter-spacing:2px; color:#fff; }
.an-streak-sub { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,0.4); margin-bottom:20px; }
.an-streak-days { display:flex; gap:6px; justify-content:center; margin-bottom:20px; }
.an-streak-day { width:36px; height:36px; border-radius:50%; border:1.5px solid rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:14px; color:rgba(255,255,255,0.3); transition:.2s; }
.an-streak-day.done { border-color:#f0a500; color:#f0a500; background:rgba(240,165,0,0.1); }
.an-streak-day.today { border-color:#00c87a; color:#00c87a; background:rgba(0,200,122,0.1); box-shadow:0 0 8px rgba(0,200,122,0.3); }
.an-streak-pts { font-family:'Bebas Neue',sans-serif; font-size:48px; letter-spacing:2px; color:#00c87a; }
.an-streak-pts-label { font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,0.3); margin-bottom:20px; }
.an-streak-chest { font-size:40px; margin-bottom:4px; }

/* COFFRE QUOTIDIEN */
.an-chest-btn { display:flex; align-items:center; gap:10px; padding:14px 20px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05); transition:background .15s; width:100%; background:none; border-left:none; border-right:none; border-top:none; text-align:left; }
.an-chest-btn:hover { background:rgba(0,61,165,0.06); }
.an-chest-btn.claimed { opacity:0.4; cursor:default; }
.an-chest-icon { font-size:28px; flex-shrink:0; }
.an-chest-info { flex:1; }
.an-chest-label { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#fff; }
.an-chest-sub { font-family:'Barlow Condensed',sans-serif; font-size:10px; letter-spacing:1px; color:rgba(255,255,255,0.3); }

/* RIVALITÉS */
.an-rival-row { display:flex; align-items:center; gap:10px; padding:12px 20px; border-bottom:1px solid rgba(255,255,255,0.05); }
.an-rival-score { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:1px; color:#4d82d4; margin-left:auto; white-space:nowrap; }
.an-rival-vs { font-family:'Bebas Neue',sans-serif; font-size:14px; color:rgba(255,255,255,0.2); }
`

// ─── HTML ──────────────────────────────────────────────────────────────────
function html() { return `
<!-- AUTH MODAL -->
<div id="an-auth-modal">
  <div class="an-auth-box">
    <button class="an-auth-close" onclick="AN.closeAuth()">✕</button>
    <div class="an-auth-eyebrow">NewsPorto</div>
    <div class="an-auth-title" id="an-auth-title">Connexion</div>
    <div class="an-auth-tabs">
      <button class="an-auth-tab active" onclick="AN.authTab('login')">Connexion</button>
      <button class="an-auth-tab" onclick="AN.authTab('signup')">Inscription</button>
    </div>
    <div class="an-auth-error" id="an-auth-err"></div>

    <!-- LOGIN -->
    <div id="an-login-form">
      <button class="an-google-btn" onclick="AN.googleLogin()">
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continuer avec Google
      </button>
      <div class="an-auth-sep"><span>ou</span></div>
      <div class="an-auth-field"><label class="an-auth-label">Email</label><input class="an-auth-input" type="email" id="an-login-email" placeholder="ton@email.com"></div>
      <div class="an-auth-field"><label class="an-auth-label">Mot de passe</label><input class="an-auth-input" type="password" id="an-login-pwd" placeholder="••••••••" onkeydown="if(event.key==='Enter')AN.login()"></div>
      <button class="an-auth-btn" id="an-login-btn" onclick="AN.login()">Se connecter →</button>
    </div>

    <!-- SIGNUP -->
    <div id="an-signup-form" style="display:none">
      <button class="an-google-btn" onclick="AN.googleLogin()">
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continuer avec Google
      </button>
      <div class="an-auth-sep"><span>ou</span></div>
      <div class="an-auth-field"><label class="an-auth-label">Nom d'utilisateur</label><input class="an-auth-input" type="text" id="an-signup-user" placeholder="MonPseudo"></div>
      <div class="an-auth-field"><label class="an-auth-label">Email</label><input class="an-auth-input" type="email" id="an-signup-email" placeholder="ton@email.com"></div>
      <div class="an-auth-field"><label class="an-auth-label">Mot de passe</label><input class="an-auth-input" type="password" id="an-signup-pwd" placeholder="Min. 8 caractères" onkeydown="if(event.key==='Enter')AN.signup()"></div>
      <label class="an-auth-check"><input type="checkbox" id="an-signup-nl" checked><span>Rejoindre la newsletter NewsPorto</span></label>
      <button class="an-auth-btn" id="an-signup-btn" onclick="AN.signup()">Créer mon compte →</button>
      <div class="an-auth-bonus">🎁 500 points offerts à l'inscription</div>
    </div>
  </div>
</div>

<!-- OVERLAY -->
<div id="an-overlay" onclick="AN.closePanel()"></div>

<!-- SIDE PANEL -->
<div id="an-panel">
  <!-- Header -->
  <div class="an-panel-head">
    <div class="an-head-avatar" id="an-head-av" onclick="AN.tabTo('profil')" title="Modifier le profil"></div>
    <div class="an-head-info">
      <div class="an-head-name" id="an-head-name">—</div>
      <div class="an-head-rank" id="an-head-rank"></div>
      <div style="display:flex;align-items:center;gap:6px">
        <div class="an-head-pts" id="an-head-pts">0 pts</div>
        <div id="an-head-level" style="font-family:'Bebas Neue',sans-serif;font-size:13px;color:#4d82d4;background:rgba(0,61,165,0.2);border:1px solid rgba(0,61,165,0.4);padding:1px 6px;letter-spacing:1px">Nv1</div>
      </div>
      <div style="margin-top:5px">
        <div style="display:flex;justify-content:space-between;margin-bottom:2px">
          <span id="an-xp-label" style="font-family:'Barlow Condensed',sans-serif;font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.3)">0 / 100 XP</span>
        </div>
        <div style="height:3px;background:rgba(255,255,255,0.08);border-radius:2px;width:140px">
          <div id="an-xp-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#003DA5,#4d82d4);border-radius:2px;transition:width .5s ease"></div>
        </div>
      </div>
    </div>
    <button class="an-head-close" onclick="AN.closePanel()">✕</button>
  </div>

  <!-- Tabs -->
  <div class="an-tabs">
    <button class="an-tab active" data-tab="profil"  onclick="AN.tabTo('profil')">Profil</button>
    <button class="an-tab"        data-tab="notifs"  onclick="AN.tabTo('notifs')">Notifs<span class="an-tab-dot" id="tab-dot-notifs"></span></button>
    <button class="an-tab"        data-tab="amis"    onclick="AN.tabTo('amis')">Amis<span class="an-tab-dot" id="tab-dot-amis"></span></button>
    <button class="an-tab"        data-tab="mp"      onclick="AN.tabTo('mp')">Messages<span class="an-tab-dot" id="tab-dot-mp"></span></button>
    <button class="an-tab"        data-tab="rangs"   onclick="AN.tabTo('rangs')">Rangs</button>
    <button class="an-tab"        data-tab="badges"  onclick="AN.tabTo('badges')">Badges</button>
    <button class="an-tab" id="an-tab-admin" data-tab="admin" onclick="AN.tabTo('admin')" style="display:none">Admin<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#e74c3c;margin-left:4px;vertical-align:middle"></span></button>
  </div>

  <!-- Body -->
  <div class="an-body">

    <!-- PROFIL -->
    <div class="an-section active" id="an-sec-profil">
      <div class="an-avatar-upload">
        <div class="an-avatar-big" id="an-prof-av" onclick="document.getElementById('an-avatar-input').click()" title="Changer la photo"></div>
        <div><div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.5)">Changer la photo</div><div class="an-avatar-hint">JPG / PNG · Max 2MB</div></div>
      </div>
      <input type="file" id="an-avatar-input" accept="image/*" onchange="AN.uploadAvatar(this)">
      <div class="an-field"><label class="an-label">Prénom affiché</label><input class="an-input" type="text" id="an-prof-name" placeholder="Ton prénom"></div>
      <div class="an-field"><label class="an-label">Bio</label><input class="an-input" type="text" id="an-prof-bio" placeholder="Fan du FC Porto depuis toujours" maxlength="120"></div>
      <div class="an-field"><label class="an-label">Nouveau mot de passe</label><input class="an-input" type="password" id="an-prof-pwd" placeholder="Laisser vide pour ne pas changer"></div>
      <div class="an-error" id="an-prof-err"></div>
      <div class="an-save-row" style="display:flex;gap:8px">
        <button class="an-btn" style="flex:1" onclick="AN.saveProfile()">Sauvegarder →</button>
        <button class="an-btn-ghost" onclick="AN.logout()">Déconnexion</button>
      </div>
      <div style="padding:0 20px 12px">
        <button class="an-btn-ghost" style="width:100%" onclick="AN._generateInviteLink()">📨 Copier mon lien d'invitation</button>
      </div>
      <!-- COFFRE QUOTIDIEN -->
      <div class="an-row-label">Coffre quotidien</div>
      <button class="an-chest-btn" id="an-chest-btn" onclick="AN.claimChest()">
        <div class="an-chest-icon">📦</div>
        <div class="an-chest-info">
          <div class="an-chest-label">Coffre du jour</div>
          <div class="an-chest-sub" id="an-chest-sub">10 à 200 pts aléatoires · 1x par jour</div>
        </div>
        <span id="an-chest-arrow" style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:#4d82d4">→</span>
      </button>
    </div>

    <!-- NOTIFS -->
    <div class="an-section" id="an-sec-notifs">
      <button class="an-mark-all" onclick="AN.markAllRead()">Tout marquer comme lu</button>
      <div id="an-notif-list"><div class="an-empty">Aucune notification</div></div>
    </div>

    <!-- AMIS -->
    <div class="an-section" id="an-sec-amis">
      <div class="an-admin-sub-tabs" style="border-bottom:1px solid rgba(255,255,255,0.06)">
        <button class="an-admin-sub-tab active" onclick="AN.amisSubTab('membres',this)">Membres</button>
        <button class="an-admin-sub-tab" onclick="AN.amisSubTab('rivalites',this)">Rivalités</button>
      </div>
      <div class="an-admin-sub-content active" id="an-amis-membres">
        <div class="an-search-wrap">
          <input class="an-search" type="text" placeholder="Rechercher un utilisateur..." id="an-friends-search" oninput="AN.searchUsers(this.value)">
        </div>
        <div id="an-friends-list"><div class="an-empty">Chargement...</div></div>
      </div>
      <div class="an-admin-sub-content" id="an-amis-rivalites">
        <div class="an-row-label">Mes rivalités</div>
        <div id="an-rivals-list"><div class="an-empty">Chargement...</div></div>
      </div>
    </div>

    <!-- MP -->
    <div class="an-section" id="an-sec-mp">
      <a href="forum.html#chat-general" style="display:flex;align-items:center;gap:10px;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(0,200,122,0.04);text-decoration:none;transition:background .15s" onmouseover="this.style.background='rgba(0,200,122,0.08)'" onmouseout="this.style.background='rgba(0,200,122,0.04)'">
        <span style="font-size:16px">💬</span>
        <div style="flex:1">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#fff">Discussion Générale</div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:9px;letter-spacing:1px;color:rgba(255,255,255,0.35)">Chat en direct · Forum</div>
        </div>
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;color:#00c87a;border:1px solid #00c87a;padding:2px 6px">LIVE</span>
      </a>
      <div class="an-admin-sub-tabs" style="border-bottom:1px solid rgba(255,255,255,0.06)">
        <button class="an-admin-sub-tab active" onclick="AN.mpSubTab('convs',this)">Messages</button>
        <button class="an-admin-sub-tab" onclick="AN.mpSubTab('groupes',this)">Groupes</button>
      </div>
      <div class="an-admin-sub-content active" id="an-mp-convs">
        <div id="an-conv-view">
          <div class="an-conv-list" id="an-conv-list"><div class="an-empty">Aucune conversation</div></div>
        </div>
        <div id="an-chat-view" style="display:none;flex-direction:column;flex:1;min-height:0">
          <div class="an-chat-wrap" style="display:flex;flex-direction:column;flex:1;min-height:0">
            <div class="an-chat-header">
              <button class="an-chat-back" onclick="AN.backToConvList()">←</button>
              <div class="an-chat-name" id="an-chat-name"></div>
            </div>
            <div class="an-chat-msgs" id="an-chat-msgs" style="flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px;-webkit-overflow-scrolling:touch"></div>
            <div class="an-chat-input-row" style="flex-shrink:0;padding:10px 12px;padding-bottom:max(10px,env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,0.07);display:flex;gap:6px;background:#04070d">
              <input class="an-chat-input" type="text" id="an-chat-input" placeholder="Écrire..." inputmode="text" autocomplete="off" onkeydown="if(event.key==='Enter'){event.preventDefault();AN.sendMsg()}">
              <button class="an-chat-send" onclick="AN.sendMsg()">↑</button>
            </div>
          </div>
        </div>
      </div>
      <div class="an-admin-sub-content" id="an-mp-groupes" style="display:flex;flex-direction:column;flex:1;min-height:0">
        <div id="an-group-list-view">
          <div class="an-row-label" style="display:flex;align-items:center;justify-content:space-between;padding-right:20px">
            Mes groupes
            <button class="an-micro-btn blue" onclick="AN.showCreateGroup()">+ Créer</button>
          </div>
          <div id="an-groups-list"><div class="an-empty">Chargement...</div></div>
        </div>
        <div id="an-group-create-view" style="display:none;padding:12px 20px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
            <button class="an-chat-back" onclick="AN.hideCreateGroup()">←</button>
            <span style="font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#fff">Nouveau groupe</span>
          </div>
          <label class="an-label">Nom du groupe</label>
          <input class="an-input" type="text" id="an-group-name" placeholder="Ex: Les Dragons Bleus" maxlength="40">
          <label class="an-label" style="margin-top:10px">Ajouter des amis</label>
          <div id="an-group-friends-pick" style="margin-top:6px;display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto"></div>
          <button class="an-btn" style="width:100%;margin-top:14px" onclick="AN.createGroup()">Créer le groupe →</button>
        </div>
        <div id="an-group-chat-view" style="display:none;flex-direction:column;flex:1;min-height:0">
          <div class="an-chat-wrap" style="display:flex;flex-direction:column;flex:1;min-height:0">
            <div class="an-chat-header">
              <button class="an-chat-back" onclick="AN.backToGroupList()">←</button>
              <div class="an-chat-name" id="an-group-chat-name"></div>
              <span id="an-group-members-count" style="font-family:'Barlow Condensed',sans-serif;font-size:10px;color:rgba(255,255,255,0.3);margin-left:auto"></span>
            </div>
            <div class="an-chat-msgs" id="an-group-msgs" style="flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px;-webkit-overflow-scrolling:touch"></div>
            <div class="an-chat-input-row" style="flex-shrink:0;padding:10px 12px;padding-bottom:max(10px,env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,0.07);display:flex;gap:6px;background:#04070d">
              <input class="an-chat-input" type="text" id="an-group-input" placeholder="Écrire..." inputmode="text" autocomplete="off" onkeydown="if(event.key==='Enter'){event.preventDefault();AN.sendGroupMsg()}">
              <button class="an-chat-send" onclick="AN.sendGroupMsg()">↑</button>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- ADMIN -->
    <div class="an-section" id="an-sec-admin">
      <div class="an-admin-sub-tabs">
        <button class="an-admin-sub-tab active" onclick="AN.adminSubTab('forum',this)">Forum</button>
        <button class="an-admin-sub-tab" onclick="AN.adminSubTab('users',this)">Users</button>
        <button class="an-admin-sub-tab" onclick="AN.adminSubTab('bets',this)">Paris</button>
        <button class="an-admin-sub-tab" onclick="AN.adminSubTab('matches',this)">Matchs</button>
      </div>

      <!-- FORUM -->
      <div class="an-admin-sub-content active" id="an-admin-forum">
        <div class="an-row-label">Threads récents</div>
        <div id="an-admin-threads"><div class="an-empty">Chargement...</div></div>
      </div>

      <!-- USERS -->
      <div class="an-admin-sub-content" id="an-admin-users">
        <div class="an-search-wrap" style="padding:12px 20px">
          <input class="an-search" type="text" placeholder="Rechercher un utilisateur..." id="an-admin-user-search" oninput="AN.adminSearchUsers(this.value)">
        </div>
        <div id="an-admin-users-list"><div class="an-empty">Recherche un utilisateur</div></div>
      </div>

      <!-- PARIS CUSTOM -->
      <div class="an-admin-sub-content" id="an-admin-bets">
        <div class="an-row-label">Paris actifs</div>
        <div id="an-admin-custom-bets"><div class="an-empty">Aucun pari actif</div></div>
        <div class="an-row-label" style="margin-top:8px">Créer un pari</div>
        <div class="an-admin-form">
          <label class="an-label">Question / Titre</label>
          <input class="an-input" type="text" id="an-cb-title" placeholder="Mora va marquer avant 60 min ?">
          <label class="an-label">Description (optionnel)</label>
          <input class="an-input" type="text" id="an-cb-desc" placeholder="Plus de détails...">
          <label class="an-label">Option Oui</label>
          <input class="an-input" type="text" id="an-cb-yes" value="Oui">
          <label class="an-label">Option Non</label>
          <input class="an-input" type="text" id="an-cb-no" value="Non">
          <div class="an-odds-row" style="margin-top:10px">
            <div>
              <label class="an-label">Cote Oui</label>
              <input class="an-input" type="number" id="an-cb-odds-yes" value="2.0" step="0.1" min="1.1">
            </div>
            <div>
              <label class="an-label">Cote Non</label>
              <input class="an-input" type="number" id="an-cb-odds-no" value="2.0" step="0.1" min="1.1">
            </div>
          </div>
          <label class="an-label">Ferme le (optionnel)</label>
          <input class="an-input" type="datetime-local" id="an-cb-closes">
          <button class="an-btn" style="width:100%;margin-top:12px" onclick="AN.createCustomBet()">Lancer le pari →</button>
        </div>
      </div>

      <!-- MATCHS CUSTOM -->
      <div class="an-admin-sub-content" id="an-admin-matches">
        <div class="an-row-label">Matchs actifs</div>
        <div id="an-admin-matches-list"><div class="an-empty">Chargement...</div></div>
        <div class="an-row-label" style="margin-top:8px">Créer un match</div>
        <div class="an-admin-form">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div>
              <label class="an-label">Équipe domicile</label>
              <input class="an-input" type="text" id="an-m-home" placeholder="FC Porto">
            </div>
            <div>
              <label class="an-label">Équipe extérieur</label>
              <input class="an-input" type="text" id="an-m-away" placeholder="Benfica">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
            <div>
              <label class="an-label">Logo domicile</label>
              <input class="an-input" type="file" accept="image/*" id="an-m-home-img" style="padding:5px">
            </div>
            <div>
              <label class="an-label">Logo extérieur</label>
              <input class="an-input" type="file" accept="image/*" id="an-m-away-img" style="padding:5px">
            </div>
          </div>
          <label class="an-label" style="margin-top:8px">Compétition</label>
          <input class="an-input" type="text" id="an-m-competition" placeholder="Liga Portugal" value="Liga Portugal">
          <label class="an-label">Kick-off (date/heure)</label>
          <input class="an-input" type="datetime-local" id="an-m-kickoff">
          <label class="an-label">Fermeture des mises</label>
          <input class="an-input" type="datetime-local" id="an-m-closes">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px">
            <div>
              <label class="an-label">Cote Victoire</label>
              <input class="an-input" type="number" id="an-m-odds-win" value="1.8" step="0.1" min="1.1">
            </div>
            <div>
              <label class="an-label">Cote Nul</label>
              <input class="an-input" type="number" id="an-m-odds-draw" value="3.5" step="0.1" min="1.1">
            </div>
            <div>
              <label class="an-label">Cote Défaite</label>
              <input class="an-input" type="number" id="an-m-odds-lose" value="4.5" step="0.1" min="1.1">
            </div>
          </div>
          <button class="an-btn" style="width:100%;margin-top:12px" onclick="AN.createCustomMatch()">Créer le match →</button>
        </div>
      </div>
    </div>


    <!-- BADGES -->
    <div class="an-section" id="an-sec-badges">
      <div id="an-badges-content"><div class="an-empty">Chargement...</div></div>
    </div>

    <!-- RANGS -->
    <div class="an-section" id="an-sec-rangs">
      <div class="an-row-label">Solde : <span id="an-rangs-pts" style="color:#4d82d4">—</span> pts</div>
      <div id="an-rank-list"></div>
    </div>

  </div>
</div>

<!-- CROP MODAL -->
<div id="an-crop-modal">
  <div class="an-crop-hint">Déplace · Pinche pour zoomer</div>
  <div id="an-crop-wrap">
    <img id="an-crop-img" src="" alt="">
  </div>
  <div class="an-crop-zoom">
    <span>−</span>
    <input type="range" id="an-crop-zoom-range" min="1" max="3" step="0.01" value="1">
    <span>+</span>
  </div>
  <div class="an-crop-actions">
    <button class="an-btn-ghost" onclick="AN.closeCrop()">Annuler</button>
    <button class="an-btn" onclick="AN.confirmCrop()">Valider →</button>
  </div>
</div>

<!-- BOTTOM NAV MOBILE -->
<div class="an-bottom-nav" id="an-bottom-nav">
  <div class="an-bottom-nav-inner">
    <button class="an-bnav-btn active" data-tab="profil" onclick="AN.tabTo('profil')">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
      <span class="an-bnav-label">Profil</span>
    </button>
    <button class="an-bnav-btn" data-tab="notifs" onclick="AN.tabTo('notifs')">
      <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <span class="an-bnav-label">Notifs</span>
      <span class="an-bnav-dot" id="bnav-dot-notifs"></span>
    </button>
    <button class="an-bnav-btn" data-tab="mp" onclick="AN.tabTo('mp')">
      <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span class="an-bnav-label">Messages</span>
      <span class="an-bnav-dot" id="bnav-dot-mp"></span>
    </button>
    <button class="an-bnav-btn" data-tab="amis" onclick="AN.tabTo('amis')">
      <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      <span class="an-bnav-label">Amis</span>
    </button>
    <button class="an-bnav-btn" data-tab="rangs" onclick="AN.tabTo('rangs')">
      <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      <span class="an-bnav-label">Rangs</span>
    </button>
  </div>
</div>

<div id="an-toast"></div>

<div id="an-profile-card">
  <button id="an-profile-card-close" onclick="AN.closeProfileCard()">✕</button>
  <div class="an-pcard-head">
    <div class="an-pcard-av" id="an-pcard-av"></div>
    <div>
      <div class="an-pcard-name" id="an-pcard-name"></div>
      <div class="an-pcard-rank" id="an-pcard-rank"></div>
    </div>
  </div>
  <div class="an-pcard-bio" id="an-pcard-bio"></div>
  <div class="an-pcard-badges" id="an-pcard-badges"></div>
  <div class="an-pcard-actions" id="an-pcard-actions"></div>
</div>

<!-- STREAK MODAL -->
<div id="an-streak-modal">
  <div class="an-streak-box">
    <div class="an-streak-fire" id="an-streak-fire">🔥</div>
    <div class="an-streak-title" id="an-streak-title">STREAK !</div>
    <div class="an-streak-sub" id="an-streak-sub">Connexion quotidienne</div>
    <div class="an-streak-days" id="an-streak-days"></div>
    <div id="an-streak-chest-icon"></div>
    <div class="an-streak-pts" id="an-streak-pts">+10</div>
    <div class="an-streak-pts-label">points gagnés</div>
    <button class="an-btn" style="width:100%" onclick="AN.closeStreakModal()">Récupérer →</button>
  </div>
</div>
`}

// ─── CONTROLLER ────────────────────────────────────────────────────────────
class AN {
  constructor() { this.u = null; this.p = null; this.mpFriend = null; this.mpCh = null; this.onlineIds = new Set() }

  async init() {
    const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s)
    document.body.insertAdjacentHTML('beforeend', html())
    this._mountNav()

    // Check existing session FIRST (page reload / OAuth redirect already processed)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) await this._onLogin(session.user)

    // Listen for future changes — guard !this.u to avoid double _onLogin
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && !this.u) {
        await this._onLogin(session.user)
      } else if (event === 'SIGNED_OUT') {
        this._onLogout()
      } else if (event === 'TOKEN_REFRESHED' && session && !this.u) {
        await this._onLogin(session.user)
      }
    })

    // Auto-ouvrir le chat général si #chat-general dans l'URL
    if (window.location.hash === '#chat-general') {
      setTimeout(() => {
        if (typeof toggleChatGeneral === 'function') toggleChatGeneral()
        else window.dispatchEvent(new CustomEvent('open-chat-general'))
      }, 600)
    }
  }

  _mountNav() {
    const nav = document.querySelector('nav')
    if (!nav) return
    const wrap = document.createElement('div')
    wrap.style.cssText = 'display:flex;align-items:center;gap:8px;flex-shrink:0;'

    // Not logged in button
    const signinBtn = document.createElement('button')
    signinBtn.id = 'an-signin-btn'
    signinBtn.textContent = "S'inscrire"
    signinBtn.onclick = () => this.openAuth('signup')

    // Profile pill
    const pill = document.createElement('button')
    pill.id = 'an-trigger-btn'
    pill.style.display = 'none'
    pill.innerHTML = `<div id="an-avatar-pill"></div><div id="an-pill-info"><div id="an-pill-name">—</div><div id="an-pill-pts">0 pts</div></div><div id="an-notif-dot"></div>`
    pill.onclick = () => this.togglePanel()

    wrap.appendChild(signinBtn)
    wrap.appendChild(pill)

    // Replace .nav-cta or append
    const cta = nav.querySelector('.nav-cta')
    if (cta) cta.replaceWith(wrap)
    else nav.appendChild(wrap)
  }

  _updateNav() {
    const p = this.p
    if (!p) return
    // pill
    const av = document.getElementById('an-avatar-pill')
    if (av) av.innerHTML = p.avatar_url ? `<img src="${p.avatar_url}">` : (p.display_name||p.username||'?')[0].toUpperCase()
    const pn = document.getElementById('an-pill-name'); if (pn) pn.textContent = p.display_name || p.username
    const pp = document.getElementById('an-pill-pts');  if (pp) pp.textContent = p.role === 'admin' ? 'Admin' : `${p.points} pts · Nv${p.level||1}`
    // panel header
    const ha = document.getElementById('an-head-av')
    if (ha) ha.innerHTML = p.avatar_url ? `<img src="${p.avatar_url}">` : (p.display_name||p.username||'?')[0].toUpperCase()
    const hn = document.getElementById('an-head-name'); if (hn) hn.textContent = p.display_name || p.username
    const hr = document.getElementById('an-head-rank')
    const hpts = document.getElementById('an-head-pts'); if (hpts) hpts.textContent = `${p.points} pts`
    // Level + XP bar
    const lvl = p.level || 1
    const xp = p.xp || 0
    const hlvl = document.getElementById('an-head-level'); if (hlvl) hlvl.textContent = `Nv${lvl}`
    // Compute XP for current level
    let needed = Math.round(100 * Math.pow(1.4, lvl - 1))
    let accumulated = 0; for (let i = 1; i < lvl; i++) accumulated += Math.round(100 * Math.pow(1.4, i - 1))
    const currentXp = xp - accumulated
    const pct = Math.min(100, Math.round(currentXp / needed * 100))
    const xpLabel = document.getElementById('an-xp-label'); if (xpLabel) xpLabel.textContent = `${currentXp} / ${needed} XP`
    const xpBar = document.getElementById('an-xp-bar'); if (xpBar) xpBar.style.width = pct + '%'
    const rk = RANKS.find(r => r.id === p.rank) || RANKS[0]
    if (hr) {
      if (p.role === 'admin') {
        hr.textContent = '🔴 Admin'; hr.style.color = '#e74c3c'
      } else {
        hr.textContent = `${rk.emoji} ${p.rank}`; hr.style.color = rk.color
      }
    }
    // profile form
    const pname = document.getElementById('an-prof-name'); if (pname) pname.value = p.display_name || ''
    const pbio  = document.getElementById('an-prof-bio');  if (pbio)  pbio.value  = p.bio || ''
    const pavBig = document.getElementById('an-prof-av')
    if (pavBig) pavBig.innerHTML = p.avatar_url ? `<img src="${p.avatar_url}">` : (p.display_name||p.username||'?')[0].toUpperCase()
  }

  async _onLogin(authUser) {
    this.u = authUser
    let { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()

    // Profile not found yet (timing) — retry once after short delay
    if (!profile) {
      await new Promise(r => setTimeout(r, 800))
      const { data: retryProfile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
      profile = retryProfile
    }

    // Auto-create profile for Google OAuth users (still no profile after retry)
    if (!profile) {
      const username = (authUser.email || 'user').split('@')[0].replace(/[^a-z0-9]/gi,'').toLowerCase() + Math.floor(Math.random()*999)
      const display_name = authUser.user_metadata?.full_name || username
      const avatar_url = authUser.user_metadata?.avatar_url || null
      const { data: newProfile } = await supabase.from('profiles').insert({ id: authUser.id, username, display_name, avatar_url, newsletter: true, points: 500, rank: 'Dragão' }).select().single()
      await supabase.from('points_log').insert({ user_id: authUser.id, amount: 500, reason: 'welcome' }).catch(()=>{})
      try { await fetch('/api/subscribe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: authUser.email }) }) } catch {}
      localStorage.setItem('np_email_subscribed', '1')
      profile = newProfile
    }

    // Still null — abort silently (shouldn't happen)
    if (!profile) { console.warn('Profile still null after retries'); return }

    // Check if banned
    const { data: ban } = await supabase.from('bans').select('reason').eq('user_id', authUser.id).maybeSingle()
    if (ban) {
      await supabase.auth.signOut()
      alert(`Ton compte a été banni.\nRaison : ${ban.reason || 'Non précisée'}`)
      return
    }
    this.p = profile
    // Init badge tracking
    this._loadBadgeStats().then(stats => {
      const p2 = { ...profile, ...stats }
      const nonPres = this._BADGES.filter(b => b.id !== 'president')
      p2._allOtherBadges = nonPres.every(b => b.req(p2))
      if (this.p) this.p._unlockedBadges = this._BADGES.filter(b => b.req(p2)).map(b => b.id)
    })
    const signinBtn = document.getElementById('an-signin-btn')
    const triggerBtn = document.getElementById('an-trigger-btn')
    if (signinBtn) signinBtn.style.display = 'none'
    if (triggerBtn) triggerBtn.style.display = 'flex'
    this._updateNav()
    this._checkNotifs()
    this._subscribePoints()
    this._subscribeNotifs()
    // Masque le popup newsletter
    if (profile?.newsletter) {
      localStorage.setItem('np_email_subscribed', '1')
      const popup = document.getElementById('notif-popup')
      if (popup) popup.classList.remove('show')
    }
    startPresence(authUser.id, profile?.username || '')
    // Streak quotidien
    checkStreak(authUser.id).then(result => {
      if (result && !result.alreadyClaimed) {
        this._showStreakModal(result)
      }
    }).catch(() => {})
    // Show admin tab if admin
    if (profile?.role === 'admin') {
      const adminTab = document.getElementById('an-tab-admin')
      if (adminTab) { adminTab.style.display = ''; adminTab.style.visibility = 'visible' }
    }
    // Notify other page scripts
    window.dispatchEvent(new CustomEvent('an:login', { detail: { user: authUser, profile } }))
  }

  _onLogout() {
    this.u = null; this.p = null
    if (this._notifPollInterval) { clearInterval(this._notifPollInterval); this._notifPollInterval = null }
    if (this._notifChannel) { try { supabase.removeChannel(this._notifChannel) } catch {} this._notifChannel = null }
    document.getElementById('an-signin-btn').style.display = ''
    document.getElementById('an-trigger-btn').style.display = 'none'
    stopPresence()
    this.closePanel()
    window.dispatchEvent(new CustomEvent('an:logout'))
  }

  // Panel
  togglePanel() {
    const panel = document.getElementById('an-panel')
    const overlay = document.getElementById('an-overlay')
    const isOpen = panel.classList.toggle('open')
    overlay.classList.toggle('on', isOpen)
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) {
      // Stop pulse
      document.getElementById('an-trigger-btn')?.classList.remove('has-notif')
      // Re-show admin tab if needed
      if (this.p?.role === 'admin') {
        const adminTab = document.getElementById('an-tab-admin')
        if (adminTab) { adminTab.style.display = ''; adminTab.style.visibility = 'visible' }
      }
      this._loadNotifs(); this._loadFriends(); this._loadConvList()
    }
  }
  closePanel() {
    document.getElementById('an-panel').classList.remove('open')
    document.getElementById('an-overlay').classList.remove('on')
    document.body.style.overflow = ''
  }

  tabTo(tab) {
    // Tabs desktop
    document.querySelectorAll('.an-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))
    // Bottom nav mobile
    document.querySelectorAll('.an-bnav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))
    // Sections — toutes cachées puis active affichée
    document.querySelectorAll('.an-section').forEach(s => {
      s.classList.remove('active')
      s.style.display = 'none'
    })
    const sec = document.getElementById('an-sec-' + tab)
    if (sec) { sec.classList.add('active'); sec.style.display = 'flex' }
    if (tab === 'notifs') this._loadNotifs()
    if (tab === 'amis') { this._loadFriends(); this._loadRivals() }
    if (tab === 'mp') {
      this._loadConvList()
      // Réinitialiser les sub-tabs MP
      const convs = document.getElementById('an-mp-convs')
      const grps = document.getElementById('an-mp-groupes')
      if (convs) { convs.classList.add('active'); convs.style.display = 'flex' }
      if (grps) { grps.classList.remove('active'); grps.style.display = 'none' }
    }
    if (tab === 'rangs') this._renderRanks()
    if (tab === 'badges') this._renderBadges()
    if (tab === 'admin') this._loadAdminForum()
    if (tab === 'profil') this._checkChestStatus()
  }

  amisSubTab(tab, btn) {
    document.querySelectorAll('#an-sec-amis .an-admin-sub-tab').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('#an-sec-amis .an-admin-sub-content').forEach(c => c.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById(`an-amis-${tab}`).classList.add('active')
    if (tab === 'rivalites') this._loadRivals()
  }

  // ── STREAK ──
  _showStreakModal({ streak, pts, isChestDay }) {
    const days = []
    for (let i = 1; i <= 7; i++) {
      const cls = i < streak ? 'done' : i === streak ? 'today' : ''
      const label = i === 7 ? '📦' : `J${i}`
      days.push(`<div class="an-streak-day ${cls}">${label}</div>`)
    }
    document.getElementById('an-streak-days').innerHTML = days.join('')
    document.getElementById('an-streak-pts').textContent = `+${pts}`
    document.getElementById('an-streak-title').textContent = streak === 7 ? 'SEMAINE COMPLÈTE !' : `JOUR ${streak} !`
    document.getElementById('an-streak-sub').textContent = streak >= 3 ? `🔥 ${streak} jours de suite` : 'Connexion quotidienne'
    document.getElementById('an-streak-chest-icon').innerHTML = isChestDay ? '<div class="an-streak-chest">📦</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#f0a500;margin-bottom:4px">+ COFFRE BONUS</div>' : ''
    document.getElementById('an-streak-modal').classList.add('open')
  }

  closeStreakModal() {
    document.getElementById('an-streak-modal').classList.remove('open')
  }

  // ── COFFRE ──
  async _checkChestStatus() {
    if (!this.u) return
    const { data: p } = await supabase.from('profiles').select('last_chest_claim').eq('id', this.u.id).single()
    const today = new Date().toISOString().slice(0, 10)
    const claimed = p?.last_chest_claim === today
    const btn = document.getElementById('an-chest-btn')
    const sub = document.getElementById('an-chest-sub')
    const arrow = document.getElementById('an-chest-arrow')
    if (!btn) return
    if (claimed) {
      btn.classList.add('claimed')
      if (sub) sub.textContent = 'Déjà réclamé aujourd\'hui — reviens demain'
      if (arrow) arrow.textContent = '✓'
    } else {
      btn.classList.remove('claimed')
      if (sub) sub.textContent = '10 à 200 pts aléatoires · 1x par jour'
      if (arrow) arrow.textContent = '→'
    }
  }

  async claimChest() {
    if (!this.u) return
    const result = await claimDailyChest(this.u.id)
    if (!result) return
    if (result.alreadyClaimed) { this._toast('Coffre déjà ouvert aujourd\'hui !', 'err'); return }
    this._toast(`📦 +${result.reward} pts dans le coffre !`, 'ok')
    this._checkChestStatus()
    // Refresh pts display
    const { data: p } = await supabase.from('profiles').select('points,xp,level').eq('id', this.u.id).single()
    if (p && this.p) { this.p.points = p.points; this.p.xp = p.xp; this.p.level = p.level; this._updateNav() }
  }

  // ── RIVALITÉS ──
  async _loadRivals() {
    if (!this.u) return
    const el = document.getElementById('an-rivals-list'); if (!el) return
    el.innerHTML = '<div class="an-empty">Chargement...</div>'
    const { data } = await supabase.from('rivalries')
      .select('*, challenger:challenger_id(id,display_name,username,avatar_url), challenged:challenged_id(id,display_name,username,avatar_url)')
      .or(`challenger_id.eq.${this.u.id},challenged_id.eq.${this.u.id}`)
      .order('updated_at', { ascending: false })
    if (!data?.length) { el.innerHTML = '<div class="an-empty">Aucune rivalité — défie un ami depuis sa fiche profil</div>'; return }
    el.innerHTML = data.map(r => {
      const isChallenger = r.challenger_id === this.u.id
      const me = isChallenger ? r.challenger : r.challenged
      const them = isChallenger ? r.challenged : r.challenger
      const myScore = isChallenger ? r.score_challenger : r.score_challenged
      const theirScore = isChallenger ? r.score_challenged : r.score_challenger
      const theirName = them?.display_name || them?.username || '?'
      const theirAv = them?.avatar_url ? `<img src="${them.avatar_url}" style="width:100%;height:100%;object-fit:cover">` : (theirName[0])
      return `<div class="an-rival-row">
        <div class="an-conv-av">${theirAv}</div>
        <div><div class="an-conv-name">${theirName}</div><div class="an-conv-preview">Paris disputés</div></div>
        <div class="an-rival-score">${myScore} <span class="an-rival-vs">vs</span> ${theirScore}</div>
      </div>`
    }).join('')
  }

  async challengeFriend(friendId, friendName) {
    if (!this.u) return
    // Check if rivalry already exists
    const { data: existing } = await supabase.from('rivalries')
      .select('id')
      .or(`and(challenger_id.eq.${this.u.id},challenged_id.eq.${friendId}),and(challenger_id.eq.${friendId},challenged_id.eq.${this.u.id})`)
      .maybeSingle()
    if (existing) { this._toast('Rivalité déjà active avec ce joueur', 'err'); return }
    await supabase.from('rivalries').insert({
      challenger_id: this.u.id,
      challenged_id: friendId,
      score_challenger: 0,
      score_challenged: 0,
    })
    await supabase.from('notifications').insert({ user_id: friendId, type: 'rival_challenge', from_user_id: this.u.id, ref_label: this.p?.display_name || this.p?.username || '?' })
    this._toast(`Défi lancé à ${friendName} ! ⚔️`, 'ok')
  }

  // AUTH
  openAuth(tab = 'login') {
    this.authTab(tab)
    document.getElementById('an-auth-modal').classList.add('open')
    document.body.style.overflow = 'hidden'
  }
  closeAuth() {
    document.getElementById('an-auth-modal').classList.remove('open')
    document.body.style.overflow = ''
    document.getElementById('an-auth-err').classList.remove('on')
  }
  authTab(tab) {
    document.querySelectorAll('.an-auth-tab').forEach((t,i) => t.classList.toggle('active',(i===0&&tab==='login')||(i===1&&tab==='signup')))
    document.getElementById('an-login-form').style.display = tab==='login'?'':'none'
    document.getElementById('an-signup-form').style.display = tab==='signup'?'':'none'
    document.getElementById('an-auth-title').textContent = tab==='login'?'Connexion':'Inscription'
    document.getElementById('an-auth-err').classList.remove('on')
  }
  _authErr(msg) { const e = document.getElementById('an-auth-err'); e.textContent = msg; e.classList.add('on') }

  async googleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: 'https://newsporto.fr' } })
    if (error) this._authErr(error.message)
  }

  async login() {
    const btn = document.getElementById('an-login-btn')
    const email = document.getElementById('an-login-email').value.trim()
    const pwd   = document.getElementById('an-login-pwd').value
    if (!email || !pwd) return this._authErr('Remplis tous les champs')
    btn.disabled = true; btn.textContent = 'Connexion...'
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pwd })
      if (error) throw error
      this.closeAuth()
    } catch(e) { this._authErr(e.message.includes('Invalid') ? 'Email ou mot de passe incorrect' : e.message) }
    finally { btn.disabled = false; btn.textContent = 'Se connecter →' }
  }

  async signup() {
    const btn = document.getElementById('an-signup-btn')
    const username = document.getElementById('an-signup-user').value.trim()
    const email    = document.getElementById('an-signup-email').value.trim()
    const pwd      = document.getElementById('an-signup-pwd').value
    const nl       = document.getElementById('an-signup-nl').checked
    if (!username || !email || !pwd) return this._authErr('Remplis tous les champs')
    if (pwd.length < 8) return this._authErr('Mot de passe trop court (min. 8 car.)')
    btn.disabled = true; btn.textContent = 'Création...'
    try {
      const { data, error } = await supabase.auth.signUp({ email, password: pwd })
      if (error) throw error
      // Check invite code in URL (?ref=CODE)
      const refCode = new URLSearchParams(window.location.search).get('ref')
      // Insert profile
      await supabase.from('profiles').insert({ id: data.user.id, username, display_name: username, newsletter: nl, points: 500, rank: 'Dragão' })
      await supabase.from('points_log').insert({ user_id: data.user.id, amount: 500, reason: 'welcome' })
      // Credit inviter
      if (refCode) {
        const { data: inviter } = await supabase.from('profiles').select('id, invite_count').eq('invite_code', refCode).single()
        if (inviter) {
          await supabase.from('profiles').update({ invite_count: (inviter.invite_count||0) + 1 }).eq('id', inviter.id)
          await supabase.from('notifications').insert({ user_id: inviter.id, type:'friend_request', from_user_id: data.user.id, ref_label: username + ' a rejoint via ton lien !' })
        }
      }
      if (nl) {
        try { await fetch('/api/subscribe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) }) } catch {}
        localStorage.setItem('np_email_subscribed', '1')
        const popup = document.getElementById('notif-popup')
        if (popup) popup.classList.remove('show')
      }
      // Auto sign in immediately after signup (no email confirmation needed)
      await supabase.auth.signInWithPassword({ email, password: pwd })
      this.closeAuth()
      this._toast('Bienvenue ! 500 pts offerts 🎁', 'ok')
    } catch(e) { this._authErr(e.message.includes('already') ? 'Email déjà utilisé' : e.message) }
    finally { btn.disabled = false; btn.textContent = 'Créer mon compte →' }
  }

  async logout() { await supabase.auth.signOut() }

  // PROFILE
  async saveProfile() {
    if (!this.u) return
    const display_name = document.getElementById('an-prof-name').value.trim()
    const bio = document.getElementById('an-prof-bio').value.trim()
    const pwd = document.getElementById('an-prof-pwd').value
    const err = document.getElementById('an-prof-err')
    err.classList.remove('on')
    try {
      const { error } = await supabase.from('profiles').update({ display_name, bio, updated_at: new Date().toISOString() }).eq('id', this.u.id)
      if (error) throw error
      if (pwd) { const { error: pe } = await supabase.auth.updateUser({ password: pwd }); if (pe) throw pe }
      // Reload profile and force nav update
      const { data } = await supabase.from('profiles').select('*').eq('id', this.u.id).single()
      if (data) { this.p = data; this._updateNav() }
      this._toast('Profil mis à jour ✓', 'ok')
      // Clear password field
      const pwdEl = document.getElementById('an-prof-pwd'); if (pwdEl) pwdEl.value = ''
    } catch(e) { err.textContent = e.message; err.classList.add('on') }
  }

  // ── CROPPER ──
  _cropState = { x:0, y:0, scale:1, dragging:false, startX:0, startY:0, imgW:0, imgH:0, blob:null }

  openCropModal(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = document.getElementById('an-crop-img')
      const wrap = document.getElementById('an-crop-wrap')
      img.onload = () => {
        const wrapW = 300, wrapH = 300
        const ratio = Math.max(wrapW / img.naturalWidth, wrapH / img.naturalHeight)
        this._cropState = { x:0, y:0, scale:ratio, minScale:ratio, dragging:false, startX:0, startY:0, imgW:img.naturalWidth, imgH:img.naturalHeight, file }
        img.style.width = img.naturalWidth + 'px'
        img.style.height = img.naturalHeight + 'px'
        this._applyCropTransform()
        document.getElementById('an-crop-zoom-range').min = ratio
        document.getElementById('an-crop-zoom-range').max = ratio * 4
        document.getElementById('an-crop-zoom-range').step = ratio * 0.01
        document.getElementById('an-crop-zoom-range').value = ratio
      }
      img.src = e.target.result
      document.getElementById('an-crop-modal').classList.add('open')
      this._initCropEvents()
    }
    reader.readAsDataURL(file)
  }

  _applyCropTransform() {
    const s = this._cropState
    const img = document.getElementById('an-crop-img')
    const wrap = document.getElementById('an-crop-wrap')
    // Clamp so image always covers the 300x300 wrap
    const scaledW = s.imgW * s.scale, scaledH = s.imgH * s.scale
    s.x = Math.min(0, Math.max(300 - scaledW, s.x))
    s.y = Math.min(0, Math.max(300 - scaledH, s.y))
    img.style.transform = `translate(${s.x}px,${s.y}px) scale(${s.scale})`
    img.style.transformOrigin = '0 0'
  }

  _initCropEvents() {
    const wrap = document.getElementById('an-crop-wrap')
    const zoom = document.getElementById('an-crop-zoom-range')
    // Remove old listeners by cloning
    const nw = wrap.cloneNode(true); wrap.parentNode.replaceChild(nw, wrap)
    const nz = zoom.cloneNode(true); zoom.parentNode.replaceChild(nz, zoom)
    const newWrap = document.getElementById('an-crop-wrap')
    const newZoom = document.getElementById('an-crop-zoom-range')
    // Mouse drag
    newWrap.addEventListener('mousedown', (e) => { this._cropState.dragging=true; this._cropState.startX=e.clientX-this._cropState.x; this._cropState.startY=e.clientY-this._cropState.y; e.preventDefault() })
    document.addEventListener('mousemove', (e) => { if(!this._cropState.dragging) return; this._cropState.x=e.clientX-this._cropState.startX; this._cropState.y=e.clientY-this._cropState.startY; this._applyCropTransform() })
    document.addEventListener('mouseup', () => { this._cropState.dragging=false })
    // Touch drag
    newWrap.addEventListener('touchstart', (e) => { const t=e.touches[0]; this._cropState.dragging=true; this._cropState.startX=t.clientX-this._cropState.x; this._cropState.startY=t.clientY-this._cropState.y }, {passive:true})
    newWrap.addEventListener('touchmove', (e) => { if(!this._cropState.dragging) return; const t=e.touches[0]; this._cropState.x=t.clientX-this._cropState.startX; this._cropState.y=t.clientY-this._cropState.startY; this._applyCropTransform() }, {passive:true})
    newWrap.addEventListener('touchend', () => { this._cropState.dragging=false })
    // Zoom
    newZoom.addEventListener('input', (e) => { this._cropState.scale=parseFloat(e.target.value); this._applyCropTransform() })
  }

  closeCrop() {
    document.getElementById('an-crop-modal').classList.remove('open')
    document.getElementById('an-avatar-input').value = ''
  }

  async confirmCrop() {
    const s = this._cropState
    const img = document.getElementById('an-crop-img')
    const canvas = document.createElement('canvas')
    canvas.width = 300; canvas.height = 300
    const ctx = canvas.getContext('2d')
    ctx.beginPath(); ctx.arc(150,150,150,0,Math.PI*2); ctx.clip()
    ctx.drawImage(img, s.x, s.y, s.imgW * s.scale, s.imgH * s.scale)
    canvas.toBlob(async (blob) => {
      this.closeCrop()
      await this._doUploadBlob(blob)
    }, 'image/jpeg', 0.9)
  }

  async uploadAvatar(input) {
    const file = input.files[0]; if (!file || !this.u) return
    if (file.size > 10*1024*1024) { this._toast('Image trop lourde (max 10MB)', 'err'); return }
    this.openCropModal(file)
  }

  async _doUploadBlob(blob) {
    try {
      const path = `${this.u.id}/avatar.jpg`
      const { error } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
      if (error) throw error
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      // Cache-bust
      const url = data.publicUrl + '?t=' + Date.now()
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', this.u.id)
      if (this.p) this.p.avatar_url = url
      const profAv = document.getElementById('an-prof-av'); if (profAv) profAv.innerHTML = `<img src="${url}">`
      this._updateNav()
      this._toast('Photo mise à jour ✓', 'ok')
    } catch(e) { this._toast('Erreur upload: ' + e.message, 'err') }
  }

  // NOTIFS
  async _checkNotifs() {
    if (!this.u) return
    const { data } = await supabase.from('notifications').select('id').eq('user_id', this.u.id).eq('read', false)
    const n = data?.length || 0
    const dot = document.getElementById('an-notif-dot'); if (dot) dot.classList.toggle('on', n > 0)
    // Pulse sur le bouton profil
    const triggerBtn = document.getElementById('an-trigger-btn')
    if (triggerBtn) triggerBtn.classList.toggle('has-notif', n > 0)
    // Badge count sur l'onglet Notifs
    const tdot = document.getElementById('tab-dot-notifs')
    if (tdot) {
      tdot.classList.toggle('on', n > 0)
      // Remplace le petit point par un badge avec le nombre
      const tabNotifs = document.querySelector('.an-tab[data-tab="notifs"]')
      if (tabNotifs) {
        let countEl = tabNotifs.querySelector('.an-tab-notif-count')
        if (n > 0) {
          if (!countEl) { countEl = document.createElement('span'); countEl.className = 'an-tab-notif-count'; tabNotifs.appendChild(countEl) }
          countEl.textContent = n > 99 ? '99+' : n
        } else {
          countEl?.remove()
        }
      }
    }
    // friend requests
    const { data: fr } = await supabase.from('friendships').select('id').eq('addressee_id', this.u.id).eq('status','pending')
    const frdot = document.getElementById('tab-dot-amis'); if (frdot) frdot.classList.toggle('on', (fr?.length||0) > 0)
  }

  async _loadNotifs() {
    if (!this.u) return
    const { data } = await supabase.from('notifications')
      .select('*, from_user:from_user_id(username, display_name)')
      .eq('user_id', this.u.id).order('created_at', { ascending: false }).limit(30)
    const el = document.getElementById('an-notif-list'); if (!el) return
    if (!data?.length) { el.innerHTML = '<div class="an-empty">Aucune notification</div>'; return }
    const icons = { reply:'💬', like:'❤️', best_answer:'✅', friend_request:'👋', friend_accepted:'🤝', bet_won:'🏆', bet_lost:'💸', mp:'✉️', badge_unlocked:'🎖️', rank_available:'⬆️', prono_won:'🏆', prono_lost:'💸', daily_streak:'🔥', level_up:'⬆️', rival_challenge:'⚔️' }
    const label = (n) => {
      const from = n.from_user?.display_name || n.from_user?.username || '?'
      const map = {
        reply: `<strong>${from}</strong> a répondu à ton thread`,
        like: `<strong>${from}</strong> a liké ta réponse`,
        best_answer: `Ta réponse a été marquée ✅ meilleure réponse`,
        friend_request: `<strong>${from}</strong> t'a envoyé une demande d'ami`,
        friend_accepted: `<strong>${from}</strong> a accepté ta demande d'ami`,
        bet_won: `🏆 Tu as gagné ton pari sur <strong>${n.ref_label||'un match'}</strong>`,
        bet_lost: `💸 Tu as perdu ton pari sur <strong>${n.ref_label||'un match'}</strong>`,
        mp: `<strong>${from}</strong> t'a envoyé un message`,
        badge_unlocked: `🎖️ Nouveau badge débloqué : <strong>${n.ref_label||'badge'}</strong>`,
        rank_available: `⬆️ Tu peux acheter le rang <strong>${n.ref_label||''}</strong> !`,
        prono_won: `🏆 Pronostic gagné sur <strong>${n.ref_label||'un match'}</strong>`,
        prono_lost: `💸 Pronostic perdu sur <strong>${n.ref_label||'un match'}</strong>`,
        daily_streak: `🔥 Streak J${n.ref_label?.split(' ')?.[1]||''} : ${n.ref_label||''}`,
        level_up: `⬆️ Niveau supérieur ! ${n.ref_label||''}`,
        rival_challenge: `⚔️ <strong>${from}</strong> t'a lancé un défi de rivalité !`,
      }
      return map[n.type] || n.type
    }
    el.innerHTML = data.map(n => {
      const t = new Date(n.created_at).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})
      return `<div class="an-notif-item${n.read?'':' unread'}" onclick="AN.clickNotif(${n.id},'${n.type}','${n.ref_id||''}')">
        <div class="an-notif-icon">${icons[n.type]||'🔔'}</div>
        <div class="an-notif-body">
          <div class="an-notif-txt">${label(n)}</div>
          ${n.ref_label?`<div class="an-notif-sub">"${n.ref_label.substring(0,50)}"</div>`:''}
        </div>
        <div class="an-notif-time">${t}</div>
      </div>`
    }).join('')
  }

  async clickNotif(id, type, refId) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    this._checkNotifs()
    if (['reply','like','best_answer'].includes(type) && refId) window.location.href = `forum.html#thread-${refId}`
    else if (type === 'friend_request') this.tabTo('amis')
    else if (type === 'mp') this.tabTo('mp')
    else if (type === 'rank_available') this.tabTo('rangs')
    else if (type === 'badge_unlocked') this.tabTo('badges')
    else if (type === 'level_up') this.tabTo('profil')
    else if (['prono_won','prono_lost','bet_won','bet_lost'].includes(type)) window.location.href = 'pronostics.html'
  }

  async markAllRead() {
    if (!this.u) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', this.u.id)
    this._checkNotifs(); this._loadNotifs()
  }

  _subscribeNotifs() {
    // Remove existing channel if any
    if (this._notifChannel) { try { supabase.removeChannel(this._notifChannel) } catch {} }

    this._notifChannel = supabase.channel('notifs-' + this.u.id)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'notifications', filter:`user_id=eq.${this.u.id}` }, (payload) => {
        this._checkNotifs()
        const n = payload.new
        const msgs = {
          reply: '💬 Quelqu\'un a répondu à ton thread',
          like: '❤️ Quelqu\'un a liké ta réponse',
          best_answer: '✅ Meilleure réponse ! +10 pts',
          friend_request: '👋 Nouvelle demande d\'ami',
          friend_accepted: '🤝 Demande acceptée !',
          bet_won: '🏆 Pari gagné !',
          bet_lost: '💸 Pari perdu',
          mp: '✉️ Nouveau message',
          badge_unlocked: `🎖️ Badge débloqué : ${n.ref_label||''}`,
          rank_available: `⬆️ Rang disponible : ${n.ref_label||''}`,
          prono_won: `🏆 Pronostic gagné !`,
          prono_lost: `💸 Pronostic perdu`,
          daily_streak: `🔥 Streak connexion : ${n.ref_label||''}`,
          level_up: `⬆️ Niveau supérieur : ${n.ref_label||''}`,
        }
        this._toast(msgs[n.type] || '🔔 Notification', n.type?.includes('won')||n.type?.includes('badge')||n.type?.includes('rank') ? 'ok' : '')
        if (document.getElementById('an-sec-notifs')?.classList.contains('active')) this._loadNotifs()
      })
      .subscribe((status, err) => {
        // Auto-reconnect si le channel tombe
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setTimeout(() => { if (this.u) this._subscribeNotifs() }, 3000)
        }
      })

    // Polling fallback toutes les 30s pour ne rien rater
    if (this._notifPollInterval) clearInterval(this._notifPollInterval)
    this._notifPollInterval = setInterval(() => {
      if (this.u) this._checkNotifs()
    }, 30000)
  }

  _subscribePoints() {
    supabase.channel('pts-' + this.u.id)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'profiles', filter:`id=eq.${this.u.id}` }, async payload => {
        const p = payload.new
        const prevPoints = this.p?.points || 0
        if (this.p) { this.p.points = p.points; this.p.rank = p.rank; this.p.xp = p.xp; this.p.level = p.level }
        this._updateNav()
        const pp = document.getElementById('an-pill-pts'); if (pp) pp.textContent = `${p.points} pts`
        const hp = document.getElementById('an-head-pts'); if (hp) hp.textContent = `${p.points} pts`
        window.dispatchEvent(new CustomEvent('points-updated', { detail: { points: p.points, rank: p.rank } }))
        // Notif si rang devient accessible
        for (const r of RANKS) {
          if (r.cost > 0 && prevPoints < r.cost && p.points >= r.cost && p.rank !== r.id) {
            await supabase.from('notifications').insert({ user_id: this.u.id, type: 'rank_available', ref_label: r.id })
            break
          }
        }
        // Check badges débloqués
        await this._checkNewBadges(p)
      }).subscribe()
  }

  async _checkNewBadges(updatedProfile) {
    if (!this.u) return
    const stats = await this._loadBadgeStats()
    const profile = { ...(updatedProfile || this.p), ...stats }
    const nonPres = this._BADGES.filter(b => b.id !== 'president')
    profile._allOtherBadges = nonPres.every(b => b.req(profile))
    const prevUnlocked = new Set(this.p?._unlockedBadges || [])
    const nowUnlocked = this._BADGES.filter(b => b.req(profile)).map(b => b.id)
    for (const id of nowUnlocked) {
      if (!prevUnlocked.has(id)) {
        const badge = this._BADGES.find(b => b.id === id)
        await supabase.from('notifications').insert({ user_id: this.u.id, type: 'badge_unlocked', ref_label: badge?.label || id })
      }
    }
    if (this.p) this.p._unlockedBadges = nowUnlocked
  }

  // AMIS
  async _loadFriends() {
    if (!this.u) return
    const list = document.getElementById('an-friends-list'); if (!list) return
    list.innerHTML = '<div class="an-empty">Chargement...</div>'
    try {
      const friends = await getFriends(this.u.id)
      const { data: pending } = await supabase.from('friendships').select('id, requester:requester_id(id,username,display_name,avatar_url,rank)').eq('addressee_id', this.u.id).eq('status','pending')
      // Load all users to suggest
      const friendIds = new Set(friends.map(f => f.id))
      const { data: allUsers } = await supabase.from('profiles').select('id,username,display_name,avatar_url,rank').neq('id', this.u.id).order('points', { ascending: false }).limit(30)
      const suggestions = (allUsers || []).filter(u => !friendIds.has(u.id))
      let html = ''
      if (pending?.length) {
        html += `<div class="an-row-label">Demandes reçues (${pending.length})</div>`
        html += pending.map(f => `<div class="an-friend-row">
          <div class="an-friend-av" style="cursor:pointer" onclick="AN.openProfileCard('${f.requester.id}',this)">${f.requester.avatar_url?`<img src="${f.requester.avatar_url}">`:(f.requester.display_name||f.requester.username||'?')[0].toUpperCase()}</div>
          <div class="an-friend-info" style="cursor:pointer" onclick="AN.openProfileCard('${f.requester.id}',this)"><div class="an-friend-name">${f.requester.display_name||f.requester.username}</div><div class="an-friend-sub">${f.requester.rank}</div></div>
          <div class="an-friend-acts">
            <button class="an-micro-btn green" onclick="AN.acceptFriend(${f.id})">✓</button>
            <button class="an-micro-btn" onclick="AN.declineFriend(${f.id})">✕</button>
          </div>
        </div>`).join('')
        html += '<div class="an-divider"></div>'
      }
      if (friends.length) {
        html += `<div class="an-row-label">Mes amis (${friends.length})</div>`
        html += friends.map(f => `<div class="an-friend-row">
          <div class="an-friend-av" style="cursor:pointer" onclick="AN.openProfileCard('${f.id}',this)">${f.avatar_url?`<img src="${f.avatar_url}">`:(f.display_name||f.username||'?')[0].toUpperCase()}</div>
          <div class="an-friend-info" style="cursor:pointer" onclick="AN.openProfileCard('${f.id}',this)"><div class="an-friend-name">${f.display_name||f.username}</div><div class="an-friend-sub">${f.rank}</div></div>
          <div class="an-friend-acts"><button class="an-micro-btn blue" onclick="AN.openChat('${f.id}','${(f.display_name||f.username).replace(/'/g,"&#39;")}')">MP</button></div>
        </div>`).join('')
        html += '<div class="an-divider"></div>'
      }
      if (suggestions.length) {
        html += `<div class="an-row-label">Membres (${suggestions.length})</div>`
        html += suggestions.map(u => `<div class="an-friend-row">
          <div class="an-friend-av" style="cursor:pointer" onclick="AN.openProfileCard('${u.id}',this)">${u.avatar_url?`<img src="${u.avatar_url}">`:(u.display_name||u.username||'?')[0].toUpperCase()}</div>
          <div class="an-friend-info" style="cursor:pointer" onclick="AN.openProfileCard('${u.id}',this)"><div class="an-friend-name">${u.display_name||u.username}</div><div class="an-friend-sub">${u.rank}</div></div>
          <div class="an-friend-acts"><button class="an-micro-btn blue" onclick="AN.addFriend('${u.id}')">+ Ajouter</button></div>
        </div>`).join('')
      }
      list.innerHTML = html || '<div class="an-empty">Aucun membre</div>'
    } catch { list.innerHTML = '<div class="an-empty">Erreur de chargement</div>' }
  }

  async searchUsers(q) {
    if (!q || q.length < 2) { this._loadFriends(); return }
    const { data } = await supabase.from('profiles').select('id,username,display_name,avatar_url,rank').ilike('username',`%${q}%`).neq('id', this.u.id).limit(10)
    const list = document.getElementById('an-friends-list'); if (!list) return
    if (!data?.length) { list.innerHTML = '<div class="an-empty">Aucun résultat</div>'; return }
    list.innerHTML = `<div class="an-row-label">Résultats</div>` + data.map(u => `<div class="an-friend-row">
      <div class="an-friend-av" style="cursor:pointer" onclick="AN.openProfileCard('${u.id}',this)">${u.avatar_url?`<img src="${u.avatar_url}">`:(u.display_name||u.username||'?')[0].toUpperCase()}</div>
      <div class="an-friend-info" style="cursor:pointer" onclick="AN.openProfileCard('${u.id}',this)"><div class="an-friend-name">${u.display_name||u.username}</div><div class="an-friend-sub">${u.rank}</div></div>
      <div class="an-friend-acts"><button class="an-micro-btn blue" onclick="AN.addFriend('${u.id}')">+ Ajouter</button></div>
    </div>`).join('')
  }

  async addFriend(id) {
    try {
      await sendFriendRequest(this.u.id, id)
      await supabase.from('notifications').insert({ user_id: id, type:'friend_request', from_user_id: this.u.id })
      this._toast('Demande envoyée !', 'ok')
    } catch { this._toast('Déjà envoyée', '') }
  }
  async acceptFriend(id) {
    await acceptFriendRequest(id)
    const { data: f } = await supabase.from('friendships').select('requester_id').eq('id', id).single()
    if (f) await supabase.from('notifications').insert({ user_id: f.requester_id, type:'friend_accepted', from_user_id: this.u.id })
    this._checkNotifs(); this._loadFriends()
  }
  async declineFriend(id) { await supabase.from('friendships').delete().eq('id', id); this._checkNotifs(); this._loadFriends() }

  // MP
  async _loadConvList() {
    if (!this.u) return
    const friends = await getFriends(this.u.id)
    const convView = document.getElementById('an-conv-view')
    const convList = document.getElementById('an-conv-list')
    if (!convList) return
    if (convView) { convView.style.display = ''; }
    const chatView = document.getElementById('an-chat-view')
    if (chatView) chatView.style.display = 'none'
    if (!friends.length) { convList.innerHTML = '<div class="an-empty">Ajoute des amis pour écrire</div>'; return }
    convList.innerHTML = '<div class="an-row-label">Conversations</div>' + friends.map(f => `<div class="an-conv-row" onclick="AN.openChat('${f.id}','${(f.display_name||f.username).replace(/'/g,"&#39;")}')">
      <div class="an-conv-av">${f.avatar_url?`<img src="${f.avatar_url}">`:(f.display_name||f.username||'?')[0].toUpperCase()}</div>
      <div><div class="an-conv-name">${f.display_name||f.username}</div><div class="an-conv-preview">${f.rank}</div></div>
    </div>`).join('')
  }

  async openChat(friendId, friendName) {
    this.mpFriend = { id: friendId, name: friendName }
    // Switch to MP tab first (without triggering _loadConvList)
    document.querySelectorAll('.an-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === 'mp'))
    document.querySelectorAll('.an-section').forEach(s => s.classList.toggle('active', s.id === 'an-sec-mp'))
    // Then show chat view
    document.getElementById('an-conv-view').style.display = 'none'
    const cv = document.getElementById('an-chat-view')
    cv.style.display = 'flex'; cv.style.flexDirection = 'column'
    document.getElementById('an-chat-name').textContent = friendName
    await this._loadMsgs()
    await markMessagesRead(friendId, this.u.id)
    if (this.mpCh) supabase.removeChannel(this.mpCh)
    this.mpCh = supabase.channel('mp-'+friendId)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages', filter:`receiver_id=eq.${this.u.id}` }, () => this._loadMsgs())
      .subscribe()
  }

  mpSubTab(tab, btn) {
    document.querySelectorAll('#an-sec-mp .an-admin-sub-tab').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    const convs = document.getElementById('an-mp-convs')
    const grps = document.getElementById('an-mp-groupes')
    if (tab === 'convs') {
      if (convs) { convs.classList.add('active'); convs.style.display = 'flex' }
      if (grps) { grps.classList.remove('active'); grps.style.display = 'none' }
    } else {
      if (grps) { grps.classList.add('active'); grps.style.display = 'flex' }
      if (convs) { convs.classList.remove('active'); convs.style.display = 'none' }
    }
  }

  // ── GROUPES ──
  async _loadGroups() {
    const el = document.getElementById('an-groups-list'); if (!el || !this.u) return
    el.innerHTML = '<div class="an-empty">Chargement...</div>'
    try {
      const { data, error } = await supabase.from('group_members')
        .select('group:group_id(id, name, created_at), last_read_at')
        .eq('user_id', this.u.id)
        .order('group(created_at)', { ascending: false })
      if (error) { el.innerHTML = '<div class="an-empty">Groupes non disponibles</div>'; return }
      if (!data?.length) { el.innerHTML = '<div class="an-empty">Aucun groupe — crée-en un !</div>'; return }
      el.innerHTML = data.map(r => {
        const g = r.group
        return `<div class="an-conv-row" onclick="AN.openGroupChat(${g.id},'${g.name.replace(/'/g,"&#39;")}')">
          <div class="an-conv-av" style="background:rgba(240,165,0,0.15);border-color:rgba(240,165,0,0.4);color:#f0a500;font-size:16px">👥</div>
          <div><div class="an-conv-name">${g.name}</div><div class="an-conv-preview">Groupe de discussion</div></div>
        </div>`
      }).join('')
    } catch(e) { el.innerHTML = '<div class="an-empty">Groupes non disponibles</div>' }
  }

  showCreateGroup() {
    document.getElementById('an-group-list-view').style.display = 'none'
    document.getElementById('an-group-create-view').style.display = 'block'
    document.getElementById('an-group-chat-view').style.display = 'none'
    // Load friends to pick
    getFriends(this.u.id).then(friends => {
      const el = document.getElementById('an-group-friends-pick'); if (!el) return
      if (!friends.length) { el.innerHTML = '<div class="an-empty" style="padding:8px 0">Ajoute des amis d\'abord</div>'; return }
      el.innerHTML = friends.map(f => `
        <label style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer">
          <input type="checkbox" value="${f.id}" style="accent-color:#003DA5;width:14px;height:14px">
          <div class="an-friend-av" style="width:24px;height:24px;font-size:10px">${f.avatar_url?`<img src="${f.avatar_url}">`:(f.display_name||f.username||'?')[0]}</div>
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.5px;color:#fff">${f.display_name||f.username}</span>
        </label>`).join('')
    })
  }

  hideCreateGroup() {
    document.getElementById('an-group-list-view').style.display = ''
    document.getElementById('an-group-create-view').style.display = 'none'
  }

  async createGroup() {
    if (!this.u) return
    const name = document.getElementById('an-group-name')?.value.trim()
    if (!name) { this._toast('Nom du groupe requis', 'err'); return }
    const checked = [...document.querySelectorAll('#an-group-friends-pick input:checked')].map(i => i.value)
    if (!checked.length) { this._toast('Sélectionne au moins un ami', 'err'); return }
    const { data: group, error } = await supabase.from('groups').insert({ name, created_by: this.u.id }).select().single()
    if (error) { this._toast(error.message, 'err'); return }
    // Ajouter le créateur + les membres
    const members = [this.u.id, ...checked].map(uid => ({ group_id: group.id, user_id: uid }))
    await supabase.from('group_members').insert(members)
    document.getElementById('an-group-name').value = ''
    this._toast(`Groupe "${name}" créé ! 🎉`, 'ok')
    this.hideCreateGroup()
    this._loadGroups()
  }

  async openGroupChat(groupId, groupName) {
    this.currentGroup = { id: groupId, name: groupName }
    document.getElementById('an-group-list-view').style.display = 'none'
    document.getElementById('an-group-create-view').style.display = 'none'
    const cv = document.getElementById('an-group-chat-view')
    cv.style.display = 'flex'
    document.getElementById('an-group-chat-name').textContent = groupName
    // Compter membres
    const { count } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', groupId)
    const countEl = document.getElementById('an-group-members-count')
    if (countEl) countEl.textContent = `${count} membres`
    await this._loadGroupMsgs()
    // Realtime
    if (this.groupCh) supabase.removeChannel(this.groupCh)
    this.groupCh = supabase.channel('group-' + groupId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` }, () => this._loadGroupMsgs())
      .subscribe()
  }

  backToGroupList() {
    if (this.groupCh) { supabase.removeChannel(this.groupCh); this.groupCh = null }
    this.currentGroup = null
    document.getElementById('an-group-list-view').style.display = ''
    document.getElementById('an-group-chat-view').style.display = 'none'
    this._loadGroups()
  }

  async _loadGroupMsgs() {
    if (!this.currentGroup) return
    const { data } = await supabase.from('group_messages')
      .select('*, author:user_id(id, display_name, username, avatar_url, level)')
      .eq('group_id', this.currentGroup.id)
      .order('created_at', { ascending: true })
      .limit(80)
    const el = document.getElementById('an-group-msgs'); if (!el) return
    el.innerHTML = (data || []).map(m => {
      const a = m.author || {}
      const isMe = m.user_id === this.u.id
      const avHTML = a.avatar_url ? `<img src="${a.avatar_url}">` : (a.display_name||a.username||'?')[0].toUpperCase()
      const time = new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      return `<div class="an-msg ${isMe?'mine':'theirs'}" style="max-width:85%">
        ${!isMe ? `<div style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:2px">${a.display_name||a.username}</div>` : ''}
        ${m.content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}
        <span class="an-msg-time">${time}</span>
      </div>`
    }).join('')
    el.scrollTop = el.scrollHeight
  }

  async sendGroupMsg() {
    if (!this.u || !this.currentGroup) return
    const input = document.getElementById('an-group-input')
    const content = input?.value.trim()
    if (!content) return
    input.value = ''
    await supabase.from('group_messages').insert({ group_id: this.currentGroup.id, user_id: this.u.id, content })
  }

  backToConvList() { this._loadConvList(); this.mpFriend = null }

  async _loadMsgs() {
    if (!this.mpFriend) return
    const msgs = await getConversation(this.u.id, this.mpFriend.id)
    const c = document.getElementById('an-chat-msgs'); if (!c) return
    c.innerHTML = msgs.map(m => `<div class="an-msg ${m.sender_id===this.u.id?'mine':'theirs'}">${m.content}<span class="an-msg-time">${new Date(m.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span></div>`).join('')
    c.scrollTop = c.scrollHeight
  }

  async sendMsg() {
    const input = document.getElementById('an-chat-input')
    const content = input.value.trim(); if (!content || !this.mpFriend || !this.u) return
    input.value = ''
    await sendMessage(this.u.id, this.mpFriend.id, content)
    addXp(this.u.id, 2, 'mp_sent').catch(() => {})
    // Notif in-app
    await supabase.from('notifications').insert({ user_id: this.mpFriend.id, type:'mp', from_user_id: this.u.id })
    // Email notification (only if recipient not active on site — best effort)
    try {
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', this.mpFriend.id)
        .single()
      // Get email from auth (only available server-side, so we use a serverless function)
      const fromName = this.p?.display_name || this.p?.username || 'Un membre'
      const preview = content.length > 80 ? content.substring(0, 80) + '…' : content
      // Call our notify-mp API — it handles email lookup server-side
      fetch('/api/notify-mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: this.mpFriend.id,
          fromName,
          messagePreview: preview,
        })
      }).catch(() => {}) // fire and forget
    } catch {}
    await this._loadMsgs()
  }

  // RANGS
  _renderRanks() {
    if (!this.p) return
    const el = document.getElementById('an-rank-list'); if (!el) return
    const pts = document.getElementById('an-rangs-pts'); if (pts) pts.textContent = this.p.points
    const RANK_IMGS = {
      Supporter: 'https://eaiiesiouwqpwtxrebax.supabase.co/storage/v1/object/public/Badges/Rang/Supporter.png',
      Dragon:    'https://eaiiesiouwqpwtxrebax.supabase.co/storage/v1/object/public/Badges/Rang/dragon.png',
      Socio:     'https://eaiiesiouwqpwtxrebax.supabase.co/storage/v1/object/public/Badges/Rang/socio.png',
      Légende:   'https://eaiiesiouwqpwtxrebax.supabase.co/storage/v1/object/public/Badges/Rang/legende.png',
      Invicta:   'https://eaiiesiouwqpwtxrebax.supabase.co/storage/v1/object/public/Badges/Rang/invicta.png',
    }
    el.innerHTML = RANKS.map(r => {
      const isCurrent = this.p.rank === r.id
      const canAfford = this.p.points >= r.cost
      const img = RANK_IMGS[r.id]
      return `<div class="an-rank-row${isCurrent?' current':''}">
        <div class="an-rank-left">
          <img src="${img}" style="width:48px;height:48px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">
          <div><div class="an-rank-name" style="color:${r.color}">${r.id}</div><div class="an-rank-price">${r.cost===0?'Rang de départ':r.cost.toLocaleString('fr-FR')+' pts'}</div></div>
        </div>
        ${isCurrent
          ? `<button class="an-micro-btn" style="color:${r.color};border-color:${r.border}" disabled>Actuel</button>`
          : r.cost===0 ? ''
          : `<button class="an-micro-btn${canAfford?' blue':''}" ${!canAfford?'disabled':''} style="${canAfford?'':'opacity:.4'}" onclick="AN.buyRank('${r.id}',${r.cost})">${canAfford?'Acheter':'Insuffisant'}</button>`
        }
      </div>`
    }).join('')
  }

  async buyRank(rankId, cost) {
    if (!this.u || !this.p || this.p.points < cost) { this._toast('Pas assez de points', 'err'); return }
    try {
      const newPts = this.p.points - cost
      await supabase.from('profiles').update({ rank: rankId, points: newPts }).eq('id', this.u.id)
      await supabase.from('points_log').insert({ user_id: this.u.id, amount: -cost, reason: 'rank_purchase', ref_id: rankId })
      this.p.rank = rankId; this.p.points = newPts
      this._updateNav(); this._renderRanks()
      this._toast(`${rankId} obtenu ! 🎉`, 'ok')
    } catch(e) { this._toast(e.message, 'err') }
  }

  // ── ADMIN ──
  isAdmin() { return this.p?.role === 'admin' }

  adminSubTab(tab, btn) {
    document.querySelectorAll('.an-admin-sub-tab').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.an-admin-sub-content').forEach(c => c.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById(`an-admin-${tab}`).classList.add('active')
    if (tab === 'forum') this._loadAdminForum()
    if (tab === 'bets') this._loadAdminBets()
    if (tab === 'users') this._loadAdminUsers()
    if (tab === 'matches') this._loadAdminMatches()
  }

  async _loadAdminForum() {
    if (!this.isAdmin()) return
    const el = document.getElementById('an-admin-threads'); if (!el) return
    const { data } = await supabase.from('forum_threads')
      .select('id, title, category, reply_count, created_at, author:author_id(username, display_name)')
      .order('created_at', { ascending: false }).limit(20)
    if (!data?.length) { el.innerHTML = '<div class="an-empty">Aucun thread</div>'; return }
    el.innerHTML = data.map(t => `
      <div class="an-admin-row">
        <div class="an-admin-row-info">
          <div class="an-admin-row-title">${t.title.substring(0,40)}</div>
          <div class="an-admin-row-sub">${t.author?.display_name||t.author?.username||'?'} · ${t.reply_count} rép. · ${t.category}</div>
        </div>
        <div class="an-admin-acts">
          <button class="an-micro-btn red" onclick="AN.adminDeleteThread(${t.id})">✕</button>
        </div>
      </div>`).join('')
  }

  async adminDeleteThread(id) {
    if (!this.isAdmin() || !confirm('Supprimer ce thread ?')) return
    await supabase.from('forum_replies').delete().eq('thread_id', id)
    await supabase.from('forum_threads').delete().eq('id', id)
    this._toast('Thread supprimé', 'ok')
    this._loadAdminForum()
    if (window.loadThreads) window.loadThreads()
  }

  async adminDeleteReply(id) {
    if (!this.isAdmin() || !confirm('Supprimer cette réponse ?')) return
    await supabase.from('reply_likes').delete().eq('reply_id', id)
    await supabase.from('forum_replies').delete().eq('id', id)
    this._toast('Réponse supprimée', 'ok')
    if (window.loadThread) window.loadThread(window._currentThreadId)
    else if (window.loadThreads) window.loadThreads()
  }

  async adminDeleteMsg(id) {
    if (!this.isAdmin() || !confirm('Supprimer ce message ?')) return
    await supabase.from('chat_messages').delete().eq('id', id)
    this._toast('Message supprimé', 'ok')
  }

  // ── CUSTOM MATCHES ──
  async _loadAdminMatches() {
    if (!this.isAdmin()) return
    const el = document.getElementById('an-admin-matches-list'); if (!el) return
    const { data } = await supabase.from('custom_matches')
      .select('*').order('kickoff_at', { ascending: false }).limit(10)
    if (!data?.length) { el.innerHTML = '<div class="an-empty">Aucun match</div>'; return }
    el.innerHTML = data.map(m => {
      const isLive = m.status === 'live'
      const isDone = m.status === 'finished'
      const scoreStr = (m.score_home != null && m.score_away != null) ? `${m.score_home}-${m.score_away}` : '—'
      return `<div class="an-admin-row" style="flex-direction:column;align-items:stretch;gap:6px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div class="an-admin-row-info">
            <div class="an-admin-row-title">${m.home_team} vs ${m.away_team}</div>
            <div class="an-admin-row-sub">
              ${new Date(m.kickoff_at).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})} ·
              <span style="color:${isLive?'#00c87a':isDone?'rgba(255,255,255,0.3)':'#f0a500'}">${isLive?'🔴 EN COURS':isDone?'Terminé':'À venir'}</span>
              · Score: <b>${scoreStr}</b>
            </div>
          </div>
          <div class="an-admin-acts" style="flex-wrap:wrap;gap:4px">
            ${!isLive && !isDone ? `<button class="an-micro-btn green" onclick="AN.startCustomMatch(${m.id})">▶ Lancer</button>` : ''}
            ${isLive ? `<button class="an-micro-btn orange" onclick="AN.updateMatchScore(${m.id})">Score</button>
                        <button class="an-micro-btn" onclick="AN.addMatchEvent(${m.id})">Carton</button>
                        <button class="an-micro-btn red" onclick="AN.finishCustomMatch(${m.id})">Terminer</button>` : ''}
            ${!isDone ? `<button class="an-micro-btn red" style="opacity:0.5" onclick="AN.deleteCustomMatch(${m.id})">✕</button>` : ''}
          </div>
        </div>
        ${m.events?.length ? `<div style="padding:4px 0;font-family:'Barlow Condensed',sans-serif;font-size:10px;color:rgba(255,255,255,0.4);border-top:1px solid rgba(255,255,255,0.05)">
          ${m.events.map(e => `${e.type==='yellow'?'🟡':e.type==='red'?'🔴':'⚽'} ${e.player} ${e.minute ? e.minute+"'" : ''}`).join(' · ')}
        </div>` : ''}
      </div>`
    }).join('')
  }

  async createCustomMatch() {
    if (!this.isAdmin()) return
    const home = document.getElementById('an-m-home')?.value.trim()
    const away = document.getElementById('an-m-away')?.value.trim()
    const competition = document.getElementById('an-m-competition')?.value.trim() || 'Liga Portugal'
    const kickoff = document.getElementById('an-m-kickoff')?.value
    const closes = document.getElementById('an-m-closes')?.value
    const oddsWin = parseFloat(document.getElementById('an-m-odds-win')?.value) || 1.8
    const oddsDraw = parseFloat(document.getElementById('an-m-odds-draw')?.value) || 3.5
    const oddsLose = parseFloat(document.getElementById('an-m-odds-lose')?.value) || 4.5
    if (!home || !away) { this._toast('Noms des équipes requis', 'err'); return }
    if (!kickoff) { this._toast('Date de kick-off requise', 'err'); return }

    let homeUrl = null, awayUrl = null
    const homeFile = document.getElementById('an-m-home-img')?.files?.[0]
    const awayFile = document.getElementById('an-m-away-img')?.files?.[0]
    try {
      if (homeFile) {
        const ext = homeFile.name.split('.').pop().toLowerCase()
        const path = `home_${Date.now()}.${ext}`
        const { error: e1 } = await supabase.storage.from('match-logos').upload(path, homeFile, { upsert: true, contentType: homeFile.type })
        if (!e1) homeUrl = supabase.storage.from('match-logos').getPublicUrl(path).data.publicUrl
        else console.warn('home logo upload error:', e1.message)
      }
      if (awayFile) {
        const ext = awayFile.name.split('.').pop().toLowerCase()
        const path = `away_${Date.now()}.${ext}`
        const { error: e2 } = await supabase.storage.from('match-logos').upload(path, awayFile, { upsert: true, contentType: awayFile.type })
        if (!e2) awayUrl = supabase.storage.from('match-logos').getPublicUrl(path).data.publicUrl
        else console.warn('away logo upload error:', e2.message)
      }
    } catch(e) { console.warn('Logo upload error:', e) }

    const { error } = await supabase.from('custom_matches').insert({
      home_team: home, away_team: away, competition,
      kickoff_at: kickoff, closes_at: closes || kickoff,
      odds_win: oddsWin, odds_draw: oddsDraw, odds_lose: oddsLose,
      home_crest: homeUrl, away_crest: awayUrl,
      status: 'upcoming', score_home: null, score_away: null, events: []
    })
    if (error) { this._toast(error.message, 'err'); return }
    ;['an-m-home','an-m-away','an-m-kickoff','an-m-closes'].forEach(id => { const el = document.getElementById(id); if(el) el.value = '' })
    document.getElementById('an-m-home-img').value = ''
    document.getElementById('an-m-away-img').value = ''
    this._toast('Match créé ✅', 'ok')
    this._loadAdminMatches()
    window.dispatchEvent(new CustomEvent('custom-match-updated'))
  }

  async startCustomMatch(id) {
    if (!this.isAdmin()) return
    await supabase.from('custom_matches').update({ status: 'live', score_home: 0, score_away: 0 }).eq('id', id)
    this._toast('Match lancé 🔴', 'ok')
    this._loadAdminMatches()
    window.dispatchEvent(new CustomEvent('custom-match-updated'))
  }

  async updateMatchScore(id) {
    if (!this.isAdmin()) return
    const input = prompt('Score (format: 1-0) :')
    if (!input) return
    const parts = input.split('-')
    if (parts.length !== 2) { this._toast('Format invalide, ex: 2-1', 'err'); return }
    const sh = parseInt(parts[0]), sa = parseInt(parts[1])
    if (isNaN(sh) || isNaN(sa)) { this._toast('Chiffres invalides', 'err'); return }
    await supabase.from('custom_matches').update({ score_home: sh, score_away: sa }).eq('id', id)
    this._toast(`Score mis à jour : ${sh}-${sa}`, 'ok')
    this._loadAdminMatches()
    window.dispatchEvent(new CustomEvent('custom-match-updated'))
  }

  async addMatchEvent(id) {
    if (!this.isAdmin()) return
    const type = prompt('Type d\'événement (yellow / red / goal) :')?.toLowerCase()
    if (!['yellow','red','goal'].includes(type)) { this._toast('Type invalide', 'err'); return }
    const player = prompt('Nom du joueur :')?.trim()
    if (!player) return
    const minute = prompt('Minute (optionnel) :') || ''
    const { data: m } = await supabase.from('custom_matches').select('events').eq('id', id).single()
    const events = [...(m?.events || []), { type, player, minute }]
    await supabase.from('custom_matches').update({ events }).eq('id', id)
    this._toast(`${type === 'yellow' ? '🟡' : type === 'red' ? '🔴' : '⚽'} ${player} ajouté`, 'ok')
    this._loadAdminMatches()
    window.dispatchEvent(new CustomEvent('custom-match-updated'))
  }

  async finishCustomMatch(id) {
    if (!this.isAdmin() || !confirm('Terminer ce match et distribuer les gains ?')) return
    const { data: m } = await supabase.from('custom_matches').select('*').eq('id', id).single()
    if (!m) return
    // Déterminer résultat
    let result = null
    if (m.score_home != null && m.score_away != null) {
      if (m.score_home > m.score_away) result = 'win'
      else if (m.score_home < m.score_away) result = 'lose'
      else result = 'draw'
    } else {
      result = prompt('Résultat (win / draw / lose depuis la perspective domicile) :')?.toLowerCase()
      if (!['win','draw','lose'].includes(result)) { this._toast('Résultat invalide', 'err'); return }
    }
    await supabase.from('custom_matches').update({ status: 'finished' }).eq('id', id)
    // Payer les gagnants
    const oddsMap = { win: m.odds_win, draw: m.odds_draw, lose: m.odds_lose }
    const { data: entries } = await supabase.from('bets').select('*').eq('match_id', String(id)).eq('status', 'pending')
    for (const entry of entries || []) {
      if (entry.pick === result) {
        const gain = Math.floor(entry.stake * (oddsMap[result] || entry.multiplier || 2))
        const { data: prof } = await supabase.from('profiles').select('points').eq('id', entry.user_id).single()
        const newPts = (prof?.points || 0) + gain
        await supabase.from('profiles').update({ points: newPts }).eq('id', entry.user_id)
        await supabase.from('points_log').insert({ user_id: entry.user_id, amount: gain, reason: 'match_win', ref_id: String(id) })
        await supabase.from('notifications').insert({ user_id: entry.user_id, type: 'prono_won', from_user_id: this.u.id, ref_label: `${m.home_team} vs ${m.away_team} · +${gain} pts` })
        await supabase.from('bets').update({ status: 'won' }).eq('id', entry.id)
        addXp(entry.user_id, XP_REWARDS.bet_win, 'bet_win').catch(() => {})
        addWeeklyPoints(entry.user_id, gain).catch(() => {})
        // Rivalités : incrémenter le score du gagnant
        this._updateRivalScore(entry.user_id).catch(() => {})
      } else {
        await supabase.from('bets').update({ status: 'lost' }).eq('id', entry.id)
        await supabase.from('notifications').insert({ user_id: entry.user_id, type: 'prono_lost', from_user_id: this.u.id, ref_label: `${m.home_team} vs ${m.away_team}` })
      }
    }
    this._toast('Match terminé, gains distribués ✅', 'ok')
    this._loadAdminMatches()
    window.dispatchEvent(new CustomEvent('custom-match-updated'))
  }

  async deleteCustomMatch(id) {
    if (!this.isAdmin() || !confirm('Supprimer ce match ? (les mises seront remboursées)')) return
    const { data: entries } = await supabase.from('bets').select('*').eq('match_id', String(id)).eq('status', 'pending')
    for (const entry of entries || []) {
      const { data: prof } = await supabase.from('profiles').select('points').eq('id', entry.user_id).single()
      await supabase.from('profiles').update({ points: (prof?.points||0) + entry.stake }).eq('id', entry.user_id)
      await supabase.from('bets').update({ status: 'refunded' }).eq('id', entry.id)
    }
    await supabase.from('custom_matches').delete().eq('id', id)
    this._toast('Match supprimé, mises remboursées', 'ok')
    this._loadAdminMatches()
    window.dispatchEvent(new CustomEvent('custom-match-updated'))
  }

  async _loadAdminUsers(q = '') {
    if (!this.isAdmin()) return
    const el = document.getElementById('an-admin-users-list'); if (!el) return
    el.innerHTML = '<div class="an-empty">Chargement...</div>'
    let query = supabase.from('profiles').select('id, username, display_name, rank, points, role')
    if (q && q.length >= 2) query = query.ilike('username', `%${q}%`)
    else query = query.order('points', { ascending: false })
    const { data } = await query.limit(30)
    if (!data?.length) { el.innerHTML = '<div class="an-empty">Aucun résultat</div>'; return }
    const { data: bans } = await supabase.from('bans').select('user_id')
    const bannedIds = new Set((bans||[]).map(b => b.user_id))
    el.innerHTML = data.map(u => {
      const isBanned = bannedIds.has(u.id)
      const isMe = u.id === this.u?.id
      const isAdmin = u.role === 'admin'
      return `<div class="an-admin-row">
        <div class="an-admin-row-info">
          <div class="an-admin-row-title">${u.display_name||u.username} ${isAdmin?'<span class="an-admin-badge">ADMIN</span>':''} ${isBanned?'<span class="an-admin-badge" style="background:#f0a500">BANNI</span>':''}</div>
          <div class="an-admin-row-sub">${u.rank} · ${u.points} pts</div>
        </div>
        <div class="an-admin-acts" style="flex-wrap:wrap;gap:4px;justify-content:flex-end">
          <button class="an-micro-btn blue" onclick="AN.adminEditPoints('${u.id}','${u.display_name||u.username}',${u.points})">± Pts</button>
          ${!isMe ? (isAdmin
            ? `<button class="an-micro-btn orange" onclick="AN.adminDemote('${u.id}','${u.display_name||u.username}')">↓ Admin</button>`
            : `<button class="an-micro-btn green" onclick="AN.adminPromote('${u.id}','${u.display_name||u.username}')">↑ Admin</button>`
          ) : ''}
          ${!isMe ? (isBanned
            ? `<button class="an-micro-btn green" onclick="AN.adminUnban('${u.id}')">Débannir</button>`
            : `<button class="an-micro-btn red" onclick="AN.adminBan('${u.id}','${u.display_name||u.username}')">Bannir</button>`
          ) : ''}
        </div>
      </div>`
    }).join('')
  }

  async adminSearchUsers(q) {
    await this._loadAdminUsers(q)
  }

  async adminBan(userId, username) {
    if (!this.isAdmin()) return
    const reason = prompt(`Raison du bannissement de ${username} :`)
    if (reason === null) return
    await supabase.from('bans').upsert({ user_id: userId, banned_by: this.u.id, reason })
    this._toast(`${username} banni`, 'ok')
    this.adminSearchUsers(document.getElementById('an-admin-user-search')?.value || '')
  }

  async adminUnban(userId) {
    if (!this.isAdmin()) return
    await supabase.from('bans').delete().eq('user_id', userId)
    this._toast('Utilisateur débanni', 'ok')
    this.adminSearchUsers(document.getElementById('an-admin-user-search')?.value || '')
  }

  async adminPromote(userId, username) {
    if (!this.isAdmin()) return
    if (!confirm(`Promouvoir ${username} en admin ?`)) return
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId)
    this._toast(`${username} est maintenant admin ✅`, 'ok')
    this.adminSearchUsers(document.getElementById('an-admin-user-search')?.value || '')
  }

  async adminDemote(userId, username) {
    if (!this.isAdmin()) return
    if (!confirm(`Rétrograder ${username} (retirer les droits admin) ?`)) return
    await supabase.from('profiles').update({ role: 'user' }).eq('id', userId)
    this._toast(`${username} rétrogradé`, 'ok')
    this.adminSearchUsers(document.getElementById('an-admin-user-search')?.value || '')
  }

  async adminEditPoints(userId, username, currentPts) {
    if (!this.isAdmin()) return
    const input = prompt(`Points actuels de ${username} : ${currentPts}\nEntrer le montant à ajouter (négatif pour enlever) :`)
    if (input === null) return
    const delta = parseInt(input)
    if (isNaN(delta)) { this._toast('Valeur invalide', 'err'); return }
    const newPts = Math.max(0, currentPts + delta)
    await supabase.from('profiles').update({ points: newPts }).eq('id', userId)
    await supabase.from('points_log').insert({ user_id: userId, amount: delta, reason: 'admin_edit', ref_id: null })
    this._toast(`${username} : ${delta > 0 ? '+' : ''}${delta} pts (total: ${newPts})`, 'ok')
    this.adminSearchUsers(document.getElementById('an-admin-user-search')?.value || '')
  }

  async _loadAdminBets() {
    if (!this.isAdmin()) return
    const el = document.getElementById('an-admin-custom-bets'); if (!el) return
    const { data } = await supabase.from('custom_bets').select('*').order('created_at', { ascending: false }).limit(10)
    if (!data?.length) { el.innerHTML = '<div class="an-empty">Aucun pari actif</div>'; return }
    el.innerHTML = data.map(b => `
      <div class="an-admin-row">
        <div class="an-admin-row-info">
          <div class="an-admin-row-title">${b.title.substring(0,40)}</div>
          <div class="an-admin-row-sub">${b.option_yes} ×${b.odds_yes} / ${b.option_no} ×${b.odds_no} · <span style="color:${b.status==='open'?'#00c87a':'#f0a500'}">${b.status}</span></div>
        </div>
        <div class="an-admin-acts">
          ${b.status==='open'?`
            <button class="an-micro-btn green" onclick="AN.resolveCustomBet(${b.id},'yes')">✓ Oui</button>
            <button class="an-micro-btn red" onclick="AN.resolveCustomBet(${b.id},'no')">✕ Non</button>
          `:''}
          <button class="an-micro-btn" onclick="AN.editCustomBetOdds(${b.id},${b.odds_yes},${b.odds_no})">Cotes</button>
        </div>
      </div>`).join('')
  }

  async createCustomBet() {
    if (!this.isAdmin()) return
    const title = document.getElementById('an-cb-title')?.value.trim()
    const desc  = document.getElementById('an-cb-desc')?.value.trim()
    const optYes = document.getElementById('an-cb-yes')?.value.trim() || 'Oui'
    const optNo  = document.getElementById('an-cb-no')?.value.trim() || 'Non'
    const oddsYes = parseFloat(document.getElementById('an-cb-odds-yes')?.value) || 2.0
    const oddsNo  = parseFloat(document.getElementById('an-cb-odds-no')?.value) || 2.0
    const closesAt = document.getElementById('an-cb-closes')?.value || null
    if (!title) { this._toast('Titre requis', 'err'); return }
    const { error } = await supabase.from('custom_bets').insert({
      created_by: this.u.id, title, description: desc,
      option_yes: optYes, option_no: optNo,
      odds_yes: oddsYes, odds_no: oddsNo,
      closes_at: closesAt || null
    })
    if (error) { this._toast(error.message, 'err'); return }
    // Reset form
    ;['an-cb-title','an-cb-desc','an-cb-closes'].forEach(id => { const el = document.getElementById(id); if(el) el.value = '' })
    document.getElementById('an-cb-yes').value = 'Oui'
    document.getElementById('an-cb-no').value = 'Non'
    document.getElementById('an-cb-odds-yes').value = '2.0'
    document.getElementById('an-cb-odds-no').value = '2.0'
    this._toast('Pari lancé ! 🎲', 'ok')
    this._loadAdminBets()
    // Dispatch event so pronostics page can refresh
    window.dispatchEvent(new CustomEvent('custom-bet-created'))
  }

  async editCustomBetOdds(betId, currentYes, currentNo) {
    if (!this.isAdmin()) return
    const newYes = parseFloat(prompt(`Nouvelle cote OUI (actuelle: ${currentYes}) :`, currentYes))
    if (isNaN(newYes)) return
    const newNo = parseFloat(prompt(`Nouvelle cote NON (actuelle: ${currentNo}) :`, currentNo))
    if (isNaN(newNo)) return
    await supabase.from('custom_bets').update({ odds_yes: newYes, odds_no: newNo }).eq('id', betId)
    this._toast('Cotes mises à jour', 'ok')
    this._loadAdminBets()
    window.dispatchEvent(new CustomEvent('custom-bet-updated'))
  }

  async resolveCustomBet(betId, result) {
    if (!this.isAdmin()) return
    if (!confirm(`Résoudre ce pari : résultat = "${result}" ?`)) return
    const newStatus = result === 'yes' ? 'resolved_yes' : 'resolved_no'
    await supabase.from('custom_bets').update({ status: newStatus }).eq('id', betId)
    // Payer les gagnants
    const { data: entries } = await supabase.from('custom_bet_entries').select('*').eq('bet_id', betId).eq('status', 'pending')
    for (const entry of entries || []) {
      if (entry.pick === result) {
        const { data: prof } = await supabase.from('profiles').select('points').eq('id', entry.user_id).single()
        const newPts = (prof?.points || 0) + entry.potential_gain
        await supabase.from('profiles').update({ points: newPts }).eq('id', entry.user_id)
        await supabase.from('points_log').insert({ user_id: entry.user_id, amount: entry.potential_gain, reason: 'custom_bet_win', ref_id: String(betId) })
        await supabase.from('notifications').insert({ user_id: entry.user_id, type: 'prono_won', from_user_id: this.u.id, ref_label: `+${entry.potential_gain} pts` })
        await supabase.from('custom_bet_entries').update({ status: 'won' }).eq('id', entry.id)
        addXp(entry.user_id, XP_REWARDS.bet_win, 'custom_bet_win').catch(() => {})
        addWeeklyPoints(entry.user_id, entry.potential_gain).catch(() => {})
        this._updateRivalScore(entry.user_id).catch(() => {})
      } else {
        await supabase.from('custom_bet_entries').update({ status: 'lost' }).eq('id', entry.id)
        await supabase.from('notifications').insert({ user_id: entry.user_id, type: 'prono_lost', from_user_id: this.u.id, ref_label: `${entry.stake} pts perdus` })
      }
    }
    this._toast('Pari résolu, gains distribués ✅', 'ok')
    this._loadAdminBets()
    window.dispatchEvent(new CustomEvent('custom-bet-updated'))
  }



  // ── BADGES ──
  _BADGES = [
    { id:'cercle_restreint',  cat:'amis',        label:'Cercle Restreint',  desc:'Avoir 5 amis',              img:'amis/Cercle Restreint.png',        req: p => (p._friendCount||0) >= 5 },
    { id:'clan_du_dragon',    cat:'amis',        label:'Clan du Dragon',    desc:'Avoir 25 amis',             img:'amis/Clan du Dragon.png',          req: p => (p._friendCount||0) >= 25 },
    { id:'premier_compagnon', cat:'amis',        label:'Premier Compagnon', desc:'Avoir 1 ami',               img:'amis/Premier Compagnon.png',       req: p => (p._friendCount||0) >= 1 },
    { id:'roi_des_dragons',   cat:'amis',        label:'Roi des Dragons',   desc:'Avoir 100 amis',            img:'amis/Roi des dragons.png',         req: p => (p._friendCount||0) >= 100 },
    { id:'premier_disciple',  cat:'invitation', label:'Premier Disciple',  desc:'Parrainer 1 membre',        img:'invitation/Premier Disciple.png', req: p => (p.invite_count||0) >= 1 },
    { id:'mentor',            cat:'invitation', label:'Mentor',            desc:'Parrainer 5 membres',       img:'invitation/Mentor.png',           req: p => (p.invite_count||0) >= 5 },
    { id:'ultra',             cat:'invitation', label:'Ultra',             desc:'Parrainer 10 membres',      img:'invitation/Ultra.png',            req: p => (p.invite_count||0) >= 10 },
    { id:'grand_dragon',      cat:'invitation', label:'Grand Dragon',      desc:'Parrainer 25 membres',      img:'invitation/Grand Dragon.png',     req: p => (p.invite_count||0) >= 25 },
    { id:'empereur',          cat:'invitation', label:'Empereur',          desc:'Parrainer 50 membres',      img:'invitation/Empereur.png',         req: p => (p.invite_count||0) >= 50 },
    { id:'premiere_mise',     cat:'mises',       label:'Premiere Mise',     desc:'Reussir 1 pari',            img:'mises/Premiere Mise.png',          req: p => (p._wonBets||0) >= 1 },
    { id:'flambeur',          cat:'mises',       label:'Flambeur',          desc:'Reussir 10 paris',          img:'mises/Flambeur.png',               req: p => (p._wonBets||0) >= 10 },
    { id:'stratege',          cat:'mises',       label:'Stratege',          desc:'Reussir 50 paris',          img:'mises/Stratege.png',               req: p => (p._wonBets||0) >= 50 },
    { id:'roi_des_mises',     cat:'mises',       label:'Roi des Mises',     desc:'Reussir 500 paris',         img:'mises/Roi des Mises.png',          req: p => (p._wonBets||0) >= 500 },
    { id:'eveil_du_dragon',   cat:'reponses',    label:'Eveil du Dragon',   desc:'Poster 1 reponse',          img:'reponses/Eveuil du dragon.png',     req: p => (p._replyCount||0) >= 1 },
    { id:'souffle_naissant',  cat:'reponses',    label:'Souffle Naissant',  desc:'Poster 10 reponses',        img:'reponses/Souffle Naissant.png',    req: p => (p._replyCount||0) >= 10 },
    { id:'jeune_chasseur',    cat:'reponses',    label:'Jeune Chasseur',    desc:'Poster 20 reponses',        img:'reponses/Jeune Chasseur.png',      req: p => (p._replyCount||0) >= 20 },
    { id:'dragon_erudit',     cat:'reponses',    label:'Dragon Erudit',     desc:'Poster 50 reponses',        img:'reponses/Dragon erudit.png',       req: p => (p._replyCount||0) >= 50 },
    { id:'maitre_du_savoir',  cat:'reponses',    label:'Maitre du Savoir',  desc:'Poster 100 reponses',       img:'reponses/Maitre du Savoir.png',    req: p => (p._replyCount||0) >= 100 },
    { id:'sage_legendaire',   cat:'reponses',    label:'Sage Legendaire',   desc:'Poster 500 reponses',       img:'reponses/Sage legendaire.png',     req: p => (p._replyCount||0) >= 500 },
    { id:'tresorier',         cat:'richesse',    label:'Tresorier',         desc:'Avoir 1000 points',         img:'richesse/Tresorier.png',           req: p => (p.points||0) >= 1000 },
    { id:'president',         cat:'president',   label:'President',         desc:'Debloquer tous les badges', img:'president/President.png',          req: p => p._allOtherBadges },
  ]

  _badgeStats = null

  async _loadBadgeStats() {
    if (!this.u) return {}
    const [fc, wb, rc] = await Promise.all([
      supabase.from('friendships').select('*',{count:'exact',head:true}).or(`requester_id.eq.${this.u.id},addressee_id.eq.${this.u.id}`).eq('status','accepted'),
      supabase.from('bets').select('*',{count:'exact',head:true}).eq('user_id',this.u.id).eq('status','won'),
      supabase.from('forum_replies').select('*',{count:'exact',head:true}).eq('author_id',this.u.id),
    ])
    return { _friendCount: fc.count||0, _wonBets: wb.count||0, _replyCount: rc.count||0 }
  }

  async _renderBadges() {
    if (!this.u || !this.p) return
    const el = document.getElementById('an-badges-content'); if (!el) return
    el.innerHTML = '<div class="an-empty">Chargement...</div>'
    const stats = await this._loadBadgeStats()
    const profile = { ...this.p, ...stats }
    const nonPres = this._BADGES.filter(b => b.id !== 'president')
    profile._allOtherBadges = nonPres.every(b => b.req(profile))
    const unlocked = this._BADGES.filter(b => b.req(profile))
    const total = this._BADGES.length
    const selected = (this.p.badges_selected || []).filter(id => {
      const b = this._BADGES.find(x => x.id === id); return b && b.req(profile)
    })
    const encodeBadgePath = (p) => p.split('/').map(s => encodeURIComponent(s)).join('/')
    const BASE = 'https://eaiiesiouwqpwtxrebax.supabase.co/storage/v1/object/public/Badges/'
    const CATS = { amis:'Amis', invitation:'Invitations', mises:'Paris', reponses:'Reponses', richesse:'Richesse', president:'President' }
    const EMOJIS = { amis:'👥', invitation:'📨', mises:'🎲', reponses:'💬', richesse:'💰', president:'👑' }

    let html = ''
    // Progress
    html += `<div style="padding:14px 20px 8px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.3)">Progression</span>
        <span style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;color:#4d82d4">${unlocked.length}/${total}</span>
      </div>
      <div style="height:3px;background:rgba(255,255,255,0.08);border-radius:2px">
        <div style="height:100%;width:${Math.round(unlocked.length/total*100)}%;background:linear-gradient(90deg,#003DA5,#4d82d4);border-radius:2px"></div>
      </div>
    </div>`

    // Selected showcase
    html += `<div style="padding:8px 20px 12px;border-bottom:1px solid rgba(255,255,255,0.06)">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:8px">Affiches (max 3) · Clique pour selectionner</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${
        selected.length ? selected.map(id => {
          const b = this._BADGES.find(x => x.id === id)
          return b ? `<div style="position:relative"><img src="${BASE}${encodeBadgePath(b.img)}" style="width:44px;height:44px;border-radius:50%;border:2px solid #003DA5;object-fit:cover" title="${b.label}"><button onclick="AN._unselectBadge('${id}')" style="position:absolute;top:-3px;right:-3px;width:14px;height:14px;border-radius:50%;background:#e74c3c;border:none;color:#fff;font-size:8px;cursor:pointer;line-height:14px;text-align:center;padding:0">✕</button></div>` : ''
        }).join('') : `<span style="font-family:'Barlow Condensed',sans-serif;font-size:10px;letter-spacing:1px;color:rgba(255,255,255,0.2)">Aucun badge selectionne</span>`
      }</div>
    </div>`

    // Grid by category
    for (const [catKey, catLabel] of Object.entries(CATS)) {
      const catBadges = this._BADGES.filter(b => b.cat === catKey)
      html += `<div style="padding:10px 20px 2px"><span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.4)">${EMOJIS[catKey]} ${catLabel}</span></div>`
      html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:4px 20px 10px">`
      for (const b of catBadges) {
        const isUnlocked = b.req(profile)
        const isSel = selected.includes(b.id)
        const imgUrl = BASE + encodeBadgePath(b.img)
        html += `<div onclick="${isUnlocked?`AN._toggleBadge('${b.id}')`:''}" style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border:1px solid ${isSel?'#003DA5':isUnlocked?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.04)'};background:${isSel?'rgba(0,61,165,0.12)':'transparent'};cursor:${isUnlocked?'pointer':'default'};position:relative;transition:.15s" title="${b.desc}">
          <img src="${imgUrl}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;${!isUnlocked?'filter:grayscale(1) brightness(0.25)':''}">
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:7px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${isUnlocked?'#fff':'rgba(255,255,255,0.2)'};text-align:center;line-height:1.2">${b.label}</span>
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:6px;letter-spacing:.5px;color:${isUnlocked?'rgba(255,255,255,0.35)':'rgba(255,255,255,0.12)'};text-align:center;line-height:1.2">${b.desc}</span>
          ${isSel?'<div style="position:absolute;top:3px;right:3px;width:7px;height:7px;border-radius:50%;background:#003DA5"></div>':''}
          ${!isUnlocked?'<div style="position:absolute;top:3px;right:3px;font-size:9px">🔒</div>':''}
        </div>`
      }
      html += '</div>'
    }
    el.innerHTML = html
  }

  _toggleBadge(id) {
    const sel = (this.p.badges_selected||[]).slice()
    const idx = sel.indexOf(id)
    if (idx >= 0) { sel.splice(idx,1) }
    else { if (sel.length >= 3) { this._toast('Max 3 badges', 'err'); return }; sel.push(id) }
    this._saveBadgeSelection(sel)
  }

  _unselectBadge(id) { this._saveBadgeSelection((this.p.badges_selected||[]).filter(x=>x!==id)) }

  async _saveBadgeSelection(sel) {
    await supabase.from('profiles').update({ badges_selected: sel }).eq('id', this.u.id)
    if (this.p) this.p.badges_selected = sel
    this._renderBadges()
  }

  async _generateInviteLink() {
    if (!this.u || !this.p) return
    const code = this.p.invite_code || (this.u.id.substring(0,8))
    await supabase.from('profiles').update({ invite_code: code }).eq('id', this.u.id)
    if (this.p) this.p.invite_code = code
    const link = `https://newsporto.fr?ref=${code}`
    await navigator.clipboard.writeText(link).catch(()=>{})
    this._toast('Lien copie ! ' + link, 'ok')
  }

  // ── MINI FICHE PROFIL ──
  async openProfileCard(userId, anchorEl) {
    if (userId === this.u?.id) { this.togglePanel(); return } // soi-même → ouvrir le panel
    const card = document.getElementById('an-profile-card')
    if (!card) return

    // Charger le profil
    const { data: p } = await supabase.from('profiles').select('id,username,display_name,avatar_url,bio,rank,points,badges_selected').eq('id', userId).single()
    if (!p) return

    const rk = RANKS.find(r => r.id === p.rank) || RANKS[0]

    // Avatar — cliquable
    const av = document.getElementById('an-pcard-av')
    av.innerHTML = p.avatar_url ? `<img src="${p.avatar_url}" style="cursor:pointer" onclick="AN.openProfileCard('${userId}',this)">` : (p.display_name||p.username||'?')[0].toUpperCase()

    document.getElementById('an-pcard-name').textContent = p.display_name || p.username
    const rankEl = document.getElementById('an-pcard-rank')
    rankEl.textContent = `${rk.emoji} ${p.rank} · ${p.points} pts`
    rankEl.style.color = rk.color

    document.getElementById('an-pcard-bio').textContent = p.bio || ''

    // Badges sélectionnés (max 3)
    const badgesEl = document.getElementById('an-pcard-badges')
    const BASE = 'https://eaiiesiouwqpwtxrebax.supabase.co/storage/v1/object/public/Badges/'
    const encodeBadgePath = (path) => path.split('/').map(s => encodeURIComponent(s)).join('/')
    const sel = (p.badges_selected || []).slice(0, 3)
    if (sel.length) {
      const allBadges = this._BADGES || []
      badgesEl.innerHTML = sel.map(id => {
        const b = allBadges.find(x => x.id === id)
        return b ? `<img src="${BASE}${encodeBadgePath(b.img)}" style="width:40px;height:40px;border-radius:50%;border:1.5px solid rgba(0,61,165,0.5);object-fit:cover" title="${b.label}">` : ''
      }).join('')
    } else {
      badgesEl.innerHTML = '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:9px;letter-spacing:1px;color:rgba(255,255,255,0.2)">Aucun badge sélectionné</span>'
    }

    // Actions (seulement si connecté et pas soi-même)
    const actEl = document.getElementById('an-pcard-actions')
    if (this.u && this.u.id !== userId) {
      actEl.innerHTML = `
        <button class="an-pcard-btn primary" onclick="AN._pcardAddFriend('${userId}')">+ Ami</button>
        <button class="an-pcard-btn ghost" onclick="AN._pcardOpenMP('${userId}','${(p.display_name||p.username).replace(/'/g,"\\'")}')">Message</button>
        <button class="an-pcard-btn ghost" onclick="AN.challengeFriend('${userId}','${(p.display_name||p.username).replace(/'/g,"\\'")}');AN.closeProfileCard()" style="border-color:rgba(240,165,0,0.4);color:#f0a500">⚔️ Défier</button>
      `
    } else {
      actEl.innerHTML = ''
    }

    // Positionner la card près du clic
    card.classList.add('open')
    const rect = anchorEl ? anchorEl.getBoundingClientRect() : { bottom: 100, left: 100 }
    const cardW = 280
    let left = Math.min(rect.left, window.innerWidth - cardW - 16)
    let top = rect.bottom + 8
    if (top + 300 > window.innerHeight) top = rect.top - 300
    card.style.left = Math.max(8, left) + 'px'
    card.style.top = Math.max(8, top) + 'px'

    // Fermer au clic extérieur
    setTimeout(() => document.addEventListener('click', this._outsideCardClick = (e) => {
      if (!card.contains(e.target)) this.closeProfileCard()
    }), 50)
  }

  closeProfileCard() {
    document.getElementById('an-profile-card')?.classList.remove('open')
    document.removeEventListener('click', this._outsideCardClick)
  }

  async _pcardAddFriend(userId) {
    try {
      await sendFriendRequest(this.u.id, userId)
      await supabase.from('notifications').insert({ user_id: userId, type:'friend_request', from_user_id: this.u.id })
      this._toast('Demande envoyée !', 'ok')
    } catch { this._toast('Déjà envoyée', '') }
    this.closeProfileCard()
  }

  async _pcardOpenMP(userId, name) {
    this.closeProfileCard()
    this.closePanel()
    setTimeout(() => {
      this.togglePanel()
      setTimeout(() => this.openChat(userId, name), 200)
    }, 100)
  }

  _toast(msg, type = '') {
    const t = document.getElementById('an-toast'); if (!t) return
    t.textContent = msg; t.className = 'on ' + type
    clearTimeout(t._t); t._t = setTimeout(() => t.className = '', 3000)
  }

  async _updateRivalScore(winnerId) {
    if (!winnerId) return
    const { data: rivals } = await supabase.from('rivalries')
      .select('id, challenger_id, challenged_id, score_challenger, score_challenged')
      .or(`challenger_id.eq.${winnerId},challenged_id.eq.${winnerId}`)
    for (const r of rivals || []) {
      if (r.challenger_id === winnerId) {
        await supabase.from('rivalries').update({ score_challenger: (r.score_challenger||0)+1, updated_at: new Date().toISOString() }).eq('id', r.id)
      } else {
        await supabase.from('rivalries').update({ score_challenged: (r.score_challenged||0)+1, updated_at: new Date().toISOString() }).eq('id', r.id)
      }
    }
  }
}

const ANInstance = new AN()
window.AN = ANInstance
ANInstance.init()
