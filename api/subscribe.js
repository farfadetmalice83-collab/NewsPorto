// api/subscribe.js
// Enregistre un abonné (email et/ou push token) dans Vercel KV
// POST { email, pushSubscription? }

import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM || 'NewsPorto <notifications@newsporto.fr>';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, pushSubscription } = req.body || {};

  try {
    // ── Email ─────────────────────────────────────────────────────────────
    if (email) {
      const emailKey = `subscriber:email:${email.toLowerCase().trim()}`;
      const exists   = await kv.get(emailKey);

      if (!exists) {
        // Stocker l'abonné
        await kv.set(emailKey, {
          email:     email.toLowerCase().trim(),
          createdAt: new Date().toISOString(),
        });
        // Ajouter à la liste globale
        await kv.sadd('subscribers:emails', email.toLowerCase().trim());

        // Email de confirmation
        await resend.emails.send({
          from:    FROM,
          to:      email,
          subject: '✅ Tu es abonné(e) à NewsPorto !',
          html: `
            <div style="background:#000;color:#fff;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 32px;">
              <h1 style="font-family:Georgia,serif;font-size:32px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">NewsPorto</h1>
              <p style="color:rgba(255,255,255,0.4);font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:32px;">Le média FC Porto en français</p>
              <h2 style="font-size:22px;margin-bottom:16px;">Bienvenue dans la communauté 🐉</h2>
              <p style="color:rgba(255,255,255,0.7);line-height:1.7;margin-bottom:24px;">
                Tu recevras désormais une notification pour chaque nouvel article et un rappel avant chaque match de Porto.
              </p>
              <p style="color:rgba(255,255,255,0.7);line-height:1.7;">
                <strong>Força Porto!</strong>
              </p>
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:32px 0;">
              <p style="color:rgba(255,255,255,0.25);font-size:11px;">
                Pour te désabonner, <a href="https://newsporto.fr/unsubscribe?email=${encodeURIComponent(email)}" style="color:rgba(255,255,255,0.4);">clique ici</a>.
              </p>
            </div>
          `,
        });
      }
    }

    // ── Push subscription ────────────────────────────────────────────────
    if (pushSubscription) {
      const endpoint  = pushSubscription.endpoint;
      const pushKey   = `subscriber:push:${Buffer.from(endpoint).toString('base64').slice(0, 64)}`;
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
