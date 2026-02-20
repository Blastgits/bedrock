const TILE = 32;
const WORLD_W = 72;
const WORLD_H = 140;
const BEDROCK_START = 126;
const VIEW_W = 960;
const VIEW_H = 540;
const GRAVITY = 1700;
const MOVE_SPEED = 240;
const JUMP_SPEED = 660;
const MINE_REACH = TILE * 8;

const TILE_TYPES = {
  air: 0,
  dirt: 1,
  stone: 2,
  bedrock: 3,
  grass: 4,
  coal: 5,
  iron: 6,
  lava: 7,
};

const tileNames = {
  0: "air",
  1: "dirt",
  2: "stone",
  3: "bedrock",
  4: "grass",
  5: "coal_ore",
  6: "iron_ore",
  7: "lava",
};

const hardnessByTile = {
  [TILE_TYPES.dirt]: 0.42,
  [TILE_TYPES.grass]: 0.45,
  [TILE_TYPES.stone]: 1.2,
  [TILE_TYPES.coal]: 1.35,
  [TILE_TYPES.iron]: 1.7,
};

const resourceByTile = {
  [TILE_TYPES.dirt]: "dirt",
  [TILE_TYPES.grass]: "dirt",
  [TILE_TYPES.stone]: "stone",
  [TILE_TYPES.coal]: "coal",
  [TILE_TYPES.iron]: "iron",
};

const TOOL_DATA = {
  hand: {
    label: "hand",
    miningPower: 1,
  },
  stone: {
    label: "stone pickaxe",
    miningPower: 1.75,
  },
  iron: {
    label: "iron pickaxe",
    miningPower: 2.45,
  },
};

const CRAFT_RECIPES = {
  stone: {
    label: "stone pickaxe",
    cost: {
      dirt: 4,
      stone: 1,
    },
  },
  iron: {
    label: "iron pickaxe",
    cost: {
      stone: 3,
      coal: 1,
      iron: 1,
    },
  },
};

const colors = {
  skyTop: "#92d6ff",
  skyBottom: "#3a89c8",
  dirt: "#8b5a2b",
  stone: "#7f8c8d",
  bedrock: "#2f3136",
  grass: "#4ade80",
  coal: "#525b61",
  iron: "#d1a67f",
  lavaBright: "#fb923c",
  lavaDark: "#dc2626",
  player: "#fbbf24",
  accent: "#1f2937",
  mining: "#fef3c7",
};

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("start-btn");
const depthReadout = document.getElementById("depth-readout");
const biomeReadout = document.getElementById("biome-readout");
const healthReadout = document.getElementById("health-readout");
const modeReadout = document.getElementById("mode-readout");
const toolReadout = document.getElementById("tool-readout");
const inventoryReadout = document.getElementById("inventory-readout");

const state = {
  mode: "title",
  keys: new Set(),
  world: [],
  cameraY: 0,
  time: 0,
  mouse: {
    x: VIEW_W * 0.5,
    y: VIEW_H * 0.5,
    down: false,
  },
  milestone: {
    depth: 0,
    text: "",
    timer: 0,
  },
  toast: {
    text: "",
    timer: 0,
  },
  showCraftPanel: false,
  tool: "hand",
  mine: {
    tx: null,
    ty: null,
    progress: 0,
    required: 0,
  },
  inventory: {
    dirt: 0,
    stone: 0,
    coal: 0,
    iron: 0,
  },
  player: {
    x: TILE * 6,
    y: TILE * 2,
    vx: 0,
    vy: 0,
    w: 22,
    h: 30,
    onGround: false,
    health: 100,
    maxHealth: 100,
    damageCooldown: 0,
    hurtFlash: 0,
  },
};

function randSeeded(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return n - Math.floor(n);
}

function getBiomeLabel(depth) {
  if (depth < 16) return "surface";
  if (depth < 46) return "dirtline";
  if (depth < 88) return "stone caves";
  if (depth < 122) return "deep slate";
  return "bedrock frontier";
}

