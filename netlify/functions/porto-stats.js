const BASE = 'https://api.football-data.org/v4';
const PORTO_ID = 503;
const LIGA_ID = 'PD'; // Liga Portugal = PPL on football-data
// Note: Liga Portugal code on football-data.org is PPL (Primeira Liga Portugal)
const LIGA_CODE = 'PPL';
 
const headers = {
  'X-Auth-Token': process.env.FOOTBALL_API_KEY,
};
 
async function fetchFD(path) {
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`football-data error ${res.status} on ${path}`);
  return res.json();
}
 
exports.handler = async () => {
  try {
    // ── 1. Liga Portugal standings ──────────────────────────────────────────
    const standingsData = await fetchFD(`/competitions/${LIGA_CODE}/standings`);
    const table = standingsData.standings.find(s => s.type === 'TOTAL')?.table || [];
 
    // Porto's row
    const portoRow = table.find(r => r.team.id === PORTO_ID) || {};
 
    const stats = {
      position:   portoRow.position   ?? '—',
      played:     portoRow.playedGames ?? 0,
      wins:       portoRow.won         ?? 0,
      draws:      portoRow.draw        ?? 0,
      losses:     portoRow.lost        ?? 0,
      goalsFor:   portoRow.goalsFor    ?? 0,
      goalsAgainst: portoRow.goalsAgainst ?? 0,
      goalDiff:   portoRow.goalDifference ?? 0,
      points:     portoRow.points      ?? 0,
    };
 
    // Gap to second place (or gap from leader if not 1st)
    const sorted = [...table].sort((a, b) => a.position - b.position);
    const leaderPts = sorted[0]?.points ?? 0;
    const secondPts = sorted[1]?.points ?? 0;
    stats.gapPoints = stats.position === 1
      ? stats.points - secondPts
      : stats.points - leaderPts;
    stats.secondTeam = stats.position === 1
      ? sorted[1]?.team?.shortName ?? sorted[1]?.team?.name ?? '—'
      : sorted[0]?.team?.shortName ?? sorted[0]?.team?.name ?? '—';
 
    // Full standings top 10 for the page
    const standings = sorted.slice(0, 10).map(r => ({
      position:  r.position,
      teamId:    r.team.id,
      teamName:  r.team.shortName ?? r.team.name,
      teamCrest: r.team.crest,
      played:    r.playedGames,
      won:       r.won,
      draw:      r.draw,
      lost:      r.lost,
      goalsFor:  r.goalsFor,
      goalsAgainst: r.goalsAgainst,
      goalDiff:  r.goalDifference,
      points:    r.points,
      isPorto:   r.team.id === PORTO_ID,
    }));
 
    // ── 2. Porto matches (all competitions, current season) ─────────────────
    const matchesData = await fetchFD(`/teams/${PORTO_ID}/matches?status=SCHEDULED,FINISHED&limit=20`);
    const allMatches = matchesData.matches ?? [];
 
    const now = new Date();
 
    // Recent matches (last 5 finished)
    const finished = allMatches
      .filter(m => m.status === 'FINISHED')
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
      .slice(0, 5);
 
    const recentMatches = finished.map(m => {
      const isHome = m.homeTeam.id === PORTO_ID;
      const opponent = isHome ? m.awayTeam : m.homeTeam;
      const portoGoals = isHome ? m.score.fullTime.home : m.score.fullTime.away;
      const oppGoals   = isHome ? m.score.fullTime.away : m.score.fullTime.home;
      let result = 'D';
      if (portoGoals > oppGoals)  result = 'W';
      if (portoGoals < oppGoals)  result = 'L';
      return {
        date:         m.utcDate,
        competition:  m.competition.name,
        competitionCode: m.competition.code,
        isHome,
        opponentName:  opponent.shortName ?? opponent.name,
        opponentCrest: opponent.crest,
        portoGoals,
        oppGoals,
        result,
        venue: m.venue ?? null,
      };
    });
 
    // Upcoming matches (next 5 scheduled)
    const scheduled = allMatches
      .filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED')
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
      .slice(0, 5);
 
    const upcomingMatches = scheduled.map(m => ({
      date:         m.utcDate,
      competition:  m.competition.name,
      competitionCode: m.competition.code,
      homeTeam:  m.homeTeam.shortName  ?? m.homeTeam.name,
      awayTeam:  m.awayTeam.shortName  ?? m.awayTeam.name,
      homeCrest: m.homeTeam.crest,
      awayCrest: m.awayTeam.crest,
      venue:     m.venue ?? null,
    }));
 
    // Next match (first scheduled)
    const nextMatch = upcomingMatches[0] ?? null;
 
    // ── 3. European stats ────────────────────────────────────────────────────
    // Derive from allMatches — filter non-Liga competitions
    const euroMatches = allMatches.filter(
      m => !['PPL', 'PL1'].includes(m.competition.code) && m.status === 'FINISHED'
    );
 
    const euroWins   = euroMatches.filter(m => {
      const isHome = m.homeTeam.id === PORTO_ID;
      const pg = isHome ? m.score.fullTime.home : m.score.fullTime.away;
      const og = isHome ? m.score.fullTime.away : m.score.fullTime.home;
      return pg > og;
    }).length;
 
    const euroGoals = euroMatches.reduce((acc, m) => {
      const isHome = m.homeTeam.id === PORTO_ID;
      return acc + (isHome ? (m.score.fullTime.home ?? 0) : (m.score.fullTime.away ?? 0));
    }, 0);
 
    // Group by competition
    const euroByComp = {};
    euroMatches.forEach(m => {
      const key = m.competition.name;
      if (!euroByComp[key]) euroByComp[key] = { name: key, played: 0, won: 0, goals: 0 };
      euroByComp[key].played++;
      const isHome = m.homeTeam.id === PORTO_ID;
      const pg = isHome ? m.score.fullTime.home : m.score.fullTime.away;
      const og = isHome ? m.score.fullTime.away : m.score.fullTime.home;
      if (pg > og) euroByComp[key].won++;
      euroByComp[key].goals += pg ?? 0;
    });
 
    const europeanStats = {
      played: euroMatches.length,
      wins:   euroWins,
      goals:  euroGoals,
      competitions: Object.values(euroByComp),
    };
 
    // ── 4. Winning streak ────────────────────────────────────────────────────
    let streak = 0;
    for (const m of recentMatches) {
      if (m.result === 'W') streak++;
      else break;
    }
 
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // cache 5 min
      },
      body: JSON.stringify({
        stats: { ...stats, winStreak: streak },
        nextMatch,
        recentMatches,
        upcomingMatches,
        standings,
        europeanStats,
        updatedAt: new Date().toISOString(),
      }),
    };
  } catch (err) {
    console.error('porto-stats error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
