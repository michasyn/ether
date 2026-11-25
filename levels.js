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
        "#..B..#....~..O.#..#",
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
        "#..###...aa....###.#",
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
    }
  ];
})();