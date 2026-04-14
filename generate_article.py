#!/usr/bin/env python3
import os, json, re, requests, random
from datetime import datetime

GEMINI_KEY   = os.environ["GEMINI_API_KEY"]
UNSPLASH_KEY = os.environ["UNSPLASH_ACCESS_KEY"]

MONTHS_FR = {"Jan":"Jan","Feb":"Fév","Mar":"Mar","Apr":"Avr","May":"Mai",
             "Jun":"Jun","Jul":"Jul","Aug":"Aoû","Sep":"Sep","Oct":"Oct",
             "Nov":"Nov","Dec":"Déc"}

def load_index():
    path = "articles/index.json"
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"articles": [], "used_image_ids": []}

def save_index(data):
    with open("articles/index.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_unsplash_image(query, used_ids):
    params = {"query": query, "per_page": 20, "orientation": "landscape", "client_id": UNSPLASH_KEY}
    r = requests.get("https://api.unsplash.com/search/photos", params=params)
    r.raise_for_status()
    results = r.json().get("results", [])
    for photo in results:
        if photo["id"] not in used_ids:
            requests.get(photo["links"]["download_location"], params={"client_id": UNSPLASH_KEY})
            return {"id": photo["id"], "url": photo["urls"]["regular"],
                    "thumb": photo["urls"]["small"], "author": photo["user"]["name"],
                    "author_link": photo["user"]["links"]["html"]}
    if results:
        photo = results[0]
        return {"id": photo["id"], "url": photo["urls"]["regular"],
                "thumb": photo["urls"]["small"], "author": photo["user"]["name"],
                "author_link": photo["user"]["links"]["html"]}
    return None

def generate_article(existing_titles):
    styles = [
        "un compte-rendu d'un match récent du FC Porto",
        "une analyse tactique d'un match ou système de jeu récent",
        "un article mercato sur un transfert ou une rumeur récente",
        "un focus sur les performances récentes d'un joueur de Porto",
        "un article sur la course au titre en Liga Portugal cette saison",
        "un article sur le parcours européen actuel du FC Porto"
    ]
    style = random.choice(styles)
    titles_str = "\n".join(f"- {t}" for t in existing_titles[-15:]) if existing_titles else "Aucun."

    prompt = f"""Tu es un journaliste sportif expert du FC Porto pour NewsPorto.fr.

MISSION : Génère {style}.

RÈGLES STRICTES :
1. Base-toi sur des faits réels et récents de la saison 2025/2026 du FC Porto.
2. NE génère PAS un article sur un sujet déjà traité :
{titles_str}
3. Ne mentionne jamais que l'article est généré par une IA.

RÉPONSE : JSON uniquement, sans markdown, sans backticks, sans texte avant/après.

{{
  "title": "Titre accrocheur en français (max 65 caractères)",
  "category": "europe | analyse | transfert | liga | interview",
  "excerpt": "Accroche percutante 150 caractères max",
  "read_time": "X min de lecture",
  "unsplash_query": "requête anglais pour image football générique (ex: soccer stadium crowd, football match action)",
  "content": "HTML : minimum 5 balises <p> avec contenu riche, 2 balises <h2>. Style journalistique passionné. PAS de balises html/head/body."
}}"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={GEMINI_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.8, "maxOutputTokens": 2048}
    }
    r = requests.post(url, json=payload)
    r.raise_for_status()
    raw = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    raw = re.sub(r"^```json\s*", "", raw)
    raw = re.sub(r"^```\s*", "", raw)
    raw = re.sub(r"```$", "", raw).strip()
    return json.loads(raw)

def build_html(data, image, date_str):
    cat_labels = {"europe":"Europa League","analyse":"Analyse","transfert":"Mercato",
                  "liga":"Championnat","interview":"Interview"}
    cat_label = cat_labels.get(data["category"], data["category"].capitalize())
    img_url        = image["url"] if image else "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200"
    img_author     = image["author"] if image else "Unsplash"
    img_author_link= image["author_link"] if image else "#"

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{data['title']} — NewsPorto</title>
  <meta name="description" content="{data['excerpt']}">
  <meta property="og:title" content="{data['title']}">
  <meta property="og:description" content="{data['excerpt']}">
  <meta property="og:image" content="{img_url}">
  <link rel="icon" type="image/x-icon" href="../favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root{{--white:#fff;--gray:rgba(255,255,255,0.45);--border:rgba(255,255,255,0.09);--grid-color:rgba(255,255,255,0.035);}}
    *,*::before,*::after{{margin:0;padding:0;box-sizing:border-box;}}
    body{{background:#000;color:#fff;font-family:'Barlow',sans-serif;overflow-x:hidden;}}
    .grid-bg{{position:fixed;inset:0;z-index:0;background-image:linear-gradient(var(--grid-color) 1px,transparent 1px),linear-gradient(90deg,var(--grid-color) 1px,transparent 1px);background-size:44px 44px;animation:gridScroll 16s linear infinite;pointer-events:none;}}
    @keyframes gridScroll{{0%{{background-position:0 0}}100%{{background-position:44px 44px}}}}
    .page{{position:relative;z-index:1;}}
    #page-loader{{position:fixed;inset:0;background:#000;z-index:9999;display:flex;align-items:center;justify-content:center;transition:opacity .4s,visibility .4s;}}
    #page-loader.hidden{{opacity:0;visibility:hidden;}}
    .loader-text{{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:8px;}}
    .loader-bar{{width:160px;height:1px;background:var(--border);overflow:hidden;margin-top:20px;}}
    .loader-bar-fill{{height:100%;width:0%;background:#fff;animation:loadBar .55s ease forwards;}}
    @keyframes loadBar{{to{{width:100%;}}}}
    nav{{display:flex;align-items:center;justify-content:space-between;padding:0 56px;height:72px;border-bottom:1px solid rgba(0,61,165,0.5);backdrop-filter:blur(10px);background:rgba(0,0,0,0.65);position:sticky;top:0;z-index:100;}}
    .nav-logo{{display:flex;align-items:center;gap:10px;text-decoration:none;}}
    .nav-logo img{{height:44px;}}
    .nav-logo-text{{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:3px;color:#fff;}}
    .nav-links{{display:flex;gap:36px;list-style:none;}}
    .nav-links a{{font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.4);text-decoration:none;transition:color .2s;}}
    .nav-links a:hover{{color:#fff;}}
    .nav-cta{{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border:1px solid rgba(255,255,255,0.18);color:#fff;background:transparent;padding:8px 22px;text-decoration:none;}}
    .article-hero{{position:relative;height:480px;overflow:hidden;}}
    .article-hero img{{width:100%;height:100%;object-fit:cover;opacity:0.55;}}
    .article-hero::after{{content:'';position:absolute;inset:0;background:linear-gradient(to top,#000 0%,rgba(0,0,0,0.4) 60%,transparent 100%);}}
    .article-hero-content{{position:absolute;bottom:0;left:0;right:0;padding:48px 80px;z-index:2;}}
    .article-cat-badge{{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;background:#fff;color:#000;padding:4px 12px;display:inline-block;margin-bottom:16px;}}
    .article-title{{font-family:'Bebas Neue',sans-serif;font-size:clamp(36px,5vw,72px);line-height:.95;letter-spacing:.5px;margin-bottom:16px;}}
    .article-meta-bar{{display:flex;align-items:center;gap:24px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4);}}
    .article-body{{max-width:760px;margin:0 auto;padding:64px 40px 80px;}}
    .article-body p{{font-size:16px;line-height:1.85;color:rgba(255,255,255,0.72);margin-bottom:24px;}}
    .article-body h2{{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:.5px;margin:48px 0 20px;}}
    .article-lead{{font-size:17px!important;color:rgba(255,255,255,0.85)!important;font-weight:500;line-height:1.7!important;margin-bottom:32px!important;border-left:2px solid rgba(0,61,165,0.7);padding-left:20px;}}
    .article-back{{display:inline-flex;align-items:center;gap:8px;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.35);text-decoration:none;padding:40px 40px 0;transition:color .2s;}}
    .article-back:hover{{color:#fff;}}
    .img-credit{{font-family:'Barlow Condensed',sans-serif;font-size:10px;color:rgba(255,255,255,0.2);letter-spacing:1px;padding:8px 40px;text-align:right;}}
    .img-credit a{{color:rgba(255,255,255,0.25);text-decoration:none;}}
    footer{{padding:36px 48px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);flex-wrap:wrap;gap:16px;}}
    .footer-logo{{display:flex;align-items:center;gap:8px;}}
    .footer-logo img{{height:32px;}}
    .footer-logo-text{{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:3px;color:rgba(255,255,255,0.4);}}
    .footer-copy{{font-family:'Barlow Condensed',sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.2);}}
    .footer-links{{display:flex;gap:24px;list-style:none;}}
    .footer-links a{{font-family:'Barlow Condensed',sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.2);text-decoration:none;transition:color .2s;}}
    .footer-links a:hover{{color:#fff;}}
    .reveal{{opacity:0;transform:translateY(16px);transition:opacity .55s ease,transform .55s cubic-bezier(.22,1,.36,1);}}
    .reveal.visible{{opacity:1;transform:none;}}
    @media(max-width:768px){{
      nav{{padding:0 20px;}} .nav-links,.nav-cta{{display:none;}}
      .article-hero{{height:280px;}} .article-hero-content{{padding:24px;}}
      .article-body{{padding:40px 20px 60px;}} .article-back{{padding:24px 20px 0;}}
      footer{{flex-direction:column;text-align:center;}}
    }}
  </style>
</head>
<body>
<div id="page-loader"><div class="loader-text">NewsPorto</div><div class="loader-bar"><div class="loader-bar-fill"></div></div></div>
<div class="grid-bg"></div>
<div class="page">
  <nav>
    <a href="../index.html" class="nav-logo"><img src="../Logo.png" alt="NewsPorto"><span class="nav-logo-text">NewsPorto</span></a>
    <ul class="nav-links">
      <li><a href="../actu.html">Actu</a></li>
      <li><a href="../effectif.html">Effectif</a></li>
      <li><a href="../stats.html">Stats</a></li>
      <li><a href="../videos.html">Vidéos</a></li>
      <li><a href="../shop.html">Shop</a></li>
    </ul>
    <a href="../shop.html" class="nav-cta">Boutique →</a>
  </nav>
  <div class="article-hero">
    <img src="{img_url}" alt="{data['title']}">
    <div class="article-hero-content">
      <span class="article-cat-badge">{cat_label}</span>
      <h1 class="article-title">{data['title']}</h1>
      <div class="article-meta-bar"><span>{date_str}</span><span>·</span><span>{data['read_time']}</span></div>
    </div>
  </div>
  <p class="img-credit">Photo : <a href="{img_author_link}" target="_blank">{img_author}</a> / Unsplash</p>
  <a href="../actu.html" class="article-back">← Retour aux articles</a>
  <div class="article-body reveal">
    <p class="article-lead">{data['excerpt']}</p>
    {data['content']}
  </div>
  <footer>
    <div class="footer-logo"><img src="../Logo.png" alt="NewsPorto"><span class="footer-logo-text">NewsPorto</span></div>
    <p class="footer-copy">© 2026 NewsPorto FR — Tous droits réservés</p>
    <ul class="footer-links">
      <li><a href="https://discord.gg/YCcuMHmGcH" target="_blank">Discord</a></li>
      <li><a href="mailto:luisdasilva83310@gmail.com">Contact</a></li>
      <li><a href="../mentions-legales.html">Mentions légales</a></li>
    </ul>
  </footer>
</div>
<script>
  window.addEventListener('load',()=>{{setTimeout(()=>document.getElementById('page-loader').classList.add('hidden'),350);}});
  const ro=new IntersectionObserver(e=>{{e.forEach(el=>{{if(el.isIntersecting){{el.target.classList.add('visible');ro.unobserve(el.target);}}}});}},{{threshold:0.05}});
  document.querySelectorAll('.reveal').forEach(el=>ro.observe(el));
</script>
</body>
</html>"""

def main():
    index     = load_index()
    ex_titles = [a["title"] for a in index.get("articles", [])]
    used_ids  = index.get("used_image_ids", [])

    print("🔍 Génération Gemini...")
    data = generate_article(ex_titles)
    print(f"✅ Titre : {data['title']}")

    print("🖼️  Unsplash...")
    image = get_unsplash_image(data["unsplash_query"], used_ids)
    print(f"✅ Image : {image['id'] if image else 'fallback'}")

    now      = datetime.now()
    date_str = now.strftime("%-d %b %Y")
    for en, fr in MONTHS_FR.items():
        date_str = date_str.replace(en, fr)

    existing_nums = [int(re.search(r'article(\d+)', a["file"]).group(1))
                     for a in index["articles"] if re.search(r'article(\d+)', a["file"])]
    next_num = max(existing_nums, default=0) + 1
    filename = f"article{next_num}.html"

    os.makedirs("articles", exist_ok=True)
    with open(f"articles/{filename}", "w", encoding="utf-8") as f:
        f.write(build_html(data, image, date_str))

    img_url = image["url"] if image else ""
    index["articles"].insert(0, {
        "id": next_num, "file": filename,
        "title": data["title"], "excerpt": data["excerpt"],
        "category": data["category"], "read_time": data["read_time"],
        "date": date_str, "date_iso": now.strftime("%Y-%m-%d"),
        "image": img_url, "image_thumb": image["thumb"] if image else img_url
    })
    if image:
        index["used_image_ids"].append(image["id"])

    save_index(index)
    print(f"✅ Sauvegardé : articles/{filename} — {len(index['articles'])} articles")

if __name__ == "__main__":
    main()
