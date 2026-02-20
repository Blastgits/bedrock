const TILE = 32;
const WORLD_W = 72;
const WORLD_H = 140;
const BEDROCK_START = 126;
const VIEW_W = 960;
const VIEW_H = 540;
const GRAVITY = 1700;
const MOVE_SPEED = 240;
const JUMP_SPEED = 660;

const colors = {
  skyTop: "#78c7ff",
  skyBottom: "#2d8cd6",
  dirt: "#8b5a2b",
  stone: "#7f8c8d",
  bedrock: "#2f3136",
  player: "#fbbf24",
  accent: "#1f2937",
};

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("start-btn");
const depthReadout = document.getElementById("depth-readout");
const modeReadout = document.getElementById("mode-readout");

const state = {
  mode: "title",
  keys: new Set(),
  world: [],
  cameraY: 0,
  time: 0,
  player: {
    x: TILE * 6,
    y: TILE * 2,
    vx: 0,
    vy: 0,
    w: 22,
    h: 30,
    onGround: false,
  },
};

function randSeeded(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return n - Math.floor(n);
}

function buildWorld() {
  const world = new Array(WORLD_H);
  for (let y = 0; y < WORLD_H; y++) {
    world[y] = new Array(WORLD_W).fill(0);
    for (let x = 0; x < WORLD_W; x++) {
      if (y < 4) {
        world[y][x] = 0;
      } else if (y >= BEDROCK_START) {
        world[y][x] = 3;
      } else if (y > 88) {
        world[y][x] = randSeeded(x, y) > 0.24 ? 2 : 1;
      } else {
        world[y][x] = randSeeded(x, y) > 0.72 ? 2 : 1;
      }
    }
  }

  for (let y = 0; y < 11; y++) {
    world[y][5] = 0;
    world[y][6] = 0;
    world[y][7] = 0;
  }

  state.world = world;
}

function tileAt(tx, ty) {
  if (tx < 0 || tx >= WORLD_W) return 3;
  if (ty < 0) return 0;
  if (ty >= WORLD_H) return 3;
  return state.world[ty][tx];
}

function isSolidTile(value) {
  return value !== 0;
}

function resetPlayer() {
  state.player.x = TILE * 6;
  state.player.y = TILE * 2;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.onGround = false;
  state.cameraY = 0;
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

  state.player.y += state.player.vy * dt;
  if (overlapSolidRect(state.player.x, state.player.y, state.player.w, state.player.h)) {
    const dir = Math.sign(state.player.vy) || 1;
    while (overlapSolidRect(state.player.x, state.player.y, state.player.w, state.player.h)) {
      state.player.y -= dir;
    }
    if (state.player.vy > 0) {
      state.player.onGround = true;
    }
    state.player.vy = 0;
  } else {
    state.player.onGround = false;
  }
}

function checkGoal() {
  const footY = state.player.y + state.player.h + 1;
  const tx = Math.floor((state.player.x + state.player.w / 2) / TILE);
  const ty = Math.floor(footY / TILE);
  if (tileAt(tx, ty) === 3) {
    state.mode = "won";
  }
}

function update(dt) {
  state.time += dt;
  if (state.mode !== "playing") return;

  applyInput();
  integratePhysics(dt);
  checkGoal();

  const followY = state.player.y - VIEW_H * 0.55;
  const maxCamera = WORLD_H * TILE - VIEW_H;
  state.cameraY = Math.max(0, Math.min(maxCamera, followY));
}

function drawWorld() {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, colors.skyTop);
  grad.addColorStop(1, colors.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const minTy = Math.floor(state.cameraY / TILE);
  const maxTy = Math.ceil((state.cameraY + VIEW_H) / TILE);

  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = 0; tx < WORLD_W; tx++) {
      const tile = tileAt(tx, ty);
      if (!tile) continue;

      if (tile === 1) ctx.fillStyle = colors.dirt;
      if (tile === 2) ctx.fillStyle = colors.stone;
      if (tile === 3) ctx.fillStyle = colors.bedrock;

      const px = tx * TILE;
      const py = ty * TILE - state.cameraY;
      ctx.fillRect(px, py, TILE, TILE);

      if (tile === 3) {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(px + 4, py + 4, TILE - 8, 3);
      }
    }
  }
}

function drawPlayer() {
  const px = Math.round(state.player.x);
  const py = Math.round(state.player.y - state.cameraY);

  ctx.fillStyle = colors.player;
  ctx.fillRect(px, py, state.player.w, state.player.h);
  ctx.fillStyle = colors.accent;
  ctx.fillRect(px + 4, py + 8, 5, 5);
  ctx.fillRect(px + state.player.w - 9, py + 8, 5, 5);
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
    ctx.fillText("WASD/ARROWS TO MOVE", 206, 230);
    ctx.fillText("SPACE OR W TO JUMP", 220, 260);
    ctx.fillText("REACH BEDROCK TO WIN", 190, 300);
  } else {
    ctx.fillText("YOU REACHED BEDROCK", 210, 246);
    ctx.fillText("PRESS RESTART FOR A NEW RUN", 148, 290);
  }
}

function refreshDomHud() {
  const depth = Math.max(0, Math.floor((state.player.y - TILE * 2) / TILE));
  depthReadout.textContent = `Depth: ${depth}m`;
  modeReadout.textContent = `Mode: ${state.mode}`;
}

function render() {
  drawWorld();
  drawPlayer();
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
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }
}

startBtn.addEventListener("click", () => {
  startRound();
});

window.addEventListener("keydown", (event) => handleKeyChange(event, true));
window.addEventListener("keyup", (event) => handleKeyChange(event, false));

window.render_game_to_text = () => {
  const footY = state.player.y + state.player.h;
  const sampleTx = Math.floor((state.player.x + state.player.w / 2) / TILE);
  const sampleTy = Math.floor(footY / TILE);

  return JSON.stringify({
    coordinateSystem: "origin top-left, +x right, +y down, units in pixels",
    mode: state.mode,
    depthMeters: Math.max(0, Math.floor((state.player.y - TILE * 2) / TILE)),
    player: {
      x: Math.round(state.player.x),
      y: Math.round(state.player.y),
      vx: Math.round(state.player.vx),
      vy: Math.round(state.player.vy),
      onGround: state.player.onGround,
    },
    camera: { y: Math.round(state.cameraY) },
    goal: { bedrockStartsAtTileY: BEDROCK_START },
    belowPlayerTile: {
      x: sampleTx,
      y: sampleTy,
      type: tileAt(sampleTx, sampleTy),
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
