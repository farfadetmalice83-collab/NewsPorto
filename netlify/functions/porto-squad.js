// netlify/functions/porto-squad.js
// FC Porto (ID 503) — football-data.org
// Returns full squad grouped by position + coach

const BASE     = 'https://api.football-data.org/v4';
const PORTO_ID = 503;

const API_HEADERS = {
  'X-Auth-Token': process.env.FOOTBALL_API_KEY,
};

const POSITION_FR = {
  'Goalkeeper':  'Gardiens',
  'Defence':     'Défenseurs',
  'Midfield':    'Milieux',
  'Offence':     'Attaquants',
};

const POSITION_ORDER = ['Goalkeeper', 'Defence', 'Midfield', 'Offence'];

exports.handler = async () => {
  try {
    const res = await fetch(`${BASE}/teams/${PORTO_ID}`, { headers: API_HEADERS });
    if (!res.ok) throw new Error(`football-data ${res.status}`);
    const data = await res.json();

    // ── Squad ──────────────────────────────────────────────────────────────
    const players = (data.squad ?? []).map(p => ({
      id:          p.id,
      name:        p.name,
      firstName:   p.firstName ?? null,
      lastName:    p.lastName  ?? null,
      number:      p.shirtNumber ?? null,
      position:    p.position ?? 'Offence',
      nationality: p.nationality ?? null,
      birthDate:   p.dateOfBirth ?? null,
      marketValue: null, // not in free tier
    }));

    // Group by position in display order
    const grouped = {};
    POSITION_ORDER.forEach(pos => {
      const list = players.filter(p => p.position === pos);
      if (list.length > 0) {
        grouped[pos] = {
          label: POSITION_FR[pos] ?? pos,
          count: list.length,
          players: list.sort((a, b) => (a.number ?? 99) - (b.number ?? 99)),
        };
      }
    });

    // ── Coach ──────────────────────────────────────────────────────────────
    const coach = data.coach ? {
      name:        data.coach.name,
      nationality: data.coach.nationality ?? null,
      birthDate:   data.coach.dateOfBirth ?? null,
      contract:    data.coach.contract?.until ?? null,
    } : null;

    // ── Club info ──────────────────────────────────────────────────────────
    const club = {
      name:    data.name,
      crest:   data.crest,
      venue:   data.venue,
      founded: data.founded,
      colors:  data.clubColors,
      website: data.website,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600', // 1h cache
      },
      body: JSON.stringify({ club, coach, grouped, updatedAt: new Date().toISOString() }),
    };

  } catch (err) {
    console.error('porto-squad error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
