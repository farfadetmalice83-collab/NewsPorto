// api/porto-stats.js  ← Vercel Serverless Function
// FC Porto (ID 503) — football-data.org

const BASE      = 'https://api.football-data.org/v4';
const PORTO_ID  = 503;
const LIGA_CODE = 'PPL';

const API_HEADERS = { 'X-Auth-Token': process.env.FOOTBALL_API_KEY };

async function fetchFD(path) {
  const res = await fetch(`${BASE}${path}`, { headers: API_HEADERS });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`football-data ${res.status} on ${path}`);
  return res.json();
}

function extractLineup(matchDetail, competition) {
  if (!matchDetail || !matchDetail.lineups) return null;
  const porto = matchDetail.lineups.find(l => l.team?.id === PORTO_ID);
  if (!porto) return null;
  const mapPlayer = p => ({
    number:   p.shirtNumber ?? p.shirt_number ?? null,
    name:     p.player?.name ?? p.name ?? '—',
    position: p.position ?? null,
  });
  return {
    competition: competition ?? '',
    formation:   porto.formation ?? null,
    startXI:     (porto.startXIs ?? porto.lineup ?? []).map(mapPlayer),
    bench:       (porto.bench ?? []).map(mapPlayer),
  };
}

// Extrait les événements du match (buts, cartons, remplacements)
function extractEvents(matchDetail) {
  if (!matchDetail?.goals && !matchDetail?.bookings && !matchDetail?.substitutions) return [];
  const events = [];

  // Buts
  (matchDetail.goals || []).forEach(g => {
    events.push({
      minute:      g.minute ?? g.regularTimeMinute ?? null,
      type:        g.type === 'OWN_GOAL' ? 'OWN_GOAL' : g.type === 'PENALTY' ? 'PENALTY' : 'GOAL',
      playerName:  g.scorer?.name ?? '—',
      assistName:  g.assist?.name ?? null,
      teamId:      g.team?.id ?? null,
      teamName:    g.team?.shortName ?? g.team?.name ?? null,
    });
  });

  // Cartons
  (matchDetail.bookings || []).forEach(b => {
    events.push({
      minute:     b.minute ?? null,
      type:       b.card === 'RED_CARD' ? 'RED_CARD' : 'YELLOW_CARD',
      playerName: b.player?.name ?? '—',
      teamId:     b.team?.id ?? null,
      teamName:   b.team?.shortName ?? b.team?.name ?? null,
    });
  });

  // Remplacements
  (matchDetail.substitutions || []).forEach(s => {
    events.push({
      minute:        s.minute ?? null,
      type:          'SUBSTITUTION',
      playerName:    s.playerIn?.name ?? '—',
      playerOutName: s.playerOut?.name ?? null,
      teamId:        s.team?.id ?? null,
      teamName:      s.team?.shortName ?? s.team?.name ?? null,
    });
  });

  return events.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
}

// Extrait les stats du match (possession, tirs, etc.)
function extractMatchStats(matchDetail) {
  if (!matchDetail?.odds && !matchDetail?.referees) return [];
  // football-data.org v4 ne fournit pas les stats détaillées sur le plan gratuit
  // On retourne les stats disponibles depuis le score
  const stats = [];
  if (matchDetail.score) {
    const ht = matchDetail.score.halfTime;
    if (ht?.home != null) {
      stats.push({ label: 'Score mi-temps', home: ht.home ?? 0, away: ht.away ?? 0 });
    }
  }
  return stats;
}

