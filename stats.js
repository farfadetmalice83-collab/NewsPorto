exports.handler = async function() {
  const API_KEY = '89a64c6c883849af9b36216912f484f8';

  const res = await fetch('https://api.football-data.org/v4/competitions/PPL/standings', {
    headers: { 'X-Auth-Token': API_KEY }
  });

  const data = await res.json();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(data)
  };
};