function buildBaseWorld(world) {
  for (let y = 0; y < WORLD_H; y++) {
    world[y] = new Array(WORLD_W).fill(TILE_TYPES.air);
    for (let x = 0; x < WORLD_W; x++) {
      if (y < 3) {
        world[y][x] = TILE_TYPES.air;
        continue;
      }

      if (y === 3) {
        world[y][x] = TILE_TYPES.grass;
        continue;
      }

      if (y >= BEDROCK_START) {
        world[y][x] = TILE_TYPES.bedrock;
        continue;
      }

      const r = randSeeded(x, y);
      if (y < 42) {
        world[y][x] = r > 0.78 ? TILE_TYPES.stone : TILE_TYPES.dirt;
      } else if (y < 86) {
        if (r > 0.94) world[y][x] = TILE_TYPES.coal;
        else world[y][x] = r > 0.34 ? TILE_TYPES.stone : TILE_TYPES.dirt;
      } else {
        if (r > 0.95) world[y][x] = TILE_TYPES.iron;
        else if (r > 0.88) world[y][x] = TILE_TYPES.coal;
        else world[y][x] = TILE_TYPES.stone;
      }
    }
  }
}

function carveDescentShaft(world) {
  let center = 6;
  for (let y = 2; y < BEDROCK_START; y++) {
    const driftRoll = randSeeded(center + y, y);
    if (y % 6 === 0) {
      if (driftRoll > 0.62) center += 1;
      if (driftRoll < 0.36) center -= 1;
      center = Math.max(4, Math.min(WORLD_W - 5, center));
    }

    const shaftWidth = y < 44 ? 3 : 2;
    for (let x = center - shaftWidth; x <= center + shaftWidth; x++) {
      world[y][x] = TILE_TYPES.air;
      if (y + 1 < BEDROCK_START && randSeeded(x, y + 1) > 0.72) {
        world[y + 1][x] = TILE_TYPES.air;
      }
    }

    if (y % 24 === 0) {
      for (let cy = y; cy < y + 3; cy++) {
        for (let cx = center - 7; cx <= center + 7; cx++) {
          if (cx < 2 || cx > WORLD_W - 3 || cy >= BEDROCK_START) continue;
          world[cy][cx] = TILE_TYPES.air;
        }
      }
    }

    if (y % 12 === 0) {
      const ledgeDir = randSeeded(y, center) > 0.5 ? 1 : -1;
      const ledgeY = Math.min(BEDROCK_START - 1, y + 1);
      const ledgeX = center + ledgeDir * (shaftWidth + 1);
      if (ledgeX > 1 && ledgeX < WORLD_W - 2) {
        world[ledgeY][ledgeX] = y > 70 ? TILE_TYPES.stone : TILE_TYPES.dirt;
      }
    }
  }

  for (let y = 0; y <= 8; y++) {
    world[y][4] = TILE_TYPES.air;
    world[y][5] = TILE_TYPES.air;
    world[y][6] = TILE_TYPES.air;
    world[y][7] = TILE_TYPES.air;
  }
}

function addLavaHazards(world) {
  world[18][8] = TILE_TYPES.lava;
  world[18][9] = TILE_TYPES.lava;
  world[17][8] = TILE_TYPES.air;
  world[17][9] = TILE_TYPES.air;

  for (let y = 76; y < BEDROCK_START - 1; y++) {
    for (let x = 3; x < WORLD_W - 3; x++) {
      if (world[y][x] !== TILE_TYPES.air) continue;
      const below = world[y + 1][x];
      if (![TILE_TYPES.dirt, TILE_TYPES.stone, TILE_TYPES.coal, TILE_TYPES.iron].includes(below)) continue;

      const roll = randSeeded(x * 3.1, y * 2.7);
      if (roll > 0.992) {
        world[y + 1][x] = TILE_TYPES.lava;
        if (roll > 0.996 && world[y + 1][x + 1] !== TILE_TYPES.air) {
          world[y + 1][x + 1] = TILE_TYPES.lava;
        }
      }
    }
  }
}

function buildWorld() {
  const world = new Array(WORLD_H);
  buildBaseWorld(world);
  carveDescentShaft(world);
  addLavaHazards(world);
  state.world = world;
}

