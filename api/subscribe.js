// api/subscribe.js
import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM || 'NewsPorto <notifications@newsporto.fr>';

function buildWelcomeEmail(email) {
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Bienvenue chez NewsPorto</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background-color: #f0f0f0 !important; }
    .email-wrapper { background-color: #f0f0f0; padding: 32px 16px; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; }
    .inner-card { background: #000000; margin: 0 28px 0; }
    .inner-padding { padding: 36px 32px; }

    @media screen and (max-width: 600px) {
      .email-wrapper { padding: 0 !important; }
      .email-container { border: none !important; }
      .inner-card { margin: 0 !important; border-left: none !important; border-right: none !important; }
      .inner-padding { padding: 28px 20px !important; }
      .header-cell { padding: 20px !important; }
      .perk-cell { padding: 12px 20px !important; }
      .footer-cell { padding: 20px !important; }
      .title-text { font-size: 26px !important; }
      .hide-mobile { display: none !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;">
<div class="email-wrapper">

  <table class="email-container" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e0e0e0;">

    <!-- BARRE BLEUE TOP -->
    <tr><td style="height:4px;background:#003DA5;font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- HEADER -->
    <tr>
      <td class="header-cell" style="padding:28px 28px 24px;background:#ffffff;border-bottom:1px solid #f0f0f0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-right:14px;vertical-align:middle;">
              <img src="https://newsporto.fr/Logo.png" width="44" height="44" alt="NewsPorto" style="display:block;border:0;">
            </td>
            <td style="vertical-align:middle;">
              <span style="font-family:Georgia,serif;font-size:19px;font-weight:700;letter-spacing:5px;text-transform:uppercase;color:#000000;display:block;">NEWSPORTO</span>
              <span style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#999999;">Le média FC Porto en français</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ENCADRÉ NOIR PRINCIPAL -->
    <tr>
      <td style="padding:28px 28px 0;background:#ffffff;">
        <table class="inner-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000;">
          <tr><td style="height:2px;background:#003DA5;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr>
            <td class="inner-padding" style="padding:36px 32px;">

              <!-- Eyebrow -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td style="width:22px;height:2px;background:#003DA5;padding-right:10px;vertical-align:middle;font-size:0;line-height:2px;">&nbsp;</td>
                  <td style="font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.4);">Bienvenue dans la communauté</td>
                </tr>
              </table>

              <!-- Titre -->
              <h1 class="title-text" style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;line-height:1.2;color:#ffffff;">
                Tu es officiellement<br>un Portista.
              </h1>

              <!-- Texte -->
              <p style="margin:0 0 28px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.75;color:rgba(255,255,255,0.6);">
                Merci de rejoindre la communauté NewsPorto. Tu recevras désormais toute l'actualité du FC Porto directement dans ta boîte mail.
              </p>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border:1px solid rgba(255,255,255,0.5);">
                    <a href="https://newsporto.fr" style="display:inline-block;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;padding:13px 32px;">
                      ALLER SUR LE SITE &nbsp;→
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- PERKS sur fond blanc -->
    <tr>
      <td style="padding:0 28px;background:#ffffff;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:1px solid #eeeeee;border-right:1px solid #eeeeee;border-bottom:1px solid #eeeeee;">

          <tr>
            <td class="perk-cell" style="padding:16px 24px;border-bottom:1px solid #f5f5f5;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:14px;font-size:20px;vertical-align:middle;">📰</td>
                  <td>
                    <span style="font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#111111;display:block;">Chaque nouvel article</span>
                    <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#888888;">Transferts, analyses, Liga, Europa League</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="perk-cell" style="padding:16px 24px;border-bottom:1px solid #f5f5f5;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:14px;font-size:20px;vertical-align:middle;">⚽</td>
                  <td>
                    <span style="font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#111111;display:block;">Rappel avant chaque match</span>
                    <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#888888;">La veille et le jour J avec l'heure du coup d'envoi</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="perk-cell" style="padding:16px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:14px;font-size:20px;vertical-align:middle;">🐉</td>
                  <td>
                    <span style="font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#111111;display:block;">Força Porto, rien d'autre</span>
                    <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#888888;">Pas de pub. Pas de spam. Juste Porto.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>

    <!-- FOOTER BLANC -->
    <tr>
      <td class="footer-cell" style="padding:20px 28px 24px;background:#ffffff;border-top:1px solid #f0f0f0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:1.8;color:#aaaaaa;">
                <a href="https://newsporto.fr" style="color:#555555;text-decoration:none;font-weight:700;">newsporto.fr</a>
                &nbsp;·&nbsp;
                <a href="https://discord.gg/YCcuMHmGcH" style="color:#555555;text-decoration:none;">Discord</a>
                &nbsp;·&nbsp;
                <a href="https://newsporto.fr/unsubscribe?email=${encodeURIComponent(email)}" style="color:#aaaaaa;text-decoration:underline;">Se désabonner</a>
              </p>
            </td>
            <td align="right" class="hide-mobile">
              <span style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:1px;color:#cccccc;">© 2026 NewsPorto FR</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- BARRE BLEUE BOTTOM -->
    <tr><td style="height:2px;background:#003DA5;font-size:0;line-height:0;">&nbsp;</td></tr>

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

  const { email, pushSubscription } = req.body || {};

  try {
    if (email) {
      const emailKey = `subscriber:email:${email.toLowerCase().trim()}`;
      const exists   = await kv.get(emailKey).catch(() => null);

      if (!exists) {
        await kv.set(emailKey, { email: email.toLowerCase().trim(), createdAt: new Date().toISOString() });
        await kv.sadd('subscribers:emails', email.toLowerCase().trim());

        await resend.emails.send({
          from:    FROM,
          to:      email,
          subject: '🐉 Bienvenue chez NewsPorto !',
          html:    buildWelcomeEmail(email),
        });
      }
    }

    if (pushSubscription) {
      const endpoint = pushSubscription.endpoint;
      const pushKey  = `subscriber:push:${Buffer.from(endpoint).toString('base64').slice(0, 64)}`;
      await kv.set(pushKey, { subscription: pushSubscription, createdAt: new Date().toISOString() });
      await kv.sadd('subscribers:push', pushKey);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('subscribe error:', err);
    return res.status(500).json({ error: err.message });
  }
}
