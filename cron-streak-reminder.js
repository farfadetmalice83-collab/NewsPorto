// api/cron-streak-reminder.js — Cron Vercel (ex: 18h00 chaque jour)
// Dans vercel.json : { "crons": [{ "path": "/api/cron-streak-reminder", "schedule": "0 17 * * *" }] }
// Envoie un email à tous les users qui ont un streak actif et ne se sont pas connectés aujourd'hui

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://newsporto.fr';

export default async function handler(req, res) {
  // Sécurité : Vercel envoie un header d'autorisation pour les crons
  const auth = req.headers['authorization'];
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    // Trouver tous les users avec streak > 0 qui ne se sont pas connectés aujourd'hui
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, username, streak, last_streak_date')
      .gt('streak', 0)
      .neq('last_streak_date', today); // pas encore connectés aujourd'hui

    if (error) throw error;
    if (!profiles?.length) return res.status(200).json({ ok: true, sent: 0 });

    let sent = 0;
    for (const profile of profiles) {
      // Vérifier que le streak est encore "sauvable" (dernière co = hier)
      const lastDate = new Date(profile.last_streak_date);
      const diffDays = Math.floor((new Date() - lastDate) / 86400000);
      if (diffDays > 1) continue; // streak déjà perdu

      try {
        await fetch(`${BASE_URL}/api/notify-streak`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toUserId: profile.id,
            streak: profile.streak,
            hoursLeft: 7, // ~7h restantes si cron à 17h
          }),
        });
        sent++;
      } catch {}
    }

    return res.status(200).json({ ok: true, sent });
  } catch (err) {
    console.error('cron-streak error:', err);
    return res.status(500).json({ error: err.message });
  }
}