function tileAt(tx, ty) {
  if (tx < 0 || tx >= WORLD_W) return TILE_TYPES.bedrock;
  if (ty < 0) return TILE_TYPES.air;
  if (ty >= WORLD_H) return TILE_TYPES.bedrock;
  return state.world[ty][tx];
}

function setTile(tx, ty, value) {
  if (tx < 0 || tx >= WORLD_W) return;
  if (ty < 0 || ty >= WORLD_H) return;
  if (ty >= BEDROCK_START) return;
  state.world[ty][tx] = value;
}

function isSolidTile(value) {
  return value !== TILE_TYPES.air && value !== TILE_TYPES.lava;
}

function isBreakable(value) {
  return value !== TILE_TYPES.air && value !== TILE_TYPES.bedrock && value !== TILE_TYPES.lava;
}

function getDepthMeters() {
  return Math.max(0, Math.floor((state.player.y - TILE * 2) / TILE));
}

function getPlayerCenter() {
  return {
    x: state.player.x + state.player.w * 0.5,
    y: state.player.y + state.player.h * 0.5,
  };
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const rawX = (event.clientX - rect.left) * scaleX;
  const rawY = (event.clientY - rect.top) * scaleY;
  return {
    x: Math.max(0, Math.min(canvas.width, rawX)),
    y: Math.max(0, Math.min(canvas.height, rawY)),
  };
}

function getTargetedTile() {
  const worldX = state.mouse.x;
  const worldY = state.mouse.y + state.cameraY;
  const playerCenter = getPlayerCenter();
  const tx = Math.floor(worldX / TILE);
  const ty = Math.floor(worldY / TILE);
  const candidates = [];

  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const candidateX = tx + ox;
      const candidateY = ty + oy;
      const tile = tileAt(candidateX, candidateY);
      if (!isBreakable(tile)) continue;

      const blockCenterX = candidateX * TILE + TILE * 0.5;
      const blockCenterY = candidateY * TILE + TILE * 0.5;
      const playerDist = Math.hypot(blockCenterX - playerCenter.x, blockCenterY - playerCenter.y);
      if (playerDist > MINE_REACH) continue;

      const cursorDist = Math.hypot(blockCenterX - worldX, blockCenterY - worldY);
      candidates.push({
        tx: candidateX,
        ty: candidateY,
        tile,
        required: hardnessByTile[tile] || 1,
        cursorDist,
      });
    }
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => a.cursorDist - b.cursorDist);
  return candidates[0];
}

function resetMiningState() {
  state.mine.tx = null;
  state.mine.ty = null;
  state.mine.progress = 0;
  state.mine.required = 0;
}

function inventorySummary() {
  const parts = [];
  if (state.inventory.dirt) parts.push(`dirt ${state.inventory.dirt}`);
  if (state.inventory.stone) parts.push(`stone ${state.inventory.stone}`);
  if (state.inventory.coal) parts.push(`coal ${state.inventory.coal}`);
  if (state.inventory.iron) parts.push(`iron ${state.inventory.iron}`);
  return parts.length ? parts.join(" | ") : "empty";
}

function grantDrop(tile) {
  const key = resourceByTile[tile];
  if (!key) return;
  state.inventory[key] += 1;
}

function addToast(text, duration = 2.2) {
  state.toast.text = text;
  state.toast.timer = duration;
}

function resetPlayer() {
  state.player.x = TILE * 5.5;
  state.player.y = TILE * 1.5;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.onGround = false;
  state.player.health = 100;
  state.player.damageCooldown = 0;
  state.player.hurtFlash = 0;

  state.cameraY = 0;
  state.milestone.depth = 0;
  state.milestone.text = "";
  state.milestone.timer = 0;
  state.toast.text = "";
  state.toast.timer = 0;
  state.inventory.dirt = 0;
  state.inventory.stone = 0;
  state.inventory.coal = 0;
  state.inventory.iron = 0;
  state.tool = "hand";
  state.showCraftPanel = false;
  resetMiningState();
}

function startRound() {
  buildWorld();
  resetPlayer();
  state.mode = "playing";
  startBtn.textContent = "Restart";
}