export default async function handler(req, res) {
  try {
    // 1. Standings
    const standingsData = await fetchFD(`/competitions/${LIGA_CODE}/standings`);
    const table  = standingsData?.standings?.find(s => s.type === 'TOTAL')?.table ?? [];
    const sorted = [...table].sort((a, b) => a.position - b.position);
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

    // 2. Matches
    async function fetchLive(status) {
      try {
        const d = await fetchFD(`/teams/${PORTO_ID}/matches?status=${status}`);
        return d?.matches ?? [];
      } catch(e) { return []; }
    }

    const [matchesData, liveInPlay, livePaused, liveHalf] = await Promise.all([
      fetchFD(`/teams/${PORTO_ID}/matches?status=SCHEDULED,FINISHED&limit=20`),
      fetchLive('IN_PLAY'),
      fetchLive('PAUSED'),
      fetchLive('HALF_TIME'),
    ]);

    const allMatches  = matchesData?.matches ?? [];
    const liveMatches = [...liveInPlay, ...livePaused, ...liveHalf];

    // 3. Live match + lineup + events
    let liveMatch = null;
    let lineup    = null;

    if (liveMatches.length > 0) {
      const lm = liveMatches[0];
      const detail = await fetchFD(`/matches/${lm.id}`);
      const events = extractEvents(detail);
      const matchStats = extractMatchStats(detail);

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
        events,
        matchStats,
      };
      lineup = extractLineup(detail, lm.competition?.name);
    }

    // 4. Upcoming + next match
    const scheduled = allMatches
      .filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED')
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

    const mapUpcoming = m => ({
      id: m.id, date: m.utcDate,
      competition: m.competition?.name ?? '—',
      competitionCode: m.competition?.code ?? '',
      homeTeam: m.homeTeam?.shortName ?? m.homeTeam?.name ?? '—',
      awayTeam: m.awayTeam?.shortName ?? m.awayTeam?.name ?? '—',
      homeCrest: m.homeTeam?.crest ?? null, awayCrest: m.awayTeam?.crest ?? null,
      venue: m.venue ?? null,
    });

    const upcomingMatches = scheduled.slice(0, 5).map(mapUpcoming);
    const nextMatch = upcomingMatches[0] ?? null;

    if (!liveMatch && nextMatch?.id) {
      const detail = await fetchFD(`/matches/${nextMatch.id}`);
      if (detail) {
        const pre = extractLineup(detail, nextMatch.competition);
        if (pre?.startXI?.length > 0) lineup = pre;
        // Add events for next match (will be empty but ready)
        if (nextMatch) {
          nextMatch.events = [];
          nextMatch.matchStats = [];
        }
      }
    }

    // 5. Recent matches
    const finished = allMatches
      .filter(m => m.status === 'FINISHED')
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
      .slice(0, 5);

    const recentMatches = finished.map(m => {
      const isHome = m.homeTeam.id === PORTO_ID;
      const opp    = isHome ? m.awayTeam : m.homeTeam;
      const pg     = isHome ? m.score.fullTime.home : m.score.fullTime.away;
      const og     = isHome ? m.score.fullTime.away : m.score.fullTime.home;
      return {
        date: m.utcDate, competition: m.competition?.name ?? '—',
        competitionCode: m.competition?.code ?? '', isHome,
        opponentName: opp.shortName ?? opp.name,
        opponentCrest: opp.crest ?? null, portoGoals: pg, oppGoals: og,
        result: pg > og ? 'W' : pg < og ? 'L' : 'D',
        venue: m.venue ?? null,
      };
    });

    // 6. European stats
    const euroMatches = allMatches.filter(
      m => !['PPL','PL1'].includes(m.competition?.code) && m.status === 'FINISHED'
    );
    const euroByComp = {};
    euroMatches.forEach(m => {
      const key = m.competition?.name ?? 'Europe';
      if (!euroByComp[key]) euroByComp[key] = { name: key, played: 0, won: 0, goals: 0 };
      const isHome = m.homeTeam.id === PORTO_ID;
      const pg = isHome ? m.score.fullTime.home : m.score.fullTime.away;
      const og = isHome ? m.score.fullTime.away : m.score.fullTime.home;
      euroByComp[key].played++;
      if (pg > og) euroByComp[key].won++;
      euroByComp[key].goals += pg ?? 0;
    });
    const europeanStats = {
      played: euroMatches.length,
      wins: euroMatches.filter(m => {
        const isHome = m.homeTeam.id === PORTO_ID;
        const pg = isHome ? m.score.fullTime.home : m.score.fullTime.away;
        const og = isHome ? m.score.fullTime.away : m.score.fullTime.home;
        return pg > og;
      }).length,
      goals: euroMatches.reduce((a, m) => {
        const isHome = m.homeTeam.id === PORTO_ID;
        return a + (isHome ? (m.score.fullTime.home ?? 0) : (m.score.fullTime.away ?? 0));
      }, 0),
      competitions: Object.values(euroByComp),
    };

    // 7. Win streak
    let winStreak = 0;
    for (const m of recentMatches) { if (m.result === 'W') winStreak++; else break; }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', `public, max-age=${liveMatch ? 60 : 300}`);
    res.status(200).json({
      stats: { ...stats, winStreak },
      nextMatch,
      liveMatch,
      lineup,
      recentMatches,
      upcomingMatches,
      standings,
      europeanStats,
      updatedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('porto-stats error:', err);
    res.status(500).json({ error: err.message });
  }
}
