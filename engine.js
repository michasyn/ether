(() => {
  "use strict";

  const { SoundEngine, LEVELS } = window.ETHER;

  // =========================================================================
  // 1. KONSTANTEN & PALETTEN
  // =========================================================================
  const COLS = 20;
  const ROWS = 13;
  const TILE = 48;
  const WORLD_W = COLS * TILE; // 960
  const WORLD_H = ROWS * TILE; // 624

  const FIXED_DT = 1 / 120;
  const MARBLE_RADIUS = 15.5;
  const MAX_SPEED = 780;
  const RESTITUTION = 0.56;
  const MOUSE_FORCE_SCALE = 1.95;
  const TOUCH_FORCE_SCALE = 3.2;
  const KEY_ACCEL = 1150;
  const GYRO_ACCEL = 38;
  const PUSH_SPEED_THRESHOLD = 145;
  const SHIELD_DURATION = 10.0;
  const WATER_DEATH_DUR = 0.95;
  const ABYSS_DEATH_DUR = 0.65;
  const LASER_DEATH_DUR = 0.55;
  const MAX_INVENTORY = 5;
  const MAX_LIVES = 5;
  const GRAVITY_RADIUS = TILE * 3.6;
  const GRAVITY_STRENGTH = 500;
  const STORAGE_KEY = "ether_progress_v1";

  const DIR_VECS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };

  const FLOOR_PROPS = {
    standard: { name: "Äther-Boden",  friction: 2.35, control: 1.00, dot: "#818cf8" },
    ice:      { name: "Kristalleis",  friction: 0.28, control: 0.32, dot: "#67e8f9" },
    red:      { name: "Rubinfeld",    friction: 6.40, control: 0.65, dot: "#f472b6" },
    bridge:   { name: "Lichtbrücke",  friction: 2.20, control: 1.00, dot: "#22d3ee" },
    plate:    { name: "Sensor-Platte",friction: 2.35, control: 1.00, dot: "#a78bfa" },
    water:    { name: "Tiefenwasser", friction: 4.00, control: 0.20, dot: "#06b6d4" },
    abyss:    { name: "Sternenkluft", friction: 0.00, control: 0.00, dot: "#312e81" }
  };

  const OXYD_SYMBOLS = [
    { name: "Cyan",    color: "#22d3ee", glow: "rgba(34,211,238,0.55)",  shape: "circle",   freq: 523.25 },
    { name: "Koralle", color: "#fb7185", glow: "rgba(251,113,133,0.55)", shape: "diamond",  freq: 587.33 },
    { name: "Smaragd", color: "#34d399", glow: "rgba(52,211,153,0.55)",  shape: "triangle", freq: 659.25 },
    { name: "Gold",    color: "#fbbf24", glow: "rgba(251,191,36,0.55)",  shape: "square",   freq: 783.99 },
    { name: "Violett", color: "#c084fc", glow: "rgba(192,132,252,0.55)", shape: "star",     freq: 880.00 },
    { name: "Orange",  color: "#fb923c", glow: "rgba(251,146,60,0.55)",  shape: "hex",      freq: 987.77 }
  ];

  const ITEM_META = {
    pulse:     { name: "Puls-Ladung",  icon: "⚡", color: "#fbbf24" },
    shield:    { name: "Phasen-Schild",icon: "🛡", color: "#34d399" },
    shard:     { name: "Daten-Shard",  icon: "◈", color: "#38bdf8" },
    extraLife: { name: "Extra-Kugel",  icon: "+1", color: "#7dd3fc" }
  };

  // =========================================================================
  // 2. SPIELSTAND (LOCALSTORAGE)
  // =========================================================================
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveProgress(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  let progress = loadProgress();

  // =========================================================================
  // 3. DOM-REFERENZEN & SPIELZUSTAND
  // =========================================================================
  const stageWrap = document.querySelector(".stage-wrap");
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const audio = new SoundEngine();

  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const btnOverlayPrimary = document.getElementById("btnOverlayPrimary");
  const btnOverlaySecondary = document.getElementById("btnOverlaySecondary");
  const hudLevelTag = document.getElementById("hudLevelTag");
  const hudPairs = document.getElementById("hudPairs");
  const hudTime = document.getElementById("hudTime");
  const shieldPill = document.getElementById("shieldPill");
  const hudShield = document.getElementById("hudShield");
  const livesOrbs = document.getElementById("livesOrbs");
  const floorDot = document.getElementById("floorDot");
  const floorLabel = document.getElementById("floorLabel");
  const sensSlider = document.getElementById("sensSlider");
  const sensValue = document.getElementById("sensValue");
  const btnLevels = document.getElementById("btnLevels");
  const btnEditor = document.getElementById("btnEditor");
  const btnBackToEditor = document.getElementById("btnBackToEditor");
  const btnGyro = document.getElementById("btnGyro");
  const btnGyroCal = document.getElementById("btnGyroCal");
  const btnFullscreen = document.getElementById("btnFullscreen");
  const btnPause = document.getElementById("btnPause");
  const btnAudio = document.getElementById("btnAudio");
  const btnRestart = document.getElementById("btnRestart");
  const btnSwitchOrb = document.getElementById("btnSwitchOrb");
  const btnPickupLock = document.getElementById("btnPickupLock");
  const invSlotsWrap = document.getElementById("invSlots");
  const btnUseItem = document.getElementById("btnUseItem");
  const holoBanner = document.getElementById("holoBanner");
  const holoText = document.getElementById("holoText");

  const levelsModal = document.getElementById("levelsModal");
  const levelsGrid = document.getElementById("levelsGrid");
  const levelsProgress = document.getElementById("levelsProgress");
  const btnCloseLevels = document.getElementById("btnCloseLevels");

  const ambientDust = Array.from({ length: 34 }, () => ({
    x: Math.random() * WORLD_W,
    y: Math.random() * WORLD_H,
    vx: (Math.random() - 0.5) * 14,
    vy: -4 - Math.random() * 10,
    r: 1.0 + Math.random() * 2.0,
    phase: Math.random() * Math.PI * 2,
    hue: Math.random() > 0.45 ? "125, 211, 252" : "196, 181, 253"
  }));

  const state = {
    levelIndex: 0,
    customLevel: null,
    mode: "ready",
    isPortrait: false,
    sensitivity: 1.0,
    elapsed: 0,
    animTime: 0,
    lives: 3,
    totalPairs: 0,
    matchedPairs: 0,
    activeOxyd: null,
    floors: [],
    items: [],
    stones: [],
    oxydList: [],
    plates: [],
    lasers: [],
    receivers: [],
    gravityCores: [],
    laserBeams: [],
    links: [],
    activeCharges: [],
    inventory: [],
    pickupLocked: false,
    mouseHoldSuppress: false,
    holoTimer: 0,
    marbles: [],
    activeMarbleIdx: 0,
    particles: [],
    pendingMouseX: 0,
    pendingMouseY: 0,
    keys: new Set(),
    pointerLocked: false,
    isTouchDevice: ("ontouchstart" in window) || (navigator.maxTouchPoints > 0),
    activeTouchId: null,
    lastTouchX: 0,
    lastTouchY: 0,
    gyroEnabled: false,
    gyroNeedsCal: false,
    gyroBeta: 0,
    gyroGamma: 0,
    gyroZeroBeta: 0,
    gyroZeroGamma: 0,
    wallSoundCooldown: 0,
    idleTimer: 0
  };

  function createMarble(colorType, sx, sy) {
    return {
      colorType,
      spawnX: sx,
      spawnY: sy,
      x: sx, y: sy, vx: 0, vy: 0,
      rollX: 0, rollY: 0,
      alive: true,
      shieldTimer: 0,
      deathType: null,
      deathTimer: 0,
      deathDur: 0.65,
      spawnFade: 0.5,
      trail: []
    };
  }

  function getActiveMarble() {
    return state.marbles[state.activeMarbleIdx] || state.marbles[0];
  }

  function updateOrientation() {
    const portrait = window.innerHeight > window.innerWidth && window.innerWidth <= 900;
    if (portrait === state.isPortrait && canvas.width === (portrait ? WORLD_H : WORLD_W)) return;
    state.isPortrait = portrait;
    canvas.width = portrait ? WORLD_H : WORLD_W;
    canvas.height = portrait ? WORLD_W : WORLD_H;
    stageWrap.classList.toggle("portrait", portrait);
  }

  window.addEventListener("resize", updateOrientation);
  window.addEventListener("orientationchange", updateOrientation);
  updateOrientation();

  function getPan(wx, wy) {
    if (state.isPortrait) {
      const sx = WORLD_H - wy;
      return (sx / WORLD_H) * 2 - 1;
    }
    return (wx / WORLD_W) * 2 - 1;
  }

  function addScreenDelta(sdx, sdy) {
    if (state.isPortrait) {
      state.pendingMouseX += sdy;
      state.pendingMouseY += -sdx;
    } else {
      state.pendingMouseX += sdx;
      state.pendingMouseY += sdy;
    }
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function formatTime(sec) {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    const s = Math.floor(rem);
    const tenths = Math.floor((rem - s) * 10);
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}.${tenths}`;
  }

  // =========================================================================
  // 4. LEVEL-ÜBERSICHT (MODAL)
  // =========================================================================
  function renderLevelsModal() {
    levelsGrid.innerHTML = "";
    let solvedCount = 0;

    LEVELS.forEach((lvl, idx) => {
      const rec = progress[idx];
      const isSolved = Boolean(rec && rec.solved);
      if (isSolved) solvedCount++;
      const beatPar = isSolved && lvl.par && rec.bestTime <= lvl.par;

      const card = document.createElement("button");
      card.className = "level-card"
        + (!state.customLevel && state.levelIndex === idx ? " current" : "")
        + (isSolved ? " solved" : "");

      card.innerHTML = `
        <div class="lc-top">
          <span>Level ${idx + 1}</span>
          <span class="lc-badges">
            ${isSolved ? '<span title="Gelöst" style="color:#34d399;">✓</span>' : ""}
            ${beatPar ? '<span title="PAR-Zeit geschlagen" style="color:#fbbf24;">★</span>' : ""}
          </span>
        </div>
        <div class="lc-title">${lvl.name}</div>
        <div class="lc-times">
          <span>PAR: ${lvl.par ? formatTime(lvl.par) : "--"}</span>
          <span class="lc-best">${isSolved ? "Best: " + formatTime(rec.bestTime) : "Offen"}</span>
        </div>
      `;

      card.addEventListener("click", () => {
        levelsModal.classList.add("hidden");
        state.customLevel = null;
        btnBackToEditor.classList.add("hidden");
        loadLevel(idx, true);
      });
      levelsGrid.appendChild(card);
    });

    levelsProgress.textContent = `${solvedCount} / ${LEVELS.length} Landschaften gelöst`;
  }

  function openLevelsModal() {
    if (state.mode === "playing") pauseGame();
    renderLevelsModal();
    levelsModal.classList.remove("hidden");
  }

  btnLevels.addEventListener("click", openLevelsModal);
  btnCloseLevels.addEventListener("click", () => levelsModal.classList.add("hidden"));

  // =========================================================================
  // 5. LEVEL-LOADER & DUAL-KUGEL-UMSCHALTER
  // =========================================================================
  function updateSwitchOrbButton() {
    if (state.marbles.length <= 1) {
      btnSwitchOrb.classList.add("hidden");
      return;
    }
    btnSwitchOrb.classList.remove("hidden");
    const active = getActiveMarble();
    const isGold = active.colorType === "gold";
    btnSwitchOrb.textContent = isGold ? "⇄ Gold" : "⇄ Blau";
    btnSwitchOrb.classList.toggle("gold", isGold);
  }

  function switchActiveMarble() {
    if (state.marbles.length < 2 || state.mode !== "playing") return;
    state.activeMarbleIdx = (state.activeMarbleIdx + 1) % state.marbles.length;
    const m = getActiveMarble();
    audio.playShardOpen(getPan(m.x, m.y));
    spawnParticles(m.x, m.y, m.colorType === "gold" ? "#fbbf24" : "#38bdf8", 12, 95, 2.8);
    updateSwitchOrbButton();
  }

  btnSwitchOrb.addEventListener("click", () => {
    audio.init();
    switchActiveMarble();
  });

  function loadLevelData(def, keepOverlay = true) {
    state.floors = [];
    state.items = [];
    state.stones = [];
    state.oxydList = [];
    state.plates = [];
    state.lasers = [];
    state.receivers = [];
    state.gravityCores = [];
    state.laserBeams = [];
    state.links = def.links || [];
    state.activeCharges = [];
    state.inventory = [];
    state.activeOxyd = null;
    state.matchedPairs = 0;
    state.elapsed = 0;
    state.lives = 3;
    state.particles = [];
    state.pendingMouseX = 0;
    state.pendingMouseY = 0;
    state.holoTimer = 0;
    state.idleTimer = 0;
    holoBanner.classList.add("hidden");

    let blueSpawn = { x: 2.5 * TILE, y: 6.5 * TILE };
    let goldSpawn = null;

    for (let y = 0; y < ROWS; y++) {
      const fRow = [];
      const iRow = [];
      const sRow = [];
      const rowStr = (def.grid && def.grid[y]) || "####################";
      for (let x = 0; x < COLS; x++) {
        const ch = rowStr[x] || ".";
        const key = `${x},${y}`;
        let floor = "standard";
        let item = null;
        let stone = null;

        if (ch === "i") floor = "ice";
        else if (ch === "r") floor = "red";
        else if (ch === "~") floor = "water";
        else if (ch === "a") floor = "abyss";
        else if (ch === "P") {
          floor = "plate";
          state.plates.push({ x, y, pressed: false });
        } else if (ch === "#") {
          stone = { type: "wall", x, y };
        } else if (ch === "C") {
          stone = { type: "cracked", x, y };
        } else if (ch === "B") {
          stone = { type: "stasis", x, y, pushCooldown: 0 };
        } else if (ch === "W") {
          stone = { type: "swap", x, y, pushCooldown: 0 };
        } else if (ch === "T") {
          stone = { type: "terminal", x, y, active: false, cooldown: 0 };
        } else if (ch === "D") {
          stone = { type: "gate", x, y, open: false, openAnim: 0 };
        } else if (ch === "b") {
          stone = { type: "phaseGate", x, y, allow: "blue" };
        } else if (ch === "g") {
          stone = { type: "phaseGate", x, y, allow: "gold" };
        } else if (ch === "L") {
          const cfg = (def.lasers && def.lasers[key]) || { dir: "E", active: true };
          stone = { type: "laser", x, y, dir: cfg.dir || "E", active: cfg.active !== false };
          state.lasers.push(stone);
        } else if (ch === "M") {
          const angle = (def.mirrors && def.mirrors[key]) || "/";
          stone = { type: "mirror", x, y, angle, cooldown: 0 };
        } else if (ch === "R") {
          stone = { type: "receiver", x, y, powered: false, poweredThisStep: false };
          state.receivers.push(stone);
        } else if (ch === "G" || ch === "X") {
          stone = { type: "gravity", x, y, polarity: ch === "G" ? 1 : -1 };
          state.gravityCores.push(stone);
        } else if (ch === "O") {
          stone = { type: "oxyd", x, y, pairId: 0, status: "closed", openAnim: 0, cooldown: 0, hintGlow: 0 };
          state.oxydList.push(stone);
        } else if (ch === "1") {
          item = { type: "pulse" };
        } else if (ch === "2") {
          item = { type: "shield" };
        } else if (ch === "3") {
          item = { type: "shard", text: (def.shards && def.shards[key]) || "Keine Daten hinterlegt." };
        } else if (ch === "E") {
          item = { type: "extraLife" };
        } else if (ch === "S") {
          blueSpawn = { x: (x + 0.5) * TILE, y: (y + 0.5) * TILE };
        } else if (ch === "K") {
          goldSpawn = { x: (x + 0.5) * TILE, y: (y + 0.5) * TILE };
        }

        fRow.push(floor);
        iRow.push(item);
        sRow.push(stone);
      }
      state.floors.push(fRow);
      state.items.push(iRow);
      state.stones.push(sRow);
    }

    state.marbles = [createMarble("blue", blueSpawn.x, blueSpawn.y)];
    if (goldSpawn) state.marbles.push(createMarble("gold", goldSpawn.x, goldSpawn.y));
    state.activeMarbleIdx = 0;

    state.totalPairs = Math.floor(state.oxydList.length / 2);
    const pairIds = [];
    for (let i = 0; i < state.totalPairs; i++) {
      pairIds.push(i % OXYD_SYMBOLS.length, i % OXYD_SYMBOLS.length);
    }
    shuffle(pairIds);
    state.oxydList.forEach((st, idx) => {
      st.pairId = pairIds[idx] ?? 0;
    });

    computeLasers(false);
    renderInventoryUI();
    updateSwitchOrbButton();
    updateHUD();

    hudLevelTag.textContent = state.customLevel
      ? `Editor: ${def.name || "Test"}`
      : `Level ${state.levelIndex + 1}`;

    if (keepOverlay) {
      const startHint = state.isTouchDevice
        ? "\nWische über das Spielfeld oder nutze 🧭 zum Kippen."
        : "\nKlicke auf das Spielfeld, um die Maus zu sperren.";
      showOverlay(
        state.customLevel ? (def.name || "Eigene Landschaft") : `Level ${state.levelIndex + 1}: ${def.name}`,
        (def.hint || "Erwecke alle Äther-Steinpaare.") + startHint,
        "Spielen",
        false
      );
      state.mode = "ready";
    } else {
      hideOverlay();
      state.mode = "playing";
    }
  }

  function loadLevel(index, keepOverlay = true) {
    state.levelIndex = index;
    state.customLevel = null;
    loadLevelData(LEVELS[index], keepOverlay);
  }

  function respawnMarble(m) {
    m.x = m.spawnX;
    m.y = m.spawnY;
    m.vx = 0;
    m.vy = 0;
    m.alive = true;
    m.shieldTimer = 0;
    m.deathType = null;
    m.deathTimer = 0;
    m.spawnFade = 0.5;
    m.trail = [];
    state.idleTimer = 0;
  }

  function triggerSignal(fromX, fromY, activeState) {
    for (const link of state.links) {
      if (link.from[0] === fromX && link.from[1] === fromY) {
        const [tx, ty] = link.to;
        const target = state.stones[ty]?.[tx];
        if (!target) continue;

        if (target.type === "gate") {
          const prev = target.open;
          target.open = (link.mode === "toggle") ? !target.open : Boolean(activeState);
          if (target.open !== prev) {
            audio.playGateToggle(target.open, getPan((tx + 0.5) * TILE, (ty + 0.5) * TILE));
            spawnParticles((tx + 0.5) * TILE, (ty + 0.5) * TILE, "#38bdf8", 12, 110, 2.8);
          }
        } else if (target.type === "laser") {
          target.active = (link.mode === "toggle") ? !target.active : Boolean(activeState);
        }
      }
    }
  }

  // =========================================================================
  // 6. LASER-RAYCASTING
  // =========================================================================
  function distToSegmentSq(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-6) return (px - x1) ** 2 + (py - y1) ** 2;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    return (px - cx) ** 2 + (py - cy) ** 2;
  }

  function computeLasers(allowEffects = true) {
    state.laserBeams = [];
    for (const r of state.receivers) r.poweredThisStep = false;

    for (const laser of state.lasers) {
      if (!laser.active) continue;
      let [dx, dy] = DIR_VECS[laser.dir] || [1, 0];
      let cx = laser.x;
      let cy = laser.y;
      let sx = (cx + 0.5) * TILE + dx * (TILE * 0.45);
      let sy = (cy + 0.5) * TILE + dy * (TILE * 0.45);

      for (let step = 0; step < 64; step++) {
        cx += dx;
        cy += dy;
        if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) {
          const ex = (cx - dx + 0.5) * TILE + dx * (TILE * 0.5);
          const ey = (cy - dy + 0.5) * TILE + dy * (TILE * 0.5);
          state.laserBeams.push({ x1: sx, y1: sy, x2: ex, y2: ey });
          break;
        }

        const st = state.stones[cy][cx];
        if (!st || (st.type === "gate" && st.open) || st.type === "phaseGate") continue;

        const midX = (cx + 0.5) * TILE;
        const midY = (cy + 0.5) * TILE;

        if (st.type === "mirror") {
          state.laserBeams.push({ x1: sx, y1: sy, x2: midX, y2: midY });
          if (st.angle === "/") {
            const ndx = -dy;
            const ndy = -dx;
            dx = ndx; dy = ndy;
          } else {
            const ndx = dy;
            const ndy = dx;
            dx = ndx; dy = ndy;
          }
          sx = midX; sy = midY;
          continue;
        }

        if (st.type === "receiver") {
          state.laserBeams.push({ x1: sx, y1: sy, x2: midX, y2: midY });
          st.poweredThisStep = true;
          break;
        }

        const ex = midX - dx * (TILE * 0.48);
        const ey = midY - dy * (TILE * 0.48);
        state.laserBeams.push({ x1: sx, y1: sy, x2: ex, y2: ey });

        if (allowEffects && st.type === "oxyd" && st.status === "closed" && st.cooldown <= 0) {
          handleOxydHit(st);
        }
        break;
      }
    }

    if (!allowEffects) return;

    for (const r of state.receivers) {
      if (r.poweredThisStep !== r.powered) {
        r.powered = r.poweredThisStep;
        audio.playTerminalSwitch(r.powered, getPan((r.x + 0.5) * TILE, (r.y + 0.5) * TILE));
        triggerSignal(r.x, r.y, r.powered);
      }
    }
  }

  // =========================================================================
  // 7. INVENTAR & ITEM-AKTIONEN
  // =========================================================================
  function renderInventoryUI() {
    invSlotsWrap.innerHTML = "";
    for (let i = 0; i < MAX_INVENTORY; i++) {
      const item = state.inventory[i];
      const slot = document.createElement("button");
      slot.className = "inv-slot" + (i === 0 && item ? " active-slot" : "") + (!item ? " empty" : "");
      if (item) {
        const meta = ITEM_META[item.type];
        slot.textContent = meta.icon;
        slot.style.color = meta.color;
        slot.title = `${meta.name} (Tippen zum Auswählen)`;
        slot.addEventListener("click", (e) => {
          e.stopPropagation();
          selectInventoryIndex(i);
        });
      }
      invSlotsWrap.appendChild(slot);
    }
    btnUseItem.disabled = state.inventory.length === 0;
    if (state.inventory.length > 0) {
      const activeMeta = ITEM_META[state.inventory[0].type];
      btnUseItem.textContent = `${activeMeta.icon} Nutzen`;
    } else {
      btnUseItem.textContent = "Aktivieren";
    }
  }

  function selectInventoryIndex(idx) {
    if (idx <= 0 || idx >= state.inventory.length) return;
    const [chosen] = state.inventory.splice(idx, 1);
    state.inventory.unshift(chosen);
    renderInventoryUI();
  }

  function rotateInventory(dir = 1) {
    if (state.inventory.length < 2) return;
    if (dir > 0) state.inventory.push(state.inventory.shift());
    else state.inventory.unshift(state.inventory.pop());
    renderInventoryUI();
  }

  function showHoloMessage(text) {
    holoText.textContent = text;
    holoBanner.classList.remove("hidden");
    state.holoTimer = 6.5;
  }

  function useActiveItem() {
    const m = getActiveMarble();
    if (state.mode !== "playing" || !m || !m.alive) return;
    if (state.inventory.length === 0) return;

    const item = state.inventory[0];
    const pan = getPan(m.x, m.y);

    if (item.type === "shard") {
      audio.playShardOpen(pan);
      showHoloMessage(item.text);
      return;
    }

    if (item.type === "shield") {
      state.inventory.shift();
      m.shieldTimer = SHIELD_DURATION;
      audio.playShieldActivate(pan);
      spawnParticles(m.x, m.y, "#34d399", 18, 120, 3.2);
      renderInventoryUI();
      return;
    }

    if (item.type === "pulse") {
      const tx = Math.max(0, Math.min(COLS - 1, Math.floor(m.x / TILE)));
      const ty = Math.max(0, Math.min(ROWS - 1, Math.floor(m.y / TILE)));
      state.inventory.shift();
      state.activeCharges.push({ tx, ty, timer: 1.4, maxTimer: 1.4 });
      audio.playPulseArm(pan);
      renderInventoryUI();
    }
  }

  function detonateCharge(charge) {
    const cx = (charge.tx + 0.5) * TILE;
    const cy = (charge.ty + 0.5) * TILE;
    const pan = getPan(cx, cy);
    audio.playPulseDetonate(pan);
    spawnParticles(cx, cy, "#fbbf24", 28, 210, 4.2);
    spawnParticles(cx, cy, "#38bdf8", 16, 160, 3.0);

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = charge.tx + dx;
        const ny = charge.ty + dy;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
        const st = state.stones[ny][nx];
        if (st && st.type === "cracked") {
          state.stones[ny][nx] = null;
          spawnParticles((nx + 0.5) * TILE, (ny + 0.5) * TILE, "#c084fc", 18, 150, 3.5);
        }
      }
    }
  }

  // =========================================================================
  // 8. UI, VOLLBILD, GYROSKOP, POINTER LOCK & TOUCH
  // =========================================================================
  function showOverlay(title, text, primaryLabel, showSecondary = false, secondaryLabel = "Nochmal spielen") {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    btnOverlayPrimary.textContent = primaryLabel;
    btnOverlaySecondary.style.display = showSecondary ? "inline-block" : "none";
    btnOverlaySecondary.textContent = secondaryLabel;
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function getFloorAt(x, y) {
    const tx = Math.max(0, Math.min(COLS - 1, Math.floor(x / TILE)));
    const ty = Math.max(0, Math.min(ROWS - 1, Math.floor(y / TILE)));
    return state.floors[ty]?.[tx] || "standard";
  }

  function updateHUD() {
    const m = getActiveMarble();
    hudPairs.textContent = `${state.matchedPairs} / ${state.totalPairs}`;
    hudTime.textContent = formatTime(state.elapsed);

    if (m && m.shieldTimer > 0) {
      shieldPill.classList.remove("hidden");
      hudShield.textContent = `${m.shieldTimer.toFixed(1)}s`;
    } else {
      shieldPill.classList.add("hidden");
    }

    const totalOrbsToShow = Math.max(3, state.lives);
    livesOrbs.innerHTML = "";
    for (let i = 0; i < totalOrbsToShow; i++) {
      const span = document.createElement("span");
      span.className = "life-orb" + (i >= state.lives ? " empty" : "");
      livesOrbs.appendChild(span);
    }

    const fKey = m ? getFloorAt(m.x, m.y) : "standard";
    const fp = FLOOR_PROPS[fKey] || FLOOR_PROPS.standard;
    floorDot.style.background = fp.dot;
    floorLabel.textContent = fp.name;
  }

  function setSensitivity(val) {
    state.sensitivity = Math.max(0.4, Math.min(2.4, Math.round(val * 10) / 10));
    sensSlider.value = state.sensitivity.toFixed(1);
    sensValue.textContent = `${state.sensitivity.toFixed(1)}×`;
  }

  // Vollbild-Modus
  btnFullscreen.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  });

  // Gyroskop / Neigungssteuerung
  function onDeviceOrientation(e) {
    if (e.beta === null || e.gamma === null) return;
    state.gyroBeta = e.beta;
    state.gyroGamma = e.gamma;
    if (state.gyroNeedsCal) {
      state.gyroZeroBeta = e.beta;
      state.gyroZeroGamma = e.gamma;
      state.gyroNeedsCal = false;
    }
  }

  window.addEventListener("deviceorientation", onDeviceOrientation);

  async function toggleGyro() {
    if (!state.gyroEnabled) {
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        try {
          const perm = await DeviceOrientationEvent.requestPermission();
          if (perm !== "granted") {
            showHoloMessage("Sensor-Zugriff wurde nicht erteilt.");
            return;
          }
        } catch (_) {
          showHoloMessage("Neigungssensor auf diesem Gerät nicht verfügbar.");
          return;
        }
      }
      state.gyroEnabled = true;
      state.gyroNeedsCal = true;
      btnGyro.classList.add("active");
      btnGyroCal.classList.remove("hidden");
      showHoloMessage("Neigungssteuerung aktiv. Halte das Gerät bequem – mit ⌖ jederzeit neu kalibrieren.");
    } else {
      state.gyroEnabled = false;
      btnGyro.classList.remove("active");
      btnGyroCal.classList.add("hidden");
      showHoloMessage("Neigungssteuerung deaktiviert.");
    }
  }

  btnGyro.addEventListener("click", () => {
    audio.init();
    toggleGyro();
  });

  btnGyroCal.addEventListener("click", () => {
    state.gyroNeedsCal = true;
    showHoloMessage("Neigung auf aktuelle Haltung kalibriert.");
  });

  function engagePointerLock() {
    if (state.isTouchDevice || state.gyroEnabled || !canvas.requestPointerLock) return;
    try {
      const res = canvas.requestPointerLock({ unadjustedMovement: true });
      if (res && typeof res.catch === "function") {
        res.catch((err) => {
          if (err && err.name === "NotSupportedError") {
            try { canvas.requestPointerLock(); } catch (_) {}
          }
        });
      }
    } catch (_) {
      try { canvas.requestPointerLock(); } catch (__) {}
    }
  }

  function exitPointerLock() {
    if (document.pointerLockElement && document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  function pauseGame() {
    if (state.mode !== "playing") return;
    state.mode = "paused";
    audio.updateSurfaceSound("standard", 0, 0, false);
    exitPointerLock();
    showOverlay(
      "Pausiert",
      "Klicke oder tippe auf Weiter, um fortzufahren, oder starte die Landschaft neu.",
      "Weiterspielen",
      true,
      "Level neustarten"
    );
  }

  function reloadCurrentLevel(startImmediately = true) {
    if (state.customLevel) loadLevelData(state.customLevel, !startImmediately);
    else loadLevel(state.levelIndex, !startImmediately);
  }

  function startOrResume() {
    audio.init();
    if (state.mode === "won") {
      if (state.customLevel) loadLevelData(state.customLevel, false);
      else loadLevel((state.levelIndex + 1) % LEVELS.length, false);
      audio.playNewLevel();
      engagePointerLock();
    } else if (state.mode === "gameover") {
      reloadCurrentLevel(true);
      audio.playNewLevel();
      engagePointerLock();
    } else {
      const isFreshStart = (state.mode === "ready");
      hideOverlay();
      state.mode = "playing";
      if (isFreshStart) audio.playNewLevel();
      engagePointerLock();
    }
  }

  document.addEventListener("pointerlockchange", () => {
    state.pointerLocked = (document.pointerLockElement === canvas);
    if (!state.pointerLocked && state.mode === "playing" && !state.isTouchDevice) {
      pauseGame();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.mode === "playing") pauseGame();
  });

  document.addEventListener("mousemove", (e) => {
    if (state.mode !== "playing" || !state.pointerLocked) return;
    const dx = Math.max(-140, Math.min(140, e.movementX || 0));
    const dy = Math.max(-140, Math.min(140, e.movementY || 0));
    addScreenDelta(dx, dy);
  });

  canvas.addEventListener("mousedown", (e) => {
    if (state.mode !== "playing") return;
    if (!state.pointerLocked && !state.isTouchDevice) {
      audio.init();
      engagePointerLock();
      return;
    }
    state.mouseHoldSuppress = true;
    if (e.button === 0) useActiveItem();
    else if (e.button === 2) rotateInventory(1);
  });

  window.addEventListener("mouseup", () => { state.mouseHoldSuppress = false; });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  window.addEventListener("wheel", (e) => {
    if (state.mode === "playing" && state.pointerLocked) {
      e.preventDefault();
      rotateInventory(e.deltaY > 0 ? 1 : -1);
    }
  }, { passive: false });

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") return;
    state.isTouchDevice = true;
    audio.init();
    if (state.mode !== "playing") return;
    state.activeTouchId = e.pointerId;
    state.lastTouchX = e.clientX;
    state.lastTouchY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "touch" || e.pointerId !== state.activeTouchId) return;
    if (state.mode !== "playing") return;
    const dx = e.clientX - state.lastTouchX;
    const dy = e.clientY - state.lastTouchY;
    state.lastTouchX = e.clientX;
    state.lastTouchY = e.clientY;
    const scale = TOUCH_FORCE_SCALE / MOUSE_FORCE_SCALE;
    addScreenDelta(
      Math.max(-140, Math.min(140, dx * scale)),
      Math.max(-140, Math.min(140, dy * scale))
    );
  });

  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerId === state.activeTouchId) state.activeTouchId = null;
  });
  canvas.addEventListener("pointercancel", (e) => {
    if (e.pointerId === state.activeTouchId) state.activeTouchId = null;
  });

  window.addEventListener("keydown", (e) => {
    if (document.activeElement && document.activeElement.tagName === "INPUT") return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Tab"].includes(e.code)) {
      e.preventDefault();
    }
    state.keys.add(e.code);

    if (e.code === "Space") useActiveItem();
    else if (e.code === "Tab") rotateInventory(1);
    else if (e.key === "q" || e.key === "Q" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
      switchActiveMarble();
    } else if (e.key === "r" || e.key === "R") {
      audio.init();
      reloadCurrentLevel(true);
      audio.playNewLevel();
      engagePointerLock();
    } else if (e.key === "+" || e.key === "=") {
      setSensitivity(state.sensitivity + 0.1);
    } else if (e.key === "-") {
      setSensitivity(state.sensitivity - 0.1);
    } else if (e.key === "Escape" && state.mode === "playing") {
      pauseGame();
    }
  });

  window.addEventListener("keyup", (e) => { state.keys.delete(e.code); });

  btnOverlayPrimary.addEventListener("click", startOrResume);
  btnOverlaySecondary.addEventListener("click", () => {
    audio.init();
    reloadCurrentLevel(true);
    audio.playNewLevel();
    engagePointerLock();
  });
  btnPause.addEventListener("click", () => {
    if (state.mode === "playing") pauseGame();
    else if (state.mode === "paused" || state.mode === "ready") startOrResume();
  });
  btnRestart.addEventListener("click", () => {
    audio.init();
    reloadCurrentLevel(true);
    audio.playNewLevel();
    engagePointerLock();
  });
  btnAudio.addEventListener("click", () => {
    audio.init();
    audio.muted = !audio.muted;
    btnAudio.textContent = audio.muted ? "🔇" : "🔊";
    if (audio.muted) {
      audio.stopJingles();
      audio.updateSurfaceSound("standard", 0, 0, false);
    }
  });
  sensSlider.addEventListener("input", (e) => setSensitivity(parseFloat(e.target.value)));

  btnPickupLock.addEventListener("click", () => {
    state.pickupLocked = !state.pickupLocked;
    btnPickupLock.textContent = state.pickupLocked ? "🔒" : "🔓";
    btnPickupLock.classList.toggle("locked", state.pickupLocked);
  });

  btnUseItem.addEventListener("click", () => {
    audio.init();
    useActiveItem();
  });

  // =========================================================================
  // 9. PARTIKEL & SPIEL-EREIGNISSE
  // =========================================================================
  function spawnParticles(x, y, color, count, speed = 130, size = 3.5, style = "dot") {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.85) * speed;
      const maxLife = style === "bubble" ? (0.55 + Math.random() * 0.45) : (0.35 + Math.random() * 0.35);
      state.particles.push({
        x: x + (style === "bubble" ? (Math.random() - 0.5) * 18 : 0),
        y: y + (style === "bubble" ? (Math.random() - 0.5) * 18 : 0),
        vx: Math.cos(ang) * spd * (style === "bubble" ? 0.35 : 1),
        vy: Math.sin(ang) * spd * (style === "bubble" ? 0.35 : 1) - (style === "bubble" ? 24 : 0),
        life: maxLife,
        maxLife,
        color,
        size: size * (0.6 + Math.random() * 0.8),
        style
      });
    }
  }

  function handleOxydHit(stone) {
    if (stone.status === "matched" || stone.cooldown > 0) return;
    if (stone === state.activeOxyd) return;

    stone.cooldown = 0.25;
    const cx = (stone.x + 0.5) * TILE;
    const cy = (stone.y + 0.5) * TILE;
    const pan = getPan(cx, cy);
    const sym = OXYD_SYMBOLS[stone.pairId];

    if (!state.activeOxyd) {
      stone.status = "open";
      state.activeOxyd = stone;
      audio.playOxydOpen(sym.freq, pan);
      spawnParticles(cx, cy, sym.color, 10, 110, 3);
    } else if (state.activeOxyd.pairId === stone.pairId) {
      const partner = state.activeOxyd;
      stone.status = "matched";
      partner.status = "matched";
      state.activeOxyd = null;
      state.matchedPairs++;

      audio.playOxydMatch(pan);
      spawnParticles(cx, cy, sym.color, 20, 170, 4);
      spawnParticles((partner.x + 0.5) * TILE, (partner.y + 0.5) * TILE, sym.color, 20, 170, 4);

      if (state.matchedPairs >= state.totalPairs && state.totalPairs > 0) {
        state.mode = "won";
        audio.updateSurfaceSound("standard", 0, 0, false);
        audio.playLevelWin();
        exitPointerLock();

        let extraMsg = "";
        if (!state.customLevel) {
          const prev = progress[state.levelIndex];
          const isNewBest = !prev || state.elapsed < prev.bestTime;
          const par = LEVELS[state.levelIndex].par;
          progress[state.levelIndex] = {
            solved: true,
            bestTime: isNewBest ? state.elapsed : prev.bestTime
          };
          saveProgress(progress);
          if (isNewBest) extraMsg += "\n✨ Neue persönliche Bestzeit!";
          if (par && state.elapsed <= par) extraMsg += `\n★ PAR-Zeit (${formatTime(par)}) geschlagen!`;
        }

        const isLast = !state.customLevel && state.levelIndex === LEVELS.length - 1;
        showOverlay(
          "Landschaft vollendet!",
          `Alle ${state.totalPairs} Äther-Paare in ${formatTime(state.elapsed)} erweckt.${extraMsg}`,
          state.customLevel ? "Nochmal testen" : (isLast ? "Zurück zu Level 1" : "Nächstes Level starten"),
          true,
          "Zeit verbessern"
        );
      }
    } else {
      state.activeOxyd.status = "closed";
      stone.status = "open";
      state.activeOxyd = stone;
      audio.playOxydMismatch(pan);
      spawnParticles(cx, cy, sym.color, 8, 90, 2.5);
    }
  }

  function tryPushStasisBlock(stone, pushDx, pushDy) {
    if (stone.pushCooldown > 0) return;
    const nx = stone.x + pushDx;
    const ny = stone.y + pushDy;
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return;
    if (state.stones[ny][nx] !== null) return;

    const targetFloor = state.floors[ny][nx];
    const pan = getPan((nx + 0.5) * TILE, (ny + 0.5) * TILE);

    state.stones[stone.y][stone.x] = null;

    if (targetFloor === "water" || targetFloor === "abyss") {
      state.floors[ny][nx] = "bridge";
      audio.playBlockPush(pan, true);
      spawnParticles((nx + 0.5) * TILE, (ny + 0.5) * TILE, "#22d3ee", 20, 140, 3.5);
    } else {
      stone.x = nx;
      stone.y = ny;
      stone.pushCooldown = 0.22;
      state.stones[ny][nx] = stone;
      audio.playBlockPush(pan, false);
      spawnParticles((nx + 0.5) * TILE, (ny + 0.5) * TILE, "#7dd3fc", 8, 80, 2.4);
    }
  }

  function trySwapBlock(stone, pushDx, pushDy) {
    if (stone.pushCooldown > 0) return;
    const nx = stone.x + pushDx;
    const ny = stone.y + pushDy;
    if (nx <= 0 || nx >= COLS - 1 || ny <= 0 || ny >= ROWS - 1) return;

    const target = state.stones[ny][nx];
    if (target && ["oxyd", "laser", "receiver", "terminal", "gate", "phaseGate", "gravity"].includes(target.type)) {
      return;
    }

    const ox = stone.x;
    const oy = stone.y;
    state.stones[oy][ox] = target;
    if (target) { target.x = ox; target.y = oy; }
    stone.x = nx;
    stone.y = ny;
    stone.pushCooldown = 0.26;
    state.stones[ny][nx] = stone;

    const pan = getPan((nx + 0.5) * TILE, (ny + 0.5) * TILE);
    audio.playSwap(pan);
    spawnParticles((nx + 0.5) * TILE, (ny + 0.5) * TILE, "#c084fc", 14, 120, 3);
    spawnParticles((ox + 0.5) * TILE, (oy + 0.5) * TILE, "#38bdf8", 10, 90, 2.5);
  }

  // =========================================================================
  // 10. 120-HZ-PHYSIK-SCHLEIFE (INKL. DUAL-KUGEL & GYROSKOP)
  // =========================================================================
  function physicsStep(dt, stepMouseX, stepMouseY) {
    state.animTime += dt;
    if (state.wallSoundCooldown > 0) state.wallSoundCooldown -= dt;

    for (const d of ambientDust) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.x < 0) d.x += WORLD_W;
      if (d.x > WORLD_W) d.x -= WORLD_W;
      if (d.y < 0) d.y += WORLD_H;
      if (d.y > WORLD_H) d.y -= WORLD_H;
    }

    if (state.holoTimer > 0) {
      state.holoTimer -= dt;
      if (state.holoTimer <= 0) holoBanner.classList.add("hidden");
    }

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const st = state.stones[y][x];
        if (!st) continue;
        if (st.cooldown > 0) st.cooldown -= dt;
        if (st.pushCooldown > 0) st.pushCooldown -= dt;
        if (st.type === "oxyd") {
          const target = (st.status === "closed") ? 0 : 1;
          st.openAnim += (target - st.openAnim) * Math.min(1, dt * 16);
        } else if (st.type === "gate") {
          const target = st.open ? 1 : 0;
          st.openAnim += (target - st.openAnim) * Math.min(1, dt * 12);
        }
      }
    }

    for (let i = state.activeCharges.length - 1; i >= 0; i--) {
      const c = state.activeCharges[i];
      c.timer -= dt;
      if (c.timer <= 0) {
        detonateCharge(c);
        state.activeCharges.splice(i, 1);
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-3.0 * dt);
      p.vy *= Math.exp(-3.0 * dt);
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }

    for (const m of state.marbles) {
      for (let i = m.trail.length - 1; i >= 0; i--) {
        m.trail[i].life -= dt;
        if (m.trail[i].life <= 0) m.trail.splice(i, 1);
      }
    }

    if (state.mode !== "playing") return;
    state.elapsed += dt;

    let skx = 0, sky = 0;
    if (state.keys.has("ArrowLeft") || state.keys.has("KeyA")) skx -= 1;
    if (state.keys.has("ArrowRight") || state.keys.has("KeyD")) skx += 1;
    if (state.keys.has("ArrowUp") || state.keys.has("KeyW")) sky -= 1;
    if (state.keys.has("ArrowDown") || state.keys.has("KeyS")) sky += 1;

    // Alle Kugeln simulieren
    state.marbles.forEach((m, idx) => {
      const isActive = (idx === state.activeMarbleIdx);

      if (!m.alive) {
        m.deathTimer -= dt;
        m.vx *= Math.exp(-6.5 * dt);
        m.vy *= Math.exp(-6.5 * dt);
        m.x += m.vx * dt;
        m.y += m.vy * dt;

        if (m.deathType === "water" && Math.random() < dt * 12) {
          spawnParticles(m.x, m.y, "#a5f3fc", 1, 25, 3.2, "bubble");
        }

        if (m.deathTimer <= 0) {
          if (state.lives > 0) {
            state.lives--;
            respawnMarble(m);
          } else {
            state.mode = "gameover";
            audio.updateSurfaceSound("standard", 0, 0, false);
            audio.playGameOver();
            exitPointerLock();
            showOverlay(
              "Der Äther verblasst",
              "Alle Äther-Kugeln wurden verbraucht. Starte die Landschaft für einen neuen Versuch.",
              "Level neustarten",
              false
            );
          }
        }
        return;
      }

      if (m.spawnFade > 0) m.spawnFade = Math.max(0, m.spawnFade - dt);
      if (m.shieldTimer > 0) m.shieldTimer = Math.max(0, m.shieldTimer - dt);

      const floorType = getFloorAt(m.x, m.y);
      const fp = (m.shieldTimer > 0 && (floorType === "water" || floorType === "abyss"))
        ? FLOOR_PROPS.standard
        : (FLOOR_PROPS[floorType] || FLOOR_PROPS.standard);

      if (isActive) {
        const impulseFactor = MOUSE_FORCE_SCALE * state.sensitivity * fp.control;
        m.vx += stepMouseX * impulseFactor;
        m.vy += stepMouseY * impulseFactor;

        if (skx !== 0 || sky !== 0) {
          const kx = state.isPortrait ? sky : skx;
          const ky = state.isPortrait ? -skx : sky;
          const invLen = 1 / Math.hypot(kx, ky);
          m.vx += kx * invLen * KEY_ACCEL * fp.control * dt;
          m.vy += ky * invLen * KEY_ACCEL * fp.control * dt;
        }

        // Neigungssteuerung (Gyroskop)
        if (state.gyroEnabled && !state.gyroNeedsCal) {
          let gx = state.gyroGamma - state.gyroZeroGamma; // Links/Rechts im Hochformat
          let gy = state.gyroBeta - state.gyroZeroBeta;   // Vor/Zurück im Hochformat
          if (Math.abs(gx) < 2.2) gx = 0;
          if (Math.abs(gy) < 2.2) gy = 0;
          gx = Math.max(-30, Math.min(30, gx));
          gy = Math.max(-30, Math.min(30, gy));

          const worldGx = state.isPortrait ? gy : gx;
          const worldGy = state.isPortrait ? -gx : gy;
          m.vx += worldGx * GYRO_ACCEL * state.sensitivity * fp.control * dt;
          m.vy += worldGy * GYRO_ACCEL * state.sensitivity * fp.control * dt;
        }
      }

      for (const core of state.gravityCores) {
        const cx = (core.x + 0.5) * TILE;
        const cy = (core.y + 0.5) * TILE;
        const dx = cx - m.x;
        const dy = cy - m.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 18 && dist < GRAVITY_RADIUS) {
          const falloff = 1 - dist / GRAVITY_RADIUS;
          const accel = GRAVITY_STRENGTH * falloff * core.polarity;
          m.vx += (dx / dist) * accel * dt;
          m.vy += (dy / dist) * accel * dt;
        }
      }

      const damp = Math.exp(-fp.friction * dt);
      m.vx *= damp;
      m.vy *= damp;

      const spd = Math.hypot(m.vx, m.vy);
      if (spd > MAX_SPEED) {
        m.vx = (m.vx / spd) * MAX_SPEED;
        m.vy = (m.vy / spd) * MAX_SPEED;
      }

      const moveX = m.vx * dt;
      const moveY = m.vy * dt;
      m.x += moveX;
      m.y += moveY;
      m.rollX += moveX / MARBLE_RADIUS;
      m.rollY += moveY / MARBLE_RADIUS;

      if (spd > 28) {
        const last = m.trail[m.trail.length - 1];
        if (!last || Math.hypot(m.x - last.x, m.y - last.y) > 5.5) {
          m.trail.push({ x: m.x, y: m.y, life: 0.34, maxLife: 0.34 });
          if (m.trail.length > 26) m.trail.shift();
        }
      }

      // Zwei-Pass-Kollision gegen feste Kacheln
      const minTx = Math.max(0, Math.floor((m.x - MARBLE_RADIUS) / TILE) - 1);
      const maxTx = Math.min(COLS - 1, Math.floor((m.x + MARBLE_RADIUS) / TILE) + 1);
      const minTy = Math.max(0, Math.floor((m.y - MARBLE_RADIUS) / TILE) - 1);
      const maxTy = Math.min(ROWS - 1, Math.floor((m.y + MARBLE_RADIUS) / TILE) + 1);

      let maxImpact = 0;
      const hitEvents = [];

      for (let pass = 0; pass < 2; pass++) {
        for (let ty = minTy; ty <= maxTy; ty++) {
          for (let tx = minTx; tx <= maxTx; tx++) {
            const stone = state.stones[ty][tx];
            if (!stone) continue;
            if (stone.type === "gate" && stone.open) continue;
            if (stone.type === "phaseGate" && stone.allow === m.colorType) continue;

            const left = tx * TILE;
            const right = left + TILE;
            const top = ty * TILE;
            const bottom = top + TILE;

            const insideX = m.x >= left && m.x <= right;
            const insideY = m.y >= top && m.y <= bottom;
            const isCardinal = insideX || insideY;

            if (pass === 0 && !isCardinal) continue;
            if (pass === 1 && isCardinal) continue;

            const cx = Math.max(left, Math.min(m.x, right));
            const cy = Math.max(top, Math.min(m.y, bottom));
            const dx = m.x - cx;
            const dy = m.y - cy;
            const distSq = dx * dx + dy * dy;

            if (distSq < MARBLE_RADIUS * MARBLE_RADIUS) {
              let nx, ny, pen;
              if (distSq > 1e-8) {
                const dist = Math.sqrt(distSq);
                nx = dx / dist;
                ny = dy / dist;
                pen = MARBLE_RADIUS - dist;
              } else {
                const dLeft = Math.abs(m.x - left);
                const dRight = Math.abs(right - m.x);
                const dTop = Math.abs(m.y - top);
                const dBottom = Math.abs(bottom - m.y);
                const minD = Math.min(dLeft, dRight, dTop, dBottom);
                if (minD === dLeft) { nx = -1; ny = 0; pen = MARBLE_RADIUS + dLeft; }
                else if (minD === dRight) { nx = 1; ny = 0; pen = MARBLE_RADIUS + dRight; }
                else if (minD === dTop) { nx = 0; ny = -1; pen = MARBLE_RADIUS + dTop; }
                else { nx = 0; ny = 1; pen = MARBLE_RADIUS + dBottom; }
              }

              m.x += nx * pen;
              m.y += ny * pen;

              const vn = m.vx * nx + m.vy * ny;
              if (vn < 0) {
                const impact = -vn;
                m.vx -= (1 + RESTITUTION) * vn * nx;
                m.vy -= (1 + RESTITUTION) * vn * ny;
                if (impact > maxImpact) maxImpact = impact;
                hitEvents.push({ stone, nx, ny, impact });
              }
            }
          }
        }
      }

      if (maxImpact > 45 && state.wallSoundCooldown <= 0) {
        audio.playWallHit(maxImpact, getPan(m.x, m.y));
        state.wallSoundCooldown = 0.055;
        if (maxImpact > 260) spawnParticles(m.x, m.y, m.colorType === "gold" ? "#fde68a" : "#7dd3fc", 6, 95, 2.2);
      }

      for (const ev of hitEvents) {
        const st = ev.stone;
        if (st.type === "oxyd") {
          handleOxydHit(st);
        } else if (st.type === "terminal" && st.cooldown <= 0) {
          st.cooldown = 0.35;
          st.active = !st.active;
          audio.playTerminalSwitch(st.active, getPan((st.x + 0.5) * TILE, (st.y + 0.5) * TILE));
          triggerSignal(st.x, st.y, st.active);
        } else if (st.type === "mirror" && st.cooldown <= 0) {
          st.cooldown = 0.35;
          st.angle = st.angle === "/" ? "\\" : "/";
          audio.playMirrorRotate(getPan((st.x + 0.5) * TILE, (st.y + 0.5) * TILE));
          spawnParticles((st.x + 0.5) * TILE, (st.y + 0.5) * TILE, "#e0f2fe", 10, 100, 2.5);
        } else if ((st.type === "stasis" || st.type === "swap") && ev.impact >= PUSH_SPEED_THRESHOLD) {
          let pdx = 0, pdy = 0;
          if (Math.abs(ev.nx) > Math.abs(ev.ny)) pdx = ev.nx > 0 ? -1 : 1;
          else pdy = ev.ny > 0 ? -1 : 1;
          if (st.type === "stasis") tryPushStasisBlock(st, pdx, pdy);
          else trySwapBlock(st, pdx, pdy);
        }
      }

      // Items & versteckte Extra-Kugeln
      const mTx = Math.max(0, Math.min(COLS - 1, Math.floor(m.x / TILE)));
      const mTy = Math.max(0, Math.min(ROWS - 1, Math.floor(m.y / TILE)));
      const floorItem = state.items[mTy][mTx];
      if (floorItem) {
        if (floorItem.type === "extraLife") {
          state.items[mTy][mTx] = null;
          if (state.lives < MAX_LIVES) state.lives++;
          audio.playExtraLife(getPan(m.x, m.y));
          spawnParticles((mTx + 0.5) * TILE, (mTy + 0.5) * TILE, "#7dd3fc", 22, 160, 3.6);
          showHoloMessage("Versteckte Äther-Kugel gefunden! (+1 Reserve-Kugel)");
        } else if (!state.pickupLocked && !state.mouseHoldSuppress && state.inventory.length < MAX_INVENTORY) {
          state.inventory.push(floorItem);
          state.items[mTy][mTx] = null;
          audio.playPickup(getPan(m.x, m.y));
          spawnParticles((mTx + 0.5) * TILE, (mTy + 0.5) * TILE, ITEM_META[floorItem.type].color, 12, 110, 2.8);
          renderInventoryUI();
        }
      }
    });

    // Kugel-gegen-Kugel-Kollision im Dual-Modus
    if (state.marbles.length === 2) {
      const a = state.marbles[0];
      const b = state.marbles[1];
      if (a.alive && b.alive) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = MARBLE_RADIUS * 2;
        if (dist > 1e-5 && dist < minDist) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (minDist - dist) * 0.5;
          a.x -= nx * overlap; a.y -= ny * overlap;
          b.x += nx * overlap; b.y += ny * overlap;

          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const vn = rvx * nx + rvy * ny;
          if (vn < 0) {
            const j = -(1 + 0.85) * vn * 0.5;
            a.vx -= j * nx; a.vy -= j * ny;
            b.vx += j * nx; b.vy += j * ny;
            if (-vn > 40 && state.wallSoundCooldown <= 0) {
              audio.playWallHit(-vn, getPan((a.x + b.x) * 0.5, (a.y + b.y) * 0.5));
              state.wallSoundCooldown = 0.06;
            }
          }
        }
      }
    }

    // Stillstand erkennen (aktive Kugel)
    const activeM = getActiveMarble();
    const activeSpd = activeM ? Math.hypot(activeM.vx, activeM.vy) : 0;
    const isMoving = activeSpd > 18 || Math.abs(stepMouseX) > 0.5 || Math.abs(stepMouseY) > 0.5 || skx !== 0 || sky !== 0;
    if (isMoving) state.idleTimer = 0;
    else state.idleTimer += dt;

    for (const ox of state.oxydList) ox.hintGlow = 0;
    if (state.idleTimer > 3.0) {
      const closed = state.oxydList.filter((o) => o.status === "closed");
      if (closed.length > 0) {
        const hintT = state.idleTimer - 3.0;
        const slotDur = 0.55;
        const activeIdx = Math.floor(hintT / slotDur) % closed.length;
        const phase = (hintT % slotDur) / slotDur;
        closed[activeIdx].hintGlow = Math.sin(phase * Math.PI);
      }
    }

    // Laser & Sensor-Platten auswerten
    computeLasers(true);

    for (const plate of state.plates) {
      let onMarble = false;
      for (const m of state.marbles) {
        if (!m.alive) continue;
        const mTx = Math.max(0, Math.min(COLS - 1, Math.floor(m.x / TILE)));
        const mTy = Math.max(0, Math.min(ROWS - 1, Math.floor(m.y / TILE)));
        if (mTx === plate.x && mTy === plate.y) onMarble = true;
      }
      const st = state.stones[plate.y][plate.x];
      const onBlock = (st && (st.type === "stasis" || st.type === "swap"));
      const nowPressed = onMarble || onBlock;
      if (nowPressed !== plate.pressed) {
        plate.pressed = nowPressed;
        audio.playTerminalSwitch(nowPressed, getPan((plate.x + 0.5) * TILE, (plate.y + 0.5) * TILE));
        triggerSignal(plate.x, plate.y, nowPressed);
      }
    }

    // Gefahren (Laser, Wasser, Abgrund) für alle Kugeln prüfen
    for (const m of state.marbles) {
      if (!m.alive || m.shieldTimer > 0) continue;

      if (state.laserBeams.length > 0) {
        const hitRadSq = (MARBLE_RADIUS * 0.72) ** 2;
        for (const seg of state.laserBeams) {
          if (distToSegmentSq(m.x, m.y, seg.x1, seg.y1, seg.x2, seg.y2) < hitRadSq) {
            m.alive = false;
            m.deathType = "laser";
            m.deathDur = LASER_DEATH_DUR;
            m.deathTimer = LASER_DEATH_DUR;
            const pan = getPan(m.x, m.y);
            audio.updateSurfaceSound("standard", 0, pan, false);
            audio.playLaserZap(pan);
            spawnParticles(m.x, m.y, "#fb7185", 22, 180, 3.5);
            break;
          }
        }
      }

      if (!m.alive) continue;
      const newFloor = getFloorAt(m.x, m.y);
      if (newFloor === "water" || newFloor === "abyss") {
        m.alive = false;
        m.deathType = newFloor;
        m.deathDur = newFloor === "water" ? WATER_DEATH_DUR : ABYSS_DEATH_DUR;
        m.deathTimer = m.deathDur;
        const pan = getPan(m.x, m.y);
        audio.updateSurfaceSound("standard", 0, pan, false);
        audio.playHazard(newFloor, pan);
        if (newFloor === "water") spawnParticles(m.x, m.y, "#a5f3fc", 10, 55, 3.8, "bubble");
        else spawnParticles(m.x, m.y, "#818cf8", 16, 80, 3);
      }
    }
  }

  // =========================================================================
  // 11. CANVAS-2D-RENDERER
  // =========================================================================
  function drawFloorTile(tx, ty, type) {
    const x = tx * TILE;
    const y = ty * TILE;

    if (type === "standard" || type === "plate") {
      const alt = (tx + ty) % 2 === 0;
      const grad = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
      grad.addColorStop(0, alt ? "#1e2242" : "#1a1f3c");
      grad.addColorStop(1, alt ? "#182845" : "#15233d");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = "rgba(129, 140, 248, 0.11)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);

      if (type === "plate") {
        const plate = state.plates.find((p) => p.x === tx && p.y === ty);
        const pressed = plate && plate.pressed;
        ctx.fillStyle = pressed ? "rgba(52, 211, 153, 0.28)" : "rgba(167, 139, 250, 0.16)";
        ctx.fillRect(x + 6, y + 6, TILE - 12, TILE - 12);
        ctx.strokeStyle = pressed ? "#34d399" : "#a78bfa";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 7, y + 7, TILE - 14, TILE - 14);
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 7, 0, Math.PI * 2);
        ctx.stroke();
      } else if (alt) {
        ctx.fillStyle = "rgba(125, 211, 252, 0.08)";
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === "bridge") {
      ctx.fillStyle = "#082f49";
      ctx.fillRect(x, y, TILE, TILE);
      const grad = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
      grad.addColorStop(0, "rgba(34, 211, 238, 0.55)");
      grad.addColorStop(1, "rgba(56, 189, 248, 0.35)");
      ctx.fillStyle = grad;
      ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
      ctx.strokeStyle = "#67e8f9";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + TILE / 2);
      ctx.lineTo(x + TILE - 8, y + TILE / 2);
      ctx.moveTo(x + TILE / 2, y + 8);
      ctx.lineTo(x + TILE / 2, y + TILE - 8);
      ctx.stroke();
    } else if (type === "ice") {
      const grad = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
      grad.addColorStop(0, "#a5f3fc");
      grad.addColorStop(0.5, "#38bdf8");
      grad.addColorStop(1, "#6366f1");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + TILE - 10);
      ctx.lineTo(x + TILE - 10, y + 8);
      ctx.moveTo(x + 19, y + TILE - 6);
      ctx.lineTo(x + TILE - 6, y + 19);
      ctx.stroke();
      ctx.strokeStyle = "rgba(224, 242, 254, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    } else if (type === "red") {
      const grad = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
      grad.addColorStop(0, "#6d1d4a");
      grad.addColorStop(1, "#4c1338");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "rgba(244, 114, 182, 0.32)";
      for (let py = 10; py < TILE; py += 14) {
        for (let px = 10; px < TILE; px += 14) {
          ctx.beginPath();
          ctx.arc(x + px, y + py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.strokeStyle = "rgba(244, 114, 182, 0.28)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    } else if (type === "water") {
      const wave = Math.sin(state.animTime * 2.6 + tx * 0.9 + ty * 0.7) * 0.5 + 0.5;
      const grad = ctx.createLinearGradient(x, y, x, y + TILE);
      grad.addColorStop(0, "#0e7490");
      grad.addColorStop(0.55, "#0c4a6e");
      grad.addColorStop(1, "#082f49");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = `rgba(103, 232, 249, ${0.22 + wave * 0.25})`;
      ctx.lineWidth = 2;
      const wy = y + 14 + wave * 7;
      ctx.beginPath();
      ctx.moveTo(x + 6, wy);
      ctx.quadraticCurveTo(x + TILE * 0.5, wy - 4.5, x + TILE - 6, wy);
      ctx.stroke();
      ctx.fillStyle = "rgba(2, 6, 23, 0.35)";
      if (ty > 0 && state.floors[ty - 1][tx] !== "water") ctx.fillRect(x, y, TILE, 5);
      if (tx > 0 && state.floors[ty][tx - 1] !== "water") ctx.fillRect(x, y, 5, TILE);
    } else if (type === "abyss") {
      ctx.fillStyle = "#040611";
      ctx.fillRect(x, y, TILE, TILE);
      const seed = (tx * 73 + ty * 137) % 19;
      if (seed < 7) {
        const twinkle = 0.25 + 0.35 * (Math.sin(state.animTime * 2 + seed) * 0.5 + 0.5);
        ctx.fillStyle = `rgba(196, 181, 253, ${twinkle})`;
        ctx.beginPath();
        ctx.arc(x + 10 + (seed * 5) % 28, y + 10 + (seed * 9) % 28, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawGravityFields() {
    for (const core of state.gravityCores) {
      const cx = (core.x + 0.5) * TILE;
      const cy = (core.y + 0.5) * TILE;
      const attract = core.polarity > 0;
      const col = attract ? "167, 139, 250" : "251, 146, 60";
      for (let i = 0; i < 2; i++) {
        let p = (state.animTime * 0.55 + i * 0.5) % 1;
        if (attract) p = 1 - p;
        const r = 20 + p * (GRAVITY_RADIUS * 0.72);
        const alpha = Math.sin(p * Math.PI) * 0.28;
        ctx.strokeStyle = `rgba(${col}, ${alpha})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawItem(tx, ty, item) {
    const cx = (tx + 0.5) * TILE;
    const cy = (ty + 0.5) * TILE;
    const bob = Math.sin(state.animTime * 3.5 + tx + ty) * 2.5;

    ctx.save();
    ctx.translate(cx, cy + bob);
    if (state.isPortrait) ctx.rotate(-Math.PI / 2);

    if (item.type === "extraLife") {
      const pulse = 0.85 + Math.sin(state.animTime * 5) * 0.15;
      const aura = ctx.createRadialGradient(0, 0, 3, 0, 0, 18);
      aura.addColorStop(0, `rgba(125, 211, 252, ${0.65 * pulse})`);
      aura.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      const orb = ctx.createRadialGradient(-3, -3, 1, 0, 0, 10.5);
      orb.addColorStop(0, "#ffffff");
      orb.addColorStop(0.3, "#7dd3fc");
      orb.addColorStop(0.75, "#2563eb");
      orb.addColorStop(1, "#312e81");
      ctx.fillStyle = orb;
      ctx.beginPath();
      ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(224, 242, 254, 0.85)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 13.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const meta = ITEM_META[item.type];
    ctx.shadowColor = meta.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = "rgba(10, 16, 36, 0.85)";
    ctx.strokeStyle = meta.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.font = "15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(meta.icon, 0, 1);
    ctx.restore();
  }

  function drawSymbol(cx, cy, shape, color, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (shape === "circle") ctx.arc(0, 0, 10, 0, Math.PI * 2);
    else if (shape === "diamond") { ctx.moveTo(0,-11); ctx.lineTo(11,0); ctx.lineTo(0,11); ctx.lineTo(-11,0); ctx.closePath(); }
    else if (shape === "triangle") { ctx.moveTo(0,-11); ctx.lineTo(11,9); ctx.lineTo(-11,9); ctx.closePath(); }
    else if (shape === "square") ctx.rect(-9, -9, 18, 18);
    else if (shape === "star") {
      for (let i = 0; i < 10; i++) {
        const rad = (i % 2 === 0) ? 11.5 : 5;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        if (i === 0) ctx.moveTo(Math.cos(a)*rad, Math.sin(a)*rad);
        else ctx.lineTo(Math.cos(a)*rad, Math.sin(a)*rad);
      }
      ctx.closePath();
    } else {
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        if (i === 0) ctx.moveTo(Math.cos(a)*10.5, Math.sin(a)*10.5);
        else ctx.lineTo(Math.cos(a)*10.5, Math.sin(a)*10.5);
      }
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawStone(stone) {
    const x = stone.x * TILE;
    const y = stone.y * TILE;
    const cx = x + TILE / 2;
    const cy = y + TILE / 2;

    if (stone.type === "gate") {
      ctx.fillStyle = "#334155";
      ctx.fillRect(x + 2, y + 2, 8, TILE - 4);
      ctx.fillRect(x + TILE - 10, y + 2, 8, TILE - 4);
      if (stone.openAnim < 0.95) {
        const alpha = (1 - stone.openAnim) * (0.75 + Math.sin(state.animTime * 10) * 0.15);
        ctx.save();
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.45})`;
        ctx.fillRect(x + 10, y + 4, TILE - 20, TILE - 8);
        ctx.strokeStyle = `rgba(125, 211, 252, ${alpha})`;
        ctx.lineWidth = 2.5;
        for (let ly = y + 12; ly < y + TILE - 6; ly += 12) {
          ctx.beginPath();
          ctx.moveTo(x + 10, ly);
          ctx.lineTo(x + TILE - 10, ly);
          ctx.stroke();
        }
        ctx.restore();
      }
      return;
    }

    if (stone.type === "phaseGate") {
      // Farbgebundenes Phasen-Tor (nur für Blau oder nur für Gold passierbar)
      const isGold = stone.allow === "gold";
      const col = isGold ? "251, 191, 36" : "56, 189, 248";
      const pulse = 0.65 + Math.sin(state.animTime * 5) * 0.2;
      ctx.save();
      ctx.fillStyle = `rgba(${col}, 0.2)`;
      ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
      ctx.strokeStyle = `rgba(${col}, ${pulse})`;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(x + 5, y + 5, TILE - 10, TILE - 10);
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(${col}, ${pulse})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.fillStyle = "rgba(3, 5, 16, 0.45)";
    ctx.fillRect(x + 5, y + 6, TILE, TILE);

    if (stone.type === "wall" || stone.type === "cracked") {
      const grad = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
      grad.addColorStop(0, stone.type === "cracked" ? "#4c3568" : "#3b3568");
      grad.addColorStop(1, stone.type === "cracked" ? "#2e1f45" : "#22254a");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "rgba(167, 139, 250, 0.42)";
      ctx.fillRect(x, y, TILE, 3.5);
      ctx.fillRect(x, y, 3.5, TILE);
      ctx.fillStyle = "#111329";
      ctx.fillRect(x, y + TILE - 4, TILE, 4);
      ctx.fillRect(x + TILE - 4, y, 4, TILE);
      ctx.fillStyle = "rgba(24, 28, 58, 0.72)";
      ctx.fillRect(x + 6, y + 6, TILE - 12, TILE - 12);

      if (stone.type === "cracked") {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 10);
        ctx.lineTo(x + 24, y + 22);
        ctx.lineTo(x + 18, y + 36);
        ctx.moveTo(x + 24, y + 22);
        ctx.lineTo(x + 38, y + 16);
        ctx.moveTo(x + 24, y + 22);
        ctx.lineTo(x + 34, y + 38);
        ctx.stroke();
      } else {
        ctx.strokeStyle = "rgba(125, 211, 252, 0.16)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 6.5, y + 6.5, TILE - 13, TILE - 13);
      }
    } else if (stone.type === "stasis") {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.4;
      ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
      ctx.fillStyle = "rgba(56, 189, 248, 0.28)";
      ctx.fillRect(x + 11, y + 11, TILE - 22, TILE - 22);
      ctx.fillStyle = "#e0f2fe";
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (stone.type === "swap") {
      ctx.fillStyle = "#24193b";
      ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 2.4;
      ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
      ctx.strokeStyle = "#e9d5ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 4);
      ctx.lineTo(cx + 10, cy - 4);
      ctx.lineTo(cx + 5, cy - 9);
      ctx.moveTo(cx + 10, cy + 4);
      ctx.lineTo(cx - 10, cy + 4);
      ctx.lineTo(cx - 5, cy + 9);
      ctx.stroke();
    } else if (stone.type === "terminal") {
      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.strokeStyle = stone.active ? "#34d399" : "#fb7185";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
      ctx.fillStyle = stone.active ? "#34d399" : "#fb7185";
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();
    } else if (stone.type === "laser") {
      ctx.fillStyle = "#1e1b33";
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 2.4;
      ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
      const [dx, dy] = DIR_VECS[stone.dir] || [1, 0];
      ctx.fillStyle = stone.active ? "#fb7185" : "#475569";
      ctx.beginPath();
      ctx.arc(cx + dx * 10, cy + dy * 10, 6.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (stone.type === "mirror") {
      ctx.fillStyle = "#162038";
      ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
      ctx.strokeStyle = "rgba(125, 211, 252, 0.45)";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);

      ctx.save();
      ctx.strokeStyle = "#e0f2fe";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      if (stone.angle === "/") {
        ctx.moveTo(x + 11, y + TILE - 11);
        ctx.lineTo(x + TILE - 11, y + 11);
      } else {
        ctx.moveTo(x + 11, y + 11);
        ctx.lineTo(x + TILE - 11, y + TILE - 11);
      }
      ctx.stroke();
      ctx.restore();
    } else if (stone.type === "receiver") {
      ctx.fillStyle = "#181e36";
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.strokeStyle = stone.powered ? "#34d399" : "#64748b";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
      ctx.fillStyle = stone.powered ? "#34d399" : "#334155";
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#e0f2fe";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.stroke();
    } else if (stone.type === "gravity") {
      const attract = stone.polarity > 0;
      ctx.fillStyle = attract ? "#1e163d" : "#361e14";
      ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
      ctx.strokeStyle = attract ? "#a78bfa" : "#fb923c";
      ctx.lineWidth = 2.2;
      ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
      ctx.fillStyle = attract ? "#c084fc" : "#fb923c";
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx - 4.5, cy);
      ctx.lineTo(cx + 4.5, cy);
      if (attract) { ctx.moveTo(cx, cy - 4.5); ctx.lineTo(cx, cy + 4.5); }
      ctx.stroke();
    } else if (stone.type === "oxyd") {
      const sym = OXYD_SYMBOLS[stone.pairId];
      ctx.fillStyle = "#191e3a";
      ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
      ctx.strokeStyle = stone.status === "matched" ? sym.color : "rgba(167, 139, 250, 0.48)";
      ctx.lineWidth = 2.4;
      ctx.strokeRect(x + 2.5, y + 2.5, TILE - 5, TILE - 5);

      ctx.fillStyle = "#a5b4fc";
      [[7,7],[TILE-7,7],[7,TILE-7],[TILE-7,TILE-7]].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, 1.7, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = "#080b1a";
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fill();

      if (stone.openAnim > 0.04) {
        const pulse = stone.status === "open" ? 0.8 + Math.sin(state.animTime * 8) * 0.2 : 1.0;
        ctx.save();
        ctx.shadowColor = sym.color;
        ctx.shadowBlur = stone.status === "matched" ? 18 : 13 * pulse;
        ctx.fillStyle = sym.glow;
        ctx.beginPath();
        ctx.arc(cx, cy, 14.5 * stone.openAnim, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        drawSymbol(cx, cy, sym.shape, sym.color, stone.openAnim);
      } else {
        const hg = stone.hintGlow || 0;
        if (hg > 0.02) {
          ctx.save();
          ctx.shadowColor = "#7dd3fc";
          ctx.shadowBlur = 16 * hg;
          ctx.strokeStyle = `rgba(125, 211, 252, ${0.85 * hg})`;
          ctx.lineWidth = 2.6;
          ctx.strokeRect(x + 2.5, y + 2.5, TILE - 5, TILE - 5);
          ctx.fillStyle = `rgba(125, 211, 252, ${0.28 * hg})`;
          ctx.beginPath();
          ctx.arc(cx, cy, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.strokeStyle = `rgba(165, 180, 252, ${0.35 + hg * 0.65})`;
        ctx.lineWidth = 1.5 + hg * 0.8;
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(125, 211, 252, ${0.3 + hg * 0.7})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5 + hg * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawLaserBeams() {
    if (state.laserBeams.length === 0) return;
    const flicker = 0.85 + Math.sin(state.animTime * 28) * 0.15;
    ctx.save();
    ctx.lineCap = "round";
    for (const seg of state.laserBeams) {
      ctx.strokeStyle = `rgba(244, 63, 94, ${0.42 * flicker})`;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();
      ctx.strokeStyle = "#ffe4e6";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawActiveCharges() {
    for (const c of state.activeCharges) {
      const cx = (c.tx + 0.5) * TILE;
      const cy = (c.ty + 0.5) * TILE;
      const p = 1 - c.timer / c.maxTimer;
      const blink = Math.sin(state.animTime * (12 + p * 28)) * 0.5 + 0.5;
      ctx.save();
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.4 + blink * 0.6})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 10 + p * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawAmbientDust() {
    for (const d of ambientDust) {
      const a = 0.12 + 0.16 * (Math.sin(state.animTime * 1.6 + d.phase) * 0.5 + 0.5);
      ctx.fillStyle = `rgba(${d.hue}, ${a})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSingleMarble(m, isActive) {
    const isGold = m.colorType === "gold";

    // Zarte Leuchtspur
    for (const pt of m.trail) {
      const t = Math.max(0, pt.life / pt.maxLife);
      const r = 3 + t * 10;
      const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r);
      g.addColorStop(0, isGold ? `rgba(253, 224, 71, ${t * 0.28})` : `rgba(125, 211, 252, ${t * 0.28})`);
      g.addColorStop(1, isGold ? "rgba(251, 191, 36, 0)" : "rgba(56, 189, 248, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    let scale = 1, alpha = 1, blurPx = 0;
    if (!m.alive) {
      const t = Math.max(0, m.deathTimer / m.deathDur);
      if (m.deathType === "water") {
        scale = 0.25 + 0.75 * t;
        alpha = Math.pow(t, 1.35);
        blurPx = (1 - t) * 9.5;
      } else if (m.deathType === "laser") {
        scale = 0.3 + 0.9 * t;
        alpha = t;
        blurPx = (1 - t) * 6;
      } else {
        scale = 0.12 + 0.88 * t;
        alpha = t;
      }
    } else if (m.spawnFade > 0) {
      const t = 1 - m.spawnFade / 0.5;
      scale = 0.65 + 0.35 * t;
      alpha = 0.3 + 0.7 * t;
    }

    const r = MARBLE_RADIUS * scale;
    const pulse = 0.88 + Math.sin(state.animTime * 4.2) * 0.12;

    ctx.save();
    ctx.globalAlpha = alpha;
    if (blurPx > 0.1) ctx.filter = `blur(${blurPx.toFixed(1)}px)`;

    if (m.alive) {
      ctx.fillStyle = "rgba(4, 8, 28, 0.42)";
      ctx.beginPath();
      ctx.ellipse(m.x + 3.5, m.y + 5.5, r * 0.96, r * 0.86, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Aktiv-Ring im Dual-Modus
    if (state.marbles.length > 1 && isActive && m.alive) {
      ctx.strokeStyle = isGold ? "rgba(253, 224, 71, 0.75)" : "rgba(125, 211, 252, 0.75)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(m.x, m.y, r + 4.5 + Math.sin(state.animTime * 6) * 1.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    const aura = ctx.createRadialGradient(m.x, m.y, r * 0.5, m.x, m.y, r * 1.85);
    if (isGold) {
      aura.addColorStop(0, `rgba(251, 191, 36, ${0.42 * pulse})`);
      aura.addColorStop(0.55, `rgba(245, 158, 11, ${0.18 * pulse})`);
      aura.addColorStop(1, "rgba(251, 191, 36, 0)");
    } else {
      aura.addColorStop(0, `rgba(56, 189, 248, ${0.42 * pulse})`);
      aura.addColorStop(0.55, `rgba(99, 102, 241, ${0.18 * pulse})`);
      aura.addColorStop(1, "rgba(56, 189, 248, 0)");
    }
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(m.x, m.y, r * 1.85, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createRadialGradient(m.x - r * 0.3, m.y - r * 0.3, r * 0.08, m.x, m.y, r);
    if (isGold) {
      grad.addColorStop(0, "#fffbeb");
      grad.addColorStop(0.24, "#fde047");
      grad.addColorStop(0.58, "#d97706");
      grad.addColorStop(0.88, "#78350f");
      grad.addColorStop(1, "#451a03");
    } else {
      grad.addColorStop(0, "#f0f9ff");
      grad.addColorStop(0.24, "#7dd3fc");
      grad.addColorStop(0.58, "#2563eb");
      grad.addColorStop(0.88, "#312e81");
      grad.addColorStop(1, "#1e1b4b");
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
    ctx.fill();

    const rx = Math.sin(m.rollX) * r * 0.38;
    const ry = Math.sin(m.rollY) * r * 0.38;
    const wisp = ctx.createRadialGradient(m.x + rx, m.y + ry, 0, m.x + rx, m.y + ry, r * 0.45);
    wisp.addColorStop(0, isGold ? "rgba(254, 249, 195, 0.72)" : "rgba(224, 242, 254, 0.72)");
    wisp.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = wisp;
    ctx.beginPath();
    ctx.arc(m.x + rx, m.y + ry, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isGold ? "rgba(254, 240, 138, 0.75)" : "rgba(186, 230, 253, 0.72)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(m.x, m.y, r - 0.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.ellipse(m.x - r * 0.34, m.y - r * 0.34, r * 0.23, r * 0.14, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    if (m.alive && m.shieldTimer > 0) {
      const warnBlink = m.shieldTimer > 3.0 || (Math.floor(state.animTime * 10) % 2 === 0);
      if (warnBlink) {
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = state.animTime * 1.5 + (i * Math.PI) / 3;
          const px = m.x + Math.cos(a) * (r + 5);
          const py = m.y + Math.sin(a) * (r + 5);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    ctx.restore();

    // Wasserwellen beim Versinken
    if (!m.alive && m.deathType === "water") {
      const progress = 1 - Math.max(0, m.deathTimer / m.deathDur);
      for (let i = 0; i < 3; i++) {
        const p = progress - i * 0.16;
        if (p <= 0 || p >= 1) continue;
        ctx.save();
        ctx.strokeStyle = `rgba(165, 243, 252, ${(1 - p) * 0.65})`;
        ctx.lineWidth = 2.2 * (1 - p * 0.5);
        ctx.beginPath();
        ctx.arc(m.x, m.y, 8 + p * 34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (state.isPortrait) {
      ctx.translate(WORLD_H, 0);
      ctx.rotate(Math.PI / 2);
    }

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        drawFloorTile(x, y, state.floors[y][x]);
      }
    }

    drawGravityFields();

    for (const m of state.marbles) {
      ctx.strokeStyle = m.colorType === "gold" ? "rgba(251, 191, 36, 0.28)" : "rgba(125, 211, 252, 0.28)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(m.spawnX, m.spawnY, 13, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const it = state.items[y][x];
        if (it) drawItem(x, y, it);
      }
    }

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const st = state.stones[y][x];
        if (st) drawStone(st);
      }
    }

    drawLaserBeams();
    drawActiveCharges();

    state.marbles.forEach((m, idx) => drawSingleMarble(m, idx === state.activeMarbleIdx));

    for (const p of state.particles) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = a;
      if (p.style === "bubble") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawAmbientDust();
    ctx.restore();
  }

  // =========================================================================
  // 12. EDITOR-SCHNITTSTELLE, GETEILTE LINKS & PWA SERVICE WORKER
  // =========================================================================
  window.ETHER.pauseGame = pauseGame;
  window.ETHER.playCustomLevel = (levelObj, fromEditor = false) => {
    state.customLevel = levelObj;
    btnBackToEditor.classList.toggle("hidden", !fromEditor);
    loadLevelData(levelObj, false);
    audio.init();
    audio.playNewLevel();
    engagePointerLock();
  };

  function checkSharedLevelHash() {
    if (!window.location.hash.startsWith("#level=")) return false;
    try {
      const b64 = window.location.hash.slice(7);
      const json = decodeURIComponent(escape(atob(b64)));
      const levelObj = JSON.parse(json);
      if (levelObj && Array.isArray(levelObj.grid) && levelObj.grid.length === ROWS) {
        state.customLevel = levelObj;
        loadLevelData(levelObj, true);
        return true;
      }
    } catch (_) {}
    return false;
  }

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  // =========================================================================
  // 13. HAUPTSCHLEIFE
  // =========================================================================
  let lastTime = performance.now();
  let accumulator = 0;

  function loop(now) {
    const frameDt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    accumulator += frameDt;
    const substeps = Math.floor(accumulator / FIXED_DT);

    if (substeps > 0) {
      const stepMx = state.pendingMouseX / substeps;
      const stepMy = state.pendingMouseY / substeps;
      state.pendingMouseX = 0;
      state.pendingMouseY = 0;

      for (let i = 0; i < substeps; i++) {
        physicsStep(FIXED_DT, stepMx, stepMy);
      }
      accumulator -= substeps * FIXED_DT;
    }

    const m = getActiveMarble();
    if (m) {
      const spd = Math.hypot(m.vx, m.vy);
      audio.updateSurfaceSound(getFloorAt(m.x, m.y), spd, getPan(m.x, m.y), state.mode === "playing" && m.alive);
    }

    render();
    updateHUD();
    requestAnimationFrame(loop);
  }

  if (!checkSharedLevelHash()) {
    loadLevel(0, true);
  }
  requestAnimationFrame(loop);
})();