function overlapSolidRect(x, y, w, h) {
  const minTx = Math.floor(x / TILE);
  const maxTx = Math.floor((x + w - 1) / TILE);
  const minTy = Math.floor(y / TILE);
  const maxTy = Math.floor((y + h - 1) / TILE);

  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (isSolidTile(tileAt(tx, ty))) {
        return true;
      }
    }
  }
  return false;
}

function overlapTileType(x, y, w, h, tileType) {
  const minTx = Math.floor(x / TILE);
  const maxTx = Math.floor((x + w - 1) / TILE);
  const minTy = Math.floor(y / TILE);
  const maxTy = Math.floor((y + h - 1) / TILE);

  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (tileAt(tx, ty) === tileType) return true;
    }
  }
  return false;
}

function applyInput() {
  let axis = 0;
  if (state.keys.has("arrowleft") || state.keys.has("a")) axis -= 1;
  if (state.keys.has("arrowright") || state.keys.has("d")) axis += 1;
  state.player.vx = axis * MOVE_SPEED;

  const wantsJump = state.keys.has(" ") || state.keys.has("arrowup") || state.keys.has("w");
  if (wantsJump && state.player.onGround) {
    state.player.vy = -JUMP_SPEED;
    state.player.onGround = false;
  }
}

function applyDamage(amount, reason) {
  if (state.mode !== "playing") return;
  if (state.player.damageCooldown > 0) return;

  state.player.health = Math.max(0, state.player.health - amount);
  state.player.damageCooldown = 0.45;
  state.player.hurtFlash = 0.3;

  if (reason === "lava") {
    addToast(`Lava burn -${amount}`);
  }
  if (reason === "fall") {
    addToast(`Hard landing -${amount}`);
  }

  if (state.player.health <= 0) {
    state.mode = "lost";
    state.mouse.down = false;
    addToast("You were defeated");
  }
}

function integratePhysics(dt) {
  state.player.vy += GRAVITY * dt;
  if (state.player.vy > 980) state.player.vy = 980;

  state.player.x += state.player.vx * dt;
  if (overlapSolidRect(state.player.x, state.player.y, state.player.w, state.player.h)) {
    const dir = Math.sign(state.player.vx) || 1;
    while (overlapSolidRect(state.player.x, state.player.y, state.player.w, state.player.h)) {
      state.player.x -= dir;
    }
    state.player.vx = 0;
  }

  const preStepVy = state.player.vy;
  state.player.y += state.player.vy * dt;
  if (overlapSolidRect(state.player.x, state.player.y, state.player.w, state.player.h)) {
    const dir = Math.sign(state.player.vy) || 1;
    while (overlapSolidRect(state.player.x, state.player.y, state.player.w, state.player.h)) {
      state.player.y -= dir;
    }
    if (state.player.vy > 0) {
      state.player.onGround = true;
      if (preStepVy > 760) {
        const damage = Math.max(6, Math.floor((preStepVy - 760) / 32));
        applyDamage(damage, "fall");
      }
    }
    state.player.vy = 0;
  } else {
    state.player.onGround = false;
  }
}

function getToolMeta() {
  return TOOL_DATA[state.tool] || TOOL_DATA.hand;
}

function updateMining(dt) {
  if (state.mode !== "playing") {
    resetMiningState();
    return;
  }

  if (!state.mouse.down) {
    resetMiningState();
    return;
  }

  const target = getTargetedTile();
  if (!target) {
    resetMiningState();
    return;
  }

  if (state.mine.tx !== target.tx || state.mine.ty !== target.ty) {
    state.mine.tx = target.tx;
    state.mine.ty = target.ty;
    state.mine.progress = 0;
    state.mine.required = target.required;
  }

  state.mine.progress += dt * getToolMeta().miningPower;
  if (state.mine.progress >= state.mine.required) {
    setTile(target.tx, target.ty, TILE_TYPES.air);
    grantDrop(target.tile);
    resetMiningState();
  }
}

function updateHazards() {
  if (state.mode !== "playing") return;

  const touchingLava = overlapTileType(
    state.player.x,
    state.player.y,
    state.player.w,
    state.player.h,
    TILE_TYPES.lava,
  );
  if (touchingLava) {
    applyDamage(8, "lava");
  }
}

