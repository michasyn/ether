# PROJECT_CONTEXT – ETHER

Dieses Dokument fasst die Vision, Architektur, Spielmechaniken und technischen Leitplanken des Web-Spiels **»ETHER«** zusammen. Es dient als verbindliche Referenz für die Weiterentwicklung in Google AI Studio und auf GitHub.

---

## 1. Vision & Spielgefühl
* **Ursprung:** Inspiriert vom Atari-ST-Klassiker *OXYD* – ein physikbasiertes Murmel- und Rätselspiel, bei dem verborgene Steinpaare (Äther-Steine) in einer Landschaft gefunden und nacheinander geöffnet werden müssen.
* **Ästhetik:** Moderne, dunkle, leuchtende Sci-Fi-Ästhetik (tiefes Nachtblau, Cyan, Violett, Gold). Ein Schwarzweiß-/Retro-Monochrom-Modus ist **bewusst nicht gewünscht**.
* **Spielgefühl:** Direktes, präzises, physikalisches Rollgefühl (120-Hz-Physikschleife). Desktop-Steuerung über Pointer Lock (Maus) oder Tastatur; mobile Steuerung über Touch-Wischen oder Gyroskop (Neigung) inklusive automatischer 90°-Hochformat-Drehung.

---

## 2. Technische Leitplanken (Wichtig für AI Studio)
* **Reines Vanilla-Setup:** HTML5 Canvas 2D, CSS3 und modulares Vanilla JavaScript (ES6+, IIFE mit Namespace `window.ETHER`). **Kein** React, **kein** TypeScript, **kein** Bundler/Build-Step.
* **Flache Dateistruktur:** Alle Dateien liegen direkt im Root-Verzeichnis für direktes, kostenloses Hosting auf **GitHub Pages** (`index.html` muss auf oberster Ebene bleiben).
* **PWA & Offline-Fähigkeit:** Vollständige Progressive Web App (`manifest.json`, `sw.js`, `icon.svg`). Bei Code- oder Level-Updates muss `CACHE_NAME` in `sw.js` hochgezählt werden.
* **Persistenz:** Gelöste Level und persönliche Bestzeiten (inkl. PAR-Richtzeiten) werden in `localStorage` unter dem Schlüssel `ether_progress_v1` gespeichert.
* **Audio-System:** Prozedurale Web-Audio-API-Effekte und Oberflächen-Loops (Eis, Sand) in `audio.js`, kombiniert mit lokalen HTML5-MP3-Jingles (`newlevel.mp3`, `winlevel.mp3`, `lostlevel.mp3`). Fehlen die MP3s, greift automatisch ein Synthesizer-Fallback.

---

## 3. Dateistruktur im Repository
* `index.html` – Haupt-UI, HUD, Modals (Level-Übersicht & Editor), PWA-Meta-Tags.
* `style.css` – Komplettes Layout, Responsive Design, Hochformat-Anpassung (`.stage-wrap.portrait`), Modals.
* `audio.js` – `SoundEngine` (Web Audio API, Stereo-Panning, Oberflächen-Loops, MP3-Jingles).
* `levels.js` – `window.ETHER.LEVELS` mit aktuell **20 spielbaren Landschaften** (20×13 Raster).
* `engine.js` – 120-Hz-Physik, Zwei-Pass-Kollision, Laser-Raycasting, Dual-Kugel-Physik, Gyroskop, Renderer, `localStorage`, Hash-Loader (`#level=...`).
* `editor.js` – Erweiterter Level-Editor im Browser.
* `manifest.json`, `sw.js`, `icon.svg` – PWA-Konfiguration und App-Icon.
* `newlevel.mp3`, `winlevel.mp3`, `lostlevel.mp3` – Eigene Musik-Jingles (exakt kleingeschrieben für Linux/GitHub).

---

## 4. Aktueller Funktionsumfang (Phasen 1–5 abgeschlossen)

### Steuerung & Mobile
* **Desktop:** Pointer Lock (Maus), `WASD`/Pfeiltasten, `Linksklick`/`Space` (Item nutzen), `Rechtsklick`/`Tab`/Mausrad (Inventar drehen), `Q`/`Shift` (Dual-Kugel wechseln), `R` (Neustart), `ESC` (Pause), `+`/`-` (Empfindlichkeit).
* **Mobil:** Touch-Wischen, automatische 90°-Drehung im Hochformat, optionaler **Gyroskop-Modus (`🧭`)** mit **Kalibrierung (`⌖`)**, Vollbild-Button (`⛶`).

