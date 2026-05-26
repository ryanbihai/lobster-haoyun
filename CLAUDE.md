# lucky-lobster — 龙虾好运势

Agent-based deep personality reading skill for ClawHub. Zero user input — analyzes from memory, session history, loaded files.

## Commands

```bash
npm install
node src/index.js --action status         # OB identity + profile + history
node src/index.js --action fortune         # Full flow: calendar + fortune data
node src/index.js --action l1-calendar     # Direct L1 CalendarSvc call
node src/index.js --action l1-personality --label <name> --center <c>  # L1 personality
```

## Architecture

```
User says "看运势" in CC
       │
       ▼
CC runs: node src/index.js --action fortune
       │
       ├── identity.js → restore OB identity (~/.lucky-lobster/ob-credentials.json)
       ├── profile.js  → load profile (birthday/city/gender)
       ├── local-calendar.js → calendar fallback (节气/季节/日期)
       │      or L1 CalendarSvc via OB L0 (if LUCKY_LOBSTER_SVC_OPENID set)
       │
       ▼
Output JSON: { flow, data: { profile, calendar, history, aha, preferences }, _instructions }
       │
       ▼
CC reads SKILL.md → executes 6-step analysis prompt → renders Markdown
```

### Key Design Decisions

- **Analysis in LLM, not JS**: The 6-step personality analysis runs in CC's context (LLM), not in JS. JS code handles OB identity, L1 communication, calendar data. The LLM has access to user's memory, session history, and files — JS doesn't.
- **Local calendar fallback**: When L1 CalendarSvc is unavailable, `local-calendar.js` provides season/solar term data using hardcoded 2026 term dates (zero external deps).
- **A/B data split**: Profile/birthday/behavior stay local (A data). Only anonymized labels go to L1 (B data).
- **Three flows**: first_reading (deep analysis) → daily_fortune (light daily) → weekly_review (Sunday trigger).
- **Aha Moment engine**: Connects solar term × personality center × daily genre. 30+ template associations in `cal-templates.js`.

## File Map

```
src/
  index.js             — CLI entry: fortune/l1-calendar/l1-personality/status actions
  identity.js          — OB identity auto-register + restore from disk
  ob-client.js         — OB connection wrapper (sendJson, startListening, L1 request/response)
  profile.js           — Local profile I/O (~/.lucky-lobster/profile.json)
  history.js           — Fortune history + streak + Sunday detection
  preferences.js       — Push preferences (categories, frequency, quiet hours)
  local-calendar.js    — Lightweight calendar fallback (24 term dates, seasons)
  cal-templates.js     — Aha Moment engine (30+ templates, genre picker, micro-action)
  labels.js            — 9-label personality library (definitions + matching)
  persuasion.js        — 7 persuasion technique templates
  render.js            — Markdown format templates (first/daily/weekly)
```

## State Files

```
~/.lucky-lobster/
  ob-credentials.json   — OB identity (agent_id, api_key, openid)
  profile.json          — User info (birthday, city, gender) — NEVER leaves device
  fortune-history.json  — Past readings, streak count
  preferences.json      — Push preferences, interest tags
```

## Data Flow (Privacy)

```
A Data (local ONLY):
  对话内容 · 项目名 · 人名 · 行为细节 · 情感状态 · 文件内容
       │ NEVER leaves device
       ▼
  Agent local analysis → evidence citations, specific suggestions

B Data (anonymized → L1):
  人格标签 · 特征关键词 · 城市级 · 年龄段 · OpenID
       │ via OB L0
       ▼
  L1 PersonalitySvc → enrichment (blindspots, growth path, peer traits)
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| OCEANBUS_URL | No | https://ai.ihaola.com.cn/api/l0 | L0 API base URL |
| LUCKY_LOBSTER_SVC_OPENID | No | — | L1 service OpenID for enrichment |

## Dependencies

- `oceanbus` — L0 P2P identity and messaging (only runtime dep)
- Node.js `>=18.0.0`