function checkGoal() {
  if (state.mode !== "playing") return;

  const footY = state.player.y + state.player.h + 1;
  const tx = Math.floor((state.player.x + state.player.w / 2) / TILE);
  const ty = Math.floor(footY / TILE);
  if (tileAt(tx, ty) === TILE_TYPES.bedrock) {
    state.mode = "won";
  }
}

function updateMilestones(dt) {
  if (state.mode !== "playing") return;

  const depth = getDepthMeters();
  const clearedChunk = Math.floor(depth / 25) * 25;
  if (clearedChunk > state.milestone.depth && clearedChunk > 0) {
    state.milestone.depth = clearedChunk;
    state.milestone.text = `${clearedChunk}m reached - ${getBiomeLabel(depth)}`;
    state.milestone.timer = 2.6;
  }

  if (state.milestone.timer > 0) {
    state.milestone.timer = Math.max(0, state.milestone.timer - dt);
  }
}

function updateToast(dt) {
  if (state.toast.timer > 0) {
    state.toast.timer = Math.max(0, state.toast.timer - dt);
  }
}

function updateDamageTimers(dt) {
  if (state.player.damageCooldown > 0) {
    state.player.damageCooldown = Math.max(0, state.player.damageCooldown - dt);
  }
  if (state.player.hurtFlash > 0) {
    state.player.hurtFlash = Math.max(0, state.player.hurtFlash - dt);
  }
}

function canAfford(cost) {
  const pairs = Object.entries(cost);
  for (const [resource, amount] of pairs) {
    if ((state.inventory[resource] || 0) < amount) {
      return false;
    }
  }
  return true;
}

function consumeCost(cost) {
  const pairs = Object.entries(cost);
  for (const [resource, amount] of pairs) {
    state.inventory[resource] -= amount;
  }
}

function recipeCostString(cost) {
  return Object.entries(cost)
    .map(([resource, amount]) => `${amount} ${resource}`)
    .join(" + ");
}

function tryCraft(kind) {
  if (state.mode !== "playing") return;

  if (!CRAFT_RECIPES[kind]) return;
  if (kind === "stone" && (state.tool === "stone" || state.tool === "iron")) {
    addToast("Stone pickaxe already crafted");
    return;
  }
  if (kind === "iron" && state.tool === "iron") {
    addToast("Iron pickaxe already crafted");
    return;
  }
  if (kind === "iron" && state.tool === "hand") {
    addToast("Craft stone pickaxe first");
    return;
  }

  const recipe = CRAFT_RECIPES[kind];
  if (!canAfford(recipe.cost)) {
    addToast(`Need ${recipeCostString(recipe.cost)}`);
    return;
  }

  consumeCost(recipe.cost);
  state.tool = kind;
  addToast(`Crafted ${recipe.label}`);
}

function update(dt) {
  state.time += dt;
  updateToast(dt);
  updateDamageTimers(dt);

  if (state.mode !== "playing") {
    updateMilestones(dt);
    return;
  }

  applyInput();
  updateMining(dt);
  integratePhysics(dt);
  updateHazards();
  checkGoal();
  updateMilestones(dt);

  const followY = state.player.y - VIEW_H * 0.55;
  const maxCamera = WORLD_H * TILE - VIEW_H;
  state.cameraY = Math.max(0, Math.min(maxCamera, followY));
}

