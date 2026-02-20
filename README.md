# Bedrock Descent

A Minecraft-inspired browser game about digging, surviving, and completing prep objectives before touching bedrock.

## Features

- Blocky layered world generation with a descent shaft and ore distribution.
- Mining + inventory loop with break progress and tool upgrades.
- Crafting system for stone and iron pickaxes.
- Hazards and survival systems (lava, fall damage, health).
- Torch placement and depth-based darkness/lighting.
- Objective checklist that gates final bedrock completion.
- Deterministic hooks for automated game QA (`window.render_game_to_text`, `window.advanceTime`).

## Controls

- `A/D` or arrow keys: move
- `W` / `Space` / up arrow: jump
- Left mouse hold: mine targeted block
- Right mouse click or `T`: place torch (costs coal)
- `B`: craft stone pickaxe
- `Enter`: craft iron pickaxe
- `C`: toggle craft panel
- `P`: pause/resume
- `F`: toggle fullscreen

## Run Locally

```bash
npm install
npm run serve
```

Open [http://localhost:4173](http://localhost:4173).

## Smoke Test

```bash
npm run smoke:latest
```

Optional args:

```bash
bash scripts/run_smoke.sh <port> <output_dir> <actions_file>
```

Example:

```bash
bash scripts/run_smoke.sh 4173 output/web-game/custom scripts/actions/pr7-smoke.json
```
