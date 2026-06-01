// auth-nav.js — NewsPorto v2
// <script type="module" src="auth-nav.js"></script> avant </body>

import {
  supabase, signOut,
  sendFriendRequest, getFriends, acceptFriendRequest,
  getConversation, sendMessage, markMessagesRead,
  startPresence, stopPresence,
} from './supabase-client.js'

const RANKS = [
  { id:'Adepto',  emoji:'⚪', cost:0,      color:'rgba(255,255,255,0.6)', border:'rgba(255,255,255,0.3)' },
  { id:'Dragão',  emoji:'🔵', cost:2000,   color:'#4d82d4',               border:'#003DA5' },
  { id:'Ultras',  emoji:'🟡', cost:8000,   color:'#f0a500',               border:'#f0a500' },
  { id:'Lenda',   emoji:'🔴', cost:40000,  color:'#e74c3c',               border:'#e74c3c' },
  { id:'Invicta', emoji:'💎', cost:300000, color:'#c9a84c',               border:'#c9a84c' },
]

const CSS = `
  #auth-trigger{font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border:1px solid rgba(255,255,255,0.3);color:rgba(255,255,255,0.7);background:transparent;padding:8px 20px;cursor:pointer;transition:.2s;white-space:nowrap;}
  #auth-trigger:hover{border-color:#fff;color:#fff;}
  #profile-pill{display:flex;align-items:center;gap:10px;cursor:pointer;padding:6px 12px 6px 6px;border:1px solid rgba(255,255,255,0.1);transition:border-color .2s;position:relative;background:transparent;}
  #profile-pill:hover{border-color:rgba(0,61,165,0.5);}
  #profile-avatar{width:32px;height:32px;border-radius:50%;border:1.5px solid rgba(0,61,165,0.6);background:rgba(0,61,165,0.3);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:14px;color:#4d82d4;flex-shrink:0;overflow:hidden;}
  #profile-avatar img{width:100%;height:100%;object-fit:cover;}
  #profile-info{display:flex;flex-direction:column;gap:1px;}
  #profile-name{font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#fff;line-height:1;}
  #profile-points{font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;color:#4d82d4;line-height:1;}

  /* NOTIF BADGE global */
  #notif-badge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:#e74c3c;border:2px solid #000;font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;color:#fff;display:none;align-items:center;justify-content:center;}
  #notif-badge.visible{display:flex;}

  /* DROPDOWN */
  #profile-dropdown{position:absolute;top:calc(100% + 8px);right:0;min-width:250px;background:#05090f;border:1px solid rgba(0,61,165,0.35);z-index:300;display:none;animation:ddIn .2s cubic-bezier(.22,1,.36,1);}
  #profile-dropdown.open{display:block;}
  @keyframes ddIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
  .dd-header{padding:16px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:10px;}
  .dd-avatar-lg{width:40px;height:40px;border-radius:50%;border:1.5px solid rgba(0,61,165,0.6);flex-shrink:0;overflow:hidden;background:rgba(0,61,165,0.3);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:18px;color:#4d82d4;}
  .dd-avatar-lg img{width:100%;height:100%;object-fit:cover;}
  .dd-user-name{font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#fff;}
  .dd-user-rank{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:2px;}
  .dd-points-row{padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;}
  .dd-points-label{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4);}
  .dd-points-val{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:1px;color:#4d82d4;}
  .dd-item{display:flex;align-items:center;gap:10px;padding:12px 16px;cursor:pointer;transition:background .15s;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.6);text-decoration:none;border:none;background:none;width:100%;text-align:left;}
  .dd-item:hover{background:rgba(0,61,165,0.1);color:#fff;}
  .dd-item.danger:hover{background:rgba(231,76,60,0.1);color:#e74c3c;}
  .dd-item svg{opacity:.5;flex-shrink:0;}.dd-item:hover svg{opacity:1;}
  .dd-sep{height:1px;background:rgba(255,255,255,0.08);}
  .dd-notif-dot{width:6px;height:6px;border-radius:50%;background:#e74c3c;margin-left:auto;}
  .dd-notif-count{font-family:'Bebas Neue',sans-serif;font-size:13px;color:#e74c3c;margin-left:auto;}

  /* NOTIF PANEL */
  #notif-panel{position:absolute;top:calc(100% + 8px);right:0;width:320px;background:#05090f;border:1px solid rgba(0,61,165,0.35);z-index:400;display:none;animation:ddIn .2s cubic-bezier(.22,1,.36,1);}
  #notif-panel.open{display:block;}
  .notif-panel-header{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;}
  .notif-panel-title{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;}
  .notif-mark-all{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.3);cursor:pointer;background:none;border:none;transition:color .2s;}
  .notif-mark-all:hover{color:#fff;}
  .notif-list{max-height:320px;overflow-y:auto;}
  .notif-item{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;transition:background .15s;display:flex;align-items:flex-start;gap:10px;}
  .notif-item:hover{background:rgba(0,61,165,0.06);}
  .notif-item.unread{background:rgba(0,61,165,0.04);}
  .notif-item.unread::before{content:'';display:block;width:4px;background:#003DA5;align-self:stretch;flex-shrink:0;margin:-12px 6px -12px -16px;}
  .notif-icon{font-size:16px;flex-shrink:0;margin-top:1px;}
  .notif-text{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,0.7);line-height:1.4;}
  .notif-text strong{color:#fff;}
  .notif-time{font-family:'Barlow Condensed',sans-serif;font-size:9px;letter-spacing:1px;color:rgba(255,255,255,0.25);margin-top:3px;}
  .notif-empty{padding:24px 16px;text-align:center;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.2);}

  /* MODALS */
  .np-modal{display:none;position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.9);backdrop-filter:blur(12px);align-items:center;justify-content:center;}
  .np-modal.open{display:flex;}
  .np-box{background:#05090f;border:1px solid rgba(0,61,165,0.35);width:100%;padding:40px;position:relative;animation:fadeUp .3s cubic-bezier(.22,1,.36,1);}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .np-close{position:absolute;top:16px;right:20px;background:none;border:none;color:rgba(255,255,255,0.3);font-family:'Bebas Neue',sans-serif;font-size:22px;cursor:pointer;transition:color .2s;}
  .np-close:hover{color:#fff;}
  .np-eyebrow{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:10px;}
  .np-title{font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:2px;margin-bottom:28px;}
  #auth-modal .np-box{max-width:420px;}
  .auth-tabs{display:flex;margin-bottom:28px;border-bottom:1px solid rgba(255,255,255,0.1);}
  .auth-tab{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.4);padding:10px 20px;cursor:pointer;background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-1px;transition:.2s;}
  .auth-tab.active{color:#fff;border-bottom-color:#003DA5;}
  .np-field{margin-bottom:16px;}
  .np-label{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.4);display:block;margin-bottom:6px;}
  .np-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:12px 14px;font-family:'Barlow',sans-serif;font-size:14px;outline:none;transition:border-color .2s;}
  .np-input:focus{border-color:#003DA5;background:rgba(0,20,80,0.1);}
  .np-input::placeholder{color:rgba(255,255,255,0.2);}
  .np-newsletter{display:flex;align-items:center;gap:10px;margin-bottom:20px;cursor:pointer;}
  .np-newsletter input{accent-color:#003DA5;width:14px;height:14px;}
  .np-newsletter span{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.4);}
  .np-btn{width:100%;background:#003DA5;color:#fff;border:1px solid #003DA5;padding:14px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;cursor:pointer;transition:.2s;margin-bottom:12px;}
  .np-btn:hover{background:#0050CC;}
  .np-btn:disabled{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3);cursor:not-allowed;}
  .np-error{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#e74c3c;margin-bottom:12px;display:none;}
  .np-error.visible{display:block;}
  .auth-bonus{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#4d82d4;text-align:center;}

  /* SETTINGS */
  #settings-modal .np-box{max-width:520px;max-height:90vh;overflow-y:auto;}
  .settings-section{margin-bottom:28px;}
  .settings-section-title{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:16px;display:flex;align-items:center;gap:10px;}
  .settings-section-title::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.08);}
  .avatar-upload-wrap{display:flex;align-items:center;gap:20px;margin-bottom:20px;}
  #settings-avatar-preview{width:64px;height:64px;border-radius:50%;border:2px solid rgba(0,61,165,0.5);overflow:hidden;background:rgba(0,61,165,0.2);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:24px;color:#4d82d4;flex-shrink:0;}
  #settings-avatar-preview img{width:100%;height:100%;object-fit:cover;}
  .avatar-upload-btn{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.6);padding:8px 16px;cursor:pointer;background:none;transition:.2s;}
  .avatar-upload-btn:hover{border-color:#fff;color:#fff;}
  #avatar-file-input{display:none;}

  /* RANK SHOP */
  #rank-shop-modal .np-box{max-width:560px;max-height:90vh;overflow-y:auto;}
  .rank-shop-row{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border:1px solid rgba(255,255,255,0.08);margin-bottom:2px;transition:border-color .2s;}
  .rank-shop-row:hover{border-color:rgba(0,61,165,0.3);}
  .rank-shop-row.current{border-color:rgba(0,61,165,0.5);background:rgba(0,61,165,0.06);}
  .rank-info{display:flex;align-items:center;gap:14px;}
  .rank-emoji-big{font-size:28px;line-height:1;}
  .rank-name-big{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;}
  .rank-cost-label{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-top:2px;}
  .rank-buy-btn{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:8px 18px;cursor:pointer;transition:.2s;border:1px solid;background:none;}
  .rank-buy-btn:disabled{opacity:.3;cursor:not-allowed;}

  /* FRIENDS */
  #friends-panel .np-box{max-width:480px;max-height:80vh;display:flex;flex-direction:column;padding:0;}
  .friends-header{padding:24px 28px 20px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;}
  .friends-title{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:2px;}
  .friends-search-wrap{padding:16px 28px;border-bottom:1px solid rgba(255,255,255,0.08);}
  .friends-search{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:10px 14px;font-family:'Barlow',sans-serif;font-size:13px;outline:none;transition:border-color .2s;}
  .friends-search:focus{border-color:#003DA5;}
  .friends-search::placeholder{color:rgba(255,255,255,0.2);}
  .friends-list{flex:1;overflow-y:auto;padding:8px 0;}
  .friend-row{display:flex;align-items:center;gap:12px;padding:12px 28px;transition:background .15s;}
  .friend-row:hover{background:rgba(255,255,255,0.02);}
  .friend-avatar{width:36px;height:36px;border-radius:50%;background:rgba(0,61,165,0.3);border:1.5px solid rgba(0,61,165,0.5);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:15px;color:#4d82d4;flex-shrink:0;overflow:hidden;position:relative;}
  .friend-avatar img{width:100%;height:100%;object-fit:cover;}
  .online-dot-sm{width:8px;height:8px;border-radius:50%;background:#00c87a;border:2px solid #05090f;position:absolute;bottom:0;right:0;}
  .friend-info{flex:1;}
  .friend-name{font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#fff;}
  .friend-rank-label{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.35);}
  .friend-actions{display:flex;gap:6px;}
  .friend-btn{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.5);padding:5px 10px;cursor:pointer;background:none;transition:.2s;}
  .friend-btn:hover{border-color:#fff;color:#fff;}
  .friend-btn.primary{border-color:#003DA5;color:#4d82d4;}
  .friend-btn.primary:hover{background:#003DA5;color:#fff;}
  .friend-btn.green{border-color:#00c87a;color:#00c87a;}
  .friends-section-label{padding:8px 28px 4px;font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.3);}
  .friends-empty{padding:40px 28px;text-align:center;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.2);}

  /* MP */
  #mp-modal{display:none;position:fixed;inset:0;z-index:600;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);align-items:flex-end;justify-content:flex-end;padding:80px 24px 24px;}
  #mp-modal.open{display:flex;}
  .mp-box{background:#05090f;border:1px solid rgba(0,61,165,0.35);width:360px;height:480px;display:flex;flex-direction:column;animation:fadeUp .3s cubic-bezier(.22,1,.36,1);}
  .mp-header{padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;}
  .mp-with{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5);}
  .mp-username{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;color:#fff;}
  .mp-close{background:none;border:none;color:rgba(255,255,255,0.3);font-size:18px;cursor:pointer;transition:color .2s;font-family:'Bebas Neue',sans-serif;}
  .mp-close:hover{color:#fff;}
  .mp-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;}
  .mp-msg{max-width:80%;padding:8px 12px;font-family:'Barlow',sans-serif;font-size:13px;line-height:1.5;}
  .mp-msg.mine{align-self:flex-end;background:#003DA5;color:#fff;}
  .mp-msg.theirs{align-self:flex-start;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.85);}
  .mp-msg-time{font-family:'Barlow Condensed',sans-serif;font-size:9px;letter-spacing:1px;color:rgba(255,255,255,0.3);margin-top:4px;display:block;}
  .mp-input-row{padding:12px 16px;border-top:1px solid rgba(255,255,255,0.08);display:flex;gap:8px;}
  .mp-input{flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:10px 12px;font-family:'Barlow',sans-serif;font-size:13px;outline:none;transition:border-color .2s;}
  .mp-input:focus{border-color:#003DA5;}
  .mp-input::placeholder{color:rgba(255,255,255,0.2);}
  .mp-send{background:#003DA5;border:none;color:#fff;padding:10px 16px;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;transition:.2s;}
  .mp-send:hover{background:#0050CC;}

  /* TOAST */
  #an-toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(12px);background:#05090f;border:1px solid rgba(0,61,165,0.4);padding:10px 24px;z-index:700;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#fff;opacity:0;transition:opacity .3s,transform .3s;pointer-events:none;white-space:nowrap;}
  #an-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
  #an-toast.success{border-color:#00c87a;color:#00c87a;}
  #an-toast.error{border-color:#e74c3c;color:#e74c3c;}

  @media(max-width:768px){#profile-info{display:none;}.mp-box{width:100%;height:100%;}#mp-modal{padding:0;align-items:stretch;justify-content:stretch;}}
`

