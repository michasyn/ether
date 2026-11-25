(() => {
  "use strict";

  const COLS = 20;
  const ROWS = 13;
  const T = 40; // 20*40 = 800, 13*40 = 520

  const editorModal = document.getElementById("editorModal");
  const btnEditor = document.getElementById("btnEditor");
  const btnCloseEditor = document.getElementById("btnCloseEditor");
  const btnBackToEditor = document.getElementById("btnBackToEditor");
  const edPalette = document.getElementById("edPalette");
  const edCanvas = document.getElementById("editorCanvas");
  const edCtx = edCanvas.getContext("2d");
  const edStatus = document.getElementById("edStatus");
  const edLevelName = document.getElementById("edLevelName");
  const edLevelSelect = document.getElementById("edLevelSelect");
  const edBtnTest = document.getElementById("edBtnTest");
  const edBtnShare = document.getElementById("edBtnShare");
  const edBtnExport = document.getElementById("edBtnExport");
  const edBtnImport = document.getElementById("edBtnImport");
  const edBtnClear = document.getElementById("edBtnClear");

  const TOOLS = [
    { id: ".", label: "Boden",      color: "#1e2242" },
    { id: "#", label: "Wand",       color: "#3b3568" },
    { id: "O", label: "Äther-Stein",color: "#22d3ee" },
    { id: "S", label: "Start Blau", color: "#38bdf8" },
    { id: "K", label: "Start Gold", color: "#fbbf24" },
    { id: "b", label: "Tor Blau",   color: "#0284c7" },
    { id: "g", label: "Tor Gold",   color: "#d97706" },
    { id: "i", label: "Eis",        color: "#67e8f9" },
    { id: "r", label: "Rubinfeld",  color: "#9d174d" },
    { id: "~", label: "Wasser",     color: "#0e7490" },
    { id: "a", label: "Kluft",      color: "#050714" },
    { id: "B", label: "Stasis",     color: "#0369a1" },
    { id: "C", label: "Riss-Wand",  color: "#f59e0b" },
    { id: "W", label: "Tauscher",   color: "#a855f7" },
    { id: "T", label: "Terminal",   color: "#fb7185" },
    { id: "P", label: "Platte",     color: "#8b5cf6" },
    { id: "D", label: "Schleuse",   color: "#38bdf8" },
    { id: "L", label: "Laser (↻)",  color: "#f43f5e" },
    { id: "M", label: "Spiegel (↻)",color: "#e0f2fe" },
    { id: "R", label: "Empfänger",  color: "#34d399" },
    { id: "G", label: "Grav (+)",   color: "#c084fc" },
    { id: "X", label: "Grav (-)",   color: "#fb923c" },
    { id: "1", label: "⚡ Puls",     color: "#fbbf24" },
    { id: "2", label: "🛡 Schild",   color: "#34d399" },
    { id: "3", label: "◈ Shard",    color: "#38bdf8" },
    { id: "E", label: "+1 Kugel",   color: "#7dd3fc" },
    { id: "LINK", label: "🔗 Signal verknüpfen", color: "#34d399", wide: true }
  ];

  const DIRS = ["E", "S", "W", "N"];

  let currentTool = "#";
  let isDrawing = false;
  let linkSource = null;

  let edData = createEmptyLevel();

  function createEmptyLevel() {
    const grid = [];
    for (let y = 0; y < ROWS; y++) {
      let row = "";
      for (let x = 0; x < COLS; x++) {
        row += (y === 0 || y === ROWS - 1 || x === 0 || x === COLS - 1) ? "#" : ".";
      }
      grid.push(row.split(""));
    }
    grid[6][2] = "S";
    grid[2][5] = "O";
    grid[10][14] = "O";
    return {
      name: "Eigene Landschaft",
      hint: "Selbst entworfene Landschaft aus dem ETHER-Editor.",
      grid,
      lasers: {},
      mirrors: {},
      links: [],
      shards: {}
    };
  }

  function loadIntoEditor(obj) {
    edData = {
      name: obj.name || "Importierte Landschaft",
      hint: obj.hint || "",
      grid: obj.grid.map((r) => r.split("")),
      lasers: obj.lasers ? JSON.parse(JSON.stringify(obj.lasers)) : {},
      mirrors: obj.mirrors ? { ...obj.mirrors } : {},
      links: obj.links ? obj.links.map((l) => ({ from: [...l.from], to: [...l.to], mode: l.mode })) : [],
      shards: obj.shards ? { ...obj.shards } : {}
    };
    linkSource = null;
    edLevelName.value = edData.name;
    drawEditor();
  }

  function exportLevelObject() {
    return {
      name: edLevelName.value.trim() || "Eigene Landschaft",
      hint: edData.hint,
      grid: edData.grid.map((r) => r.join("")),
      lasers: JSON.parse(JSON.stringify(edData.lasers)),
      mirrors: { ...edData.mirrors },
      links: edData.links.map((l) => ({ from: [...l.from], to: [...l.to], mode: l.mode })),
      shards: { ...edData.shards }
    };
  }

  // Dropdown mit allen vorhandenen Leveln füllen
  function populateLevelSelect() {
    if (!edLevelSelect || !window.ETHER || !Array.isArray(window.ETHER.LEVELS)) return;
    edLevelSelect.innerHTML = '<option value="">Vorlage laden…</option>';
    window.ETHER.LEVELS.forEach((lvl, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = `Level ${idx + 1}: ${lvl.name}`;
      edLevelSelect.appendChild(opt);
    });
  }

  if (edLevelSelect) {
    populateLevelSelect();
    edLevelSelect.addEventListener("change", () => {
      const val = edLevelSelect.value;
      if (val === "") return;
      const idx = parseInt(val, 10);
      const lvl = window.ETHER.LEVELS[idx];
      if (lvl) {
        loadIntoEditor(lvl);
        edStatus.textContent = `Level ${idx + 1} (${lvl.name}) als Vorlage geladen.`;
      }
      edLevelSelect.value = "";
    });
  }

  // Palette aufbauen
  const toolBtns = {};
  TOOLS.forEach((t) => {
    const btn = document.createElement("button");
    btn.className = "ed-tool" + (t.wide ? " wide" : "") + (t.id === currentTool ? " active" : "");
    btn.textContent = t.label;
    btn.addEventListener("click", () => {
      currentTool = t.id;
      linkSource = null;
      Object.values(toolBtns).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      edStatus.textContent = t.id === "LINK"
        ? "Verknüpfen: Klicke zuerst einen Auslöser (Terminal, Platte oder Empfänger), dann eine Schleuse oder einen Laser."
        : `Werkzeug: ${t.label} – Klicke oder ziehe über das Raster.`;
      drawEditor();
    });
    edPalette.appendChild(btn);
    toolBtns[t.id] = btn;
  });

  function getCellFromEvent(e) {
    const rect = edCanvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * COLS);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * ROWS);
    return { x: Math.max(0, Math.min(COLS - 1, x)), y: Math.max(0, Math.min(ROWS - 1, y)) };
  }

  function applyToolAt(x, y, isSingleClick) {
    const key = `${x},${y}`;

    if (currentTool === "LINK") {
      if (!isSingleClick) return;
      const ch = edData.grid[y][x];
      if (!linkSource) {
        if (["T", "P", "R"].includes(ch)) {
          linkSource = [x, y];
          edStatus.textContent = `Auslöser (${x},${y}) gewählt. Klicke jetzt auf eine Schleuse (D) oder einen Laser (L).`;
        } else {
          edStatus.textContent = "Bitte zuerst auf ein Terminal (T), eine Platte (P) oder einen Empfänger (R) klicken.";
        }
      } else {
        if (["D", "L"].includes(ch)) {
          const [fx, fy] = linkSource;
          const existingIdx = edData.links.findIndex(
            (l) => l.from[0] === fx && l.from[1] === fy && l.to[0] === x && l.to[1] === y
          );
          if (existingIdx >= 0) {
            edData.links.splice(existingIdx, 1);
            edStatus.textContent = "Verknüpfung entfernt.";
          } else {
            const srcCh = edData.grid[fy][fx];
            const mode = srcCh === "T" ? "toggle" : "hold";
            edData.links.push({ from: [fx, fy], to: [x, y], mode });
            edStatus.textContent = `Verknüpft: (${fx},${fy}) → (${x},${y}) [${mode}].`;
          }
          linkSource = null;
        } else {
          linkSource = null;
          edStatus.textContent = "Ziel muss eine Schleuse (D) oder ein Laser (L) sein. Verknüpfung abgebrochen.";
        }
      }
      drawEditor();
      return;
    }

    // Nur ein Startpunkt pro Farbe erlaubt
    if (currentTool === "S" || currentTool === "K") {
      for (let ry = 0; ry < ROWS; ry++) {
        for (let rx = 0; rx < COLS; rx++) {
          if (edData.grid[ry][rx] === currentTool) edData.grid[ry][rx] = ".";
        }
      }
    }

    // Laser-Richtung oder Spiegel-Winkel bei erneutem Klick drehen
    if (currentTool === "L" && edData.grid[y][x] === "L" && isSingleClick) {
      const cur = (edData.lasers[key] && edData.lasers[key].dir) || "E";
      const next = DIRS[(DIRS.indexOf(cur) + 1) % DIRS.length];
      edData.lasers[key] = { dir: next, active: true };
      edStatus.textContent = `Laser-Richtung: ${next}`;
      drawEditor();
      return;
    }

    if (currentTool === "M" && edData.grid[y][x] === "M" && isSingleClick) {
      const cur = edData.mirrors[key] || "/";
      edData.mirrors[key] = cur === "/" ? "\\" : "/";
      drawEditor();
      return;
    }

    // Daten-Shard-Text abfragen
    if (currentTool === "3" && isSingleClick) {
      const txt = prompt("Hinweistext für diesen Daten-Shard:", edData.shards[key] || "Geheimer Hinweis...");
      if (txt !== null) edData.shards[key] = txt;
    }

    edData.grid[y][x] = currentTool;
    if (currentTool === "L" && !edData.lasers[key]) edData.lasers[key] = { dir: "E", active: true };
    if (currentTool === "M" && !edData.mirrors[key]) edData.mirrors[key] = "/";
    if (currentTool !== "L") delete edData.lasers[key];
    if (currentTool !== "M") delete edData.mirrors[key];
    if (currentTool !== "3") delete edData.shards[key];

    // Verwaiste Links entfernen
    edData.links = edData.links.filter((l) => {
      const f = edData.grid[l.from[1]][l.from[0]];
      const t = edData.grid[l.to[1]][l.to[0]];
      return ["T", "P", "R"].includes(f) && ["D", "L"].includes(t);
    });

    drawEditor();
  }

  edCanvas.addEventListener("pointerdown", (e) => {
    isDrawing = true;
    const { x, y } = getCellFromEvent(e);
    applyToolAt(x, y, true);
  });
  edCanvas.addEventListener("pointermove", (e) => {
    if (!isDrawing || currentTool === "LINK" || currentTool === "3") return;
    const { x, y } = getCellFromEvent(e);
    applyToolAt(x, y, false);
  });
  window.addEventListener("pointerup", () => { isDrawing = false; });

  function drawEditor() {
    edCtx.clearRect(0, 0, edCanvas.width, edCanvas.height);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const ch = edData.grid[y][x];
        const px = x * T;
        const py = y * T;
        const tool = TOOLS.find((t) => t.id === ch);

        edCtx.fillStyle = tool ? tool.color : "#1e2242";
        edCtx.fillRect(px, py, T, T);
        edCtx.strokeStyle = "rgba(255,255,255,0.1)";
        edCtx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);

        if (ch !== "." && ch !== "#") {
          edCtx.fillStyle = "#ffffff";
          edCtx.font = "bold 14px system-ui, sans-serif";
          edCtx.textAlign = "center";
          edCtx.textBaseline = "middle";
          let sym = ch;
          const key = `${x},${y}`;
          if (ch === "L") sym = "L:" + ((edData.lasers[key] && edData.lasers[key].dir) || "E");
          else if (ch === "M") sym = edData.mirrors[key] || "/";
          else if (ch === "1") sym = "⚡";
          else if (ch === "2") sym = "🛡";
          else if (ch === "3") sym = "◈";
          else if (ch === "E") sym = "+1";
          edCtx.fillText(sym, px + T / 2, py + T / 2);
        }
      }
    }

    // Signal-Verknüpfungen als leuchtende Linien zeichnen
    for (const link of edData.links) {
      const x1 = (link.from[0] + 0.5) * T;
      const y1 = (link.from[1] + 0.5) * T;
      const x2 = (link.to[0] + 0.5) * T;
      const y2 = (link.to[1] + 0.5) * T;
      edCtx.strokeStyle = "#34d399";
      edCtx.lineWidth = 2.5;
      edCtx.setLineDash([5, 4]);
      edCtx.beginPath();
      edCtx.moveTo(x1, y1);
      edCtx.lineTo(x2, y2);
      edCtx.stroke();
      edCtx.setLineDash([]);
    }

    if (linkSource) {
      edCtx.strokeStyle = "#fbbf24";
      edCtx.lineWidth = 3;
      edCtx.strokeRect(linkSource[0] * T + 2, linkSource[1] * T + 2, T - 4, T - 4);
    }
  }

  // Editor-Buttons
  function openEditor() {
    if (window.ETHER.pauseGame) window.ETHER.pauseGame();
    editorModal.classList.remove("hidden");
    drawEditor();
  }

  btnEditor.addEventListener("click", openEditor);
  btnBackToEditor.addEventListener("click", openEditor);
  btnCloseEditor.addEventListener("click", () => editorModal.classList.add("hidden"));

  edBtnClear.addEventListener("click", () => {
    edData = createEmptyLevel();
    edLevelName.value = edData.name;
    drawEditor();
    edStatus.textContent = "Spielfeld zurückgesetzt.";
  });

  edBtnTest.addEventListener("click", () => {
    const obj = exportLevelObject();
    editorModal.classList.add("hidden");
    window.ETHER.playCustomLevel(obj, true);
  });

  edBtnExport.addEventListener("click", () => {
    const json = JSON.stringify(exportLevelObject());
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json).then(() => {
        edStatus.textContent = "Level-JSON in die Zwischenablage kopiert!";
      }).catch(() => prompt("Level-JSON kopieren:", json));
    } else {
      prompt("Level-JSON kopieren:", json);
    }
  });

  edBtnImport.addEventListener("click", () => {
    const raw = prompt("Füge hier das kopierte Level-JSON ein:");
    if (!raw) return;
    try {
      const obj = JSON.parse(raw);
      if (!Array.isArray(obj.grid) || obj.grid.length !== ROWS) throw new Error();
      loadIntoEditor(obj);
      edStatus.textContent = "Level erfolgreich importiert!";
    } catch (_) {
      edStatus.textContent = "Ungültiges JSON-Format.";
    }
  });

  edBtnShare.addEventListener("click", () => {
    const json = JSON.stringify(exportLevelObject());
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const url = `${window.location.origin}${window.location.pathname}#level=${b64}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        edStatus.textContent = "Teilbarer Level-Link in die Zwischenablage kopiert!";
      }).catch(() => prompt("Level-Link kopieren:", url));
    } else {
      prompt("Level-Link kopieren:", url);
    }
  });
})();
