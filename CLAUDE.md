# lucky-lobster — 龙虾好运势

Agent-based deep personality reading skill for ClawHub. Zero user input — analyzes from memory, session history, loaded files.

## Commands

```bash
npm install
node src/index.js --action status              # OB identity + profile + history + dimensions
node src/index.js --action fortune              # Full flow: calendar + fortune data + personality state
node src/index.js --action save-dimensions --code <5chars> --type <name> --confidence <0-1>
node src/index.js --action filter-stories [--emotion <e>] [--life-phase <p>]
node src/index.js --action l1-calendar          # Direct L1 CalendarSvc call
node src/index.js --action discovery            # ClawHub/MOOC candidates from L1
node src/index.js --action discovery-shown --source <s> --slug <slug>
```

## Architecture

```
User says "看运势" in CC
       │
       ▼
CC runs: node src/index.js --action fortune
       │
       ├── identity.js → restore OB identity (~/.lucky-lobster/ob-credentials.json)
       ├── profile.js  → load profile + dimensions (5-dim behavior code)
       ├── local-calendar.js → calendar fallback (节气/季节/日期)
       │      or L1 CalendarSvc via OB L0 (if LUCKY_LOBSTER_SVC_OPENID set)
       │
       ▼
Output JSON: { flow, personality: {has_dimensions, needs_reevaluation, dimensions}, data, _instructions }
       │
       ▼
CC reads SKILL.md → context sensing → dimension analysis → save-dimensions
       │
       ├── filter-stories → corpus.json filtered by dimensions code
       │
       ▼
Render Markdown (tag hook + 5-dim breakdown + story + blindspot + advice)
```

### Key Design Decisions

- **LLM qualitative + JS quantitative**: LLM judges 5 dimensions with evidence → JS stores 5-char code, filters 500-story corpus, computes matches. LLM never touches raw filtering logic.
- **5-Dimension Behavioral Classification**: Replaces old 9-label system (布局者/观察者/etc). Observed from actual behavior: 工作方式(架构/探索) × 沟通模式(精炼/叙事) × 关注焦点(事务/人际) × 能量来源(内收/外放) × 情感倾向(理性/感性) = 32 types.
- **Expanded output, not codes**: User sees natural language dimension breakdown with evidence. 5-char code (e.g. `架精事内理`) is internal storage only — never shown to user.
- **500-story corpus with 4-axis tags**: emotions, personality_fit (dimension values), seasonal_fit, life_situations. Weighted scoring: personality ×2 + season ×1 + life_phase ×1 + emotion ×0.5. Top 8 candidates returned for LLM to pick best match.
- **Local calendar fallback**: When L1 CalendarSvc is unavailable, `local-calendar.js` provides season/solar term data.
- **A/B data split**: Profile/birthday/behavior stay local (A data). Only 5-char dimension code + city-level location go to L1 (B data).
- **Three flows**: first_reading (5-dim + story) → daily_fortune (story matching) → weekly_review.

## File Map

```
src/
  index.js             — CLI entry: fortune/save-dimensions/filter-stories/status/l1-*/discovery
  dimensions.js        — 5-dim definitions + 32-type TYPE_TABLE + filterCorpus() scoring engine
  corpus.json          — 500 classic stories with emotion/personality/season/life tags (~250KB)
  identity.js          — OB identity auto-register + restore from disk
  ob-client.js         — OB connection wrapper (sendJson, startListening, L1 request/response)
  profile.js           — Profile I/O + dimension storage (~/.lucky-lobster/profile.json)
  history.js           — Fortune history + streak + Sunday detection
  preferences.js       — Push preferences (categories, frequency, quiet hours)
  local-calendar.js    — Lightweight calendar fallback (24 term dates, seasons)
  cal-templates.js     — Aha Moment engine (simplified, generic templates)
  persuasion.js        — 7 persuasion technique templates (legacy, tone rules now in SKILL.md)
  render.js            — Markdown format templates (first/daily/weekly with expanded placeholders)
  consent.js           — First-run privacy consent gate
```

## State Files

```
~/.lucky-lobster/
  ob-credentials.json   — OB identity (agent_id, api_key, openid)
  profile.json          — User info + dimensions {code, type_name, confidence, last_evaluated}
  fortune-history.json  — Past readings (with dimensions field), streak count
  preferences.json      — Push preferences, interest tags
  consent.json          — Privacy consent record
```

## Data Flow (Privacy)

```
A Data (local ONLY):
  对话内容 · 项目名 · 人名 · 行为细节 · 情感状态 · 文件内容
       │ NEVER leaves device
       ▼
  LLM local analysis → 5-dim judgment with evidence citations

B Data (encrypted → L1 via OB L0):
  5-char dimension code · city-level location (if provided) · date
  OpenID (cryptographically random, used for request/response correlation)
  Discovery: OpenID for recommendation dedup (no ad tracking)
       │ via OB L0 (E2EE)
       ▼
  L1 CalendarSvc → solar term / phenology data
  L1 DiscoverySvc → community skill/MOOC recommendations

Local storage (~/.lucky-lobster/):
  OB credentials (OpenID + API key) · profile · dimensions
  fortune history · push preferences · consent record
  → Delete this directory to permanently clear identity
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| OCEANBUS_URL | No | https://ai.ihaola.com.cn/api/l0 | L0 API base URL |
| LUCKY_LOBSTER_SVC_OPENID | No | — | L1 service OpenID for enrichment |

## Dependencies

- `oceanbus` — L0 P2P identity and messaging (only runtime dep)
- Node.js `>=18.0.0`
