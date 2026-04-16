// api/notify-article.js
// Appelé par l'admin quand un article est publié
// POST { title, excerpt, category, url, imageUrl? }

import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM || 'NewsPorto <notifications@newsporto.fr>';

const CAT_LABELS = {
  europe:    'Europa League',
  analyse:   'Analyse',
  transfert: 'Mercato',
  liga:      'Liga Portugal',
  interview: 'Interview',
  actu:      'Actu',
};

// ── Template email article ────────────────────────────────────────────────────
function buildArticleEmail({ title, excerpt, catLabel, fullUrl, imageUrl, email }) {
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#000000;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<!-- Preheader invisible -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#000000;line-height:1px;">
  ${catLabel} · ${title} — NewsPorto, le média FC Porto en français 🐉
</div>

<!-- Wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#000000;">
<tr><td align="center" style="padding:32px 16px;">

  <!-- Container principal -->
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#000000;border:1px solid rgba(255,255,255,0.08);">

    <!-- BARRE BLEUE TOP -->
    <tr>
      <td style="padding:0;height:3px;background:linear-gradient(90deg,#003DA5 0%,#0052CC 50%,#003DA5 100%);font-size:0;line-height:0;">&nbsp;</td>
    </tr>

    <!-- HEADER -->
    <tr>
      <td style="padding:28px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;">
              <!-- Logo + nom -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:14px;vertical-align:middle;">
                    <img src="https://newsporto.fr/Logo.png" width="40" height="40" alt="NP" style="display:block;border:0;outline:none;border-radius:0;">
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;letter-spacing:5px;text-transform:uppercase;color:#ffffff;line-height:1;">NEWSPORTO</span>
                    <br>
                    <span style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.3);line-height:1.4;">Le média FC Porto en français</span>
                  </td>
                </tr>
              </table>
            </td>
            <td align="right" style="vertical-align:middle;">
              <!-- Badge catégorie -->
              <span style="font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#003DA5;border:1px solid #003DA5;padding:4px 12px;display:inline-block;">
                ${catLabel.toUpperCase()}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${imageUrl ? `
    <!-- IMAGE COVER -->
    <tr>
      <td style="padding:0;line-height:0;font-size:0;">
        <img src="${imageUrl}" width="600" alt="${title}" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;">
        <!-- Overlay simulé via dégradé -->
      </td>
    </tr>` : `
    <!-- SÉPARATEUR DÉCORATIF SANS IMAGE -->
    <tr>
      <td style="padding:0 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="height:1px;background:rgba(255,255,255,0.05);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>`}

    <!-- CORPS -->
    <tr>
      <td style="padding:36px 40px 28px;">

        <!-- Eyebrow ligne déco -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
          <tr>
            <td style="width:24px;height:1px;background:#003DA5;vertical-align:middle;padding-right:10px;font-size:0;line-height:0;">&nbsp;</td>
            <td style="font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.4);vertical-align:middle;">Nouvel article</td>
          </tr>
        </table>

        <!-- Titre -->
        <h1 style="margin:0 0 20px 0;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;line-height:1.2;color:#ffffff;letter-spacing:-0.5px;">
          ${title}
        </h1>

        ${excerpt ? `
        <!-- Excerpt -->
        <p style="margin:0 0 32px 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:rgba(255,255,255,0.6);">
          ${excerpt}
        </p>` : ''}

        <!-- CTA Button -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:#ffffff;padding:0;">
              <a href="${fullUrl}" style="display:inline-block;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#000000;text-decoration:none;padding:15px 36px;border:none;">
                LIRE L'ARTICLE &nbsp;→
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
          <tr>
            <td style="height:1px;background:rgba(255,255,255,0.06);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="padding:24px 40px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <!-- Dragon + tagline -->
              <p style="margin:0 0 10px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:rgba(255,255,255,0.06);letter-spacing:2px;">
                🐉 &nbsp; FORÇA PORTO
              </p>
              <!-- Liens -->
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
  <!-- /Container -->

</td></tr>
</table>
<!-- /Wrapper -->

</body>
</html>`;
}

// ── Handler principal ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, excerpt, category, url, imageUrl } = req.body || {};
  if (!title || !url) return res.status(400).json({ error: 'title et url requis' });

  const catLabel = CAT_LABELS[category] || category || 'Actu';
  const fullUrl  = url.startsWith('http') ? url : `https://newsporto.fr/${url}`;

  try {
    const emails = await kv.smembers('subscribers:emails');
    let emailsSent = 0;

    if (emails && emails.length > 0) {
      // Envoi individuel pour personnaliser le lien désabonnement
      for (const emailAddr of emails) {
        await resend.emails.send({
          from:    FROM,
          to:      [emailAddr],
          subject: `${catLabel.toUpperCase()} · ${title}`,
          html:    buildArticleEmail({
            title, excerpt, catLabel, fullUrl, imageUrl,
            email: emailAddr,
          }),
        });
        emailsSent++;
      }
    }

    // Push notifications
    let pushSent = 0;
    try {
      const webpush = await import('web-push');
      webpush.setVapidDetails(
        'mailto:contact@newsporto.fr',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      const pushKeys = await kv.smembers('subscribers:push');
      if (pushKeys?.length) {
        const payload = JSON.stringify({
          title:  `NewsPorto · ${catLabel}`,
          body:   title,
          url:    fullUrl,
          icon:   'https://newsporto.fr/Logo.png',
          badge:  'https://newsporto.fr/favicon.ico',
        });
        await Promise.allSettled(pushKeys.map(async (key) => {
          const data = await kv.get(key);
          if (!data?.subscription) return;
          try { await webpush.sendNotification(data.subscription, payload); pushSent++; }
          catch (e) { if (e.statusCode === 410) { await kv.del(key); await kv.srem('subscribers:push', key); } }
        }));
      }
    } catch (e) { console.warn('Push skipped:', e.message); }

    return res.status(200).json({ ok: true, emailsSent, pushSent });
  } catch (err) {
    console.error('notify-article error:', err);
    return res.status(500).json({ error: err.message });
  }
}
