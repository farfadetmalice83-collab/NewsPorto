// auth-nav.js — NewsPorto v3
// <script type="module" src="auth-nav.js"></script> avant </body>

import { supabase, signOut, sendFriendRequest, getFriends, acceptFriendRequest, getConversation, sendMessage, markMessagesRead, startPresence, stopPresence } from './supabase-client.js'

const RANKS = [
  { id:'Adepto',  emoji:'⚪', cost:0,      color:'rgba(255,255,255,0.7)', border:'rgba(255,255,255,0.25)' },
  { id:'Dragão',  emoji:'🔵', cost:2000,   color:'#4d82d4', border:'#003DA5' },
  { id:'Ultras',  emoji:'🟡', cost:8000,   color:'#f0a500', border:'#f0a500' },
  { id:'Lenda',   emoji:'🔴', cost:40000,  color:'#e74c3c', border:'#e74c3c' },
  { id:'Invicta', emoji:'💎', cost:300000, color:'#c9a84c', border:'#c9a84c' },
]

// ─── CSS ───────────────────────────────────────────────────────────────────
const CSS = `
/* TRIGGER BUTTON */
#an-trigger-btn {
  display:flex; align-items:center; gap:8px; cursor:pointer;
  background:transparent; border:1px solid rgba(255,255,255,0.15);
  padding:5px 10px 5px 5px; transition:border-color .2s; position:relative; flex-shrink:0;
}
#an-trigger-btn:hover { border-color:rgba(0,61,165,0.6); }
#an-avatar-pill {
  width:30px; height:30px; border-radius:50%;
  background:rgba(0,61,165,0.4); border:1.5px solid rgba(0,61,165,0.7);
  display:flex; align-items:center; justify-content:center;
  font-family:'Bebas Neue',sans-serif; font-size:13px; color:#4d82d4;
  flex-shrink:0; overflow:hidden;
}
#an-avatar-pill img { width:100%; height:100%; object-fit:cover; }
#an-pill-info { display:flex; flex-direction:column; gap:0; }
#an-pill-name { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#fff; line-height:1.1; }
#an-pill-pts  { font-family:'Bebas Neue',sans-serif; font-size:12px; letter-spacing:1px; color:#4d82d4; line-height:1.1; }
#an-notif-dot { position:absolute; top:-3px; right:-3px; width:10px; height:10px; border-radius:50%; background:#e74c3c; border:2px solid #000; display:none; }
#an-notif-dot.on { display:block; }

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
.an-body { flex:1; overflow-y:auto; padding:0; }
.an-section { display:none; }
.an-section.active { display:block; }

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

@media(max-width:768px) {
  /* Panel takes full screen */
  #an-panel { width:100%; border-left:none; }
  #an-pill-info { display:none; }
  /* Bigger touch targets */
  .an-tab { padding:12px 2px; font-size:8px; letter-spacing:1.5px; }
  .an-friend-row { padding:12px 16px; }
  .an-notif-item { padding:12px 16px; }
  .an-admin-row { padding:12px 16px; }
  .an-conv-row { padding:14px 16px; }
  .an-rank-row { padding:14px 16px; }
  /* Input fields bigger for mobile */
  .an-input, .an-search, .an-chat-input { font-size:16px; padding:12px; } /* 16px prevents iOS zoom */
  .an-auth-input { font-size:16px; } /* prevents iOS zoom */
  .an-btn, .an-auth-btn { padding:14px; font-size:12px; }
  /* Chat full height */
  .an-chat-wrap { height:calc(100vh - 120px); }
  .an-chat-msgs { flex:1; }
  /* Auth modal */
  #an-auth-modal { align-items:flex-end; }
  .an-auth-box { border-radius:0; border-bottom:none; padding:28px 20px; padding-bottom:calc(28px + env(safe-area-inset-bottom,0px)); max-width:100%; }
  /* Panel head smaller */
  .an-panel-head { padding:12px 16px; }
  .an-head-avatar { width:38px; height:38px; font-size:17px; }
  .an-head-name { font-size:13px; }
  .an-head-pts { font-size:18px; }
  /* Row labels */
  .an-row-label { padding:12px 16px 4px; }
  .an-field { padding:0 16px 10px; }
  .an-save-row { padding:10px 16px 16px; }
  .an-search-wrap { padding:10px 16px; }
  /* Admin sub tabs */
  .an-admin-sub-tab { font-size:8px; padding:10px 4px; letter-spacing:1.5px; }
  .an-admin-form { padding:10px 16px; }
  /* Rank rows */
  .an-rank-emoji { font-size:20px; }
  .an-rank-name { font-size:17px; }
  /* Trigger button */
  #an-trigger-btn { padding:4px 8px 4px 4px; gap:6px; }
  #an-avatar-pill { width:28px; height:28px; font-size:12px; }
}
/* Safe area for panel */
@supports(padding-bottom: env(safe-area-inset-bottom)){
  .an-chat-input-row { padding-bottom:calc(10px + env(safe-area-inset-bottom)); }
  .an-save-row { padding-bottom:calc(16px + env(safe-area-inset-bottom)); }
}
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
      <div class="an-head-pts"  id="an-head-pts">0 pts</div>
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
    </div>

    <!-- NOTIFS -->
    <div class="an-section" id="an-sec-notifs">
      <button class="an-mark-all" onclick="AN.markAllRead()">Tout marquer comme lu</button>
      <div id="an-notif-list"><div class="an-empty">Aucune notification</div></div>
    </div>

    <!-- AMIS -->
    <div class="an-section" id="an-sec-amis">
      <div class="an-search-wrap">
        <input class="an-search" type="text" placeholder="Rechercher un utilisateur..." id="an-friends-search" oninput="AN.searchUsers(this.value)">
      </div>
      <div id="an-friends-list"><div class="an-empty">Chargement...</div></div>
    </div>

    <!-- MP -->
    <div class="an-section" id="an-sec-mp">
      <div id="an-conv-view">
        <div class="an-conv-list" id="an-conv-list"><div class="an-empty">Aucune conversation</div></div>
      </div>
      <div id="an-chat-view" style="display:none;height:calc(100vh - 160px);flex-direction:column">
        <div class="an-chat-wrap">
          <div class="an-chat-header">
            <button class="an-chat-back" onclick="AN.backToConvList()">←</button>
            <div class="an-chat-name" id="an-chat-name"></div>
          </div>
          <div class="an-chat-msgs" id="an-chat-msgs"></div>
          <div class="an-chat-input-row">
            <input class="an-chat-input" type="text" id="an-chat-input" placeholder="Écrire..." onkeydown="if(event.key==='Enter')AN.sendMsg()">
            <button class="an-chat-send" onclick="AN.sendMsg()">Envoyer</button>
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
    </div>

    <!-- RANGS -->
    <div class="an-section" id="an-sec-rangs">
      <div class="an-row-label">Solde : <span id="an-rangs-pts" style="color:#4d82d4">—</span> pts</div>
      <div id="an-rank-list"></div>
    </div>

  </div>
</div>

<div id="an-toast"></div>
`}

