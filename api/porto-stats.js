// api/porto-stats.js — Vercel Serverless Function
// football-data.org — endpoints GRATUITS uniquement
//
// Logique compétition européenne (auto-détectée) :
//   Saison 2025/26 → Europa League (EL)
//   Saison 2026/27 → Champions League (CL)
//   Les deux sont tentés, seul celui qui retourne des données est utilisé

const FD_BASE  = 'https://api.football-data.org/v4';
const PORTO_ID = 503;
const SEASON_START = new Date('2025-07-01'); // début saison 2025/26

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

    // ── 1. Requêtes parallèles ────────────────────────────────────────────────
    const [
      standingsData,
      ligaFinished,
      ligaScheduled,
      elFinished,
      elScheduled,
      clFinished,
      clScheduled,
      liveData,
    ] = await Promise.all([
      fetchFD('/competitions/PPL/standings'),
      fetchFD(`/competitions/PPL/matches?team=${PORTO_ID}&status=FINISHED`),
      fetchFD(`/competitions/PPL/matches?team=${PORTO_ID}&status=SCHEDULED,TIMED`),
      // Europa League (saison en cours)
      fetchFD(`/competitions/EL/matches?team=${PORTO_ID}&status=FINISHED`).catch(() => null),
      fetchFD(`/competitions/EL/matches?team=${PORTO_ID}&status=SCHEDULED,TIMED`).catch(() => null),
      // Champions League (saison prochaine / si qualifiés)
      fetchFD(`/competitions/CL/matches?team=${PORTO_ID}&status=FINISHED`).catch(() => null),
      fetchFD(`/competitions/CL/matches?team=${PORTO_ID}&status=SCHEDULED,TIMED`).catch(() => null),
      fetchFD(`/competitions/PPL/matches?team=${PORTO_ID}&status=IN_PLAY,PAUSED,HALF_TIME`).catch(() => null),
    ]);

    // ── 2. Classement Liga ────────────────────────────────────────────────────
    const table    = standingsData?.standings?.find(s => s.type === 'TOTAL')?.table ?? [];
    const sorted   = [...table].sort((a, b) => a.position - b.position);
    const portoRow = table.find(r => r.team.id === PORTO_ID) ?? {};

    const played       = portoRow.playedGames  ?? 0;
    const wins         = portoRow.won          ?? 0;
    const draws        = portoRow.draw         ?? 0;
    const losses       = portoRow.lost         ?? 0;
    const goalsFor     = portoRow.goalsFor     ?? 0;
    const goalsAgainst = portoRow.goalsAgainst ?? 0;
    const points       = portoRow.points       ?? 0;
    const position     = portoRow.position     ?? '—';

    const gapPoints  = position === 1
      ? points - (sorted[1]?.points ?? 0)
      : points - (sorted[0]?.points ?? 0);
    const secondTeam = position === 1
      ? (sorted[1]?.team?.shortName ?? sorted[1]?.team?.name ?? '—')
      : (sorted[0]?.team?.shortName ?? sorted[0]?.team?.name ?? '—');

    const standings = sorted.slice(0, 10).map(r => ({
      position:     r.position,
      teamId:       r.team.id,
      teamName:     r.team.shortName ?? r.team.name,
      teamCrest:    r.team.crest,
      played:       r.playedGames,
      won:          r.won,
      draw:         r.draw,
      lost:         r.lost,
      goalsFor:     r.goalsFor,
      goalsAgainst: r.goalsAgainst,
      goalDiff:     r.goalDifference,
      points:       r.points,
      isPorto:      r.team.id === PORTO_ID,
    }));

    // ── 3. Match en cours ─────────────────────────────────────────────────────
    const liveMatches = liveData?.matches ?? [];
    let liveMatch = null;
    if (liveMatches.length > 0) {
      const lm = liveMatches[0];
      liveMatch = {
        id:          lm.id,
        competition: lm.competition?.name ?? '—',
        homeTeam:    lm.homeTeam?.shortName ?? lm.homeTeam?.name ?? '—',
        awayTeam:    lm.awayTeam?.shortName ?? lm.awayTeam?.name ?? '—',
        homeCrest:   lm.homeTeam?.crest ?? null,
        awayCrest:   lm.awayTeam?.crest ?? null,
        homeGoals:   lm.score?.fullTime?.home ?? lm.score?.halfTime?.home ?? 0,
        awayGoals:   lm.score?.fullTime?.away ?? lm.score?.halfTime?.away ?? 0,
        minute:      lm.minute ?? null,
        status:      lm.status,
        venue:       lm.venue ?? null,
      };
    }

    // ── 4. Matchs européens — EL + CL fusionnés, filtrés saison en cours ─────
    const euroFinished = [
      ...(elFinished?.matches ?? []),
      ...(clFinished?.matches ?? []),
    ].filter(m => new Date(m.utcDate) >= SEASON_START);

    const euroScheduled = [
      ...(elScheduled?.matches ?? []),
      ...(clScheduled?.matches ?? []),
    ].filter(m => new Date(m.utcDate) >= SEASON_START);

    // ── 5. Résultats récents (Liga + Europe, triés par date) ─────────────────
    const allFinished = [
      ...(ligaFinished?.matches ?? []),
      ...euroFinished,
    ].sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate)).slice(0, 5);

    const recentMatches = allFinished.map(m => {
      const isHome = m.homeTeam.id === PORTO_ID;
      const opp    = isHome ? m.awayTeam : m.homeTeam;
      const pg     = isHome ? m.score.fullTime.home : m.score.fullTime.away;
      const og     = isHome ? m.score.fullTime.away : m.score.fullTime.home;
      return {
        date:            m.utcDate,
        competition:     m.competition?.name ?? '—',
        competitionCode: m.competition?.code ?? '',
        isHome,
        opponentName:    opp.shortName ?? opp.name,
        opponentCrest:   opp.crest ?? null,
        portoGoals:      pg ?? 0,
        oppGoals:        og ?? 0,
        result:          pg > og ? 'W' : pg < og ? 'L' : 'D',
        venue:           m.venue ?? null,
      };
    });

    let winStreak = 0;
    for (const m of recentMatches) { if (m.result === 'W') winStreak++; else break; }

    // ── 6. Prochains matchs (Liga + Europe) ──────────────────────────────────
    const PORTO_CREST = 'https://crests.football-data.org/503.png';
    const allScheduled = [
      ...(ligaScheduled?.matches ?? []),
      ...euroScheduled,
    ].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

    const upcomingMatches = allScheduled.slice(0, 5).map(m => {
      const isHomePorto = m.homeTeam?.id === PORTO_ID;
      return {
        id:              m.id,
        date:            m.utcDate,
        competition:     m.competition?.name ?? '—',
        competitionCode: m.competition?.code ?? '',
        homeTeam:        m.homeTeam?.shortName ?? m.homeTeam?.name ?? '—',
        awayTeam:        m.awayTeam?.shortName ?? m.awayTeam?.name ?? '—',
        homeCrest:       m.homeTeam?.crest ?? (isHomePorto ? PORTO_CREST : null),
        awayCrest:       m.awayTeam?.crest ?? (!isHomePorto ? PORTO_CREST : null),
        venue:           m.venue ?? null,
      };
    });

    const nextMatch = upcomingMatches[0] ?? null;

    // ── 7. Stats européennes — par compétition ────────────────────────────────
    let europeanStats = null;
    if (euroFinished.length > 0) {
      // Grouper par compétition
      const byComp = {};
      euroFinished.forEach(m => {
        const code = m.competition?.code ?? 'EUR';
        const name = m.competition?.name ?? '—';
        if (!byComp[code]) byComp[code] = { name, played: 0, won: 0, goals: 0 };
        const isHome = m.homeTeam.id === PORTO_ID;
        const pg = isHome ? m.score.fullTime.home : m.score.fullTime.away;
        const og = isHome ? m.score.fullTime.away : m.score.fullTime.home;
        byComp[code].played++;
        if (pg > og) byComp[code].won++;
        byComp[code].goals += pg ?? 0;
      });
      const competitions = Object.values(byComp);
      europeanStats = {
        played: euroFinished.length,
        wins:   competitions.reduce((a, c) => a + c.won, 0),
        goals:  competitions.reduce((a, c) => a + c.goals, 0),
        competitions,
      };
    }

    // ── Réponse ───────────────────────────────────────────────────────────────
    const isLive = liveMatch && liveMatch.status !== 'FINISHED';
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', `public, max-age=${isLive ? 60 : 600}, s-maxage=${isLive ? 60 : 600}, stale-while-revalidate=30`);

    res.status(200).json({
      stats: {
        position, played, wins, draws, losses,
        goalsFor, goalsAgainst,
        goalDiff: goalsFor - goalsAgainst,
        points, gapPoints, secondTeam, winStreak,
      },
      nextMatch,
      liveMatch,
      lineup:        null,
      recentMatches,
      upcomingMatches,
      standings,
      europeanStats,
      pollInterval:  isLive ? 60 : 300,
      updatedAt:     new Date().toISOString(),
    });

  } catch (err) {
    console.error('porto-stats error:', err);
    res.status(500).json({ error: err.message });
  }
}
