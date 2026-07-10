export const NATIONALITIES = [
  "BRA",
  "ARG",
  "POR",
  "ESP",
  "FRA",
  "GER",
  "ITA",
  "ENG",
  "NED",
  "URU",
] as const;

export type NationalityCode = (typeof NATIONALITIES)[number];

export const NAME_POOLS: Record<
  NationalityCode,
  { first: string[]; last: string[] }
> = {
  BRA: {
    first: [
      "Adriano", "Alex", "Anderson", "Arthur", "Bruno", "Caio", "Carlos", "Daniel",
      "Diego", "Eduardo", "Felipe", "Gabriel", "Guilherme", "Henrique", "Igor",
      "João", "Jorge", "Júlio", "Leandro", "Lucas", "Marcelo", "Marcos", "Mateus",
      "Mauro", "Murilo", "Paulo", "Pedro", "Rafael", "Renato", "Ricardo", "Rodrigo",
      "Samuel", "Thiago", "Vitor", "Wellington", "Yuri",
    ],
    last: [
      "Alves", "Araújo", "Barbosa", "Cardoso", "Carvalho", "Castro", "Correia",
      "Costa", "Dias", "Ferreira", "Freitas", "Gomes", "Lima", "Lopes", "Machado",
      "Martins", "Melo", "Mendes", "Monteiro", "Moura", "Nascimento", "Nunes",
      "Oliveira", "Pereira", "Pinto", "Ramos", "Reis", "Ribeiro", "Rocha", "Santos",
      "Silva", "Souza", "Teixeira", "Torres", "Vieira",
    ],
  },
  ARG: {
    first: [
      "Agustín", "Alejandro", "Ángel", "Carlos", "Cristian", "Diego", "Emiliano",
      "Enzo", "Esteban", "Facundo", "Franco", "Gabriel", "Gonzalo", "Hernán",
      "Ignacio", "Javier", "Joaquín", "Juan", "Julian", "Lautaro", "Leandro",
      "Lionel", "Lucas", "Marcos", "Martín", "Mateo", "Matías", "Maximiliano",
      "Nicolás", "Pablo", "Paulo", "Rodrigo", "Sergio", "Thiago", "Tomás",
    ],
    last: [
      "Acosta", "Agüero", "Álvarez", "Batistuta", "Benítez", "Cabrera", "Caniggia",
      "Correa", "Di María", "Fernández", "García", "González", "Gutiérrez", "Herrera",
      "Ibáñez", "López", "Martínez", "Medina", "Molina", "Morales", "Ortega",
      "Paredes", "Pérez", "Romero", "Ruiz", "Sánchez", "Suárez", "Torres", "Vargas",
      "Vega", "Zárate",
    ],
  },
  POR: {
    first: [
      "André", "António", "Bernardo", "Bruno", "Carlos", "Cristiano", "Diogo",
      "Eduardo", "Fábio", "Fernando", "Francisco", "Gonçalo", "Hugo", "João",
      "José", "Luís", "Manuel", "Marco", "Miguel", "Nuno", "Paulo", "Pedro",
      "Rafael", "Ricardo", "Rúben", "Sérgio", "Tiago", "Tomás", "Vítor",
    ],
    last: [
      "Almeida", "Carvalho", "Castro", "Coelho", "Costa", "Cunha", "Fernandes",
      "Ferreira", "Gomes", "Lopes", "Machado", "Marques", "Martins", "Mendes",
      "Monteiro", "Moreira", "Neves", "Nunes", "Oliveira", "Pereira", "Pinto",
      "Ramos", "Reis", "Ribeiro", "Rodrigues", "Santos", "Silva", "Sousa", "Teixeira",
      "Torres", "Vieira",
    ],
  },
  ESP: {
    first: [
      "Adrián", "Alberto", "Álvaro", "Carlos", "David", "Diego", "Fernando",
      "Francisco", "Héctor", "Iker", "Iván", "Javier", "Jesús", "Jorge", "José",
      "Juan", "Luis", "Manuel", "Marcos", "Miguel", "Pablo", "Pedro", "Raúl",
      "Roberto", "Sergio", "Víctor", "Xabi", "Xavi",
    ],
    last: [
      "Aguilar", "Blanco", "Cabrera", "Castro", "Díaz", "Domínguez", "Fernández",
      "Flores", "García", "Gómez", "González", "Guerrero", "Hernández", "Jiménez",
      "López", "Martín", "Martínez", "Molina", "Moreno", "Muñoz", "Navarro",
      "Ortega", "Pérez", "Ramírez", "Ramos", "Reyes", "Romero", "Rubio", "Ruiz",
      "Sánchez", "Serrano", "Torres", "Vargas", "Vázquez",
    ],
  },
  FRA: {
    first: [
      "Adrien", "Alexandre", "Antoine", "Arthur", "Benoît", "Christophe", "Claude",
      "Cyril", "David", "Didier", "Florian", "Franck", "Hugo", "Jean", "Julien",
      "Karim", "Kylian", "Laurent", "Lucas", "Mathieu", "Maxime", "Michel", "Nicolas",
      "Olivier", "Patrick", "Paul", "Philippe", "Sébastien", "Thierry", "Thomas",
      "Vincent", "Yann",
    ],
    last: [
      "Bernard", "Blanc", "Bonnet", "Caron", "Chevalier", "David", "Dubois", "Durand",
      "Fournier", "Garcia", "Garnier", "Girard", "Henry", "Lambert", "Laurent",
      "Leclerc", "Lefebvre", "Leroy", "Martin", "Martinez", "Mercier", "Moreau",
      "Morin", "Muller", "Nguyen", "Petit", "Richard", "Robert", "Roux", "Simon",
      "Thomas", "Vincent",
    ],
  },
  GER: {
    first: [
      "Andreas", "Bastian", "Benedikt", "Christian", "Daniel", "Felix", "Florian",
      "Hans", "Jens", "Jérôme", "Joshua", "Jürgen", "Kai", "Karl", "Lars", "Lukas",
      "Manuel", "Marco", "Mario", "Matthias", "Max", "Michael", "Niklas", "Philipp",
      "Sebastian", "Stefan", "Thomas", "Tim", "Toni", "Uwe",
    ],
    last: [
      "Bauer", "Becker", "Braun", "Fischer", "Frank", "Hartmann", "Hoffmann",
      "Kaiser", "Klein", "Koch", "Krause", "Krüger", "Lange", "Lehmann", "Maier",
      "Meyer", "Müller", "Neumann", "Peters", "Richter", "Schäfer", "Schmidt",
      "Schneider", "Scholz", "Schröder", "Schulz", "Schwarz", "Wagner", "Weber",
      "Werner", "Wolf", "Zimmermann",
    ],
  },
  ITA: {
    first: [
      "Alessandro", "Andrea", "Angelo", "Antonio", "Carlo", "Claudio", "Daniele",
      "Davide", "Fabio", "Francesco", "Franco", "Gianluigi", "Giorgio", "Giovanni",
      "Lorenzo", "Luca", "Marco", "Mario", "Massimo", "Matteo", "Mauro", "Nicola",
      "Paolo", "Roberto", "Salvatore", "Simone", "Stefano", "Tommaso", "Vincenzo",
    ],
    last: [
      "Bianchi", "Bruno", "Colombo", "Conti", "Costa", "De Luca", "Esposito",
      "Ferrari", "Ferraro", "Gallo", "Gatti", "Greco", "Lombardi", "Mancini",
      "Marchetti", "Mariani", "Martini", "Moretti", "Ricci", "Rizzo", "Romano",
      "Rossi", "Russo", "Santoro", "Serra", "Villa", "Vitale",
    ],
  },
  ENG: {
    first: [
      "Adam", "Andrew", "Ashley", "Ben", "Callum", "Charlie", "Chris", "Daniel",
      "David", "Frank", "Gary", "George", "Harry", "Jack", "James", "Joe", "John",
      "Jordan", "Kevin", "Luke", "Marcus", "Mark", "Michael", "Paul", "Peter",
      "Phil", "Robert", "Ryan", "Sam", "Steven", "Tom", "Wayne",
    ],
    last: [
      "Adams", "Baker", "Bell", "Bennett", "Brown", "Clark", "Collins", "Cook",
      "Cooper", "Davies", "Evans", "Green", "Hall", "Harris", "Hill", "Hughes",
      "Jackson", "Johnson", "Jones", "King", "Lee", "Lewis", "Martin", "Miller",
      "Moore", "Morgan", "Parker", "Robinson", "Scott", "Smith", "Taylor", "Thomas",
      "Thompson", "Walker", "White", "Williams", "Wilson", "Wright", "Young",
    ],
  },
  NED: {
    first: [
      "Arjen", "Bas", "Bram", "Daley", "Dennis", "Dirk", "Edwin", "Frank", "Giovanni",
      "Jasper", "Johan", "Luuk", "Marco", "Mark", "Memphis", "Patrick", "Robin",
      "Ruud", "Stefan", "Steven", "Virgil", "Wesley", "Wout",
    ],
    last: [
      "Bakker", "Bos", "Brouwer", "Dekker", "de Boer", "de Jong", "de Vries",
      "Dijkstra", "Hendriks", "Jansen", "Janssen", "Kok", "Koster", "Meijer",
      "Mulder", "Peters", "Smit", "Timmermans", "Veenstra", "Visser", "Vos",
      "Willems",
    ],
  },
  URU: {
    first: [
      "Álvaro", "Carlos", "Cavani", "Diego", "Edinson", "Enzo", "Federico",
      "Gastón", "Gonzalo", "Hernán", "Jorge", "José", "Juan", "Luis", "Marcelo",
      "Martín", "Matías", "Maxi", "Nicolás", "Pablo", "Rodrigo", "Sebastián",
      "Santiago", "Walter",
    ],
    last: [
      "Acosta", "Benítez", "Castro", "Domínguez", "Fernández", "García", "González",
      "Gutiérrez", "Hernández", "López", "Martínez", "Morales", "Núñez", "Pereira",
      "Pérez", "Ramírez", "Rodríguez", "Romero", "Silva", "Suárez", "Torres", "Viera",
    ],
  },
};

