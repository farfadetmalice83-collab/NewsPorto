// api/notify-article.js
// Appelé par ta page de publication quand un article est publié
// POST { title, excerpt, category, url, imageUrl?, secret }

import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM || 'NewsPorto <notifications@newsporto.fr>';
const SECRET = process.env.NOTIFY_SECRET; // clé secrète pour sécuriser l'endpoint

const CAT_LABELS = {
  europe:    'Europa League',
  analyse:   'Analyse',
  transfert: 'Mercato',
  liga:      'Liga Portugal',
  interview: 'Interview',
  actu:      'Actu',
};


// ── Template email article ───────────────────────────────────────────────────
function buildArticleEmail({ title, excerpt, catLabel, fullUrl, imageUrl, email }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#000;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000;">
    <tr><td align="center" style="padding:0;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#000;">

        <!-- HEADER -->
        <tr>
          <td style="padding:0;border-bottom:2px solid #003DA5;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:24px 32px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding-right:12px;vertical-align:middle;">
                        <img src="https://newsporto.fr/Logo.png" width="36" height="36" alt="NewsPorto" style="display:block;object-fit:contain;">
                      </td>
                      <td style="vertical-align:middle;">
                        <span style="font-family:Georgia,serif;font-size:22px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;color:#ffffff;">NEWSPORTO</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="padding:24px 32px;text-align:right;vertical-align:middle;">
                  <span style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.35);">Le média FC Porto en français</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CATEGORY BADGE -->
        <tr>
          <td style="padding:28px 32px 0;">
            <span style="font-size:9px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;color:#003DA5;border-left:2px solid #003DA5;padding-left:10px;">— ${catLabel}</span>
          </td>
        </tr>

        <!-- TITLE -->
        <tr>
          <td style="padding:16px 32px 20px;">
            <h1 style="margin:0;font-size:32px;line-height:1.15;color:#ffffff;font-family:Georgia,serif;font-weight:bold;">${title}</h1>
          </td>
        </tr>

        ${imageUrl ? `
        <!-- IMAGE -->
        <tr>
          <td style="padding:0 32px 24px;">
            <img src="${imageUrl}" width="536" alt="${title}" style="display:block;width:100%;max-width:536px;height:auto;object-fit:cover;border:1px solid rgba(255,255,255,0.1);">
          </td>
        </tr>` : ''}

        ${excerpt ? `
        <!-- EXCERPT -->
        <tr>
          <td style="padding:0 32px 28px;">
            <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">${excerpt}</p>
          </td>
        </tr>` : ''}

        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 40px;">
            <a href="${fullUrl}" style="display:inline-block;background:#ffffff;color:#000000;padding:14px 36px;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:2.5px;text-transform:uppercase;">LIRE L'ARTICLE →</a>
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr>
          <td style="padding:0 32px;">
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;">
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:11px;color:rgba(255,255,255,0.2);line-height:1.6;">
                  <strong style="color:rgba(255,255,255,0.35);">NewsPorto FR</strong> · Le média FC Porto en français<br>
                  <a href="https://newsporto.fr" style="color:rgba(255,255,255,0.25);text-decoration:none;">newsporto.fr</a>
                  &nbsp;·&nbsp;
                  <a href="https://discord.gg/YCcuMHmGcH" style="color:rgba(255,255,255,0.25);text-decoration:none;">Discord</a>
                  &nbsp;·&nbsp;
                  <a href="https://newsporto.fr/unsubscribe?email=${encodeURIComponent(email)}" style="color:rgba(255,255,255,0.25);text-decoration:none;">Se désabonner</a>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <span style="font-size:18px;color:rgba(255,255,255,0.1);">🐉</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Pas de vérification secret — endpoint appelé uniquement depuis l'admin privé

  const { title, excerpt, category, url, imageUrl } = req.body || {};
  if (!title || !url) return res.status(400).json({ error: 'title et url requis' });

  const catLabel = CAT_LABELS[category] || category || 'Actu';
  const fullUrl  = url.startsWith('http') ? url : `https://newsporto.fr/${url}`;

  try {
    // ── Récupérer tous les abonnés email ──────────────────────────────────
    const emails = await kv.smembers('subscribers:emails');

    let emailsSent = 0;
    if (emails && emails.length > 0) {
      // Envoyer en batch (max 50 par appel Resend)
      // Envoi individuel pour personnaliser le lien désabonnement
      for (const emailAddr of emails) {
        await resend.emails.send({
          from:    FROM,
          to:      [emailAddr],
          subject: `📰 ${catLabel} · ${title}`,
          html: buildArticleEmail({ title, excerpt, catLabel, fullUrl, imageUrl, email: emailAddr }),
        });
        emailsSent++;
      }
    }

    // ── Push notifications ────────────────────────────────────────────────
    // (nécessite web-push installé : npm install web-push)
    let pushSent = 0;
    try {
      const webpush = await import('web-push');
      webpush.setVapidDetails(
        'mailto:contact@newsporto.fr',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );

      const pushKeys = await kv.smembers('subscribers:push');
      if (pushKeys && pushKeys.length > 0) {
        const payload = JSON.stringify({
          title:  `NewsPorto · ${catLabel}`,
          body:   title,
          url:    fullUrl,
          icon:   'https://newsporto.fr/Logo.png',
          badge:  'https://newsporto.fr/favicon.ico',
        });

        await Promise.allSettled(
          pushKeys.map(async (key) => {
            const data = await kv.get(key);
            if (!data?.subscription) return;
            try {
              await webpush.sendNotification(data.subscription, payload);
              pushSent++;
            } catch (e) {
              // Subscription expirée → supprimer
              if (e.statusCode === 410) {
                await kv.del(key);
                await kv.srem('subscribers:push', key);
              }
            }
          })
        );
      }
    } catch (e) {
      console.warn('Push skipped (web-push not available):', e.message);
    }

    return res.status(200).json({ ok: true, emailsSent, pushSent });
  } catch (err) {
    console.error('notify-article error:', err);
    return res.status(500).json({ error: err.message });
  }
}