### Böden & Gefahren
* `.` **Äther-Boden:** Standard-Reibung.
* `i` **Kristalleis:** Sehr geringe Reibung, verzögerte Kontrolle, Eis-Gleitgeräusch.
* `r` **Rubinfeld (Treibsand):** Starke Bremswirkung + Sandgeräusch. Die Kugel sinkt langsam ein und wird zerstört, wenn man zu lange darauf bleibt (Phasen-Schild schützt).
* `~` **Tiefenwasser** & `a` **Sternenkluft:** Zerstören ungeschützte Kugeln.
* `P` **Sensor-Platte:** Löst Signale aus, solange eine Kugel oder ein Block darauf liegt (`mode: "hold"`).
* **Lichtbrücke:** Entsteht automatisch, wenn ein Stasis-Quader (`B`) in Wasser oder Kluft geschoben wird.

### Steine, Optik & Mechaniken
* `#` **Monolith-Wand** | `C` **Instabile Riss-Wand** (durch Puls-Ladung sprengbar).
* `O` **Äther-Stein:** Paarweise öffnen. **Stillstand-Hinweis:** Nach 3 Sekunden Inaktivität leuchten alle noch geschlossenen Äther-Steine der Reihe nach neutral auf.
* `B` **Stasis-Quader** (schiebbar) | `W` **Phasen-Tauscher / Swap** (tauscht Platz mit dem dahinterliegenden Feld).
* `T` **Impuls-Terminal** (`mode: "toggle"`) | `D` **Kraftfeld-Schleuse**.
* `L` **Laser-Emitter**, `M` **drehbarer Prismen-Spiegel** (`/` oder `\`), `R` **Laser-Empfänger**.
* `G` **Gravitations-Kern (anziehend)** | `X` **Gravitations-Kern (abstoßend)**.

### Items & Inventar (5 Slots)
* `1` **Puls-Ladung (`⚡`):** Sprengt Riss-Wände im 3×3-Umfeld; zerstört ungeschützte Kugeln, die bei der Detonation noch auf demselben Feld stehen.
* `2` **Phasen-Schild (`🛡`):** 10 Sekunden Schutz vor Wasser, Kluft, Laser, Treibsand und Puls-Explosion.
* `3` **Daten-Shard (`◈`):** Zeigt einen Hinweistext im Holo-Banner an.
* `E` **Versteckte Extra-Kugel (`+1`):** Erhöht sofort die Reserve-Kugeln (max. 5).

### Dual-Kugel-Modus (Level 9, 10, 17, 19, 20)
* `S` **Blaue Kugel** & `K` **Goldene Kugel** (prallen physikalisch voneinander ab).
* `b` **Blaues Phasen-Tor** (nur für Blau passierbar) | `g` **Goldenes Phasen-Tor** (nur für Gold passierbar).

### Visueller Feinschliff & Editor
* Zarte, abklingende **Leuchtspur** hinter den Kugeln und sanft schwebende Hintergrund-Partikel.
* **Level-Übersicht (`☰ Landschaften`):** Kartenansicht aller 20 Level mit Status, Bestzeit und PAR-Stern.
* **Erweiterter Editor (`✎ Editor`):** 20×13-Raster, alle Spiel-Elemente inkl. Dual-Kugel, Signal-Verknüpfung per Klick (`🔗`), Dropdown **»Vorlage laden…«** für alle 20 Level, sofortiges Testen, JSON-Export/Import und Teilen per Link (`#level=...`).

---

## 5. Bewusst zurückgestellte Ideen (Roadmap)
* **Größere Level (> 20×13 Felder):** Aktuell sind `COLS = 20` und `ROWS = 13` fest verdrahtet. Für die Zukunft angedacht: dynamische Grid-Größen pro Level mit Kamera-System (weiches Scrolling oder klassischer Raumwechsel). *Nicht ungefragt umbauen.*
* **Service Worker:** Derzeit Cache-First; bei Bedarf später auf Network-First umstellbar.

---

## 6. Anweisung für KI-Assistenten
1. Behalte die bestehende Vanilla-JS-Architektur und die flache Dateistruktur für GitHub Pages strikt bei.
2. Nimm nur gezielte Änderungen an den angefragten Stellen vor und entferne keine bestehenden Features (PWA, MP3-Jingles, 20 Level, Editor, Dual-Kugel, Stillstand-Hinweis, Treibsand).
3. Erhöhe bei Änderungen an Spiel-Dateien die `CACHE_NAME`-Version in `sw.js`.