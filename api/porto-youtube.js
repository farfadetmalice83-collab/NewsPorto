// api/porto-youtube.js  ← Vercel Serverless Function
// VSPORTS - Liga Portugal channel
// Filtre les vidéos contenant "Resumo" ET "Porto" dans le titre

const CHANNEL_ID = 'UCuIlu5oGIj1RzHOYmeSV5Eg';
const KEYWORDS   = ['resumo', 'porto'];

// ── Vercel handler ────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error('YOUTUBE_API_KEY manquante');

    // ── 1. Récupérer les dernières vidéos de la chaîne ──────────────────────
    async function searchPage(pageToken) {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('channelId', CHANNEL_ID);
      url.searchParams.set('maxResults', '50');
      url.searchParams.set('order', 'date');
      url.searchParams.set('type', 'video');
      url.searchParams.set('key', apiKey);
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const r = await fetch(url.toString());
      if (!r.ok) { const e = await r.json(); throw new Error(`YouTube API ${r.status}: ${e?.error?.message}`); }
      return r.json();
    }

    let allItems = [];
    let nextPageToken = null;
    for (let page = 0; page < 4; page++) {
      const data = await searchPage(nextPageToken);
      allItems = allItems.concat(data.items ?? []);
      nextPageToken = data.nextPageToken;
      if (!nextPageToken) break;
    }

    // ── 2. Filtrer ────────────────────────────────────────────────────────────
    const filtered = allItems.filter(item => {
      const title = (item.snippet?.title ?? '').toLowerCase();
      return KEYWORDS.every(kw => title.includes(kw));
    });

    if (filtered.length === 0) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=1800');
      return res.status(200).json({ videos: [], updatedAt: new Date().toISOString() });
    }

    // ── 3. Récupérer les durées ───────────────────────────────────────────────
    const videoIds = filtered.map(i => i.id?.videoId).filter(Boolean).join(',');
    const detailUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailUrl.searchParams.set('part', 'contentDetails,statistics');
    detailUrl.searchParams.set('id', videoIds);
    detailUrl.searchParams.set('key', apiKey);

    const detailRes  = await fetch(detailUrl.toString());
    const detailData = detailRes.ok ? await detailRes.json() : { items: [] };
    const detailMap  = {};
    (detailData.items ?? []).forEach(v => { detailMap[v.id] = v; });

    // ── 4. Formater ───────────────────────────────────────────────────────────
    const videos = filtered.map(item => {
      const id      = item.id?.videoId;
      const snippet = item.snippet ?? {};
      const detail  = detailMap[id] ?? {};

      const rawDur   = detail.contentDetails?.duration ?? '';
      const durMatch = rawDur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      let duration = '—';
      if (durMatch) {
        const h = parseInt(durMatch[1] ?? 0);
        const m = parseInt(durMatch[2] ?? 0);
        const s = parseInt(durMatch[3] ?? 0);
        duration = h > 0
          ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
          : `${m}:${String(s).padStart(2,'0')}`;
      }

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

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    res.status(200).json({ videos, updatedAt: new Date().toISOString() });

  } catch (err) {
    console.error('porto-youtube error:', err);
    res.status(500).json({ error: err.message });
  }
}
