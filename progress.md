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
