Original prompt: clone https://github.com/neojeffersonian/bedrock

and push up like 8 separate PRs to make a minecraft themed game around reaching bedrock

## Notes
- Repository cloned from origin but is empty, so a base `main` commit is required before creating PRs.
- Plan: create 8 stacked PRs (`codex/pr1-*` through `codex/pr8-*`) to progressively build the game.

## PR1 - Core loop
- Added first playable canvas loop with title screen, camera, movement, gravity, collisions, and a win condition for touching bedrock.
- Exposed `window.render_game_to_text` and `window.advanceTime(ms)` for deterministic automation.
- Added initial smoke actions payload at `scripts/actions/pr1-smoke.json`.
- Playwright smoke run completed for PR1 (`output/web-game/pr1`), screenshots and JSON state generated with no console errors.

## PR2 - Biomes and full descent shaft
- Expanded generation to include grass, coal ore, and iron ore blocks.
- Added a carved shaft/chambers that run to bedrock so progression is physically possible.
- Added biome readout, depth markers, milestone popups, and depth-based atmosphere shading.
- Added `scripts/actions/pr2-smoke.json` for deeper movement/fall smoke testing.
- Playwright smoke run completed for PR2 (`output/web-game/pr2`), showing descent progression to 72m with no console errors.

## PR3 - Mining and inventory
- Added mouse-targeted mining with distance checks, block hardness, and progress bars.
- Added inventory collection for dirt/stone/coal/iron from mined blocks.
- Added HUD inventory readout and mining state in `render_game_to_text`.
- Added `scripts/actions/pr3-smoke.json` with mouse mining input for automated checks.
- Playwright smoke run completed for PR3 (`output/web-game/pr3`), confirming mined block drops recorded in inventory with no console errors.

## PR4 - Crafting and tool upgrades
- Added tool progression (`hand` -> `stone pickaxe` -> `iron pickaxe`) with mining speed multipliers.
- Added crafting system with resource costs, status toasts, and toggleable craft panel (`C`).
- Added craft shortcuts (`B` for stone pickaxe, `Enter` for iron pickaxe).
- Added tool state to HUD and `render_game_to_text`, plus `scripts/actions/pr4-smoke.json`.
- Playwright smoke run completed for PR4 (`output/web-game/pr4`), confirming stone pickaxe crafting and inventory cost consumption without console errors.

## PR5 - Hazards and survival loop
- Added lava hazards (tutorial pool + deeper random pockets) and a fluid lava tile type.
- Added health, damage cooldowns, hurt flash, lava damage, and fall damage.
- Added lose state messaging and health HUD readout.
- Added hazard status to `render_game_to_text` and `scripts/actions/pr5-smoke.json`.
- Playwright smoke run completed for PR5 (`output/web-game/pr5`), showing health drop to 80 after hazard contact and no console errors.

## PR6 - Lighting, torches, and fullscreen
- Added depth-based darkness pass with light cutouts around player and placed torches.
- Added torch placement (right-click or `T`) consuming coal and tracked torch positions.
- Added fullscreen toggle (`F`) with resize/fullscreen synchronization for canvas display.
- Added torch/fullscreen state to `render_game_to_text` and `scripts/actions/pr6-smoke.json`.
- Playwright smoke run completed for PR6 (`output/web-game/pr6`), confirming torch placement (`torchCount: 1`) and no console errors.

## PR7 - Objective progression and win gating
- Added objective checklist: gather stone, craft upgraded tool, place torch, then touch bedrock.
- Added objective panel UI and objective state in `render_game_to_text`.
- Updated bedrock win condition to require pre-objectives before final completion.
- Added `scripts/actions/pr7-smoke.json` to validate objective progression events.
- Playwright smoke run completed for PR7 (`output/web-game/pr7`), confirming objective progression updates (gather/craft/torch) with no console errors.