function fillBackground() {
  const depthFactor = Math.min(1, state.cameraY / (WORLD_H * TILE));
  const topAlpha = 0.05 + depthFactor * 0.38;
  const bottomAlpha = 0.12 + depthFactor * 0.58;

  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, colors.skyTop);
  grad.addColorStop(1, colors.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.fillStyle = `rgba(12, 26, 42, ${topAlpha.toFixed(3)})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H * 0.6);

  ctx.fillStyle = `rgba(4, 8, 12, ${bottomAlpha.toFixed(3)})`;
  ctx.fillRect(0, VIEW_H * 0.3, VIEW_W, VIEW_H * 0.7);
}

function drawDepthGrid() {
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let marker = 25; marker < BEDROCK_START; marker += 25) {
    const y = marker * TILE - state.cameraY;
    if (y < -10 || y > VIEW_H + 10) continue;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_W, y);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "10px 'Press Start 2P'";
    ctx.fillText(`${marker}m`, 8, y - 6);
  }
}

function drawTile(px, py, tile) {
  if (tile === TILE_TYPES.dirt) {
    ctx.fillStyle = colors.dirt;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(px + 6, py + 7, 4, 4);
    return;
  }

  if (tile === TILE_TYPES.stone) {
    ctx.fillStyle = colors.stone;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(px + 3, py + 11, 5, 5);
    return;
  }

  if (tile === TILE_TYPES.grass) {
    ctx.fillStyle = colors.dirt;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = colors.grass;
    ctx.fillRect(px, py, TILE, 8);
    return;
  }

  if (tile === TILE_TYPES.bedrock) {
    ctx.fillStyle = colors.bedrock;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(px + 4, py + 4, TILE - 8, 3);
    ctx.fillRect(px + 7, py + 13, TILE - 12, 2);
    return;
  }

  if (tile === TILE_TYPES.coal) {
    ctx.fillStyle = colors.stone;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = colors.coal;
    ctx.fillRect(px + 4, py + 5, 7, 7);
    ctx.fillRect(px + 18, py + 15, 6, 6);
    return;
  }

  if (tile === TILE_TYPES.iron) {
    ctx.fillStyle = colors.stone;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = colors.iron;
    ctx.fillRect(px + 4, py + 5, 7, 7);
    ctx.fillRect(px + 18, py + 15, 6, 6);
    return;
  }

  if (tile === TILE_TYPES.lava) {
    const pulse = 0.45 + Math.sin(state.time * 6 + px * 0.01) * 0.14;
    const gradient = ctx.createLinearGradient(px, py, px, py + TILE);
    gradient.addColorStop(0, colors.lavaBright);
    gradient.addColorStop(1, colors.lavaDark);

    ctx.fillStyle = gradient;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse.toFixed(3)})`;
    ctx.fillRect(px + 4, py + 4, TILE - 8, 3);
    ctx.fillStyle = "rgba(255, 30, 30, 0.26)";
    ctx.fillRect(px, py + TILE - 5, TILE, 5);
  }
}

function drawWorld() {
  fillBackground();
  drawDepthGrid();

  const minTy = Math.floor(state.cameraY / TILE);
  const maxTy = Math.ceil((state.cameraY + VIEW_H) / TILE);

  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = 0; tx < WORLD_W; tx++) {
      const tile = tileAt(tx, ty);
      if (tile === TILE_TYPES.air) continue;
      const px = tx * TILE;
      const py = ty * TILE - state.cameraY;
      drawTile(px, py, tile);
    }
  }
}

function drawHealthBar() {
  const x = 20;
  const y = 18;
  const w = 220;
  const h = 16;
  const ratio = Math.max(0, state.player.health / state.player.maxHealth);

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = ratio > 0.5 ? "#4ade80" : ratio > 0.25 ? "#facc15" : "#f87171";
  ctx.fillRect(x + 2, y + 2, (w - 4) * ratio, h - 4);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "10px 'Press Start 2P'";
  ctx.fillText(`HP ${state.player.health}`, x + 8, y + 12);
}

function drawPlayer() {
  const px = Math.round(state.player.x);
  const py = Math.round(state.player.y - state.cameraY);
  const flashing = state.player.hurtFlash > 0 && Math.floor(state.time * 16) % 2 === 0;

  ctx.fillStyle = flashing ? "#f87171" : colors.player;
  ctx.fillRect(px, py, state.player.w, state.player.h);
  ctx.fillStyle = colors.accent;
  ctx.fillRect(px + 4, py + 8, 5, 5);
  ctx.fillRect(px + state.player.w - 9, py + 8, 5, 5);
}

