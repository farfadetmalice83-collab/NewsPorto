// api/porto-stats.js — Vercel Serverless Function
//
// DEUX APIs :
//   football-data.org  → classement, calendrier, résultats  (clé : FOOTBALL_API_KEY)
//   API-Football       → stats live pendant un match         (clé : API_FOOTBALL_KEY)
//
// STRATÉGIE QUOTA API-Football (100 req/jour) :
//   - Hors match  : 0 requête API-Football
//   - Pendant match : 1 requête toutes les 2 min = ~50 req/match
//   - Le frontend poll toutes les 120s (pas 60s)

const FD_BASE    = 'https://api.football-data.org/v4';
const AF_BASE    = 'https://v3.football.api-sports.io';
const PORTO_FD   = 503;    // ID FC Porto sur football-data.org
const PORTO_AF   = 212;    // ID FC Porto sur API-Football
const LIGA_CODE  = 'PPL';
const LIGA_AF    = 94;     // ID Liga Portugal sur API-Football
const SEASON     = 2025;

// ── Helpers fetch ────────────────────────────────────────────────────────────

async function fetchFD(path) {
  const res = await fetch(`${FD_BASE}${path}`, {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`football-data ${res.status} ${path}`);
  return res.json();
}

async function fetchAF(path) {
  const res = await fetch(`${AF_BASE}${path}`, {
    headers: { 'x-apisports-key': process.env.AF_KEY }
  });
  if (!res.ok) throw new Error(`api-football ${res.status} ${path}`);
  return res.json();
}

// ── Extraire lineup depuis football-data.org ─────────────────────────────────

function extractLineup(detail, competition) {
  if (!detail?.lineups) return null;
  const porto = detail.lineups.find(l => l.team?.id === PORTO_FD);
  if (!porto) return null;
  const map = p => ({
    number:   p.shirtNumber ?? p.shirt_number ?? null,
    name:     p.player?.name ?? p.name ?? '—',
    position: p.position ?? null,
  });
  return {
    competition: competition ?? '',
    formation:   porto.formation ?? null,
    startXI:     (porto.startXIs ?? porto.lineup ?? []).map(map),
    bench:       (porto.bench ?? []).map(map),
  };
}

// ── Extraire events depuis football-data.org ─────────────────────────────────

function extractEvents(detail) {
  if (!detail) return [];
  const events = [];
  (detail.goals || []).forEach(g => events.push({
    minute:     g.minute ?? null,
    type:       g.type === 'OWN_GOAL' ? 'OWN_GOAL' : g.type === 'PENALTY' ? 'PENALTY' : 'GOAL',
    playerName: g.scorer?.name ?? '—',
    assistName: g.assist?.name ?? null,
    teamId:     g.team?.id ?? null,
    teamName:   g.team?.shortName ?? g.team?.name ?? null,
  }));
  (detail.bookings || []).forEach(b => events.push({
    minute:     b.minute ?? null,
    type:       b.card === 'RED_CARD' ? 'RED_CARD' : 'YELLOW_CARD',
    playerName: b.player?.name ?? '—',
    teamId:     b.team?.id ?? null,
    teamName:   b.team?.shortName ?? b.team?.name ?? null,
  }));
  (detail.substitutions || []).forEach(s => events.push({
    minute:        s.minute ?? null,
    type:          'SUBSTITUTION',
    playerName:    s.playerIn?.name ?? '—',
    playerOutName: s.playerOut?.name ?? null,
    teamId:        s.team?.id ?? null,
    teamName:      s.team?.shortName ?? s.team?.name ?? null,
  }));
  return events.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
}

// ── Stats live depuis API-Football ──────────────────────────────────────────
// 1 seule requête pour tout : /fixtures?id=XXX&live=all renvoie stats + events

async function fetchLiveStatsAF(fixtureId) {
  try {
    const data = await fetchAF(`/fixtures?id=${fixtureId}&live=all`);
    const fix  = data?.response?.[0];
    if (!fix) return null;

    // Stats (possession, tirs, corners, etc.)
    const rawStats = fix.statistics || [];
    const homeStats = rawStats.find(s => s.team?.id === PORTO_AF)?.statistics || [];
    const awayStats = rawStats.find(s => s.team?.id !== PORTO_AF)?.statistics || [];

    const statMap = (arr) => {
      const m = {};
      arr.forEach(s => { m[s.type] = s.value ?? 0; });
      return m;
    };
    const hs = statMap(homeStats);
    const as_ = statMap(awayStats);

    const matchStats = [];
    const addStat = (label, hKey, aKey) => {
      const h = parseInt(hs[hKey] ?? hs[label] ?? 0) || 0;
      const a = parseInt(as_[aKey ?? hKey] ?? as_[label] ?? 0) || 0;
      if (h > 0 || a > 0) matchStats.push({ label, home: h, away: a });
    };

    // Possession : valeur en "45%" → extraire le nombre
    const posH = parseInt(String(hs['Ball Possession'] ?? '0').replace('%','')) || 0;
    const posA = parseInt(String(as_['Ball Possession'] ?? '0').replace('%','')) || 0;
    if (posH > 0 || posA > 0) matchStats.push({ label: 'Possession %', home: posH, away: posA });

    addStat('Tirs cadrés',   'Shots on Goal');
    addStat('Tirs totaux',   'Total Shots');
    addStat('Corners',       'Corner Kicks');
    addStat('Fautes',        'Fouls');
    addStat('Hors-jeux',     'Offsides');
    addStat('Arrêts',        'Goalkeeper Saves');
    addStat('Cartons jaunes','Yellow Cards');
    addStat('Cartons rouges','Red Cards');

    // Minute en cours
    const elapsed = fix.fixture?.status?.elapsed ?? null;

    return { matchStats, elapsed };
  } catch (e) {
    console.error('fetchLiveStatsAF error:', e.message);
    return null;
  }
}

// ── Trouver le fixture_id API-Football depuis le match football-data ─────────
// On cherche par équipe + date (pas besoin d'un appel dédié)

async function findAFFixtureId(lm) {
  try {
    // Chercher le match live de Porto sur API-Football
    const data = await fetchAF(`/fixtures?team=${PORTO_AF}&live=all`);
    const fix  = data?.response?.[0];
    return fix?.fixture?.id ?? null;
  } catch (e) {
    console.error('findAFFixtureId error:', e.message);
    return null;
  }
}

// ── Handler principal ────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {

    // ── 1. Données football-data.org (classement + matchs) ──────────────────
    const [standingsData, matchesData, liveInPlay, livePaused, liveHalf] = await Promise.all([
      fetchFD(`/competitions/${LIGA_CODE}/standings`),
      fetchFD(`/teams/${PORTO_FD}/matches?status=SCHEDULED,FINISHED&limit=20`),
      fetchFD(`/teams/${PORTO_FD}/matches?status=IN_PLAY`).catch(() => null),
      fetchFD(`/teams/${PORTO_FD}/matches?status=PAUSED`).catch(() => null),
      fetchFD(`/teams/${PORTO_FD}/matches?status=HALF_TIME`).catch(() => null),
    ]);

    // ── 2. Classement Liga ───────────────────────────────────────────────────
    const table    = standingsData?.standings?.find(s => s.type === 'TOTAL')?.table ?? [];
    const sorted   = [...table].sort((a, b) => a.position - b.position);
    const portoRow = table.find(r => r.team.id === PORTO_FD) ?? {};

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
      goalDiff: r.goalDifference, points: r.points, isPorto: r.team.id === PORTO_FD,
    }));

    // ── 3. Match en cours ────────────────────────────────────────────────────
    const allMatches  = matchesData?.matches ?? [];
    const liveMatches = [
      ...(liveInPlay?.matches ?? []),
      ...(livePaused?.matches ?? []),
      ...(liveHalf?.matches ?? []),
    ];

    let liveMatch = null;
    let lineup    = null;

    if (liveMatches.length > 0) {
      const lm     = liveMatches[0];
      const detail = await fetchFD(`/matches/${lm.id}`);
      const events = extractEvents(detail);

      // ── Stats live depuis API-Football (1 requête) ──
      let matchStats  = [];
      let liveMinute  = lm.minute ?? null;

      const afFixId = await findAFFixtureId(lm);  // 1 requête AF
      if (afFixId) {
        // findAFFixtureId retourne déjà les données live — on refait un appel stats propre
        const afStats = await fetchLiveStatsAF(afFixId);  // 1 requête AF
        if (afStats) {
          matchStats = afStats.matchStats;
          if (afStats.elapsed) liveMinute = afStats.elapsed;
        }
      }
      // Total : 2 requêtes API-Football par poll (toutes les 2 min = ~50 req/match)

      liveMatch = {
        id:          lm.id,
        competition: lm.competition?.name ?? '—',
        homeTeam:    lm.homeTeam?.shortName ?? lm.homeTeam?.name ?? '—',
        awayTeam:    lm.awayTeam?.shortName ?? lm.awayTeam?.name ?? '—',
        homeCrest:   lm.homeTeam?.crest ?? null,
        awayCrest:   lm.awayTeam?.crest ?? null,
        homeGoals:   lm.score?.fullTime?.home ?? lm.score?.halfTime?.home ?? 0,
        awayGoals:   lm.score?.fullTime?.away ?? lm.score?.halfTime?.away ?? 0,
        minute:      liveMinute,
        status:      lm.status,
        venue:       lm.venue ?? null,
        events,
        matchStats,
      };
      lineup = extractLineup(detail, lm.competition?.name);
    }

    // ── 4. Prochain match + calendrier ───────────────────────────────────────
    const scheduled = allMatches
      .filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED')
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

    const mapMatch = m => ({
      id: m.id, date: m.utcDate,
      competition: m.competition?.name ?? '—',
      competitionCode: m.competition?.code ?? '',
      homeTeam:  m.homeTeam?.shortName ?? m.homeTeam?.name ?? '—',
      awayTeam:  m.awayTeam?.shortName ?? m.awayTeam?.name ?? '—',
      homeCrest: m.homeTeam?.crest ?? null,
      awayCrest: m.awayTeam?.crest ?? null,
      venue:     m.venue ?? null,
    });

    const upcomingMatches = scheduled.slice(0, 5).map(mapMatch);
    const nextMatch       = upcomingMatches[0] ?? null;

    // Lineup pre-match si disponible
    if (!liveMatch && nextMatch?.id) {
      const detail = await fetchFD(`/matches/${nextMatch.id}`);
      if (detail) {
        const pre = extractLineup(detail, nextMatch.competition);
        if (pre?.startXI?.length > 0) lineup = pre;
      }
    }

    // ── 5. Résultats récents ─────────────────────────────────────────────────
    const finished = allMatches
      .filter(m => m.status === 'FINISHED')
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
      .slice(0, 5);

    const recentMatches = finished.map(m => {
      const isHome = m.homeTeam.id === PORTO_FD;
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

    // ── 6. Stats Europe ──────────────────────────────────────────────────────
    const euroMatches = allMatches.filter(
      m => !['PPL','PL1'].includes(m.competition?.code) && m.status === 'FINISHED'
    );
    let winStreak = 0;
    for (const m of recentMatches) { if (m.result === 'W') winStreak++; else break; }

    // ── Réponse ──────────────────────────────────────────────────────────────
    // Cache : 120s si match en cours (aligne avec le poll frontend), 300s sinon
    const isLive = liveMatch && liveMatch.status !== 'FINISHED';
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', `public, max-age=${isLive ? 120 : 300}, s-maxage=${isLive ? 120 : 300}`);

    res.status(200).json({
      stats:          { ...stats, winStreak },
      nextMatch,
      liveMatch,
      lineup,
      recentMatches,
      upcomingMatches,
      standings,
      pollInterval:   isLive ? 120 : 300, // indique au frontend le délai optimal
      updatedAt:      new Date().toISOString(),
    });

  } catch (err) {
    console.error('porto-stats error:', err);
    res.status(500).json({ error: err.message });
  }
}
