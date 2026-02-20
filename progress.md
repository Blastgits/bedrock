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
