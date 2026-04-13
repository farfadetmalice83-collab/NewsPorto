// api/porto-squad.js  ← Vercel Serverless Function
// FC Porto — Effectif complet 2025/26 (données manuelles complètes)

const POSITION_ORDER = ['Goalkeeper', 'Defence', 'Midfield', 'Offence'];
const POSITION_FR = {
  Goalkeeper: 'Gardiens',
  Defence:    'Défenseurs',
  Midfield:   'Milieux',
  Offence:    'Attaquants',
};

const SQUAD = [
  // Gardiens
  { name: 'Diogo Costa',      position: 'Goalkeeper', nationality: 'Portugal',    birthDate: '1999-09-19', number: 1  },
  { name: 'Cláudio Ramos',    position: 'Goalkeeper', nationality: 'Portugal',    birthDate: '1991-01-21', number: 12 },
  { name: 'João Costa',       position: 'Goalkeeper', nationality: 'Portugal',    birthDate: '2004-03-10', number: 33 },
  // Défenseurs
  { name: 'Thiago Silva',     position: 'Defence',    nationality: 'Brazil',      birthDate: '1984-09-22', number: 3  },
  { name: 'Nehuén Pérez',     position: 'Defence',    nationality: 'Argentina',   birthDate: '2000-06-24', number: 4  },
  { name: 'Jan Bednarek',     position: 'Defence',    nationality: 'Poland',      birthDate: '1996-04-12', number: 5  },
  { name: 'Jakub Kiwior',     position: 'Defence',    nationality: 'Poland',      birthDate: '2000-01-15', number: 15 },
  { name: 'Zaidu Sanusi',     position: 'Defence',    nationality: 'Nigeria',     birthDate: '1997-03-11', number: 35 },
  { name: 'Francisco Moura',  position: 'Defence',    nationality: 'Portugal',    birthDate: '1999-01-13', number: 22 },
  { name: 'Alberto Costa',    position: 'Defence',    nationality: 'Portugal',    birthDate: '2003-01-05', number: 84 },
  { name: 'Dominik Prpić',    position: 'Defence',    nationality: 'Croatia',     birthDate: '2004-02-14', number: 44 },
  { name: 'Martim Fernandes', position: 'Defence',    nationality: 'Portugal',    birthDate: '2005-03-12', number: 57 },
  { name: 'Gabriel Brás',     position: 'Defence',    nationality: 'Portugal',    birthDate: '2003-04-20', number: 77 },
  { name: 'Pedro Lima',       position: 'Defence',    nationality: 'Brazil',      birthDate: '2006-02-01', number: 66 },
  // Milieux
  { name: 'Alan Varela',          position: 'Midfield', nationality: 'Argentina',   birthDate: '2001-07-11', number: 6  },
  { name: 'Stephen Eustáquio',    position: 'Midfield', nationality: 'Canada',      birthDate: '1996-12-21', number: 8  },
  { name: 'Gabri Veiga',          position: 'Midfield', nationality: 'Spain',       birthDate: '2002-04-09', number: 10 },
  { name: 'Pablo Rosario',        position: 'Midfield', nationality: 'Netherlands', birthDate: '1997-01-07', number: 16 },
  { name: 'Seko Fofana',          position: 'Midfield', nationality: 'Ivory Coast', birthDate: '1995-05-07', number: 20 },
  { name: 'Vasco Sousa',          position: 'Midfield', nationality: 'Portugal',    birthDate: '2002-09-28', number: 25 },
  { name: 'Rodrigo Mora',         position: 'Midfield', nationality: 'Portugal',    birthDate: '2007-01-14', number: 50 },
  { name: 'Victor Froholdt',      position: 'Midfield', nationality: 'Denmark',     birthDate: '2005-03-05', number: 55 },
  { name: 'André Franco',         position: 'Midfield', nationality: 'Portugal',    birthDate: '1997-04-11', number: 27 },
  { name: 'Oskar Pietuszewski',   position: 'Midfield', nationality: 'Poland',      birthDate: '2007-11-01', number: 70 },
  // Attaquants
  { name: 'Pepê',             position: 'Offence', nationality: 'Brazil',      birthDate: '1997-02-22', number: 7  },
  { name: 'Samu Aghehowa',    position: 'Offence', nationality: 'Spain',       birthDate: '2004-03-19', number: 9  },
  { name: 'Terem Moffi',      position: 'Offence', nationality: 'Nigeria',     birthDate: '1999-05-16', number: 11 },
  { name: 'Luuk de Jong',     position: 'Offence', nationality: 'Netherlands', birthDate: '1990-08-27', number: 17 },
  { name: 'Borja Sainz',      position: 'Offence', nationality: 'Spain',       birthDate: '2001-01-22', number: 19 },
  { name: 'Yann Karamoh',     position: 'Offence', nationality: 'France',      birthDate: '1998-07-08', number: 23 },
  { name: 'Danny Namaso',     position: 'Offence', nationality: 'England',     birthDate: '2001-02-14', number: 24 },
  { name: 'Gabriel Veron',    position: 'Offence', nationality: 'Brazil',      birthDate: '2002-09-22', number: 26 },
  { name: 'William Gomes',    position: 'Offence', nationality: 'Brazil',      birthDate: '2005-06-10', number: 37 },
  { name: 'Deniz Gül',        position: 'Offence', nationality: 'Sweden',      birthDate: '2004-04-05', number: 45 },
  { name: 'Gonçalo Sousa',    position: 'Offence', nationality: 'Portugal',    birthDate: '2006-08-22', number: 62 },
];

const COACH = {
  name:        'Francesco Farioli',
  nationality: 'Italy',
  birthDate:   '1989-04-07',
  contract:    '2028-06-30',
};

const CLUB = {
  name:    'FC Porto',
  crest:   'https://crests.football-data.org/503.png',
  venue:   'Estádio do Dragão',
  founded: 1893,
  colors:  'Blue / White',
  website: 'http://www.fcporto.pt',
};

function calcAge(birthDate) {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default async function handler(req, res) {
  try {
    const grouped = {};
    POSITION_ORDER.forEach(pos => {
      const list = SQUAD.filter(p => p.position === pos)
        .sort((a, b) => (a.number ?? 99) - (b.number ?? 99));
      if (list.length > 0) {
        grouped[pos] = { label: POSITION_FR[pos], count: list.length, players: list };
      }
    });

    const nations = new Set(SQUAD.map(p => p.nationality)).size;
    const ages    = SQUAD.map(p => calcAge(p.birthDate)).filter(Boolean);
    const avgAge  = ages.length ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : '—';

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).json({
      club:  CLUB,
      coach: COACH,
      grouped,
      squadStats: { total: SQUAD.length, nations, avgAge, founded: CLUB.founded },
      updatedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('porto-squad error:', err);
    res.status(500).json({ error: err.message });
  }
}
