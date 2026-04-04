const https = require('https');

function fetchURL(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.football-data.org',
      path,
      headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.end();
  });
}

exports.handler = async function() {
  try {
    const [standingsData, matchesData] = await Promise.all([
      fetchURL('/v4/competitions/PPL/standings'),
      fetchURL('/v4/teams/498/matches?status=SCHEDULED&limit=1')
    ]);

    // Stats classement
    const table = standingsData.standings[0].table;
    const porto = table.find(t => t.team.id === 498);
    const second = table.find(t => t.position === 2);

    // Prochain match
    const match = matchesData.matches[0];
    const isHome = match.homeTeam.id === 498;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        stats: {
          position: porto.position,
          wins: porto.won,
          goalsFor: porto.goalsFor,
          points: porto.points,
          played: porto.playedGames,
          gapPoints: second ? porto.points - second.points : 0,
          secondTeam: second?.team.shortName
        },
        nextMatch: {
          date: match.utcDate,
          competition: match.competition.name,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          homeCrest: match.homeTeam.crest,
          awayCrest: match.awayTeam.crest,
          isHome,
          venue: isHome ? 'Estádio do Dragão' : 'Extérieur'
        }
      })
    };
  } catch(e) {
    return { statusCode: 500, body: e.message };
  }
};
