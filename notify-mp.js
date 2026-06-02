// api/notify-mp.js — Email quand on reçoit un MP
// Body: { toUserId, fromName, messagePreview }

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend  = new Resend(process.env.RESEND_API_KEY);
const FROM    = process.env.RESEND_FROM || 'NewsPorto <notifications@newsporto.fr>';

// Admin client pour récupérer l'email du destinataire
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // ← à ajouter dans Vercel env vars
);

function buildEmail({ toName, fromName, messagePreview }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Nouveau message — NewsPorto</title>
  <style>
    body { margin:0;padding:0;background:#f0f0f0; }
    @media(max-width:600px){ .wrap{padding:0!important} .box{border:none!important} .inner{padding:24px 20px!important} .head{padding:20px!important} .foot{padding:20px!important} }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0f0f0">
<div class="wrap" style="padding:32px 16px">
<table role="presentation" class="box" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e0e0e0">

  <tr><td style="height:4px;background:#003DA5;font-size:0">&nbsp;</td></tr>

  <!-- HEADER -->
  <tr>
    <td class="head" style="padding:24px 28px;border-bottom:1px solid #f0f0f0">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right:12px;vertical-align:middle">
            <img src="https://newsporto.fr/Logo.png" width="38" height="38" alt="NewsPorto" style="display:block">
          </td>
          <td style="vertical-align:middle">
            <span style="font-family:Georgia,serif;font-size:17px;font-weight:700;letter-spacing:5px;text-transform:uppercase;color:#000;display:block">NEWSPORTO</span>
            <span style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#999">Message privé</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CORPS NOIR -->
  <tr>
    <td style="padding:24px 28px 0;background:#fff">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000">
        <tr><td style="height:2px;background:#003DA5;font-size:0">&nbsp;</td></tr>
        <tr>
          <td class="inner" style="padding:32px 28px">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
              <tr>
                <td style="width:20px;height:2px;background:#003DA5;padding-right:10px;vertical-align:middle;font-size:0">&nbsp;</td>
                <td style="font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.4)">Nouveau message privé</td>
              </tr>
            </table>
            <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:26px;font-weight:700;line-height:1.2;color:#fff">
              ${fromName} t'a<br>envoyé un message
            </h1>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border-left:2px solid #003DA5">
              <tr>
                <td style="padding:12px 16px">
                  <span style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.55);font-style:italic">"${messagePreview}"</span>
                </td>
              </tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border:1px solid rgba(255,255,255,0.5)">
                  <a href="https://newsporto.fr" style="display:inline-block;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#fff;text-decoration:none;padding:12px 28px">RÉPONDRE &nbsp;→</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- DETAIL -->
  <tr>
    <td style="padding:0 28px;background:#fff">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-top:none">
        <tr>
          <td style="padding:14px 20px">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:12px;font-size:18px;vertical-align:middle">✉️</td>
                <td>
                  <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#111;display:block">Message de ${fromName}</span>
                  <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#888">Connecte-toi pour lire et répondre</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td class="foot" style="padding:18px 28px;background:#fff;border-top:1px solid #f0f0f0">
      <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:1.8;color:#aaa">
        <a href="https://newsporto.fr" style="color:#555;text-decoration:none;font-weight:700">newsporto.fr</a>
        &nbsp;·&nbsp;
        <a href="https://discord.gg/YCcuMHmGcH" style="color:#555;text-decoration:none">Discord</a>
        &nbsp;·&nbsp;
        <span style="color:#ccc">© 2026 NewsPorto FR</span>
      </p>
    </td>
  </tr>

  <tr><td style="height:2px;background:#003DA5;font-size:0">&nbsp;</td></tr>
</table>
</div>
</body>
</html>`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { toUserId, fromName, messagePreview } = req.body || {};
  if (!toUserId || !fromName || !messagePreview) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // Récupère l'email du destinataire via admin SDK
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(toUserId);
    if (error || !user?.email) return res.status(200).json({ ok: true, skipped: 'no email' });

    // Récupère le prénom affiché
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('display_name, username')
      .eq('id', toUserId)
      .single();
    const toName = profile?.display_name || profile?.username || 'Portista';

    await resend.emails.send({
      from:    FROM,
      to:      user.email,
      subject: `✉️ ${fromName} t'a envoyé un message — NewsPorto`,
      html:    buildEmail({ toName, fromName, messagePreview }),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('notify-mp error:', err);
    return res.status(500).json({ error: err.message });
  }
}