function buildHTML() {
  return `
  <div id="auth-modal" class="np-modal">
    <div class="np-box">
      <button class="np-close" onclick="AuthNav.closeAuthModal()">✕</button>
      <div class="np-eyebrow">NewsPorto</div>
      <div class="np-title" id="auth-modal-title">Connexion</div>
      <div class="auth-tabs">
        <button class="auth-tab active" onclick="AuthNav.switchAuthTab('login')">Connexion</button>
        <button class="auth-tab" onclick="AuthNav.switchAuthTab('signup')">Inscription</button>
      </div>
      <div class="np-error" id="auth-error"></div>
      <div id="auth-login-form">
        <div class="np-field"><label class="np-label">Email</label><input class="np-input" type="email" id="login-email" placeholder="ton@email.com"></div>
        <div class="np-field"><label class="np-label">Mot de passe</label><input class="np-input" type="password" id="login-password" placeholder="••••••••" onkeydown="if(event.key==='Enter')AuthNav.handleLogin()"></div>
        <button class="np-btn" id="login-btn" onclick="AuthNav.handleLogin()">Se connecter →</button>
      </div>
      <div id="auth-signup-form" style="display:none">
        <div class="np-field"><label class="np-label">Nom d'utilisateur</label><input class="np-input" type="text" id="signup-username" placeholder="MonPseudo"></div>
        <div class="np-field"><label class="np-label">Email</label><input class="np-input" type="email" id="signup-email" placeholder="ton@email.com"></div>
        <div class="np-field"><label class="np-label">Mot de passe</label><input class="np-input" type="password" id="signup-password" placeholder="Min. 8 caractères" onkeydown="if(event.key==='Enter')AuthNav.handleSignup()"></div>
        <label class="np-newsletter"><input type="checkbox" id="signup-newsletter" checked><span>Rejoindre la newsletter NewsPorto</span></label>
        <button class="np-btn" id="signup-btn" onclick="AuthNav.handleSignup()">Créer mon compte →</button>
        <div class="auth-bonus">🎁 500 points offerts à l'inscription</div>
      </div>
    </div>
  </div>

  <div id="settings-modal" class="np-modal">
    <div class="np-box">
      <button class="np-close" onclick="AuthNav.closeSettings()">✕</button>
      <div class="np-eyebrow">NewsPorto</div>
      <div class="np-title">Paramètres</div>
      <div class="settings-section">
        <div class="settings-section-title">Photo de profil</div>
        <div class="avatar-upload-wrap">
          <div id="settings-avatar-preview"></div>
          <div>
            <button class="avatar-upload-btn" onclick="document.getElementById('avatar-file-input').click()">Changer la photo</button>
            <input type="file" id="avatar-file-input" accept="image/*" onchange="AuthNav.handleAvatarUpload(this)">
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-top:6px;">JPG, PNG · Max 2MB</div>
          </div>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-title">Profil public</div>
        <div class="np-field"><label class="np-label">Prénom affiché</label><input class="np-input" type="text" id="settings-displayname" placeholder="Ton prénom"></div>
        <div class="np-field"><label class="np-label">Bio</label><input class="np-input" type="text" id="settings-bio" placeholder="Fan du FC Porto depuis toujours" maxlength="120"></div>
      </div>
      <div class="settings-section">
        <div class="settings-section-title">Sécurité</div>
        <div class="np-field"><label class="np-label">Nouveau mot de passe</label><input class="np-input" type="password" id="settings-password" placeholder="Laisser vide pour ne pas changer"></div>
      </div>
      <div class="np-error" id="settings-error"></div>
      <button class="np-btn" onclick="AuthNav.saveSettings()">Sauvegarder →</button>
    </div>
  </div>

  <div id="rank-shop-modal" class="np-modal">
    <div class="np-box">
      <button class="np-close" onclick="AuthNav.closeRankShop()">✕</button>
      <div class="np-eyebrow">NewsPorto · Boutique</div>
      <div class="np-title">Acheter un Rang</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:24px;">Solde : <span id="shop-points-val" style="color:#4d82d4">—</span> pts</div>
      <div id="rank-shop-grid"></div>
    </div>
  </div>

  <div id="friends-panel" class="np-modal">
    <div class="np-box">
      <div class="friends-header">
        <div class="friends-title">Amis</div>
        <button class="np-close" style="position:static" onclick="AuthNav.closeFriends()">✕</button>
      </div>
      <div class="friends-search-wrap">
        <input class="friends-search" type="text" placeholder="Rechercher un utilisateur..." id="friends-search-input" oninput="AuthNav.searchUsers(this.value)">
      </div>
      <div class="friends-list" id="friends-list"></div>
    </div>
  </div>

  <div id="mp-modal">
    <div class="mp-box">
      <div class="mp-header">
        <div><div class="mp-with">Message privé avec</div><div class="mp-username" id="mp-username">—</div></div>
        <button class="mp-close" onclick="AuthNav.closeMP()">✕</button>
      </div>
      <div class="mp-messages" id="mp-messages"></div>
      <div class="mp-input-row">
        <input class="mp-input" type="text" id="mp-input" placeholder="Écrire..." onkeydown="if(event.key==='Enter')AuthNav.sendMP()">
        <button class="mp-send" onclick="AuthNav.sendMP()">Envoyer</button>
      </div>
    </div>
  </div>

  <div id="an-toast"></div>
  `
}

