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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Vérification secret
  if (SECRET && req.body?.secret !== SECRET) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

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
      const chunks = [];
      for (let i = 0; i < emails.length; i += 50) chunks.push(emails.slice(i, i + 50));

      for (const chunk of chunks) {
        await resend.emails.send({
          from:    FROM,
          to:      chunk,
          subject: `📰 ${catLabel} · ${title}`,
          html: `
            <div style="background:#000;color:#fff;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              ${imageUrl ? `<img src="${imageUrl}" alt="" style="width:100%;max-height:300px;object-fit:cover;display:block;">` : ''}
              <div style="padding:36px 32px;">
                <p style="color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:4px;text-transform:uppercase;margin-bottom:16px;">— ${catLabel}</p>
                <h1 style="font-size:28px;line-height:1.2;margin-bottom:16px;">${title}</h1>
                ${excerpt ? `<p style="color:rgba(255,255,255,0.6);line-height:1.7;margin-bottom:28px;">${excerpt}</p>` : ''}
                <a href="${fullUrl}" style="display:inline-block;background:#fff;color:#000;padding:14px 32px;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Lire l'article →</a>
                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:32px 0;">
                <p style="color:rgba(255,255,255,0.2);font-size:11px;">
                  NewsPorto · <a href="https://newsporto.fr" style="color:rgba(255,255,255,0.3);">newsporto.fr</a>
                  · <a href="https://newsporto.fr/unsubscribe?email={{email}}" style="color:rgba(255,255,255,0.3);">Se désabonner</a>
                </p>
              </div>
            </div>
          `,
        });
        emailsSent += chunk.length;
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
