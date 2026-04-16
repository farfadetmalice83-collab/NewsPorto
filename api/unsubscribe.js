// api/unsubscribe.js
// GET ?email=xxx  → désabonne l'email

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { email } = req.query;
  if (!email) return res.status(400).send('Email manquant');

  try {
    const emailKey = `subscriber:email:${email.toLowerCase().trim()}`;
    await kv.del(emailKey);
    await kv.srem('subscribers:emails', email.toLowerCase().trim());

    return res.status(200).send(`
      <html><body style="background:#000;color:#fff;font-family:Arial;text-align:center;padding:80px 20px;">
        <h1 style="font-size:28px;letter-spacing:2px;">Désabonnement confirmé</h1>
        <p style="color:rgba(255,255,255,0.5);margin-top:16px;">Tu ne recevras plus d'emails de NewsPorto.</p>
        <a href="https://newsporto.fr" style="display:inline-block;margin-top:32px;color:#fff;border:1px solid rgba(255,255,255,0.3);padding:10px 24px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Retour au site</a>
      </body></html>
    `);
  } catch (err) {
    return res.status(500).send('Erreur serveur');
  }
}
