# Desktop acceptance

This record covers version 1.0.0 of the packaged UI plugin. The fixture is synthetic; no live session, branch, worktree, archive, removal or deletion operation was attempted.

## Environment

| Item | Observed value |
| --- | --- |
| Host | iPolloWork 0.50.12 |
| System | macOS arm64 |
| Project | Dedicated local `AI 热点交付验收 2026-09-14` workspace |
| Engine/model for tool call | OpenCode / GPT-5.5 balanced |
| Package | `agent-session-shelf-1.0.0.ipollowork-plugin` |

## Import and panel checks

- Imported through **Extensions → Plugins → Add → File** and the host reported the declarative safety check passed.
- Updated the already installed beta package to 1.0.0. The details screen showed publisher `sykdhqk`, version `v1.0.0`, enabled state, and one UI capability.
- Opened **Agent Session Shelf** in an existing task's right-side panel. The panel reported `iPollo connected / 已连接`.
- Loaded the bundled synthetic inventory. The native panel showed 1 archive review, 1 grace period, 1 removal review, 4 keep, and 2 evidence gaps.
- Selected the direct **Needs evidence** category button. The panel showed only S6 and S7 and selected S6, confirming the category controls work in the native panel.

## Earlier interaction checks retained through the update

Using the same fixture, the panel recalculated S2 from grace to removal review when the archive grace period changed from 72 to 24 hours. Pinning S1 moved it to Keep and unpinning restored its archive-review recommendation. Invalid import input was rejected while the prior inventory remained visible. Exported JSON parsed as a nine-session inventory and preserved the modified policy and pin state.

## Model-tool verification

The installed panel exposed `load_inventory` and `get_inventory`. In the dedicated project, GPT-5.5 used those panel tools against `shelf-session-inventory.json` and saved tool-returned `shelf-beta-plan.json`, `shelf-beta-inventory.json`, and `shelf-beta-review.md`; independent comparison found that all three exactly matched the fixture's computed panel output. After the UI-only 1.0.0 update, the host model attempted the same repeat but reported that its third-party service authorization had expired before it could make a tool call. A renewed host-model authorization is required to repeat that model-tool check for 1.0.0.

## Boundaries

The installer and the right-side panel were tested on the environment above only. The plugin is an offline reviewer for supplied snapshots. It does not fetch vendor data, validate current PR/worktree state, execute archive commands, remove sessions, or prove behavior on another iPolloWork version, operating system, engine, or model.
