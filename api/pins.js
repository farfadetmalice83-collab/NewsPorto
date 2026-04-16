// api/pins.js — Gestion des pins carte communauté
import { kv } from '@vercel/kv';

const PINS_KEY = 'newsporto:map:pins';
const MAX_PINS = 5000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — récupère tous les pins
  if (req.method === 'GET') {
    try {
      const pins = await kv.get(PINS_KEY) || [];
      return res.status(200).json({ pins, count: pins.length });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST — ajoute un pin { lat, lng, id }
  if (req.method === 'POST') {
    try {
      const { lat, lng, visitorId } = req.body || {};
      if (!lat || !lng || !visitorId) return res.status(400).json({ error: 'lat, lng, visitorId requis' });

      const pins = await kv.get(PINS_KEY) || [];

      // Vérifie que ce visiteur n'a pas déjà un pin
      const existing = pins.find(p => p.visitorId === visitorId);
      if (existing) return res.status(409).json({ error: 'Pin déjà existant', pin: existing });

      if (pins.length >= MAX_PINS) return res.status(400).json({ error: 'Limite atteinte' });

      const newPin = {
        lat: parseFloat(lat.toFixed(4)),
        lng: parseFloat(lng.toFixed(4)),
        visitorId,
        createdAt: Date.now()
      };
      pins.push(newPin);
      await kv.set(PINS_KEY, pins);

      return res.status(200).json({ ok: true, pin: newPin, count: pins.length });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE — supprime le pin du visiteur
  if (req.method === 'DELETE') {
    try {
      const { visitorId } = req.body || {};
      if (!visitorId) return res.status(400).json({ error: 'visitorId requis' });

      let pins = await kv.get(PINS_KEY) || [];
      pins = pins.filter(p => p.visitorId !== visitorId);
      await kv.set(PINS_KEY, pins);

      return res.status(200).json({ ok: true, count: pins.length });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