class AuthNavController {
  constructor() { this.user = null; this.currentMPFriend = null; this.mpChannel = null; this.onlineUsers = new Set() }

  async init() {
    const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s)
    document.body.insertAdjacentHTML('beforeend', buildHTML())
    this._mountNavButton()
    supabase.auth.onAuthStateChange(async (_, session) => {
      if (session) await this._onLogin(session.user)
      else this._onLogout()
    })
    const { data: { session } } = await supabase.auth.getSession()
    if (session) await this._onLogin(session.user)
    ;['auth-modal','settings-modal','rank-shop-modal','friends-panel'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', e => { if (e.target.id === id) this._closeById(id) })
    })
  }

  _closeById(id) {
    const map = { 'auth-modal': () => this.closeAuthModal(), 'settings-modal': () => this.closeSettings(), 'rank-shop-modal': () => this.closeRankShop(), 'friends-panel': () => this.closeFriends() }
    map[id]?.()
  }

  _mountNavButton() {
    const nav = document.querySelector('nav')
    if (!nav) return
    const wrap = document.createElement('div')
    wrap.id = 'auth-nav-wrap'
    wrap.style.cssText = 'display:flex;align-items:center;gap:8px;position:relative;flex-shrink:0;'

    const trigger = document.createElement('button')
    trigger.id = 'auth-trigger'
    trigger.textContent = "S'inscrire"
    trigger.onclick = () => this.openAuthModal('signup')

    const pill = document.createElement('div')
    pill.id = 'profile-pill'
    pill.style.display = 'none'
    pill.innerHTML = `<div id="profile-avatar"></div><div id="profile-info"><div id="profile-name">—</div><div id="profile-points">0 pts</div></div><div id="notif-badge">0</div><div id="profile-dropdown"></div>`
    pill.onclick = e => { if (!e.target.closest('#profile-dropdown') && !e.target.closest('#notif-panel')) this._toggleDropdown() }

    wrap.appendChild(trigger)
    wrap.appendChild(pill)
    const cta = nav.querySelector('.nav-cta')
    if (cta) cta.replaceWith(wrap)
    else nav.appendChild(wrap)

    document.addEventListener('click', e => {
      if (!e.target.closest('#profile-pill')) { this._closeDropdown(); this._closeNotifPanel() }
    })
  }

  async _onLogin(authUser) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
    if (!profile) return
    this.user = { ...authUser, profile }
    document.getElementById('auth-trigger').style.display = 'none'
    document.getElementById('profile-pill').style.display = 'flex'
    this._updatePill(profile)
    this._buildDropdown(profile)
    startPresence(authUser.id, profile.username)
    this._checkNotifications()
    this._subscribeToPoints(authUser.id)
    this._subscribeToNotifs(authUser.id)
    // Masque le popup newsletter si déjà inscrit
    if (profile.newsletter) localStorage.setItem('np_email_subscribed', '1')
  }

  _onLogout() {
    this.user = null
    document.getElementById('auth-trigger').style.display = ''
    document.getElementById('profile-pill').style.display = 'none'
    stopPresence()
  }

  _updatePill(p) {
    const av = document.getElementById('profile-avatar')
    av.innerHTML = p.avatar_url ? `<img src="${p.avatar_url}">` : (p.display_name||p.username||'?')[0].toUpperCase()
    document.getElementById('profile-name').textContent = p.display_name || p.username
    document.getElementById('profile-points').textContent = `${p.points} pts`
  }

  _buildDropdown(p) {
    const r = RANKS.find(r => r.id === p.rank) || RANKS[0]
    // Injecte aussi le notif panel dans le dropdown
    document.getElementById('profile-dropdown').innerHTML = `
      <div id="notif-panel">
        <div class="notif-panel-header">
          <div class="notif-panel-title">Notifications</div>
          <button class="notif-mark-all" onclick="AuthNav.markAllNotifsRead()">Tout marquer lu</button>
        </div>
        <div class="notif-list" id="notif-list"><div class="notif-empty">Aucune notification</div></div>
      </div>
      <div class="dd-header">
        <div class="dd-avatar-lg">${p.avatar_url?`<img src="${p.avatar_url}">`:(p.display_name||p.username||'?')[0].toUpperCase()}</div>
        <div><div class="dd-user-name">${p.display_name||p.username}</div><div class="dd-user-rank" style="color:${r.color}">${r.emoji} ${p.rank}</div></div>
      </div>
      <div class="dd-points-row">
        <span class="dd-points-label">Points</span>
        <span class="dd-points-val" id="dd-points-val">${p.points}</span>
      </div>
      <button class="dd-item" onclick="AuthNav.toggleNotifPanel()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        Notifications <span id="dd-notif-count" class="dd-notif-count" style="display:none">0</span>
      </button>
      <a href="forum.html" class="dd-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Forum
      </a>
      <a href="pronostics.html" class="dd-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        Pronostics
      </a>
      <button class="dd-item" onclick="AuthNav.openFriends()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Amis <span id="dd-friend-notif" class="dd-notif-dot" style="display:none"></span>
      </button>
      <button class="dd-item" onclick="AuthNav.openRankShop()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        Acheter un rang
      </button>
      <div class="dd-sep"></div>
      <button class="dd-item" onclick="AuthNav.openSettings()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        Paramètres
      </button>
      <button class="dd-item danger" onclick="AuthNav.handleLogout()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Déconnexion
      </button>`
    this._checkNotifications()
  }

  _toggleDropdown() { document.getElementById('profile-dropdown').classList.toggle('open') }
  _closeDropdown() { document.getElementById('profile-dropdown').classList.remove('open') }
  toggleNotifPanel() {
    const p = document.getElementById('notif-panel')
    p.classList.toggle('open')
    if (p.classList.contains('open')) this._loadNotifs()
  }
  _closeNotifPanel() { document.getElementById('notif-panel')?.classList.remove('open') }

  // ── NOTIFICATIONS ──
  async _checkNotifications() {
    if (!this.user) return
    const { data } = await supabase.from('notifications').select('id').eq('user_id', this.user.id).eq('read', false)
    const count = data?.length || 0
    const badge = document.getElementById('notif-badge')
    const ddCount = document.getElementById('dd-notif-count')
    badge?.classList.toggle('visible', count > 0)
    if (count > 0 && badge) badge.textContent = count
    if (ddCount) { ddCount.style.display = count > 0 ? '' : 'none'; ddCount.textContent = count }
    // friend requests
    const { data: fr } = await supabase.from('friendships').select('id').eq('addressee_id', this.user.id).eq('status', 'pending')
    const frCount = fr?.length || 0
    const dot = document.getElementById('dd-friend-notif')
    if (dot) dot.style.display = frCount > 0 ? 'block' : 'none'
  }

  async _loadNotifs() {
    if (!this.user) return
    const { data } = await supabase
      .from('notifications')
      .select('*, from_user:from_user_id(username, display_name, avatar_url)')
      .eq('user_id', this.user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    const list = document.getElementById('notif-list')
    if (!list) return
    if (!data?.length) { list.innerHTML = '<div class="notif-empty">Aucune notification</div>'; return }
    const icons = { reply:'💬', like:'❤️', best_answer:'✅', friend_request:'👋', friend_accepted:'🤝' }
    const labels = {
      reply: (n) => `<strong>${n.from_user?.display_name||n.from_user?.username||'?'}</strong> a répondu à ton thread`,
      like: (n) => `<strong>${n.from_user?.display_name||n.from_user?.username||'?'}</strong> a liké ta réponse`,
      best_answer: (n) => `Ta réponse a été marquée comme meilleure réponse 🎉`,
      friend_request: (n) => `<strong>${n.from_user?.display_name||n.from_user?.username||'?'}</strong> t'a envoyé une demande d'ami`,
      friend_accepted: (n) => `<strong>${n.from_user?.display_name||n.from_user?.username||'?'}</strong> a accepté ta demande d'ami`,
    }
    list.innerHTML = data.map(n => {
      const t = new Date(n.created_at).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})
      return `<div class="notif-item${n.read?'':' unread'}" onclick="AuthNav.clickNotif(${n.id},'${n.type}','${n.ref_id||''}')">
        <div class="notif-icon">${icons[n.type]||'🔔'}</div>
        <div><div class="notif-text">${(labels[n.type]?.(n))||n.type}</div>${n.ref_label?`<div class="notif-time" style="color:rgba(255,255,255,0.4);font-size:10px;margin-top:2px">"${n.ref_label}"</div>`:''}
        <div class="notif-time">${t}</div></div>
      </div>`
    }).join('')
  }

  async clickNotif(id, type, refId) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    this._checkNotifications()
    if ((type === 'reply' || type === 'like' || type === 'best_answer') && refId) window.location.href = `forum.html#thread-${refId}`
    else if (type === 'friend_request') this.openFriends()
  }

  async markAllNotifsRead() {
    if (!this.user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', this.user.id)
    this._checkNotifications()
    this._loadNotifs()
  }

  _subscribeToNotifs(userId) {
    supabase.channel('notifs-' + userId)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'notifications', filter:`user_id=eq.${userId}` }, (payload) => {
        this._checkNotifications()
        // Pop-up toast discret
        const icons = { reply:'💬', like:'❤️', best_answer:'✅', friend_request:'👋', friend_accepted:'🤝' }
        const msgs = { reply:'Quelqu\'un a répondu à ton thread', like:'Quelqu\'un a liké ta réponse', best_answer:'Ta réponse est la meilleure ! +10 pts', friend_request:'Nouvelle demande d\'ami', friend_accepted:'Demande d\'ami acceptée !' }
        this._toast(msgs[payload.new.type] || 'Nouvelle notification', '')
      })
      .subscribe()
  }

  _subscribeToPoints(userId) {
    supabase.channel('pts-' + userId)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'profiles', filter:`id=eq.${userId}` }, payload => {
        const p = payload.new
        if (this.user) { this.user.profile.points = p.points; this.user.profile.rank = p.rank }
        document.getElementById('profile-points').textContent = `${p.points} pts`
        const ddPts = document.getElementById('dd-points-val')
        if (ddPts) ddPts.textContent = p.points
        window.dispatchEvent(new CustomEvent('points-updated', { detail: { points: p.points, rank: p.rank } }))
      }).subscribe()
  }

  // ── AUTH ──
  openAuthModal(tab = 'login') { this.switchAuthTab(tab); document.getElementById('auth-modal').classList.add('open'); document.body.style.overflow = 'hidden' }
  closeAuthModal() { document.getElementById('auth-modal').classList.remove('open'); document.body.style.overflow = ''; document.getElementById('auth-error').classList.remove('visible') }

  switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach((t,i) => t.classList.toggle('active',(i===0&&tab==='login')||(i===1&&tab==='signup')))
    document.getElementById('auth-login-form').style.display = tab==='login'?'':'none'
    document.getElementById('auth-signup-form').style.display = tab==='signup'?'':'none'
    document.getElementById('auth-modal-title').textContent = tab==='login'?'Connexion':'Inscription'
    document.getElementById('auth-error').classList.remove('visible')
  }

  async handleLogin() {
    const btn = document.getElementById('login-btn')
    const email = document.getElementById('login-email').value.trim()
    const password = document.getElementById('login-password').value
    if (!email || !password) return this._authError('Remplis tous les champs')
    btn.disabled = true; btn.textContent = 'Connexion...'
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      this.closeAuthModal()
    } catch(e) { this._authError(e.message.includes('Invalid') ? 'Email ou mot de passe incorrect' : e.message) }
    finally { btn.disabled = false; btn.textContent = 'Se connecter →' }
  }

  async handleSignup() {
    const btn = document.getElementById('signup-btn')
    const username = document.getElementById('signup-username').value.trim()
    const email = document.getElementById('signup-email').value.trim()
    const password = document.getElementById('signup-password').value
    const newsletter = document.getElementById('signup-newsletter').checked
    if (!username || !email || !password) return this._authError('Remplis tous les champs')
    if (password.length < 8) return this._authError('Mot de passe trop court (min. 8 car.)')
    btn.disabled = true; btn.textContent = 'Création...'
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      // Crée le profil
      await supabase.from('profiles').insert({ id: data.user.id, username, display_name: username, newsletter, points: 500, rank: 'Dragão' })
      await supabase.from('points_log').insert({ user_id: data.user.id, amount: 500, reason: 'welcome' })
      // Newsletter : appel API existante
      if (newsletter) {
        try { await fetch('/api/subscribe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) }) } catch {}
        localStorage.setItem('np_email_subscribed', '1')
        // Ferme le popup newsletter si ouvert
        const popup = document.getElementById('notif-popup')
        if (popup) popup.classList.remove('show')
      }
      this.closeAuthModal()
      this._toast('Bienvenue ! 500 pts offerts 🎁', 'success')
    } catch(e) { this._authError(e.message.includes('already') ? 'Email déjà utilisé' : e.message) }
    finally { btn.disabled = false; btn.textContent = 'Créer mon compte →' }
  }

  async handleLogout() { this._closeDropdown(); await supabase.auth.signOut() }
  _authError(msg) { const el = document.getElementById('auth-error'); el.textContent = msg; el.classList.add('visible') }

  // ── SETTINGS ──
  openSettings() {
    this._closeDropdown()
    if (!this.user) return
    const p = this.user.profile
    document.getElementById('settings-displayname').value = p.display_name || ''
    document.getElementById('settings-bio').value = p.bio || ''
    document.getElementById('settings-password').value = ''
    const prev = document.getElementById('settings-avatar-preview')
    prev.innerHTML = p.avatar_url ? `<img src="${p.avatar_url}">` : (p.display_name||p.username||'?')[0].toUpperCase()
    document.getElementById('settings-modal').classList.add('open'); document.body.style.overflow = 'hidden'
  }
  closeSettings() { document.getElementById('settings-modal').classList.remove('open'); document.body.style.overflow = '' }

  async saveSettings() {
    if (!this.user) return
    const display_name = document.getElementById('settings-displayname').value.trim()
    const bio = document.getElementById('settings-bio').value.trim()
    const password = document.getElementById('settings-password').value
    try {
      await supabase.from('profiles').update({ display_name, bio, updated_at: new Date().toISOString() }).eq('id', this.user.id)
      if (password) await supabase.auth.updateUser({ password })
      const { data } = await supabase.from('profiles').select('*').eq('id', this.user.id).single()
      this.user.profile = data; this._updatePill(data); this._buildDropdown(data)
      this.closeSettings(); this._toast('Profil mis à jour ✓', 'success')
    } catch(e) { const el = document.getElementById('settings-error'); el.textContent = e.message; el.classList.add('visible') }
  }

  async handleAvatarUpload(input) {
    const file = input.files[0]
    if (!file || !this.user) return
    if (file.size > 2 * 1024 * 1024) { this._toast('Image trop lourde (max 2MB)', 'error'); return }
    try {
      const ext = file.name.split('.').pop()
      const path = `${this.user.id}/avatar.${ext}`
      await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', this.user.id)
      document.getElementById('settings-avatar-preview').innerHTML = `<img src="${data.publicUrl}">`
      this._toast('Photo mise à jour ✓', 'success')
    } catch { this._toast('Erreur upload', 'error') }
  }

  // ── RANK SHOP ──
  openRankShop() {
    this._closeDropdown()
    if (!this.user) return
    const p = this.user.profile
    document.getElementById('shop-points-val').textContent = p.points
    document.getElementById('rank-shop-grid').innerHTML = RANKS.map(r => {
      const isCurrent = p.rank === r.id
      const canAfford = p.points >= r.cost
      return `<div class="rank-shop-row${isCurrent?' current':''}">
        <div class="rank-info">
          <div class="rank-emoji-big">${r.emoji}</div>
          <div><div class="rank-name-big" style="color:${r.color}">${r.id}</div>
          <div class="rank-cost-label">${r.cost===0?'Rang de départ':r.cost.toLocaleString('fr-FR')+' pts'}</div></div>
        </div>
        ${isCurrent
          ? `<button class="rank-buy-btn" style="color:${r.color};border-color:${r.border}" disabled>Actuel</button>`
          : r.cost===0 ? `<button class="rank-buy-btn" disabled style="color:rgba(255,255,255,0.2);border-color:rgba(255,255,255,0.1)">Gratuit</button>`
          : `<button class="rank-buy-btn" style="color:${r.color};border-color:${r.border}" ${!canAfford?'disabled':''} onclick="AuthNav.buyRank('${r.id}',${r.cost})">${canAfford?'Acheter':'Insuffisant'}</button>`
        }
      </div>`
    }).join('')
    document.getElementById('rank-shop-modal').classList.add('open'); document.body.style.overflow = 'hidden'
  }
  closeRankShop() { document.getElementById('rank-shop-modal').classList.remove('open'); document.body.style.overflow = '' }

  async buyRank(rankId, cost) {
    if (!this.user || this.user.profile.points < cost) { this._toast('Pas assez de points', 'error'); return }
    try {
      const newPoints = this.user.profile.points - cost
      await supabase.from('profiles').update({ rank: rankId, points: newPoints }).eq('id', this.user.id)
      await supabase.from('points_log').insert({ user_id: this.user.id, amount: -cost, reason: 'rank_purchase', ref_id: rankId })
      this.user.profile.rank = rankId; this.user.profile.points = newPoints
      this._updatePill(this.user.profile); this._buildDropdown(this.user.profile)
      this.closeRankShop(); this._toast(`Rang ${rankId} obtenu ! 🎉`, 'success')
    } catch(e) { this._toast('Erreur : ' + e.message, 'error') }
  }

  // ── FRIENDS ──
  async openFriends() {
    this._closeDropdown()
    if (!this.user) return
    document.getElementById('friends-panel').classList.add('open'); document.body.style.overflow = 'hidden'
    document.getElementById('friends-search-input').value = ''
    await this._loadFriends()
  }
  closeFriends() { document.getElementById('friends-panel').classList.remove('open'); document.body.style.overflow = '' }

  async _loadFriends() {
    const list = document.getElementById('friends-list')
    list.innerHTML = '<div class="friends-empty">Chargement...</div>'
    try {
      const friends = await getFriends(this.user.id)
      const { data: pending } = await supabase.from('friendships').select('id, requester:requester_id(id,username,display_name,avatar_url,rank)').eq('addressee_id', this.user.id).eq('status','pending')
      let html = ''
      if (pending?.length) {
        html += `<div class="friends-section-label">Demandes reçues (${pending.length})</div>`
        html += pending.map(f => `<div class="friend-row">
          <div class="friend-avatar">${f.requester.avatar_url?`<img src="${f.requester.avatar_url}">`:(f.requester.display_name||f.requester.username||'?')[0].toUpperCase()}</div>
          <div class="friend-info"><div class="friend-name">${f.requester.display_name||f.requester.username}</div><div class="friend-rank-label">${f.requester.rank}</div></div>
          <div class="friend-actions"><button class="friend-btn green" onclick="AuthNav.acceptFriend(${f.id})">Accepter</button><button class="friend-btn" onclick="AuthNav.declineFriend(${f.id})">Refuser</button></div>
        </div>`).join('')
        html += `<div style="height:1px;background:rgba(255,255,255,0.08);margin:4px 0"></div>`
      }
      if (friends.length) {
        html += `<div class="friends-section-label">Mes amis (${friends.length})</div>`
        html += friends.map(f => `<div class="friend-row">
          <div class="friend-avatar">${f.avatar_url?`<img src="${f.avatar_url}">`:(f.display_name||f.username||'?')[0].toUpperCase()}</div>
          <div class="friend-info"><div class="friend-name">${f.display_name||f.username}</div><div class="friend-rank-label">${f.rank}</div></div>
          <div class="friend-actions"><button class="friend-btn primary" onclick="AuthNav.openMP('${f.id}','${(f.display_name||f.username).replace(/'/g,"'")}')">MP</button></div>
        </div>`).join('')
      }
      list.innerHTML = html || '<div class="friends-empty">Aucun ami · Recherche ↑</div>'
    } catch { list.innerHTML = '<div class="friends-empty">Erreur de chargement</div>' }
  }

  async searchUsers(query) {
    if (!query || query.length < 2) { await this._loadFriends(); return }
    const { data } = await supabase.from('profiles').select('id,username,display_name,avatar_url,rank').ilike('username',`%${query}%`).neq('id', this.user.id).limit(10)
    const list = document.getElementById('friends-list')
    if (!data?.length) { list.innerHTML = '<div class="friends-empty">Aucun résultat</div>'; return }
    list.innerHTML = `<div class="friends-section-label">Résultats</div>` + data.map(u => `<div class="friend-row">
      <div class="friend-avatar">${u.avatar_url?`<img src="${u.avatar_url}">`:(u.display_name||u.username||'?')[0].toUpperCase()}</div>
      <div class="friend-info"><div class="friend-name">${u.display_name||u.username}</div><div class="friend-rank-label">${u.rank}</div></div>
      <div class="friend-actions"><button class="friend-btn primary" onclick="AuthNav.addFriend('${u.id}')">+ Ajouter</button></div>
    </div>`).join('')
  }

  async addFriend(id) {
    try {
      await sendFriendRequest(this.user.id, id)
      // Notif pour l'autre user
      await supabase.from('notifications').insert({ user_id: id, type:'friend_request', from_user_id: this.user.id })
      this._toast('Demande envoyée !', 'success')
    } catch { this._toast('Demande déjà envoyée', 'error') }
  }

  async acceptFriend(id) {
    await acceptFriendRequest(id)
    // Récupère requester pour notif
    const { data: f } = await supabase.from('friendships').select('requester_id').eq('id', id).single()
    if (f) await supabase.from('notifications').insert({ user_id: f.requester_id, type:'friend_accepted', from_user_id: this.user.id })
    await this._checkNotifications(); await this._loadFriends()
  }

  async declineFriend(id) { await supabase.from('friendships').delete().eq('id', id); await this._checkNotifications(); await this._loadFriends() }

  // ── MP ──
  async openMP(friendId, friendName) {
    this.currentMPFriend = { id: friendId, name: friendName }
    document.getElementById('mp-username').textContent = friendName
    document.getElementById('mp-messages').innerHTML = ''
    document.getElementById('mp-modal').classList.add('open')
    await this._loadMessages()
    await markMessagesRead(friendId, this.user.id)
    this._subscribeMP(friendId)
  }
  closeMP() { document.getElementById('mp-modal').classList.remove('open'); if (this.mpChannel) supabase.removeChannel(this.mpChannel); this.currentMPFriend = null }

  async _loadMessages() {
    if (!this.currentMPFriend) return
    const msgs = await getConversation(this.user.id, this.currentMPFriend.id)
    const c = document.getElementById('mp-messages')
    c.innerHTML = msgs.map(m => `<div class="mp-msg ${m.sender_id===this.user.id?'mine':'theirs'}">${m.content}<span class="mp-msg-time">${new Date(m.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span></div>`).join('')
    c.scrollTop = c.scrollHeight
  }

  _subscribeMP(friendId) {
    if (this.mpChannel) supabase.removeChannel(this.mpChannel)
    this.mpChannel = supabase.channel('mp-'+friendId)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages', filter:`receiver_id=eq.${this.user.id}` }, () => this._loadMessages())
      .subscribe()
  }

  async sendMP() {
    const input = document.getElementById('mp-input')
    const content = input.value.trim()
    if (!content || !this.currentMPFriend || !this.user) return
    input.value = ''
    await sendMessage(this.user.id, this.currentMPFriend.id, content)
    await this._loadMessages()
  }

  _toast(msg, type = '') {
    const t = document.getElementById('an-toast')
    t.textContent = msg; t.className = 'show ' + type
    clearTimeout(t._t); t._t = setTimeout(() => t.className = '', 3000)
  }
}

const AuthNav = new AuthNavController()
window.AuthNav = AuthNav
AuthNav.init()
