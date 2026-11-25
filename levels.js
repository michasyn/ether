(() => {
  "use strict";
  window.ETHER = window.ETHER || {};

  // Zusätzliche Zeichen ab Phase 5 (Dual-Kugel):
  // K = Startpunkt Goldene Äther-Kugel
  // b = Blaues Phasen-Tor (nur für Blaue Kugel passierbar)
  // g = Goldenes Phasen-Tor (nur für Goldene Kugel passierbar)

  window.ETHER.LEVELS = [
    {
      name: "Erste Resonanz",
      par: 25,
      hint: "Erwecke die 3 verborgenen Steinpaare. Spüre das rutschige Kristalleis und das dämpfende Rubinfeld.",
      grid: [
        "####################",
        "#..O.....#...iiiiO.#",
        "#........#...iiii..#",
        "#..##........iiii..#",
        "#..##..............#",
        "#.......~~~........#",
        "#...S...~~~....O...#",
        "#.......~~~........#",
        "#..##..............#",
        "#..##........rrrr..#",
        "#........#...rrrr..#",
        "#..O....O#...rrrrO.#",
        "####################"
      ],
      links: [],
      shards: {}
    },
    {
      name: "Brücke über der Sternenkluft",
      par: 35,
      hint: "Nutze die schmale Rubinbrücke in der Mitte, um sicher auf die andere Seite zu gleiten.",
      grid: [
        "####################",
        "#O..ii...a...ii...O#",
        "#..iiii..a..iiiii..#",
        "#..iiii..a..iiiii..#",
        "#...rr.O.a.O.rr....#",
        "#........a.........#",
        "#..S..rrrrrrr..O...#",
        "#........~.........#",
        "#..aa....~....aa...#",
        "#..a..O..~....aa...#",
        "#..a.....~....aa...#",
        "#O.a.....~........O#",
        "####################"
      ],
      links: [],
      shards: {}
    },
    {
      name: "Lichtbrücken & Schleusen",
      par: 45,
      hint: "Schiebe einen Stasis-Quader ins Wasser für eine Lichtbrücke. Nutze Impuls-Terminal und Sensor-Platte für die Schleusen.",
      grid: [
        "####################",
        "#O....#....~....#O.#",
        "#.....#....~....#..#",
        "#..S..D....~....D..#",
        "#.....#....~....#..#",
        "#..B..#....~....#..#",
        "#.....######....####",
        "#..T.......~.......#",
        "#......B...~...P...#",
        "#..........~.......#",
        "#..O.......~....O..#",
        "#..........~.......#",
        "####################"
      ],
      links: [
        { from: [3, 7], to: [6, 3], mode: "toggle" },
        { from: [15, 8], to: [16, 3], mode: "hold" }
      ],
      shards: {}
    },
    {
      name: "Puls-Ladung & Phasen-Schild",
      par: 45,
      hint: "Sammle Items ins Inventar. Die Puls-Ladung sprengt rissige Wände, der Phasen-Schild schützt über Wasser & Kluft.",
      grid: [
        "####################",
        "#O..#....~~....#..O#",
        "#...C....~~....#...#",
        "#...#..2.~~....#...#",
        "#..###...~~....###.#",
        "#........~~........#",
        "#..S..3..~~..1..O..#",
        "#........aa........#",
        "#..###...aa....#####",
        "#...#....aa....C...#",
        "#...#....aa....#..E#",
        "#O..#....aa....#..O#",
        "####################"
      ],
      links: [],
      shards: {
        "6,6": "Tipp: Aktiviere den Phasen-Schild (🛡), um sicher über Wasser und Kluft zu gleiten. Hinter einer rissigen Wand wartet eine Extra-Kugel."
      }
    },
    {
      name: "Das Äther-Labyrinth",
      par: 65,
      hint: "Kombiniere Lichtbrücken, Schleusen, Puls-Ladung und Phasen-Schild für alle 4 Äther-Paare.",
      grid: [
        "####################",
        "#O.ii.#..~..#..O..1#",
        "#..ii.#..~..#.....E#",
        "#..T..D..~..C..rrrr#",
        "#.....#..~..#..rrrr#",
        "#..B..#..~..#......#",
        "#..S..3..~..2..O...#",
        "#.....####..####...#",
        "#..O..a........#...#",
        "#.....a...P....D.O.#",
        "#..O..a...B....#...#",
        "#.....a........#..O#",
        "####################"
      ],
      links: [
        { from: [3, 3], to: [6, 3], mode: "toggle" },
        { from: [10, 9], to: [15, 9], mode: "hold" }
      ],
      shards: {
        "6,6": "Sektor-Log: Der Stasis-Quader baut eine Brücke über das Wasser. Auf der anderen Seite hält ein Quader die Sensor-Platte gedrückt."
      }
    },
    {
      name: "Lichtbrechung",
      par: 55,
      hint: "Tippe die Prismen-Spiegel an, um den Laserstrahl auf die Empfänger zu lenken und die Kraftfeld-Schleusen zu öffnen. Vorsicht vor dem Strahl!",
      grid: [
        "####################",
        "#....O........O....#",
        "#L.......M.........#",
        "#..................#",
        "#.O..............O.#",
        "#..................#",
        "#R.......M........R#",
        "#..................#",
        "#####....S.....#####",
        "#...D..........D.O.#",
        "#.O.#....2.....#####",
        "#.1.#..........C.E.#",
        "####################"
      ],
      lasers: {
        "1,2": { dir: "E", active: true }
      },
      mirrors: {
        "9,2": "/",
        "9,6": "/"
      },
      links: [
        { from: [1, 6], to: [4, 9], mode: "hold" },
        { from: [18, 6], to: [15, 9], mode: "hold" }
      ],
      shards: {}
    },
    {
      name: "Gravitationsfelder",
      par: 50,
      hint: "Violette Kerne ziehen deine Kugel an, bernsteinfarbene stoßen sie ab. Schiebe die Phasen-Tauscher durch die Engpässe.",
      grid: [
        "####################",
        "#O..#....~~....#..O#",
        "#...W....~~....W...#",
        "#...#..G.~~.X..#...#",
        "#...#....~~....#...#",
        "#...###......###...#",
        "#..S..O..G...O.....#",
        "#...###......###...#",
        "#...#....aa....#...#",
        "#E..#..X.aa.G..#...#",
        "#...W....aa....W...#",
        "#O..#....aa....#..O#",
        "####################"
      ],
      links: [],
      shards: {}
    },
    {
      name: "Quanten-Konvergenz",
      par: 75,
      hint: "Meistere alle Systeme von ETHER: Laser-Optik, Gravitations-Kerne, Phasen-Tauscher, Lichtbrücke, Puls-Ladung und Phasen-Schild.",
      grid: [
        "####################",
        "#O..#....L.....#..O#",
        "#.E.#.O........C...#",
        "#...#....M...M.#...#",
        "#...#..........#...#",
        "#...###..~..#.##...#",
        "#..S..3.B~..G..D.O.#",
        "#...###..~..#.######",
        "#...#....a.....#...#",
        "#...W..X.a..1..W...#",
        "#...#..O.a.O2..#...#",
        "#O..#....a...R.#..O#",
        "####################"
      ],
      lasers: {
        "9,1": { dir: "S", active: true }
      },
      mirrors: {
        "9,3": "/",
        "13,3": "/"
      },
      links: [
        { from: [13, 11], to: [15, 6], mode: "hold" }
      ],
      shards: {
        "6,6": "Finale: Lenke den Laser über beide Prismen zum Empfänger, um die Schleuse zu öffnen. Der Stasis-Quader baut eine Abkürzung über das Wasser."
      }
    },

    // --- PHASE 5: DUAL-KUGEL-LANDSCHAFTEN (BLAU & GOLD) ---
    {
      name: "Zwei Resonanzen (Dual)",
      par: 60,
      hint: "Wechsle mit [Q] / [Shift] oder dem Button zwischen Blauer und Goldener Kugel. Jede Farbe passiert nur ihr eigenes Phasen-Tor und hält der anderen die Schleuse offen.",
      grid: [
        "####################",
        "#O...#........#...O#",
        "#....b........g....#",
        "#....#..S..K..#....#",
        "#..P.#........#.P..#",
        "######........######",
        "#..................#",
        "#..###D######D###..#",
        "#..#.....##.....#..#",
        "#..#..O..##..O..#..#",
        "#..#.O...##...O.#..#",
        "#..#.....##.....#..#",
        "####################"
      ],
      links: [
        { from: [3, 4], to: [13, 7], mode: "hold" },
        { from: [16, 4], to: [6, 7], mode: "hold" }
      ],
      shards: {}
    },
    {
      name: "Synchronität (Dual)",
      par: 80,
      hint: "Baut auf beiden Seiten Lichtbrücken ins Zentrum. Dreht das Prisma, aktiviert den Laser über die blaue Platte und öffnet gemeinsam die unteren Kammern.",
      grid: [
        "####################",
        "#O..#L...M.....#..O#",
        "#...b..........g...#",
        "#...#..........#...#",
        "#..P#....ii....#P..#",
        "#...####....####...#",
        "#..S..B~....~B..K..#",
        "########....########",
        "#...#..........#...#",
        "#...#....R..E..#...#",
        "#O..D..O....O..D..O#",
        "#...#..........#...#",
        "####################"
      ],
      lasers: {
        "5,1": { dir: "E", active: false }
      },
      mirrors: {
        "9,1": "/"
      },
      links: [
        { from: [3, 4], to: [5, 1], mode: "hold" },
        { from: [9, 9], to: [15, 10], mode: "hold" },
        { from: [16, 4], to: [4, 10], mode: "hold" }
      ],
      shards: {}
    },
  // --- LEVEL 11 ---
    {
      name: "Eisige Präzision",
      par: 45,
      hint: "Nutze die Rubinfelder zum Abbremsen, bevor dich das Kristalleis ins Wasser oder in die Sternenkluft trägt.",
      grid: [
        "####################",
        "#O..iiii~~~~iiii..O#",
        "#...iiii~~~~iiii...#",
        "#...r..i~~~~i..r...#",
        "#..###.i....i.###..#",
        "#O.....i.rr.i.....O#",
        "#..S...i.rr.i......#",
        "#O.....i.rr.i.....O#",
        "#..###.i....i.###..#",
        "#...r..iaaaai..r...#",
        "#...iiiiaaaaiiii...#",
        "#O..iiiiaaaaiiii..O#",
        "####################"
      ],
      links: [],
      shards: {}
    },

    // --- LEVEL 12 ---
    {
      name: "Die drei Schleusen",
      par: 65,
      hint: "Das Impuls-Terminal schaltet zwei Schleusen gleichzeitig. Schiebe die Stasis-Quader auf die Sensor-Platten.",
      grid: [
        "####################",
        "#O..#....O.....#..O#",
        "#...D..........D...#",
        "#...#..T....P..#...#",
        "#...####....####...#",
        "#........~~........#",
        "#..S..B..~~..B..O..#",
        "#........~~........#",
        "#...####....####...#",
        "#...#....P.....#...#",
        "#...D..........D...#",
        "#O..#..O....O..#..O#",
        "####################"
      ],
      links: [
        { from: [7, 3], to: [4, 2], mode: "toggle" },
        { from: [7, 3], to: [15, 10], mode: "toggle" },
        { from: [12, 3], to: [15, 2], mode: "hold" },
        { from: [9, 9], to: [4, 10], mode: "hold" }
      ],
      shards: {}
    },

    // --- LEVEL 13 ---
    {
      name: "Spiegelkabinett",
      par: 70,
      hint: "Lenke den Laser über die Prismen-Spiegel wahlweise auf den rechten oder den unteren Empfänger, um die Schleusen zu öffnen.",
      grid: [
        "####################",
        "#O..#..L....M..#..O#",
        "#...D..........D...#",
        "#...#..........#...#",
        "#...#..M....M..R...#",
        "#...#..........#...#",
        "#..O...S....2...O..#",
        "#...#..........#...#",
        "#...#..M....R..#...#",
        "#...#..........#...#",
        "#...D..........D...#",
        "#O..#..O....O..#..O#",
        "####################"
      ],
      lasers: {
        "7,1": { dir: "E", active: true }
      },
      mirrors: {
        "12,1": "/",
        "12,4": "/",
        "7,4": "\\",
        "7,8": "/"
      },
      links: [
        { from: [15, 4], to: [4, 10], mode: "hold" },
        { from: [15, 4], to: [15, 10], mode: "hold" },
        { from: [12, 8], to: [4, 2], mode: "hold" },
        { from: [12, 8], to: [15, 2], mode: "hold" }
      ],
      shards: {}
    },

    // --- LEVEL 14 ---
    {
      name: "Abstoßung & Sog",
      par: 60,
      hint: "Violette Kerne ziehen dich an, bernsteinfarbene stoßen dich ab. Nutze die schmalen Rubinbrücken über die Sternenkluft.",
      grid: [
        "####################",
        "#O..ii...a...ii..O.#",
        "#..iii.G.a.X.iii...#",
        "#...ii...a...ii....#",
        "#....rrrr.rrrr.....#",
        "#..O.....a.....O...#",
        "#..S..X..r..G...2..#",
        "#..O.....a.....O...#",
        "#....rrrr.rrrr.....#",
        "#...ii...a...ii....#",
        "#..iii.X.a.G.iii.E.#",
        "#O..ii...a...ii..O.#",
        "####################"
      ],
      links: [],
      shards: {}
    },

    // --- LEVEL 15 ---
    {
      name: "Sprengmeister",
      par: 65,
      hint: "Sammle die Puls-Ladungen und sprenge alle vier rissigen Kammern auf. Ein Phasen-Tauscher und eine Extra-Kugel warten im Sektor.",
      grid: [
        "####################",
        "#O..#.O..O.....#..O#",
        "#...C..........C...#",
        "#...#..1....1..#...#",
        "######........######",
        "#........##........#",
        "#..S..3..##..W..O..#",
        "#........##........#",
        "######........######",
        "#...#..1....1..#...#",
        "#...C..........C...#",
        "#O..#..E....O..#..O#",
        "####################"
      ],
      links: [],
      shards: {
        "6,6": "Tipp: Lege die Puls-Ladung (⚡) direkt vor der rissigen Wand ab und rolle schnell ein Stück zurück."
      }
    },

    // --- LEVEL 16 ---
    {
      name: "Phasen-Tausch",
      par: 65,
      hint: "Baue mit dem Stasis-Quader eine Lichtbrücke über den Wasserkanal und räume die Eckkammern mit den Phasen-Tauschern frei.",
      grid: [
        "####################",
        "#O..#....~..O..#..O#",
        "#...W....~.....W...#",
        "#...#....~.....#...#",
        "#...#..B.~.O...#...#",
        "#...###..~...###...#",
        "#..S.....~......O..#",
        "#...###..~...###...#",
        "#...#..O.~.B...#...#",
        "#...#....~.....#...#",
        "#...W....~.....W...#",
        "#O..#....~.....#..O#",
        "####################"
      ],
      links: [],
      shards: {}
    },

    // --- LEVEL 17 (DUAL) ---
    {
      name: "Doppel-Resonanz (Dual)",
      par: 75,
      hint: "Blau und Gold halten sich gegenseitig die Sensor-Platten gedrückt, um die unteren Kammern und farbigen Phasen-Tore zu erreichen.",
      grid: [
        "####################",
        "#O..#..........#..O#",
        "#...b..........g...#",
        "#...#..S....K..#...#",
        "#..P#..........#P..#",
        "#####..........#####",
        "#..O............O..#",
        "#...####D##D####...#",
        "#...#....##....#...#",
        "#...#..O.##.O..#...#",
        "#...b..........g...#",
        "#O..#....##....#..O#",
        "####################"
      ],
      links: [
        { from: [3, 4], to: [11, 7], mode: "hold" },
        { from: [16, 4], to: [8, 7], mode: "hold" }
      ],
      shards: {}
    },

    // --- LEVEL 18 ---
    {
      name: "Laser-Sektor",
      par: 70,
      hint: "Aktiviere den Laser über das Impuls-Terminal. Richte die beiden Spiegel so aus, dass nacheinander beide Empfänger getroffen werden.",
      grid: [
        "####################",
        "#O..#....O.....#..O#",
        "#...D..........D...#",
        "#...#..T....2..#...#",
        "#...#..........#...#",
        "#...####....####...#",
        "#L.......M.........#",
        "#...####....####...#",
        "#...#.O..S...O.#...#",
        "#...#R...M....R#...#",
        "#...D..........D...#",
        "#O..#....O.....#..O#",
        "####################"
      ],
      lasers: {
        "1,6": { dir: "E", active: false }
      },
      mirrors: {
        "9,6": "/",
        "9,9": "/"
      },
      links: [
        { from: [7, 3], to: [1, 6], mode: "toggle" },
        { from: [5, 9], to: [4, 2], mode: "hold" },
        { from: [5, 9], to: [4, 10], mode: "hold" },
        { from: [14, 9], to: [15, 2], mode: "hold" },
        { from: [14, 9], to: [15, 10], mode: "hold" }
      ],
      shards: {}
    },

    // --- LEVEL 19 (DUAL) ---
    {
      name: "Getrennte Welten (Dual)",
      par: 75,
      hint: "Blau und Gold sind durch Wasser und Sternenkluft getrennt. Öffnet euch gegenseitig über Terminals und Sensor-Platten die Schleusen.",
      grid: [
        "####################",
        "#O..#.O.~..~.O.#..O#",
        "#...D...~..~...D...#",
        "#...#...~..~...#...#",
        "#..P....~..~....P..#",
        "#...iii.~..~.iii...#",
        "#..S.O..~..~..O.K..#",
        "#...rrr.a..a.rrr...#",
        "#..T....a..a....T..#",
        "#...#...a..a...#...#",
        "#...D...a..a...D...#",
        "#O..#...a..a...#..O#",
        "####################"
      ],
      links: [
        { from: [3, 8], to: [15, 10], mode: "toggle" },
        { from: [16, 8], to: [4, 10], mode: "toggle" },
        { from: [3, 4], to: [15, 2], mode: "hold" },
        { from: [16, 4], to: [4, 2], mode: "hold" }
      ],
      shards: {}
    },

    // --- LEVEL 20 (DUAL FINALE) ---
    {
      name: "Der Kern des Äthers (Finale)",
      par: 95,
      hint: "Das große Finale mit 5 Äther-Paaren: Baut auf beiden Seiten Lichtbrücken, meistert Gravitation und lenkt den zentralen Laser auf beide Empfänger.",
      grid: [
        "####################",
        "#O..#....L.....#..O#",
        "#...D..........D...#",
        "#...#..b...g...#...#",
        "#...#..#...#...#...#",
        "#...#..O...O...#...#",
        "#..S.B~.G.X.~B..K..#",
        "#...#..O...O...#...#",
        "#...#..#...#...#...#",
        "#..1C..........C2..#",
        "#...#..R.M.R...#...#",
        "#O.E#..O...O...#..O#",
        "####################"
      ],
      lasers: {
        "9,1": { dir: "S", active: true }
      },
      mirrors: {
        "9,10": "/"
      },
      links: [
        { from: [7, 10], to: [4, 2], mode: "hold" },
        { from: [11, 10], to: [15, 2], mode: "hold" }
      ],
      shards: {}
    }
  ];
})();
