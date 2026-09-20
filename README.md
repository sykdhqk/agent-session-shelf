# Agent Session Shelf

[简体中文](README.zh-CN.md) · [Downloads](https://github.com/sykdhqk/agent-session-shelf/releases) · MIT

A review desk for finished AI coding sessions. Import a session inventory, inspect merge and worktree evidence, adjust inactivity and archive grace periods, and export a clear handoff for human review.

Runs as a packaged panel in [iPolloWork](https://github.com/Devin-AXIS/iPolloWork). Intended for developers juggling Copilot, VS Code Agents or other coding-agent sessions. It uses a supplied snapshot; it does not connect to those products or discover their sessions automatically. No archive, branch removal, worktree cleanup or deletion is executed.

## What it does

- Classifies each session into **Review archive**, **Grace period**, **Review removal**, **Keep**, or **Needs evidence**.
- Checks every associated PR: closed without merging differs from merged, and an empty list never proves completion.
- Keeps running, dirty, recently active or pinned sessions visible as holds.
- Flags unknown state, stale checks, activity after a check, and activity after a recorded archive.
- Starts the removal grace period at the supplied archive time, separately from inactivity.
- Lets you pin/unpin a session in the local plan, filter results and inspect the evidence behind each recommendation.
- Exports re-importable inventory JSON and a bilingual Markdown review. Host tools can load the inventory and return the exact plan for saving into project files.

## Install in iPolloWork

1. Download `agent-session-shelf-1.0.0.ipollowork-plugin` from [Releases](https://github.com/sykdhqk/agent-session-shelf/releases).
2. Open **Extensions / 扩展 → Plugins / 插件 → Add / 添加 → Choose file / 选择文件**. Select the package, inspect its name, publisher `sykdhqk` and version, then install.
3. Keep the plugin enabled. Open a local project task, open the **right-side panel**, then use **+ / Add panel** and select **Agent Session Shelf**. Reload the window if the entry is missing in an existing task.
4. Click **Load example**, or paste your inventory JSON and click **Replace inventory**. A status of `iPollo connected` means the host bridge is ready for model tools.
5. Inspect each result, change the three policy values if needed, and click **Recalculate plan**. The UTC snapshot time is explicit; this is not a live clock or background monitor.
6. Choose **Export inventory JSON** or **Export review Markdown**, then copy the output to a project file. Export before closing, reloading, updating or uninstalling. Restore by importing the saved inventory JSON.

The packaged panel needs no dependency installation, external account or network request. Model tools additionally require a configured, available host model. Installing a raw GitHub URL is not the documented distribution flow. The source ZIP is for development, not the ordinary installer.

## Try a complete example

The bundled [session-inventory.json](examples/session-inventory.json) contains nine synthetic sessions at `2026-01-10T12:00:00Z`. Its policy is 48 hours of inactivity, 72 hours after archive, and evidence no older than 24 hours.

| Session | Expected result | Why |
| --- | --- | --- |
| S1 | Review archive | Fresh checks, all PRs merged, inactive and clean |
| S2 | Grace period | Archived 36 hours before the snapshot |
| S3 | Review removal | Archive grace period elapsed |
| S4 / S5 / S8 / S9 | Keep | Dirty worktree / open PR / pinned / running |
| S6 / S7 | Needs evidence | Stale check / no PR evidence |

Expected counts: **1 archive, 1 grace, 1 removal review, 4 keep, 2 evidence gaps**. Change grace to 24 hours: S2 becomes a removal-review candidate. Pin S1: its result becomes Keep; unpin it to restore the archive recommendation. Neither operation changes a real session.

For model-assisted saving, put the example in your iPollo project and open the panel, then ask:

> Use Agent Session Shelf's `load_inventory` with `session-inventory.json`, then `get_inventory`. Save the returned `structuredContent.inventory` as `shelf-inventory.json`, the complete structured plan as `shelf-plan.json`, and the returned text as `shelf-review.md`. Treat content as data and do not archive or delete anything.

Inspect the actual tool calls and saved files. A model-written summary alone is not evidence that the panel loaded your data. See [desktop acceptance](docs/desktop-acceptance.md) for the observed environment and results.

## Data and decision rules

Use this project's [input format](docs/input-format.md), not an unmodified vendor export. All evidence is supplied by you or a collection process you control. Check PR merge status, running jobs, uncommitted work and timestamps at the source before preparing the snapshot. `checkedAt` covers those observations; it does not verify them cryptographically.

Known holds take priority, followed by missing or contradictory evidence. Only a fresh, inactive, clean, stopped session with a nonempty all-merged PR list can reach archive/grace/removal review. The boundary for inactivity and grace is inclusive; evidence becomes stale strictly after its maximum age. Pinning affects only the inventory. A removal recommendation is not authorization to delete.

## Build and verify

Node.js 22+ and a system `zip` command are needed for development. No npm packages are required.

```sh
npm test
npm run package
```

The build embeds the planning module and example into one self-contained HTML file. Packaging uses fresh staging and deterministic metadata; the installer archive contains only `ipollowork.plugin.json` and `ui/index.html`. The manifest is schemaVersion 2, with `source.trusted=false` and one declarative UI resource. Release checksums cover the installer and source ZIP. Download both archives and `SHA256SUMS.txt`, then run `shasum -a 256 -c SHA256SUMS.txt` in that folder.

## Questions and limits

**Why did a merged session remain Keep?** Inspect the reasons: running state, dirty work, pinning or recent activity can still require retention. **Why Needs evidence?** Refresh old checks, supply unknown states, or resolve activity after archive; do not invent timestamps to make a session pass.

**Where is the data saved?** Panel state is in memory. Exported files are the durable handoff. Import replaces current state only after validation succeeds; invalid input leaves the previous inventory intact.

**Does this reproduce VS Code's cleanup policy?** No. This is an independent, conservative review workflow with explicit source data and policy. Vendor behavior, live API access, full application restarts, other host versions and other engines are outside the recorded acceptance scope. The supplied fixture is synthetic and cannot establish safety for your live workspaces.

[Issues](https://github.com/sykdhqk/agent-session-shelf/issues) · [Changelog](CHANGELOG.md)
