// api/notify-article.js
import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM || 'NewsPorto <notifications@newsporto.fr>';

const CAT_LABELS = {
  europe: 'Europa League', analyse: 'Analyse', transfert: 'Mercato',
  liga: 'Liga Portugal', interview: 'Interview', actu: 'Actu',
};

function buildArticleEmail({ title, excerpt, catLabel, fullUrl, imageUrl, email }) {
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
  <style>
    /* Reset */
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background-color: #f0f0f0 !important; }

    /* ── DESKTOP : encadré 600px centré ── */
    .email-wrapper { background-color: #f0f0f0; padding: 32px 16px; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; }
    .inner-card { background: #000000; margin: 0 28px 28px; border: 1px solid rgba(255,255,255,0.1); }
    .inner-padding { padding: 32px 32px; }

    /* ── MOBILE : plein écran, supprime marges ── */
    @media screen and (max-width: 600px) {
      .email-wrapper { padding: 0 !important; }
      .email-container { border: none !important; border-radius: 0 !important; }
      .inner-card { margin: 0 0 0 0 !important; border-left: none !important; border-right: none !important; }
      .inner-padding { padding: 24px 20px !important; }
      .header-cell { padding: 20px 20px !important; }
      .footer-cell { padding: 20px 20px !important; }
      .title-text { font-size: 24px !important; }
      .cover-img { height: 200px !important; }
      .cta-btn { display: block !important; text-align: center !important; }
      .hide-mobile { display: none !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;">
<div class="email-wrapper">

  <!-- Container blanc -->
  <table class="email-container" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e0e0e0;">

    <!-- BARRE BLEUE TOP -->
    <tr><td style="height:4px;background:#003DA5;font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- HEADER BLANC : logo + catégorie -->
    <tr>
      <td class="header-cell" style="padding:24px 28px;background:#ffffff;border-bottom:1px solid #f0f0f0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    <img src="https://newsporto.fr/Logo.png" width="36" height="36" alt="NP" style="display:block;border:0;">
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-family:Georgia,serif;font-size:17px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#000000;">NEWSPORTO</span><br>
                    <span style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#999999;">Le média FC Porto en français</span>
                  </td>
                </tr>
              </table>
            </td>
            <td align="right" style="vertical-align:middle;" class="hide-mobile">
              <span style="font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#ffffff;background:#003DA5;padding:5px 14px;display:inline-block;">
                ${catLabel.toUpperCase()}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${imageUrl ? `
    <!-- IMAGE COVER pleine largeur -->
    <tr>
      <td style="padding:0;line-height:0;font-size:0;">
        <img class="cover-img" src="${imageUrl}" width="600" alt="${title}"
          style="display:block;width:100%;max-width:600px;height:280px;object-fit:cover;border:0;">
      </td>
    </tr>` : ''}

    <!-- ENCADRÉ NOIR -->
    <tr>
      <td style="padding:0 28px 28px;background:#ffffff;">
        <table class="inner-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000;">

          <!-- Barre bleue top de l'encadré -->
          <tr><td style="height:2px;background:#003DA5;font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr>
            <td class="inner-padding" style="padding:32px;">

              <!-- Badge catégorie mobile (caché desktop) -->
              <div style="display:none;margin-bottom:16px;">
                <span style="font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#ffffff;background:#003DA5;padding:4px 12px;">
                  ${catLabel.toUpperCase()}
                </span>
              </div>

              <!-- Eyebrow -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
                <tr>
                  <td style="width:22px;height:2px;background:#003DA5;vertical-align:middle;padding-right:10px;font-size:0;line-height:2px;">&nbsp;</td>
                  <td style="font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.45);vertical-align:middle;line-height:1;">NOUVEL ARTICLE</td>
                </tr>
              </table>

              <!-- Titre -->
              <h1 class="title-text" style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;line-height:1.2;color:#ffffff;letter-spacing:-0.3px;">
                ${title}
              </h1>

              ${excerpt ? `
              <!-- Excerpt -->
              <p style="margin:0 0 28px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.75;color:rgba(255,255,255,0.6);">
                ${excerpt}
              </p>` : ''}

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border:1px solid rgba(255,255,255,0.5);">
                    <a class="cta-btn" href="${fullUrl}"
                      style="display:inline-block;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;padding:13px 32px;">
                      LIRE L'ARTICLE &nbsp;→
                    </a>
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, excerpt, category, url, imageUrl } = req.body || {};
  if (!title || !url) return res.status(400).json({ error: 'title et url requis' });

  const catLabel = CAT_LABELS[category] || category || 'Actu';
  const fullUrl  = url.startsWith('http') ? url : `https://newsporto.fr/${url}`;

  try {
    const emails = await kv.smembers('subscribers:emails');
    let emailsSent = 0;

    if (emails && emails.length > 0) {
      for (const emailAddr of emails) {
        await resend.emails.send({
          from:    FROM,
          to:      [emailAddr],
          subject: `${catLabel} · ${title}`,
          html:    buildArticleEmail({ title, excerpt, catLabel, fullUrl, imageUrl, email: emailAddr }),
        });
        emailsSent++;
      }
    }

    // Push
    let pushSent = 0;
    try {
      const webpush = await import('web-push');
      webpush.setVapidDetails('mailto:contact@newsporto.fr', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
      const pushKeys = await kv.smembers('subscribers:push');
      if (pushKeys?.length) {
        const payload = JSON.stringify({ title: `NewsPorto · ${catLabel}`, body: title, url: fullUrl, icon: 'https://newsporto.fr/Logo.png' });
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
