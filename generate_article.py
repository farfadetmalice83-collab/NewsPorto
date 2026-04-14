#!/usr/bin/env python3
import os, json, re, requests, random
from datetime import datetime

GROQ_KEY     = os.environ["GROQ_API_KEY"]
TAVILY_KEY   = os.environ["TAVILY_API_KEY"]
UNSPLASH_KEY = os.environ["UNSPLASH_ACCESS_KEY"]

MONTHS_FR = {"Jan":"Jan","Feb":"Feb","Mar":"Mar","Apr":"Avr","May":"Mai",
             "Jun":"Jun","Jul":"Jul","Aug":"Aou","Sep":"Sep","Oct":"Oct",
             "Nov":"Nov","Dec":"Dec"}

def load_index():
    path = "articles/index.json"
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"articles": [], "used_image_ids": []}

def save_index(data):
    with open("articles/index.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def search_porto_news():
    queries = [
        "FC Porto actualite resultat match 2026",
        "FC Porto transfert mercato 2026",
        "FC Porto Europa League 2026",
        "FC Porto Liga Portugal 2026"
    ]
    query = random.choice(queries)
    r = requests.post("https://api.tavily.com/search", json={
        "api_key": TAVILY_KEY,
        "query": query,
        "search_depth": "basic",
        "max_results": 5,
        "include_answer": True,
        "days": 7
    })
    r.raise_for_status()
    data = r.json()
    context = data.get("answer", "") + "\n\n"
    for result in data.get("results", []):
        context += "- " + result.get("title","") + ": " + result.get("content","")[:300] + "\n"
    return context, query

def generate_article(existing_titles, news_context):
    titles_str = "\n".join("- " + t for t in existing_titles[-15:]) if existing_titles else "Aucun."
    prompt = """Tu es un journaliste sportif senior, expert tactique du FC Porto, pour NewsPorto.fr.

ACTUALITES RECENTES TROUVEES SUR LE WEB :
""" + news_context + """

MISSION : Redige un article journalistique de qualite professionnelle.

REGLES STRICTES :
1. Lis attentivement les actualites. Un score comme "1-0" signifie que la premiere equipe citee a marque 1 but et l'adversaire 0. Verifie toujours qui a gagne avant d'ecrire.
2. Si une equipe "gagne 2-0" elle a marque 2 buts et en a encaisse 0 - elle a GAGNE. Si elle "perd 0-2" elle a marque 0 et en a encaisse 2 - elle a PERDU.
3. Base-toi uniquement sur les faits presents dans les actualites. Si tu n'es pas certain d'un score ou d'un fait, ne l'invente pas - fais une analyse tactique ou contextuelle a la place.
4. Enrichis l'article avec une analyse football concrete : systeme de jeu, performances individuelles, enjeux tactiques, contexte de la competition, implications au classement.
5. Style passionne et expert, comme L'Equipe ou RMC Sport. Phrases courtes et percutantes.
6. Ne pas traiter un sujet deja couvert :
""" + titles_str + """
7. Ne mentionne JAMAIS que l'article est genere par une IA.

FORMAT DE REPONSE : JSON uniquement, sans markdown, sans backticks, sans texte avant ou apres.

{"title": "Titre accrocheur en francais max 65 chars",
  "category": "europe ou analyse ou transfert ou liga ou interview",
  "excerpt": "Accroche percutante 150 chars max qui donne envie de lire",
  "read_time": "X min de lecture",
  "unsplash_query": "requete anglais pour image football generique ex: soccer match stadium crowd action",
  "category": "IMPORTANT - choisis la bonne categorie : europe = match Europa League ou Champions League UNIQUEMENT, liga = match ou classement Liga Portugal, analyse = analyse tactique ou bilan, transfert = mercato ou recrutement, interview = declaration ou portrait joueur",
  "unsplash_query": "requete PRECISE en anglais liee au SUJET de l article ex: si mercato ecrire football transfer signing, si Europa League ecrire europa league football match, si Liga Portugal ecrire portuguese football liga, si analyse tactique ecrire football tactics coach, si joueur specifique ecrire football player dribbling",
  "content": "Article HTML complet : minimum 5 balises p avec contenu riche et analyse, 2 balises h2 comme sous-titres. Style journalistique passionne et expert. PAS de balises html/head/body."
}"""

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": "Bearer " + GROQ_KEY, "Content-Type": "application/json"}
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 2048
    }
    r = requests.post(url, headers=headers, json=payload)
    r.raise_for_status()
    raw = r.json()["choices"][0]["message"]["content"].strip()

    # Extrait title
    title_m = re.search(r'(?<="title": ")[^"]+', raw)
    title = title_m.group(0) if title_m else "Actualite FC Porto"

    # Extrait category et normalise
    cat_m = re.search(r'(?<="category": ")[^"]+', raw)
    cat_raw = cat_m.group(0).lower() if cat_m else "analyse"
    if "europa" in cat_raw or "champion" in cat_raw or "europe" in cat_raw:
        category = "europe"
    elif "liga" in cat_raw or "championnat" in cat_raw:
        category = "liga"
    elif "transfert" in cat_raw or "mercato" in cat_raw:
        category = "transfert"
    elif "interview" in cat_raw:
        category = "interview"
    else:
        category = "analyse"

    # Extrait excerpt
    exc_m = re.search(r'(?<="excerpt": ")[^"]+', raw)
    excerpt = exc_m.group(0) if exc_m else ""

    # Extrait read_time
    rt_m = re.search(r'(?<="read_time": ")[^"]+', raw)
    read_time = rt_m.group(0) if rt_m else "4 min de lecture"

    # Extrait unsplash_query
    uq_m = re.search(r'(?<="unsplash_query": ")[^"]+', raw)
    unsplash_query = uq_m.group(0) if uq_m else "football match action"

    # Extrait content HTML
    cont_m = re.search(r'"content"\s*:\s*"([\s\S]*?)"\s*[,}]', raw)
    html_content = cont_m.group(1) if cont_m else "<p>Article en cours.</p>"
    html_content = html_content.replace("\\n", " ").replace("\\t", " ")

    return {
        "title": title,
        "category": category,
        "excerpt": excerpt,
        "read_time": read_time,
        "unsplash_query": unsplash_query,
        "content": html_content
    }

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

