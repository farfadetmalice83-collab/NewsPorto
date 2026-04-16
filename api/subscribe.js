// api/subscribe.js
// Enregistre un abonné et envoie l'email de bienvenue
// POST { email, pushSubscription? }

import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM || 'NewsPorto <notifications@newsporto.fr>';

// ── Template email de bienvenue ───────────────────────────────────────────────
function buildWelcomeEmail(email) {
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Bienvenue chez NewsPorto</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<!-- Preheader invisible -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#000000;line-height:1px;">
  Tu fais maintenant partie de la communauté NewsPorto. Força Porto 🐉
</div>

<!-- Wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#000000;">
<tr><td align="center" style="padding:32px 16px;">

  <!-- Container -->
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#000000;border:1px solid rgba(255,255,255,0.08);">

    <!-- BARRE BLEUE TOP -->
    <tr>
      <td style="padding:0;height:3px;background:linear-gradient(90deg,#003DA5 0%,#0052CC 50%,#003DA5 100%);font-size:0;line-height:0;">&nbsp;</td>
    </tr>

    <!-- HEADER LOGO -->
    <tr>
      <td align="center" style="padding:40px 40px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <img src="https://newsporto.fr/Logo.png" width="64" height="64" alt="NewsPorto" style="display:block;border:0;outline:none;">
            </td>
          </tr>
          <tr>
            <td align="center">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;letter-spacing:6px;text-transform:uppercase;color:#ffffff;display:block;">NEWSPORTO</span>
              <span style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.3);display:block;margin-top:6px;">Le média FC Porto en français</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- HERO TEXTE -->
    <tr>
      <td style="padding:44px 40px 36px;">

        <!-- Eyebrow -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
          <tr>
            <td style="width:24px;height:1px;background:#003DA5;vertical-align:middle;padding-right:10px;font-size:0;line-height:0;">&nbsp;</td>
            <td style="font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.4);vertical-align:middle;">Bienvenue dans la communauté</td>
          </tr>
        </table>

        <!-- Titre principal -->
        <h1 style="margin:0 0 20px 0;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:700;line-height:1.15;color:#ffffff;letter-spacing:-0.5px;">
          Tu es officiellement<br>un Portista.
        </h1>

        <!-- Texte intro -->
        <p style="margin:0 0 32px 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:rgba(255,255,255,0.6);">
          Merci de rejoindre la communauté NewsPorto. Tu recevras désormais toute l'actualité du FC Porto directement dans ta boîte mail.
        </p>

        <!-- 3 perks -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
          <tr>
            <td style="padding:14px 0;border-top:1px solid rgba(255,255,255,0.06);">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:16px;font-size:18px;vertical-align:middle;">📰</td>
                  <td>
                    <span style="font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.8);">Chaque nouvel article publié</span><br>
                    <span style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.35);">Transferts, analyses, Liga, Europa League</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 0;border-top:1px solid rgba(255,255,255,0.06);">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:16px;font-size:18px;vertical-align:middle;">⚽</td>
                  <td>
                    <span style="font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.8);">Rappel avant chaque match</span><br>
                    <span style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.35);">La veille et le jour J avec l'heure de coup d'envoi</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 0;border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06);">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:16px;font-size:18px;vertical-align:middle;">🐉</td>
                  <td>
                    <span style="font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.8);">Força Porto, rien d'autre</span><br>
                    <span style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.35);">Pas de pub. Pas de spam. Juste Porto.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:#ffffff;padding:0;">
              <a href="https://newsporto.fr" style="display:inline-block;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#000000;text-decoration:none;padding:15px 36px;">
                ALLER SUR LE SITE &nbsp;→
              </a>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- DIVIDER -->
    <tr>
      <td style="padding:0 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="height:1px;background:rgba(255,255,255,0.06);font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="padding:24px 40px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <p style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:20px;color:rgba(255,255,255,0.05);">🐉 &nbsp; FORÇA PORTO</p>
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:1.8;color:rgba(255,255,255,0.2);">
                <a href="https://newsporto.fr" style="color:rgba(255,255,255,0.35);text-decoration:none;">newsporto.fr</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="https://discord.gg/YCcuMHmGcH" style="color:rgba(255,255,255,0.35);text-decoration:none;">Discord</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="https://newsporto.fr/unsubscribe?email=${encodeURIComponent(email)}" style="color:rgba(255,255,255,0.2);text-decoration:underline;">Se désabonner</a>
              </p>
            </td>
            <td align="right" style="vertical-align:bottom;">
              <span style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.1);">© 2026 NewsPorto FR</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- BARRE BLEUE BOTTOM -->
    <tr>
      <td style="padding:0;height:1px;background:rgba(0,61,165,0.4);font-size:0;line-height:0;">&nbsp;</td>
    </tr>

  </table>

</td></tr>
</table>

</body>
</html>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, pushSubscription } = req.body || {};

  try {
    // ── Email ─────────────────────────────────────────────────────────────────
    if (email) {
      const emailKey = `subscriber:email:${email.toLowerCase().trim()}`;
      const exists   = await kv.get(emailKey).catch(() => null);

      if (!exists) {
        await kv.set(emailKey, {
          email:     email.toLowerCase().trim(),
          createdAt: new Date().toISOString(),
        });
        await kv.sadd('subscribers:emails', email.toLowerCase().trim());

        // Email de bienvenue
        await resend.emails.send({
          from:    FROM,
          to:      email,
          subject: '🐉 Bienvenue chez NewsPorto !',
          html:    buildWelcomeEmail(email),
        });
      }
    }

    // ── Push ──────────────────────────────────────────────────────────────────
    if (pushSubscription) {
      const endpoint = pushSubscription.endpoint;
      const pushKey  = `subscriber:push:${Buffer.from(endpoint).toString('base64').slice(0, 64)}`;
      await kv.set(pushKey, {
        subscription: pushSubscription,
        createdAt:    new Date().toISOString(),
      });
      await kv.sadd('subscribers:push', pushKey);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('subscribe error:', err);
    return res.status(500).json({ error: err.message });
  }
}
