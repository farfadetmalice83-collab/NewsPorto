#!/usr/bin/env python3
import os, json, re, requests, random
from datetime import datetime

GROQ_KEY    = os.environ["GROQ_API_KEY"]
TAVILY_KEY  = os.environ["TAVILY_API_KEY"]
UNSPLASH_KEY= os.environ["UNSPLASH_ACCESS_KEY"]

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

def search_porto_news(existing_titles):
    """Cherche les vraies news FC Porto via Tavily"""
    queries = [
        "FC Porto actualité résultat match 2025 2026",
        "FC Porto transfert mercato 2025 2026",
        "FC Porto Europa League Champions League 2026",
        "FC Porto Liga Portugal classement 2026"
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
    
    # Compile les résultats en contexte
    context = data.get("answer", "") + "\n\n"
    for result in data.get("results", []):
        context += f"- {result.get('title','')}: {result.get('content','')[:300]}\n"
    
    return context, query

def generate_article(existing_titles, news_context):
    """Génère l'article avec Groq basé sur les vraies news"""
    titles_str = "\n".join(f"- {t}" for t in existing_titles[-15:]) if existing_titles else "Aucun."
    
    prompt = f"""Tu es un journaliste sportif expert du FC Porto pour NewsPorto.fr.

ACTUALITÉS RÉCENTES TROUVÉES SUR LE WEB :
{news_context}

MISSION : Rédige un article de qualité journalistique basé UNIQUEMENT sur ces actualités réelles.

RÈGLES :
1. Utilise uniquement les faits présents dans les actualités ci-dessus. Ne pas inventer de scores ou de faits.
2. NE génère PAS un article sur un sujet déjà traité :
{titles_str}
3. Ne mentionne jamais que l'article est généré par une IA.
4. Si les actualités ne contiennent pas assez d'infos sur un sujet, fais une analyse générale basée sur la saison.

RÉPONSE : JSON uniquement, sans markdown, sans backticks.

{{"title": "Titre accrocheur en français (max 65 caractères)",
  "category": "europe | analyse | transfert | liga | interview",
  "excerpt": "Accroche percutante 150 caractères max",
  "read_time": "X min de lecture",
  "unsplash_query": "requête anglais pour image football générique",
  "content": "HTML : minimum 5 balises <p> riches, 2 balises <h2>. Style journalistique passionné. PAS de balises html/head/body."
}}"""

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 2048
    }
    r = requests.post(url, headers=headers, json=payload)
    r.raise_for_status()
    raw = r.json()["choices"][0]["message"]["content"].strip()
    raw = re.sub(r"^```json\s*", "", raw)
    raw = re.sub(r"^```\s*", "", raw)
    raw = re.sub(r"```$", "", raw).strip()
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        raw = match.group(0)
    raw = re.sub(r'[
