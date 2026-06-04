// api/notify-forum.js — Email quand quelqu'un répond à ton thread ou ton message
// Body: { toUserId, fromName, threadTitle, type: 'reply'|'reply_to_reply' }

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM || 'NewsPorto <notifications@newsporto.fr>';
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function buildEmail({ toName, fromName, threadTitle, type }) {
  const isReply = type === 'reply_to_reply';
  const subtitle = isReply ? 'On a répondu à ton message' : 'Nouvelle réponse sur ton thread';
  const label    = isReply ? 'Forum · Réponse à ton message' : 'Forum · Réponse à ton thread';
  const title    = isReply
    ? `${fromName} a répondu<br>à ton message`
    : `${fromName} a répondu<br>à ton thread`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{margin:0;padding:0;background:#f0f0f0;-webkit-text-size-adjust:100%}
    @media(max-width:600px){.wrap{padding:0!important}.box{border:none!important}.inner{padding:24px 16px!important}.head{padding:16px!important}.foot{padding:16px!important}.hero{font-size:22px!important}}
  </style>
</head>
<body style="margin:0;padding:0;background:#f0f0f0">
<div class="wrap" style="padding:32px 16px">
<table role="presentation" class="box" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e0e0e0">
  <tr><td style="height:4px;background:#003DA5;font-size:0">&nbsp;</td></tr>
  <tr>
    <td class="head" style="padding:20px 28px;border-bottom:1px solid #f0f0f0">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:12px;vertical-align:middle"><img src="https://newsporto.fr/Logo.png" width="36" height="36" alt="NP" style="display:block"></td>
        <td style="vertical-align:middle">
          <span style="font-family:Georgia,serif;font-size:16px;font-weight:700;letter-spacing:5px;text-transform:uppercase;color:#000;display:block">NEWSPORTO</span>
          <span style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#999">${subtitle}</span>
        </td>
      </tr></table>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 28px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000">
        <tr><td style="height:2px;background:#003DA5;font-size:0">&nbsp;</td></tr>
        <tr><td class="inner" style="padding:28px">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:14px"><tr>
            <td style="width:18px;height:2px;background:#003DA5;padding-right:10px;vertical-align:middle;font-size:0">&nbsp;</td>
            <td style="font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.4)">${label}</td>
          </tr></table>
          <h1 class="hero" style="margin:0 0 16px;font-family:Georgia,serif;font-size:26px;font-weight:700;line-height:1.25;color:#fff">💬 ${title}</h1>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-left:2px solid #003DA5"><tr>
            <td style="padding:10px 16px">
              <span style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.5);font-style:italic">${threadTitle}</span>
            </td>
          </tr></table>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="border:1px solid rgba(255,255,255,0.5)">
              <a href="https://newsporto.fr/forum.html" style="display:inline-block;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#fff;text-decoration:none;padding:12px 28px">VOIR LA RÉPONSE &nbsp;→</a>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 28px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-top:none"><tr>
        <td style="padding:14px 20px">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:12px;font-size:18px;vertical-align:middle">💬</td>
            <td>
              <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#111;display:block">Nouvelle réponse de ${fromName}</span>
              <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#888">Rejoins la discussion sur le forum</span>
            </td>
          </tr></table>
        </td>
      </tr></table>
    </td>
  </tr>
  <tr>
    <td class="foot" style="padding:16px 28px;border-top:1px solid #f0f0f0">
      <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:1.8;color:#aaa">
        <a href="https://newsporto.fr" style="color:#555;text-decoration:none;font-weight:700">newsporto.fr</a>
        &nbsp;·&nbsp;<a href="https://discord.gg/YCcuMHmGcH" style="color:#555;text-decoration:none">Discord</a>
        &nbsp;·&nbsp;<span style="color:#ccc">© 2026 NewsPorto FR</span>
      </p>
    </td>
  </tr>
  <tr><td style="height:2px;background:#003DA5;font-size:0">&nbsp;</td></tr>
</table>
</div>
</body>
</html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { toUserId, fromName, threadTitle, type = 'reply' } = req.body || {};
  if (!toUserId || !fromName) return res.status(400).json({ error: 'Missing fields' });

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(toUserId);
    if (error || !user?.email) return res.status(200).json({ ok: true, skipped: 'no email' });

    await resend.emails.send({
      from: FROM, to: user.email,
      subject: `💬 ${fromName} a répondu à ${type === 'reply_to_reply' ? 'ton message' : 'ton thread'} — NewsPorto`,
      html: buildEmail({ toName: '', fromName, threadTitle: threadTitle || 'Discussion', type }),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('notify-forum error:', err);
    return res.status(500).json({ error: err.message });
  }
}
