// api/porto-stats.js — Vercel Serverless Function
// Utilise uniquement les endpoints GRATUITS de football-data.org
// Clé : FOOTBALL_API_KEY

const FD_BASE  = 'https://api.football-data.org/v4';
const PORTO_ID = 503;
const LIGA     = 'PPL';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchFD(path, retries = 2) {
  const res = await fetch(`${FD_BASE}${path}`, {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY }
  });
  if (res.status === 404) return null;
  if (res.status === 429 && retries > 0) {
    await sleep(6000);
    return fetchFD(path, retries - 1);
  }
  if (!res.ok) throw new Error(`football-data ${res.status} ${path}`);
  return res.json();
}

export default async function handler(req, res) {
  try {

    // ── 3 requêtes sur endpoints gratuits ────────────────────────────────────
    const [standingsData, finishedData, scheduledData] = await Promise.all([
      fetchFD(`/competitions/${LIGA}/standings`),
      fetchFD(`/competitions/${LIGA}/matches?team=${PORTO_ID}&status=FINISHED`),
      fetchFD(`/competitions/${LIGA}/matches?team=${PORTO_ID}&status=SCHEDULED,TIMED`),
    ]);

    // ── Classement ────────────────────────────────────────────────────────────
    const table    = standingsData?.standings?.find(s => s.type === 'TOTAL')?.table ?? [];
    const sorted   = [...table].sort((a, b) => a.position - b.position);
    const portoRow = table.find(r => r.team.id === PORTO_ID) ?? {};

    const stats = {
      position:     portoRow.position       ?? '—',
      played:       portoRow.playedGames    ?? 0,
      wins:         portoRow.won            ?? 0,
      draws:        portoRow.draw           ?? 0,
      losses:       portoRow.lost           ?? 0,
      goalsFor:     portoRow.goalsFor       ?? 0,
      goalsAgainst: portoRow.goalsAgainst   ?? 0,
      goalDiff:     portoRow.goalDifference ?? 0,
      points:       portoRow.points         ?? 0,
    };
    stats.gapPoints  = stats.position === 1
      ? stats.points - (sorted[1]?.points ?? 0)
      : stats.points - (sorted[0]?.points ?? 0);
    stats.secondTeam = stats.position === 1
      ? (sorted[1]?.team?.shortName ?? sorted[1]?.team?.name ?? '—')
      : (sorted[0]?.team?.shortName ?? sorted[0]?.team?.name ?? '—');

    const standings = sorted.slice(0, 10).map(r => ({
      position: r.position, teamId: r.team.id,
      teamName: r.team.shortName ?? r.team.name, teamCrest: r.team.crest,
      played: r.playedGames, won: r.won, draw: r.draw, lost: r.lost,
      goalsFor: r.goalsFor, goalsAgainst: r.goalsAgainst,
      goalDiff: r.goalDifference, points: r.points, isPorto: r.team.id === PORTO_ID,
    }));

    // ── Résultats récents ─────────────────────────────────────────────────────
    const allFinished = (finishedData?.matches ?? [])
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
      .slice(0, 5);

    const recentMatches = allFinished.map(m => {
      const isHome = m.homeTeam.id === PORTO_ID;
      const opp    = isHome ? m.awayTeam : m.homeTeam;
      const pg     = isHome ? m.score.fullTime.home : m.score.fullTime.away;
      const og     = isHome ? m.score.fullTime.away : m.score.fullTime.home;
      return {
        date: m.utcDate, competition: m.competition?.name ?? '—',
        competitionCode: m.competition?.code ?? '', isHome,
        opponentName:  opp.shortName ?? opp.name,
        opponentCrest: opp.crest ?? null,
        portoGoals: pg, oppGoals: og,
        result: pg > og ? 'W' : pg < og ? 'L' : 'D',
        venue: m.venue ?? null,
      };
    });

    let winStreak = 0;
    for (const m of recentMatches) { if (m.result === 'W') winStreak++; else break; }

    // ── Prochains matchs ──────────────────────────────────────────────────────
    const PORTO_CREST = 'https://crests.football-data.org/503.png';
    const allScheduled = (scheduledData?.matches ?? [])
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
      .slice(0, 5);

    const upcomingMatches = allScheduled.map(m => {
      const isHomePorto = m.homeTeam?.id === PORTO_ID;
      return {
        id: m.id, date: m.utcDate,
        competition: m.competition?.name ?? '—',
        competitionCode: m.competition?.code ?? '',
        homeTeam:  m.homeTeam?.shortName ?? m.homeTeam?.name ?? '—',
        awayTeam:  m.awayTeam?.shortName ?? m.awayTeam?.name ?? '—',
        homeCrest: m.homeTeam?.crest ?? (isHomePorto ? PORTO_CREST : null),
        awayCrest: m.awayTeam?.crest ?? (!isHomePorto ? PORTO_CREST : null),
        venue:     m.venue ?? null,
      };
    });

    const nextMatch = upcomingMatches[0] ?? null;

    // ── Réponse ───────────────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600, stale-while-revalidate=60');

    res.status(200).json({
      stats:          { ...stats, winStreak },
      nextMatch,
      liveMatch:      null,
      lineup:         null,
      recentMatches,
      upcomingMatches,
      standings,
      europeanStats:  null,
      pollInterval:   300,
      updatedAt:      new Date().toISOString(),
    });

  } catch (err) {
    console.error('porto-stats error:', err);
    res.status(500).json({ error: err.message });
  }
}