function drawMiningCursor() {
  if (state.mode !== "playing") return;

  const target = getTargetedTile();
  if (!target) return;

  const px = target.tx * TILE;
  const py = target.ty * TILE - state.cameraY;

  ctx.strokeStyle = colors.mining;
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);

  if (state.mine.tx === target.tx && state.mine.ty === target.ty && state.mine.required > 0) {
    const ratio = Math.min(1, state.mine.progress / state.mine.required);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(px + 3, py - 10, TILE - 6, 6);
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(px + 3, py - 10, (TILE - 6) * ratio, 6);
  }
}

function drawMilestone() {
  if (state.milestone.timer <= 0) return;

  const alpha = Math.min(1, state.milestone.timer / 0.4);
  ctx.fillStyle = `rgba(9, 13, 20, ${(0.64 * alpha).toFixed(3)})`;
  ctx.fillRect(220, 20, VIEW_W - 440, 54);

  ctx.strokeStyle = "rgba(245, 158, 11, 0.8)";
  ctx.lineWidth = 2;
  ctx.strokeRect(220, 20, VIEW_W - 440, 54);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "11px 'Press Start 2P'";
  ctx.fillText(state.milestone.text.toUpperCase(), 246, 52);
}

function drawToast() {
  if (state.toast.timer <= 0) return;
  const alpha = Math.min(1, state.toast.timer / 0.35);

  ctx.fillStyle = `rgba(0, 0, 0, ${(0.6 * alpha).toFixed(3)})`;
  ctx.fillRect(250, VIEW_H - 72, VIEW_W - 500, 38);
  ctx.strokeStyle = "rgba(147, 197, 253, 0.8)";
  ctx.lineWidth = 2;
  ctx.strokeRect(250, VIEW_H - 72, VIEW_W - 500, 38);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "10px 'Press Start 2P'";
  ctx.fillText(state.toast.text.toUpperCase(), 268, VIEW_H - 48);
}

function drawCraftPanel() {
  if (!state.showCraftPanel || state.mode !== "playing") return;

  const panelX = 18;
  const panelY = VIEW_H - 170;
  const panelW = 365;
  const panelH = 148;

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "10px 'Press Start 2P'";
  ctx.fillText("CRAFT PANEL (C TO TOGGLE)", panelX + 10, panelY + 20);

  const stoneAffordable = canAfford(CRAFT_RECIPES.stone.cost);
  const ironAffordable = canAfford(CRAFT_RECIPES.iron.cost);

  ctx.fillStyle = state.tool === "stone" || state.tool === "iron" ? "#93c5fd" : stoneAffordable ? "#86efac" : "#fca5a5";
  ctx.fillText(`B  STONE PICK: ${recipeCostString(CRAFT_RECIPES.stone.cost).toUpperCase()}`, panelX + 10, panelY + 58);

  ctx.fillStyle = state.tool === "iron" ? "#93c5fd" : ironAffordable ? "#86efac" : "#fca5a5";
  ctx.fillText(`ENTER IRON PICK: ${recipeCostString(CRAFT_RECIPES.iron.cost).toUpperCase()}`, panelX + 10, panelY + 92);

  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(`CURRENT TOOL: ${getToolMeta().label.toUpperCase()}`, panelX + 10, panelY + 126);
}

function drawModeMessage() {
  if (state.mode === "playing") return;

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(130, 120, VIEW_W - 260, 250);
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 4;
  ctx.strokeRect(130, 120, VIEW_W - 260, 250);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "18px 'Press Start 2P'";
  ctx.fillText("BEDROCK DESCENT", 212, 182);

  ctx.font = "12px 'Press Start 2P'";
  if (state.mode === "title") {
    ctx.fillText("WASD/ARROWS TO MOVE", 206, 212);
    ctx.fillText("SPACE OR W TO JUMP", 220, 238);
    ctx.fillText("HOLD MOUSE TO MINE", 222, 264);
    ctx.fillText("B / ENTER TO CRAFT TOOLS", 170, 290);
    ctx.fillText("AVOID LAVA, REACH BEDROCK", 175, 322);
  } else if (state.mode === "won") {
    ctx.fillText("YOU REACHED BEDROCK", 210, 246);
    ctx.fillText("PRESS RESTART FOR A NEW RUN", 148, 290);
  } else {
    ctx.fillText("YOU WERE DEFEATED BELOW", 178, 246);
    ctx.fillText("PRESS RESTART TO TRY AGAIN", 168, 290);
  }
}