def build_html(data, image, date_str):
    cat_labels = {"europe":"Europa League","analyse":"Analyse","transfert":"Mercato",
                  "liga":"Championnat","interview":"Interview"}
    cat_label = cat_labels.get(data["category"], data["category"].capitalize())
    img_url = image["url"] if image else "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200"
    img_author = image["author"] if image else "Unsplash"
    img_author_link = image["author_link"] if image else "#"
    title = data["title"]
    excerpt = data["excerpt"]
    content = data["content"]
    read_time = data["read_time"]

    html = """<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>""" + title + """ - NewsPorto</title>
  <meta name="description" content=\"""" + excerpt + """\">
  <meta property="og:image" content=\"""" + img_url + """\">
  <link rel="icon" type="image/x-icon" href="../favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root{--white:#fff;--gray:rgba(255,255,255,0.45);--border:rgba(255,255,255,0.09);--grid-color:rgba(255,255,255,0.035);}
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
    body{background:#000;color:#fff;font-family:'Barlow',sans-serif;overflow-x:hidden;}
    .grid-bg{position:fixed;inset:0;z-index:0;background-image:linear-gradient(var(--grid-color) 1px,transparent 1px),linear-gradient(90deg,var(--grid-color) 1px,transparent 1px);background-size:44px 44px;animation:gridScroll 16s linear infinite;pointer-events:none;}
    @keyframes gridScroll{0%{background-position:0 0}100%{background-position:44px 44px}}
    .page{position:relative;z-index:1;}
    #page-loader{position:fixed;inset:0;background:#000;z-index:9999;display:flex;align-items:center;justify-content:center;transition:opacity .4s,visibility .4s;}
    #page-loader.hidden{opacity:0;visibility:hidden;}
    .loader-text{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:8px;}
    .loader-bar{width:160px;height:1px;background:var(--border);overflow:hidden;margin-top:20px;}
    .loader-bar-fill{height:100%;width:0%;background:#fff;animation:loadBar .55s ease forwards;}
    @keyframes loadBar{to{width:100%;}}
    nav{display:flex;align-items:center;justify-content:space-between;padding:0 56px;height:72px;border-bottom:1px solid rgba(0,61,165,0.5);backdrop-filter:blur(10px);background:rgba(0,0,0,0.65);position:sticky;top:0;z-index:100;}
    .nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
    .nav-logo img{height:44px;}
    .nav-logo-text{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:3px;color:#fff;}
    .nav-links{display:flex;gap:36px;list-style:none;}
    .nav-links a{font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.4);text-decoration:none;transition:color .2s;}
    .nav-links a:hover{color:#fff;}
    .nav-cta{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border:1px solid rgba(255,255,255,0.18);color:#fff;background:transparent;padding:8px 22px;text-decoration:none;}
    .article-hero{position:relative;height:480px;overflow:hidden;}
    .article-hero img{width:100%;height:100%;object-fit:cover;opacity:0.55;}
    .article-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,#000 0%,rgba(0,0,0,0.4) 60%,transparent 100%);}
    .article-hero-content{position:absolute;bottom:0;left:0;right:0;padding:48px 80px;z-index:2;}
    .article-cat-badge{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;background:#fff;color:#000;padding:4px 12px;display:inline-block;margin-bottom:16px;}
    .article-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(36px,5vw,72px);line-height:.95;letter-spacing:.5px;margin-bottom:16px;}
    .article-meta-bar{display:flex;align-items:center;gap:24px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4);}
    .article-body{max-width:760px;margin:0 auto;padding:64px 40px 80px;}
    .article-body p{font-size:16px;line-height:1.85;color:rgba(255,255,255,0.72);margin-bottom:24px;}
    .article-body h2{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:.5px;margin:48px 0 20px;}
    .article-lead{font-size:17px!important;color:rgba(255,255,255,0.85)!important;font-weight:500;line-height:1.7!important;margin-bottom:32px!important;border-left:2px solid rgba(0,61,165,0.7);padding-left:20px;}
    .article-back{display:inline-flex;align-items:center;gap:8px;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.35);text-decoration:none;padding:40px 40px 0;transition:color .2s;}
    .article-back:hover{color:#fff;}
    .img-credit{font-family:'Barlow Condensed',sans-serif;font-size:10px;color:rgba(255,255,255,0.2);letter-spacing:1px;padding:8px 40px;text-align:right;}
    .img-credit a{color:rgba(255,255,255,0.25);text-decoration:none;}
    footer{padding:36px 48px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);flex-wrap:wrap;gap:16px;}
    .footer-logo{display:flex;align-items:center;gap:8px;}
    .footer-logo img{height:32px;}
    .footer-logo-text{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:3px;color:rgba(255,255,255,0.4);}
    .footer-copy{font-family:'Barlow Condensed',sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.2);}
    .footer-links{display:flex;gap:24px;list-style:none;}
    .footer-links a{font-family:'Barlow Condensed',sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.2);text-decoration:none;transition:color .2s;}
    .footer-links a:hover{color:#fff;}
    .reveal{opacity:0;transform:translateY(16px);transition:opacity .55s ease,transform .55s cubic-bezier(.22,1,.36,1);}
    .reveal.visible{opacity:1;transform:none;}
    @media(max-width:768px){
      nav{padding:0 20px;} .nav-links,.nav-cta{display:none;}
      .article-hero{height:280px;} .article-hero-content{padding:24px;}
      .article-body{padding:40px 20px 60px;} .article-back{padding:24px 20px 0;}
      footer{flex-direction:column;text-align:center;}
    }
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
      <li><a href="../videos.html">Videos</a></li>
      <li><a href="../shop.html">Shop</a></li>
    </ul>
    <a href="../shop.html" class="nav-cta">Boutique</a>
  </nav>
  <div class="article-hero">
    <img src=\"""" + img_url + """\" alt=\"""" + title + """\">
    <div class="article-hero-content">
      <span class="article-cat-badge">""" + cat_label + """</span>
      <h1 class="article-title">""" + title + """</h1>
      <div class="article-meta-bar"><span>""" + date_str + """</span><span>.</span><span>""" + read_time + """</span></div>
    </div>
  </div>
  <p class="img-credit">Photo : <a href=\"""" + img_author_link + """\" target="_blank">""" + img_author + """</a> / Unsplash</p>
  <a href="../actu.html" class="article-back">Retour aux articles</a>
  <div class="article-body reveal">
    <p class="article-lead">""" + excerpt + """</p>
    """ + content + """
  </div>
  <footer>
    <div class="footer-logo"><img src="../Logo.png" alt="NewsPorto"><span class="footer-logo-text">NewsPorto</span></div>
    <p class="footer-copy">2026 NewsPorto FR</p>
    <ul class="footer-links">
      <li><a href="https://discord.gg/YCcuMHmGcH" target="_blank">Discord</a></li>
      <li><a href="mailto:luisdasilva83310@gmail.com">Contact</a></li>
      <li><a href="../mentions-legales.html">Mentions legales</a></li>
    </ul>
  </footer>
</div>
<script>
  window.addEventListener('load',function(){setTimeout(function(){document.getElementById('page-loader').classList.add('hidden');},350);});
  var ro=new IntersectionObserver(function(e){e.forEach(function(el){if(el.isIntersecting){el.target.classList.add('visible');ro.unobserve(el.target);}});},{threshold:0.05});
  document.querySelectorAll('.reveal').forEach(function(el){ro.observe(el);});
</script>
</body>
</html>"""
    return html

def main():
    index     = load_index()
    ex_titles = [a["title"] for a in index.get("articles", [])]
    used_ids  = index.get("used_image_ids", [])

    print("Recherche actualites Porto via Tavily...")
    news_context, query = search_porto_news()
    print("News pour : " + query)

    print("Generation article avec Groq...")
    data = generate_article(ex_titles, news_context)
    print("Titre : " + data["title"])

    print("Unsplash...")
    image = get_unsplash_image(data["unsplash_query"], used_ids)
    print("Image : " + (image["id"] if image else "fallback"))

    now = datetime.now()
    date_str = now.strftime("%-d %b %Y")
    for en, fr in MONTHS_FR.items():
        date_str = date_str.replace(en, fr)

    existing_nums = [int(re.search(r'article(\d+)', a["file"]).group(1))
                     for a in index["articles"] if re.search(r'article(\d+)', a["file"])]
    next_num = max(existing_nums, default=0) + 1
    filename = "article" + str(next_num) + ".html"

    os.makedirs("articles", exist_ok=True)
    with open("articles/" + filename, "w", encoding="utf-8") as f:
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
    print("Sauvegarde : articles/" + filename + " - " + str(len(index["articles"])) + " articles total")

if __name__ == "__main__":
    main()
