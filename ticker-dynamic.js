// ticker-dynamic.js — charge les derniers articles depuis index.json
// Inclure avec : <script src="../ticker-dynamic.js"></script> dans les articles
// ou <script src="ticker-dynamic.js"></script> sur les pages racine

(function() {
  const isInArticles = window.location.pathname.includes('/articles/');
  const jsonPath = isInArticles ? '../articles/index.json' : 'articles/index.json';

  fetch(jsonPath)
    .then(r => r.json())
    .then(data => {
      const articles = data.articles || [];
      if (!articles.length) return;

      const catLabels = {
        europe: 'EUROPA', analyse: 'ANALYSE', transfert: 'MERCATO',
        liga: 'LIGA', interview: 'INTERVIEW'
      };

      // Prend les 6 derniers articles
      const items = articles.slice(0, 6).map(a => {
        const cat = catLabels[a.category] || 'ACTU';
        return `<span class="ticker-item"><b>${cat}</b> ${a.title}</span>`;
      });

      // Double pour l'effet boucle infini
      const html = [...items, ...items].join('');

      document.querySelectorAll('.ticker-inner').forEach(el => {
        el.innerHTML = html;
      });
    })
    .catch(() => {}); // garde le contenu statique si erreur
})();
