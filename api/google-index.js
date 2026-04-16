// api/google-index.js
// Soumet une URL à l'Indexing API Google pour indexation immédiate
// Nécessite : GOOGLE_SERVICE_ACCOUNT_JSON (contenu du fichier JSON du compte de service)
//
// Setup :
// 1. console.cloud.google.com → créer projet → activer "Web Search Indexing API"
// 2. IAM → Comptes de service → créer → télécharger JSON
// 3. Google Search Console → Paramètres → Utilisateurs → ajouter l'email du compte de service (type: Propriétaire)
// 4. Coller le contenu du JSON dans la variable Vercel GOOGLE_SERVICE_ACCOUNT_JSON

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url requis' });

  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJson) {
    console.warn('GOOGLE_SERVICE_ACCOUNT_JSON non configuré — indexation skippée');
    return res.status(200).json({ ok: true, skipped: true, reason: 'no credentials' });
  }

  try {
    const sa = JSON.parse(saJson);

    // Générer un JWT pour l'authentification Google
    const jwt = await makeJWT(sa);

    // Obtenir un access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion:  jwt,
      }),
    });
    if (!tokenRes.ok) throw new Error('Token error: ' + tokenRes.status);
    const { access_token } = await tokenRes.json();

    // Appeler l'Indexing API
    const indexRes = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        url:  url,
        type: 'URL_UPDATED',
      }),
    });

    const indexData = await indexRes.json();
    if (!indexRes.ok) throw new Error('Indexing API error: ' + JSON.stringify(indexData));

    console.log('Google Indexing API OK:', url, indexData);
    return res.status(200).json({ ok: true, url, response: indexData });

  } catch (err) {
    // On ne fail pas le publish pour ça — on log juste
    console.error('google-index error:', err.message);
    return res.status(200).json({ ok: true, skipped: true, error: err.message });
  }
}

// ── JWT helper (sans lib externe) ────────────────────────────────────────────
async function makeJWT(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss:   sa.client_email,
    sub:   sa.client_email,
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
    scope: 'https://www.googleapis.com/auth/indexing',
  };

  const b64Header  = btoa(JSON.stringify(header)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const b64Payload = btoa(JSON.stringify(payload)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const sigInput   = `${b64Header}.${b64Payload}`;

  // Importer la clé privée RSA
  const pemKey = sa.private_key;
  const pemBody = pemKey.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const keyBytes = Buffer.from(pemBody, 'base64');

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(sigInput)
  );

  const b64Sig = Buffer.from(signature).toString('base64')
    .replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');

  return `${sigInput}.${b64Sig}`;
}