function refreshDomHud() {
  const depth = getDepthMeters();
  depthReadout.textContent = `Depth: ${depth}m`;
  biomeReadout.textContent = `Biome: ${getBiomeLabel(depth)}`;
  healthReadout.textContent = `Health: ${state.player.health}`;
  modeReadout.textContent = `Mode: ${state.mode}`;
  toolReadout.textContent = `Tool: ${getToolMeta().label}`;
  inventoryReadout.textContent = `Bag: ${inventorySummary()}`;
}

function render() {
  drawWorld();
  drawHealthBar();
  drawPlayer();
  drawMiningCursor();
  drawMilestone();
  drawCraftPanel();
  drawToast();
  drawModeMessage();
  refreshDomHud();
}

function gameTick(dt) {
  update(dt);
  render();
}

let rafLast = performance.now();
function frame(now) {
  const dt = Math.min((now - rafLast) / 1000, 0.05);
  rafLast = now;
  gameTick(dt);
  requestAnimationFrame(frame);
}

function handleKeyChange(event, isDown) {
  const key = event.key.toLowerCase();
  state.keys[isDown ? "add" : "delete"](key);

  if (isDown && state.mode === "playing") {
    if (key === "b") {
      tryCraft("stone");
    }
    if (key === "enter") {
      tryCraft("iron");
      event.preventDefault();
    }
    if (key === "c") {
      state.showCraftPanel = !state.showCraftPanel;
      event.preventDefault();
    }
  }

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }
}

startBtn.addEventListener("click", () => {
  startRound();
});

window.addEventListener("mousemove", (event) => {
  const point = getCanvasPoint(event);
  state.mouse.x = point.x;
  state.mouse.y = point.y;
});

window.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    const point = getCanvasPoint(event);
    state.mouse.x = point.x;
    state.mouse.y = point.y;
    state.mouse.down = true;
  }
});

window.addEventListener("mouseup", () => {
  state.mouse.down = false;
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

window.addEventListener("keydown", (event) => handleKeyChange(event, true));
window.addEventListener("keyup", (event) => handleKeyChange(event, false));

window.render_game_to_text = () => {
  const footY = state.player.y + state.player.h;
  const sampleTx = Math.floor((state.player.x + state.player.w / 2) / TILE);
  const sampleTy = Math.floor(footY / TILE);
  const depth = getDepthMeters();

  return JSON.stringify({
    coordinateSystem: "origin top-left, +x right, +y down, units in pixels",
    mode: state.mode,
    depthMeters: depth,
    biome: getBiomeLabel(depth),
    player: {
      x: Math.round(state.player.x),
      y: Math.round(state.player.y),
      vx: Math.round(state.player.vx),
      vy: Math.round(state.player.vy),
      onGround: state.player.onGround,
      health: state.player.health,
    },
    camera: { y: Math.round(state.cameraY) },
    goal: { bedrockStartsAtTileY: BEDROCK_START },
    tool: getToolMeta().label,
    inventory: { ...state.inventory },
    touchingLava: overlapTileType(state.player.x, state.player.y, state.player.w, state.player.h, TILE_TYPES.lava),
    mouse: {
      x: Math.round(state.mouse.x),
      y: Math.round(state.mouse.y),
      down: state.mouse.down,
    },
    craftingPanelVisible: state.showCraftPanel,
    mining: {
      target: state.mine.tx === null ? null : { x: state.mine.tx, y: state.mine.ty },
      progress: Number(state.mine.progress.toFixed(3)),
      required: Number(state.mine.required.toFixed(3)),
    },
    latestMilestone: state.milestone.text || null,
    latestToast: state.toast.timer > 0 ? state.toast.text : null,
    belowPlayerTile: {
      x: sampleTx,
      y: sampleTy,
      type: tileNames[tileAt(sampleTx, sampleTy)],
    },
  });
};

window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  const dt = ms / 1000 / steps;
  for (let i = 0; i < steps; i++) {
    update(dt);
  }
  render();
};

buildWorld();
render();
requestAnimationFrame(frame);