export const TEAM_POOLS: Record<NationalityCode, string[]> = {
  BRA: [
    "Flamengo", "Palmeiras", "Corinthians", "São Paulo", "Santos", "Grêmio",
    "Internacional", "Atlético Mineiro", "Botafogo", "Vasco da Gama", "Cruzeiro",
    "Fluminense", "Athletico Paranaense", "Bahia", "Fortaleza",
  ],
  ARG: [
    "Boca Juniors", "River Plate", "Racing Club", "Independiente", "San Lorenzo",
    "Estudiantes", "Vélez Sarsfield", "Newell's Old Boys", "Rosario Central",
    "Lanús", "Banfield", "Talleres",
  ],
  POR: [
    "Benfica", "Porto", "Sporting CP", "Braga", "Vitória Guimarães", "Boavista",
    "Marítimo", "Santa Clara", "Famalicão", "Gil Vicente",
  ],
  ESP: [
    "Real Madrid", "Barcelona", "Atlético Madrid", "Sevilla", "Valencia",
    "Villarreal", "Real Sociedad", "Athletic Bilbao", "Real Betis", "Celta Vigo",
    "Osasuna", "Espanyol",
  ],
  FRA: [
    "PSG", "Marseille", "Lyon", "Monaco", "Lille", "Nice", "Rennes", "Lens",
    "Saint-Étienne", "Bordeaux", "Nantes", "Montpellier",
  ],
  GER: [
    "Bayern Munich", "Borussia Dortmund", "RB Leipzig", "Bayer Leverkusen",
    "Eintracht Frankfurt", "Wolfsburg", "Borussia Mönchengladbach", "Freiburg",
    "Stuttgart", "Hoffenheim", "Werder Bremen", "Schalke 04",
  ],
  ITA: [
    "Juventus", "AC Milan", "Inter Milan", "Napoli", "Roma", "Lazio", "Fiorentina",
    "Atalanta", "Torino", "Sampdoria", "Udinese", "Bologna",
  ],
  ENG: [
    "Manchester United", "Liverpool", "Arsenal", "Chelsea", "Manchester City",
    "Tottenham", "Newcastle", "Aston Villa", "West Ham", "Everton", "Leeds United",
    "Leicester City",
  ],
  NED: [
    "Ajax", "PSV", "Feyenoord", "AZ Alkmaar", "Twente", "Utrecht", "Heerenveen",
    "Vitesse", "Groningen", "NEC Nijmegen",
  ],
  URU: [
    "Peñarol", "Nacional", "Defensor Sporting", "Danubio", "River Plate UY",
    "Wanderers", "Cerro", "Fénix", "Progreso", "Liverpool UY",
  ],
};