// ─── CONTROLLER ────────────────────────────────────────────────────────────
class AN {
  constructor() { this.u = null; this.p = null; this.mpFriend = null; this.mpCh = null; this.onlineIds = new Set() }

  async init() {
    const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s)
    document.body.insertAdjacentHTML('beforeend', html())
    this._mountNav()

    // Register auth listener FIRST — catches SIGNED_IN from OAuth redirect
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await this._onLogin(session.user)
      } else if (event === 'SIGNED_OUT') {
        this._onLogout()
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Keep nav in sync after token refresh
        if (!this.u) await this._onLogin(session.user)
      }
    })

    // Also check existing session (for page reloads)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) await this._onLogin(session.user)
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
    const pp = document.getElementById('an-pill-pts');  if (pp) pp.textContent = `${p.points} pts`
    // panel header
    const ha = document.getElementById('an-head-av')
    if (ha) ha.innerHTML = p.avatar_url ? `<img src="${p.avatar_url}">` : (p.display_name||p.username||'?')[0].toUpperCase()
    const hn = document.getElementById('an-head-name'); if (hn) hn.textContent = p.display_name || p.username
    const hr = document.getElementById('an-head-rank')
    const hpts = document.getElementById('an-head-pts'); if (hpts) hpts.textContent = `${p.points} pts`
    const rk = RANKS.find(r => r.id === p.rank) || RANKS[0]
    if (hr) { hr.textContent = `${rk.emoji} ${p.rank}`; hr.style.color = rk.color }
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
    const { data: ban } = await supabase.from('bans').select('reason').eq('user_id', authUser.id).single().catch(()=>({ data: null }))
    if (ban) {
      await supabase.auth.signOut()
      alert(`Ton compte a été banni.\nRaison : ${ban.reason || 'Non précisée'}`)
      return
    }
    this.p = profile
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
    // Show admin tab if admin
    if (profile?.role === 'admin') {
      const adminTab = document.getElementById('an-tab-admin')
      if (adminTab) adminTab.style.display = ''
    }
  }

  _onLogout() {
    this.u = null; this.p = null
    document.getElementById('an-signin-btn').style.display = ''
    document.getElementById('an-trigger-btn').style.display = 'none'
    stopPresence()
    this.closePanel()
  }

  // Panel
  togglePanel() {
    const panel = document.getElementById('an-panel')
    const overlay = document.getElementById('an-overlay')
    const isOpen = panel.classList.toggle('open')
    overlay.classList.toggle('on', isOpen)
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) { this._loadNotifs(); this._loadFriends(); this._loadConvList() }
  }
  closePanel() {
    document.getElementById('an-panel').classList.remove('open')
    document.getElementById('an-overlay').classList.remove('on')
    document.body.style.overflow = ''
  }

  tabTo(tab) {
    document.querySelectorAll('.an-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))
    document.querySelectorAll('.an-section').forEach(s => s.classList.toggle('active', s.id === `an-sec-${tab}`))
    if (tab === 'notifs') this._loadNotifs()
    if (tab === 'amis') this._loadFriends()
    if (tab === 'mp') this._loadConvList()
    if (tab === 'rangs') this._renderRanks()
    if (tab === 'admin') this._loadAdminForum()
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
    const { error } = await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: window.location.href } })
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
      // Insert profile
      await supabase.from('profiles').insert({ id: data.user.id, username, display_name: username, newsletter: nl, points: 500, rank: 'Dragão' })
      await supabase.from('points_log').insert({ user_id: data.user.id, amount: 500, reason: 'welcome' })
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
      await supabase.from('profiles').update({ display_name, bio, updated_at: new Date().toISOString() }).eq('id', this.u.id)
      if (pwd) await supabase.auth.updateUser({ password: pwd })
      const { data } = await supabase.from('profiles').select('*').eq('id', this.u.id).single()
      this.p = data; this._updateNav()
      this._toast('Profil mis à jour ✓', 'ok')
    } catch(e) { err.textContent = e.message; err.classList.add('on') }
  }

  async uploadAvatar(input) {
    const file = input.files[0]; if (!file || !this.u) return
    if (file.size > 2*1024*1024) { this._toast('Image trop lourde (max 2MB)', 'err'); return }
    try {
      const ext = file.name.split('.').pop()
      const path = `${this.u.id}/avatar.${ext}`
      await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', this.u.id)
      const profAv = document.getElementById('an-prof-av'); if (profAv) profAv.innerHTML = `<img src="${data.publicUrl}">`
      if (this.p) this.p.avatar_url = data.publicUrl
      this._updateNav(); this._toast('Photo mise à jour ✓', 'ok')
    } catch { this._toast('Erreur upload', 'err') }
  }

  // NOTIFS
  async _checkNotifs() {
    if (!this.u) return
    const { data } = await supabase.from('notifications').select('id').eq('user_id', this.u.id).eq('read', false)
    const n = data?.length || 0
    const dot = document.getElementById('an-notif-dot'); if (dot) dot.classList.toggle('on', n > 0)
    const tdot = document.getElementById('tab-dot-notifs'); if (tdot) tdot.classList.toggle('on', n > 0)
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
    const icons = { reply:'💬', like:'❤️', best_answer:'✅', friend_request:'👋', friend_accepted:'🤝', bet_won:'🏆', bet_lost:'💸', mp:'✉️' }
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
  }

  async markAllRead() {
    if (!this.u) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', this.u.id)
    this._checkNotifs(); this._loadNotifs()
  }

  _subscribeNotifs() {
    supabase.channel('notifs-' + this.u.id)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'notifications', filter:`user_id=eq.${this.u.id}` }, (payload) => {
        this._checkNotifs()
        const msgs = { reply:'💬 Quelqu\'un a répondu à ton thread', like:'❤️ Quelqu\'un a liké ta réponse', best_answer:'✅ Meilleure réponse ! +10 pts', friend_request:'👋 Nouvelle demande d\'ami', friend_accepted:'🤝 Demande acceptée !', bet_won:'🏆 Pari gagné !', bet_lost:'💸 Pari perdu', mp:'✉️ Nouveau message' }
        this._toast(msgs[payload.new.type] || '🔔 Notification', '')
        if (document.getElementById('an-sec-notifs')?.classList.contains('active')) this._loadNotifs()
      }).subscribe()
  }

  _subscribePoints() {
    supabase.channel('pts-' + this.u.id)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'profiles', filter:`id=eq.${this.u.id}` }, payload => {
        const p = payload.new
        if (this.p) { this.p.points = p.points; this.p.rank = p.rank }
        const pp = document.getElementById('an-pill-pts'); if (pp) pp.textContent = `${p.points} pts`
        const hp = document.getElementById('an-head-pts'); if (hp) hp.textContent = `${p.points} pts`
        window.dispatchEvent(new CustomEvent('points-updated', { detail: { points: p.points, rank: p.rank } }))
      }).subscribe()
  }

  // AMIS
  async _loadFriends() {
    if (!this.u) return
    const list = document.getElementById('an-friends-list'); if (!list) return
    list.innerHTML = '<div class="an-empty">Chargement...</div>'
    try {
      const friends = await getFriends(this.u.id)
      const { data: pending } = await supabase.from('friendships').select('id, requester:requester_id(id,username,display_name,avatar_url,rank)').eq('addressee_id', this.u.id).eq('status','pending')
      let html = ''
      if (pending?.length) {
        html += `<div class="an-row-label">Demandes reçues (${pending.length})</div>`
        html += pending.map(f => `<div class="an-friend-row">
          <div class="an-friend-av">${f.requester.avatar_url?`<img src="${f.requester.avatar_url}">`:(f.requester.display_name||f.requester.username||'?')[0].toUpperCase()}</div>
          <div class="an-friend-info"><div class="an-friend-name">${f.requester.display_name||f.requester.username}</div><div class="an-friend-sub">${f.requester.rank}</div></div>
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
          <div class="an-friend-av">${f.avatar_url?`<img src="${f.avatar_url}">`:(f.display_name||f.username||'?')[0].toUpperCase()}</div>
          <div class="an-friend-info"><div class="an-friend-name">${f.display_name||f.username}</div><div class="an-friend-sub">${f.rank}</div></div>
          <div class="an-friend-acts"><button class="an-micro-btn blue" onclick="AN.openChat('${f.id}','${(f.display_name||f.username).replace(/'/g,"&#39;")}')">MP</button></div>
        </div>`).join('')
      }
      list.innerHTML = html || '<div class="an-empty">Aucun ami · Recherche un utilisateur ↑</div>'
    } catch { list.innerHTML = '<div class="an-empty">Erreur de chargement</div>' }
  }

  async searchUsers(q) {
    if (!q || q.length < 2) { this._loadFriends(); return }
    const { data } = await supabase.from('profiles').select('id,username,display_name,avatar_url,rank').ilike('username',`%${q}%`).neq('id', this.u.id).limit(10)
    const list = document.getElementById('an-friends-list'); if (!list) return
    if (!data?.length) { list.innerHTML = '<div class="an-empty">Aucun résultat</div>'; return }
    list.innerHTML = `<div class="an-row-label">Résultats</div>` + data.map(u => `<div class="an-friend-row">
      <div class="an-friend-av">${u.avatar_url?`<img src="${u.avatar_url}">`:(u.display_name||u.username||'?')[0].toUpperCase()}</div>
      <div class="an-friend-info"><div class="an-friend-name">${u.display_name||u.username}</div><div class="an-friend-sub">${u.rank}</div></div>
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
    convView.style.display = ''; document.getElementById('an-chat-view').style.display = 'none'
    if (!friends.length) { convList.innerHTML = '<div class="an-empty">Ajoute des amis pour écrire</div>'; return }
    convList.innerHTML = '<div class="an-row-label">Conversations</div>' + friends.map(f => `<div class="an-conv-row" onclick="AN.openChat('${f.id}','${(f.display_name||f.username).replace(/'/g,"&#39;")}')">
      <div class="an-conv-av">${f.avatar_url?`<img src="${f.avatar_url}">`:(f.display_name||f.username||'?')[0].toUpperCase()}</div>
      <div><div class="an-conv-name">${f.display_name||f.username}</div><div class="an-conv-preview">${f.rank}</div></div>
    </div>`).join('')
  }

  async openChat(friendId, friendName) {
    this.mpFriend = { id: friendId, name: friendName }
    document.getElementById('an-chat-name').textContent = friendName
    document.getElementById('an-conv-view').style.display = 'none'
    const cv = document.getElementById('an-chat-view'); cv.style.display = 'flex'; cv.style.flexDirection = 'column'
    this.tabTo('mp')
    await this._loadMsgs()
    await markMessagesRead(friendId, this.u.id)
    if (this.mpCh) supabase.removeChannel(this.mpCh)
    this.mpCh = supabase.channel('mp-'+friendId)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages', filter:`receiver_id=eq.${this.u.id}` }, () => this._loadMsgs())
      .subscribe()
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
    // Notif
    await supabase.from('notifications').insert({ user_id: this.mpFriend.id, type:'mp', from_user_id: this.u.id })
    await this._loadMsgs()
  }

  // RANGS
  _renderRanks() {
    if (!this.p) return
    const el = document.getElementById('an-rank-list'); if (!el) return
    const pts = document.getElementById('an-rangs-pts'); if (pts) pts.textContent = this.p.points
    el.innerHTML = RANKS.map(r => {
      const isCurrent = this.p.rank === r.id
      const canAfford = this.p.points >= r.cost
      return `<div class="an-rank-row${isCurrent?' current':''}">
        <div class="an-rank-left">
          <div class="an-rank-emoji">${r.emoji}</div>
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
    await supabase.from('forum_threads').delete().eq('id', id)
    this._toast('Thread supprimé', 'ok')
    this._loadAdminForum()
    // Reload forum if on forum page
    if (window.loadThreads) window.loadThreads()
  }

  async adminSearchUsers(q) {
    if (!this.isAdmin() || !q || q.length < 2) {
      document.getElementById('an-admin-users-list').innerHTML = '<div class="an-empty">Recherche un utilisateur</div>'
      return
    }
    const { data } = await supabase.from('profiles')
      .select('id, username, display_name, rank, points, role')
      .ilike('username', `%${q}%`).limit(10)
    const el = document.getElementById('an-admin-users-list'); if (!el) return
    if (!data?.length) { el.innerHTML = '<div class="an-empty">Aucun résultat</div>'; return }
    // Check bans
    const { data: bans } = await supabase.from('bans').select('user_id')
    const bannedIds = new Set((bans||[]).map(b => b.user_id))
    el.innerHTML = data.map(u => {
      const isBanned = bannedIds.has(u.id)
      const isMe = u.id === this.u?.id
      return `<div class="an-admin-row">
        <div class="an-admin-row-info">
          <div class="an-admin-row-title">${u.display_name||u.username} ${u.role==='admin'?'<span class="an-admin-badge">ADMIN</span>':''} ${isBanned?'<span class="an-admin-badge" style="background:#f0a500">BANNI</span>':''}</div>
          <div class="an-admin-row-sub">${u.rank} · ${u.points} pts</div>
        </div>
        <div class="an-admin-acts">
          ${!isMe ? (isBanned
            ? `<button class="an-micro-btn green" onclick="AN.adminUnban('${u.id}')">Débannir</button>`
            : `<button class="an-micro-btn orange" onclick="AN.adminBan('${u.id}','${u.display_name||u.username}')">Bannir</button>`
          ) : ''}
        </div>
      </div>`
    }).join('')
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
        // Gagné
        const { data: prof } = await supabase.from('profiles').select('points').eq('id', entry.user_id).single()
        const newPts = (prof?.points || 0) + entry.potential_gain
        await supabase.from('profiles').update({ points: newPts }).eq('id', entry.user_id)
        await supabase.from('points_log').insert({ user_id: entry.user_id, amount: entry.potential_gain, reason: 'custom_bet_win', ref_id: String(betId) })
        await supabase.from('notifications').insert({ user_id: entry.user_id, type: 'bet_won', from_user_id: this.u.id, ref_label: `+${entry.potential_gain} pts` })
        await supabase.from('custom_bet_entries').update({ status: 'won' }).eq('id', entry.id)
      } else {
        await supabase.from('custom_bet_entries').update({ status: 'lost' }).eq('id', entry.id)
        await supabase.from('notifications').insert({ user_id: entry.user_id, type: 'bet_lost', from_user_id: this.u.id, ref_label: entry.potential_gain + ' pts perdus' })
      }
    }
    this._toast('Pari résolu, gains distribués ✅', 'ok')
    this._loadAdminBets()
    window.dispatchEvent(new CustomEvent('custom-bet-updated'))
  }


  _toast(msg, type = '') {
    const t = document.getElementById('an-toast'); if (!t) return
    t.textContent = msg; t.className = 'on ' + type
    clearTimeout(t._t); t._t = setTimeout(() => t.className = '', 3000)
  }
}

const ANInstance = new AN()
window.AN = ANInstance
ANInstance.init()
