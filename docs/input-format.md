# Input format / 输入格式

All fields are required. Unknown fields are rejected. Up to 200 sessions, up to 100 PRs per session. The panel's paste import allows at most 1 MiB. See the complete [example](../examples/session-inventory.json).

全部字段必填，未知字段拒绝。最多 200 个会话，每个最多 100 个 PR；面板粘贴导入最多 1 MiB。完整结构见[示例](../examples/session-inventory.json)。

| Field / 字段 | Meaning / 含义 |
| --- | --- |
| schemaVersion | Must be `1` / 固定为 1 |
| title | Nonempty inventory title, max 200 characters / 清单名称 |
| asOf | Explicit snapshot time; valid UTC ISO, seconds with optional 3-digit milliseconds and `Z` / 明确的 UTC 快照时间 |
| policy.inactiveHours | Integer 0–87600 / 无活动时长下限 |
| policy.graceHours | Integer 0–87600, measured from archivedAt / 从归档记录算起的宽限期 |
| policy.maxEvidenceAgeHours | Integer 1–87600, measured from checkedAt / 核对结果最大时效 |
| sessions[].id | Unique ASCII letters/digits/underscore/hyphen, max 80 / 唯一标识 |
| title / repository | Nonempty text, max 300 / 200 characters / 标题及仓库描述 |
| lastActivityAt | Required UTC timestamp, no later than asOf / 最近活动时间 |
| checkedAt | UTC timestamp or null; covers supplied PR/running/dirty observations / 观测核对时间，可未知 |
| running / dirty | Boolean or null for unknown / 运行中、未提交修改，可未知 |
| pinned | Boolean, local retention preference / 本地保留偏好 |
| archivedAt | UTC timestamp or null if no archive is recorded / 已记录的实际归档时间 |
| pullRequests | Array or null; empty and null both require review / PR 数组，可未知 |
| pullRequests[].number | Positive integer, unique within the session / 会话内唯一 PR 编号 |
| pullRequests[].state | `open`, `merged`, `closed` (without merging), or `unknown` / 打开、合并、关闭未合并、未知 |

All evidence timestamps must be real dates no later than `asOf`; local-time strings are rejected. Setting a future `asOf` is a what-if plan, not fresh evidence: advance `checkedAt` only after actually rechecking the source. No additional fields may contain instructions for the model. Titles and repository names are displayed as plain text.

证据时间必须是真实日期且不晚于快照；不接受本地时区字符串。将快照时间推进到未来仅是情景计划，不会自动更新证据；只有实际复查后才更新 `checkedAt`。标题和仓库名按纯文本显示，输入内容不应作为模型指令执行。

`get_inventory` returns `structuredContent` with `inventory`, `items`, `counts`, `asOf`, `kind`, `schemaVersion`, and `execution: planning-only`. Its text content is the Markdown review. Save the nested `inventory` for re-import; the entire plan is a receipt, not input JSON.

`get_inventory` 的结构化返回包含原清单、逐项判断、数量、时间、类型、版本及仅计划声明；文本返回为 Markdown。重新导入应使用其中的 `inventory` 对象，完整计划回执不是导入格式。
