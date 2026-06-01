// api/porto-stats.js — Vercel Serverless Function
// Utilise UNIQUEMENT API-Football (v3.football.api-sports.io)
// Clé : AF_KEY (100 req/jour sur plan gratuit)

const AF_BASE  = 'https://v3.football.api-sports.io';
const PORTO_ID = 212;   // FC Porto sur API-Football
const LIGA_ID  = 94;    // Liga Portugal
const SEASON   = 2025;

async function fetchAF(path) {
  const res = await fetch(`${AF_BASE}${path}`, {
    headers: { 'x-apisports-key': process.env.AF_KEY }
  });
  if (!res.ok) throw new Error(`api-football ${res.status} ${path}`);
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`api-football error: ${JSON.stringify(json.errors)}`);
  }
  return json;
}

export default async function handler(req, res) {
  try {

    // ── 1. Classement + matchs récents + matchs à venir en parallèle ─────────
    // 3 requêtes max (on reste bien dans les 100/jour)
    const [standingsData, finishedData, scheduledData] = await Promise.all([
      fetchAF(`/standings?league=${LIGA_ID}&season=${SEASON}`),
      fetchAF(`/fixtures?team=${PORTO_ID}&season=${SEASON}&status=FT&last=10`),
      fetchAF(`/fixtures?team=${PORTO_ID}&season=${SEASON}&status=NS&next=5`),
    ]);

    // ── 2. Classement Liga ───────────────────────────────────────────────────
    const table    = standingsData?.response?.[0]?.league?.standings?.[0] ?? [];
    const sorted   = [...table].sort((a, b) => a.rank - b.rank);
    const portoRow = table.find(r => r.team.id === PORTO_ID) ?? {};

    const played       = portoRow.all?.played ?? 0;
    const wins         = portoRow.all?.win ?? 0;
    const draws        = portoRow.all?.draw ?? 0;
    const losses       = portoRow.all?.lose ?? 0;
    const goalsFor     = portoRow.all?.goals?.for ?? 0;
    const goalsAgainst = portoRow.all?.goals?.against ?? 0;
    const points       = portoRow.points ?? 0;
    const position     = portoRow.rank ?? '—';

    const gapPoints  = position === 1
      ? points - (sorted[1]?.points ?? 0)
      : points - (sorted[0]?.points ?? 0);
    const secondTeam = position === 1
      ? (sorted[1]?.team?.name ?? '—')
      : (sorted[0]?.team?.name ?? '—');

    const standings = sorted.slice(0, 10).map(r => ({
      position:     r.rank,
      teamId:       r.team.id,
      teamName:     r.team.name,
      teamCrest:    r.team.logo,
      played:       r.all?.played ?? 0,
      won:          r.all?.win ?? 0,
      draw:         r.all?.draw ?? 0,
      lost:         r.all?.lose ?? 0,
      goalsFor:     r.all?.goals?.for ?? 0,
      goalsAgainst: r.all?.goals?.against ?? 0,
      goalDiff:     r.goalsDiff ?? 0,
      points:       r.points ?? 0,
      isPorto:      r.team.id === PORTO_ID,
    }));

    // ── 3. Résultats récents ─────────────────────────────────────────────────
    const finished = finishedData?.response ?? [];
    finished.sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));

    const recentMatches = finished.slice(0, 5).map(f => {
      const isHome   = f.teams.home.id === PORTO_ID;
      const opponent = isHome ? f.teams.away : f.teams.home;
      const pg       = isHome ? f.goals.home : f.goals.away;
      const og       = isHome ? f.goals.away : f.goals.home;
      return {
        date:          f.fixture.date,
        competition:   f.league.name,
        competitionCode: f.league.country,
        isHome,
        opponentName:  opponent.name,
        opponentCrest: opponent.logo,
        portoGoals:    pg ?? 0,
        oppGoals:      og ?? 0,
        result:        pg > og ? 'W' : pg < og ? 'L' : 'D',
        venue:         f.fixture.venue?.name ?? null,
      };
    });

    // Série de victoires
    let winStreak = 0;
    for (const m of recentMatches) {
      if (m.result === 'W') winStreak++;
      else break;
    }

    // ── 4. Prochains matchs ──────────────────────────────────────────────────
    const scheduled = scheduledData?.response ?? [];
    scheduled.sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));

    const upcomingMatches = scheduled.slice(0, 5).map(f => ({
      id:          f.fixture.id,
      date:        f.fixture.date,
      competition: f.league.name,
      homeTeam:    f.teams.home.name,
      awayTeam:    f.teams.away.name,
      homeCrest:   f.teams.home.logo,
      awayCrest:   f.teams.away.logo,
      venue:       f.fixture.venue?.name ?? null,
    }));

    const nextMatch = upcomingMatches[0] ?? null;

    // ── 5. Stats européennes ─────────────────────────────────────────────────
    const euroMatches = finished.filter(f => f.league.id !== LIGA_ID);
    const euroByComp  = {};
    euroMatches.forEach(f => {
      const name = f.league.name;
      if (!euroByComp[name]) euroByComp[name] = { name, played: 0, won: 0, goals: 0 };
      const isHome = f.teams.home.id === PORTO_ID;
      const pg     = isHome ? f.goals.home : f.goals.away;
      const og     = isHome ? f.goals.away : f.goals.home;
      euroByComp[name].played++;
      if (pg > og) euroByComp[name].won++;
      euroByComp[name].goals += pg ?? 0;
    });
    const euroComps = Object.values(euroByComp);
    const europeanStats = euroComps.length > 0 ? {
      played:       euroMatches.length,
      wins:         euroMatches.filter(f => {
                      const isHome = f.teams.home.id === PORTO_ID;
                      const pg = isHome ? f.goals.home : f.goals.away;
                      const og = isHome ? f.goals.away : f.goals.home;
                      return pg > og;
                    }).length,
      goals:        euroMatches.reduce((acc, f) => {
                      const isHome = f.teams.home.id === PORTO_ID;
                      return acc + (isHome ? f.goals.home : f.goals.away ?? 0);
                    }, 0),
      competitions: euroComps,
    } : null;

    // ── Réponse ──────────────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600, stale-while-revalidate=60');

    res.status(200).json({
      stats: {
        position, played, wins, draws, losses,
        goalsFor, goalsAgainst,
        goalDiff: goalsFor - goalsAgainst,
        points, gapPoints, secondTeam, winStreak,
      },
      nextMatch,
      liveMatch:      null,
      lineup:         null,
      recentMatches,
      upcomingMatches,
      standings,
      europeanStats,
      pollInterval:   300,
      updatedAt:      new Date().toISOString(),
    });

  } catch (err) {
    console.error('porto-stats error:', err);
    res.status(500).json({ error: err.message });
  }
}
