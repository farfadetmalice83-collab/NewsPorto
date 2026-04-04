const https = require('https');

exports.handler = async function() {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.football-data.org',
      path: '/v4/competitions/PPL/standings',
      headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        const standings = JSON.parse(body).standings[0].table;
        const porto = standings.find(t => t.team.id === 498);
        const second = standings.find(t => t.position === 2);
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            position: porto.position,
            wins: porto.won,
            goalsFor: porto.goalsFor,
            points: porto.points,
            played: porto.playedGames,
            gapPoints: second ? porto.points - second.points : 0,
            secondTeam: second?.team.shortName
          })
        });
      });
    });
    req.on('error', e => resolve({ statusCode: 500, body: e.message }));
    req.end();
  });
};
