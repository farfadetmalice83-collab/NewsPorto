const https = require('https');

exports.handler = async function(event, context) {
  const API_KEY = process.env.FOOTBALL_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Clé API manquante' })
    };
  }

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.football-data.org',
      path: '/v4/competitions/PPL/standings',
      method: 'GET',
      headers: {
        'X-Auth-Token': API_KEY
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const standings = data.standings[0].table;
          const porto = standings.find(t => t.team.id === 498);
          const second = standings.find(t => t.position === 2);

          if (!porto) {
            return resolve({
              statusCode: 404,
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: 'Porto non trouvé' })
            });
          }

          const gap = second ? porto.points - second.points : 0;

          const stats = {
            position: porto.position,
            wins: porto.won,
            draws: porto.draw,
            losses: porto.lost,
            goalsFor: porto.goalsFor,
            goalsAgainst: porto.goalsAgainst,
            points: porto.points,
            played: porto.playedGames,
            gapPoints: gap,
            secondTeam: second ? second.team.shortName : '',
            updatedAt: new Date().toISOString()
          };

          resolve({
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=1800' // cache 30 min côté CDN
            },
            body: JSON.stringify(stats)
          });

        } catch (e) {
          resolve({
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Erreur parsing API' })
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: e.message })
      });
    });

    req.end();
  });
};
