// netlify/functions/porto-youtube.js
// VSPORTS - Liga Portugal channel
// Filtre les vidéos contenant "Resumo" ET "Porto" dans le titre

const CHANNEL_ID   = 'UCuIlu5oGIj1RzHOYmeSV5Eg'; // ← colle l'ID ici ex: UCxxxxxxxxxxxx
const MAX_RESULTS  = 50; // on récupère 50 pour avoir assez après filtrage
const KEYWORDS     = ['resumo', 'porto'];       // les deux doivent être présents (insensible à la casse)

exports.handler = async () => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error('YOUTUBE_API_KEY manquante');

    // ── 1. Récupérer les dernières vidéos de la chaîne ──────────────────────
    // Paginer sur 4 pages de 50 = 200 vidéos pour ne rien rater
    async function searchPage(pageToken) {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('channelId', CHANNEL_ID);
      url.searchParams.set('maxResults', '50');
      url.searchParams.set('order', 'date');
      url.searchParams.set('type', 'video');
      url.searchParams.set('key', apiKey);
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const res = await fetch(url.toString());
      if (!res.ok) { const e = await res.json(); throw new Error(`YouTube API ${res.status}: ${e?.error?.message}`); }
      return res.json();
    }

    // Récupérer jusqu'à 4 pages
    let allItems = [];
    let nextPageToken = null;
    for (let page = 0; page < 4; page++) {
      const data = await searchPage(nextPageToken);
      allItems = allItems.concat(data.items ?? []);
      nextPageToken = data.nextPageToken;
      if (!nextPageToken) break;
    }

    // ── 2. Filtrer : titre doit contenir "resumo" ET "porto" ────────────────
    const filtered = allItems.filter(item => {
      const title = (item.snippet?.title ?? '').toLowerCase();
      return KEYWORDS.every(kw => title.includes(kw));
    });

    if (filtered.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=1800' },
        body: JSON.stringify({ videos: [], updatedAt: new Date().toISOString() }),
      };
    }

    // ── 3. Récupérer les durées via videos endpoint ─────────────────────────
    const videoIds = filtered.map(i => i.id?.videoId).filter(Boolean).join(',');
    const detailUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailUrl.searchParams.set('part', 'contentDetails,statistics');
    detailUrl.searchParams.set('id', videoIds);
    detailUrl.searchParams.set('key', apiKey);

    const detailRes = await fetch(detailUrl.toString());
    const detailData = detailRes.ok ? await detailRes.json() : { items: [] };
    const detailMap = {};
    (detailData.items ?? []).forEach(v => { detailMap[v.id] = v; });

    // ── 4. Formater la réponse ──────────────────────────────────────────────
    const videos = filtered.map(item => {
      const id      = item.id?.videoId;
      const snippet = item.snippet ?? {};
      const detail  = detailMap[id] ?? {};

      // Parser la durée ISO 8601 → "mm:ss"
      const rawDur  = detail.contentDetails?.duration ?? '';
      const durMatch = rawDur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      let duration = '—';
      if (durMatch) {
        const h = parseInt(durMatch[1] ?? 0);
        const m = parseInt(durMatch[2] ?? 0);
        const s = parseInt(durMatch[3] ?? 0);
        if (h > 0) duration = `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        else       duration = `${m}:${String(s).padStart(2,'0')}`;
      }

      // Miniature la plus haute qualité dispo
      const thumb = snippet.thumbnails?.maxres?.url
        ?? snippet.thumbnails?.high?.url
        ?? snippet.thumbnails?.medium?.url
        ?? '';

      return {
        id,
        title:     snippet.title,
        thumb,
        duration,
        published: snippet.publishedAt,
        views:     parseInt(detail.statistics?.viewCount ?? 0),
        url:       `https://www.youtube.com/watch?v=${id}`,
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=1800', // 30 min
      },
      body: JSON.stringify({ videos, updatedAt: new Date().toISOString() }),
    };

  } catch (err) {
    console.error('porto-youtube error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
