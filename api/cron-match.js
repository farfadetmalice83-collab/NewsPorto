// api/cron-match.js
// Vercel Cron Job — tourne chaque matin à 9h (configuré dans vercel.json)
// Vérifie s'il y a un match de Porto aujourd'hui ou demain → envoie email + push

import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const resend   = new Resend(process.env.RESEND_API_KEY);
const FROM     = process.env.RESEND_FROM || 'NewsPorto <notifications@newsporto.fr>';
const FD_KEY   = process.env.FOOTBALL_API_KEY;
const PORTO_ID = 503;

async function getNextMatch() {
  const res  = await fetch(`https://api.football-data.org/v4/teams/${PORTO_ID}/matches?status=SCHEDULED&limit=3`, {
    headers: { 'X-Auth-Token': FD_KEY }
  });
  const data = await res.json();
  return data?.matches?.[0] ?? null;
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth()    === d2.getMonth()
    && d1.getDate()     === d2.getDate();
}

function isTomorrow(d1, d2) {
  const tomorrow = new Date(d2);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(d1, tomorrow);
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Lisbon'
  });
}

export default async function handler(req, res) {
  // Vercel Cron envoie un header d'autorisation
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const match = await getNextMatch();
    if (!match) return res.status(200).json({ ok: true, message: 'Aucun match trouvé' });

    const matchDate = new Date(match.utcDate);
    const now       = new Date();
    const isToday   = isSameDay(matchDate, now);
    const isTmrw    = isTomorrow(matchDate, now);

    if (!isToday && !isTmrw) {
      return res.status(200).json({ ok: true, message: 'Pas de match aujourd\'hui ni demain' });
    }

    // Anti-doublon : vérifier qu'on n'a pas déjà envoyé pour ce match
    const sentKey = `cron:match:sent:${match.id}:${isToday ? 'today' : 'tomorrow'}`;
    const alreadySent = await kv.get(sentKey);
    if (alreadySent) {
      return res.status(200).json({ ok: true, message: 'Déjà envoyé' });
    }

    const home     = match.homeTeam?.shortName || match.homeTeam?.name;
    const away     = match.awayTeam?.shortName || match.awayTeam?.name;
    const comp     = match.competition?.name || 'Liga Portugal';
    const dateStr  = fmtDate(match.utcDate);
    const subject  = isToday
      ? `🔵⚪ Match ce soir — ${home} vs ${away}`
      : `📅 Match demain — ${home} vs ${away}`;
    const prefix   = isToday ? 'Ce soir' : 'Demain';

    // ── Emails ────────────────────────────────────────────────────────────
    const emails = await kv.smembers('subscribers:emails');
    let emailsSent = 0;

    if (emails && emails.length > 0) {
      const chunks = [];
      for (let i = 0; i < emails.length; i += 50) chunks.push(emails.slice(i, i + 50));

      for (const chunk of chunks) {
        await resend.emails.send({
          from:    FROM,
          to:      chunk,
          subject,
          html: `
            <div style="background:#000;color:#fff;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 32px;">
              <p style="color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:4px;text-transform:uppercase;margin-bottom:24px;">— ${comp}</p>

              <h1 style="font-size:36px;line-height:1.1;margin-bottom:8px;">${home}</h1>
              <p style="color:rgba(255,255,255,0.3);font-size:14px;letter-spacing:4px;margin-bottom:8px;">VS</p>
              <h1 style="font-size:36px;line-height:1.1;margin-bottom:28px;">${away}</h1>

              <p style="color:rgba(255,255,255,0.6);font-size:16px;margin-bottom:8px;">
                <strong>${prefix}</strong> · ${dateStr}
              </p>

              <a href="https://newsporto.fr/match.html" style="display:inline-block;background:#fff;color:#000;padding:14px 32px;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin-top:24px;">Suivre le match en direct →</a>

              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:32px 0;">
              <p style="color:rgba(255,255,255,0.2);font-size:11px;">
                NewsPorto · <a href="https://newsporto.fr/unsubscribe?email={{email}}" style="color:rgba(255,255,255,0.3);">Se désabonner</a>
              </p>
            </div>
          `,
        });
        emailsSent += chunk.length;
      }
    }

    // ── Push ──────────────────────────────────────────────────────────────
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
          title: `${prefix} — ${home} vs ${away}`,
          body:  `${comp} · ${dateStr}`,
          url:   'https://newsporto.fr/match.html',
          icon:  'https://newsporto.fr/Logo.png',
        });
        await Promise.allSettled(pushKeys.map(async (key) => {
          const data = await kv.get(key);
          if (!data?.subscription) return;
          try { await webpush.sendNotification(data.subscription, payload); pushSent++; }
          catch (e) { if (e.statusCode === 410) { await kv.del(key); await kv.srem('subscribers:push', key); } }
        }));
      }
    } catch (e) { console.warn('Push skipped:', e.message); }

    // Marquer comme envoyé (expire dans 26h pour éviter les doublons)
    await kv.set(sentKey, true, { ex: 26 * 3600 });

    return res.status(200).json({ ok: true, emailsSent, pushSent, match: `${home} vs ${away}` });
  } catch (err) {
    console.error('cron-match error:', err);
    return res.status(500).json({ error: err.message });
  }
}
