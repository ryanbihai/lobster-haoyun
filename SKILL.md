---
name: lucky-lobster
version: 0.1.0
description: >
  Agent-based deep personality reading with daily Chinese almanac fortune.
  Use when user asks for fortune telling, horoscope, personality analysis,
  daily luck, "看运势", "算算命", zodiac reading, self-discovery, or wants
  AI to analyze their traits from conversation history. Also covers weekly
  review, blindspot detection, and personalized growth advice.
homepage: https://github.com/ryanbihai/lucky-lobster
metadata:
  clawdbot:
    requires:
      bins:
        - node
    envVars:
      - name: OCEANBUS_URL
        required: false
        description: OceanBus L0 API base URL
      - name: LUCKY_LOBSTER_SVC_OPENID
        required: false
        description: L1 LuckyLobsterSvc OpenID for calendar/personality enrichment
    emoji: 🦞
    skillKey: 龙虾好运势
    os:
      - macos
      - linux
      - windows
files:
  - src/*
required_capabilities:
  - filesystem
  - network
---

# 🦞 龙虾好运势 (Lucky Lobster)

Agent-based deep personality reading using real user knowledge from memory, session history, and files. Zero user input required. Daily fortune integrates Chinese solar terms and seasonal phenology (七十二候).

## Trigger Keywords

- "看运势" / "今日运势" / "我的运势"
- "算算命" / "小龙虾帮我算算" / "认识我" / "了解我"
- "fortune" / "daily fortune" / "personality reading" / "tell me about myself"

## Execution Flow

When user says a trigger phrase, follow these steps in order:

### Step 1: Fetch Base Data

```bash
node <skill-path>/src/index.js --action fortune
```

Read the JSON output. Key fields:
- `flow` — "first_reading" | "daily_fortune" | "weekly_review"
- `data.profile` — User profile (birthday, city, gender)
- `data.calendar` — Solar term / season / phenology data
- `data.history.is_first_time` — Whether this is the first reading
- `data.history.is_sunday` — Whether today is Sunday (trigger weekly review)
- `data.history.streak` — Consecutive daily check-in count
- `data.aha` — Pre-generated Aha Moment text and micro-action

### Step 2: Scene Detection (silent)

Determine the user's primary life scene:
- **Career-dominant**: conversation focuses on work/projects/startup/management → extract evidence from work patterns, decision style
- **Relationship-dominant**: conversation focuses on relationships/emotions/family/growth → extract evidence from relationship patterns, emotional expression
- **Mixed**: both types → combine evidence sources

### Step 3: Trait Extraction (silent)

Scan these sources and extract 5-8 key traits, each with one specific evidence:
- Memory files (memory/): roles, preferences, project context
- Session history: work/life topics, communication style, emotional patterns
- CLAUDE.md: user-defined behavior guidelines
- Installed skills list: usage habits
- Loaded files: domain interests

### Step 4: Label Matching (silent)

Match traits to one of 9 personality labels:
- First determine the center: Thinking (needs certainty) | Feeling (needs connection) | Instinct (needs control)
- Then match to a specific label (see `src/labels.js` for full label library)

### Step 5: Blindspot + Advice (silent)

Infer 1-2 blindspots based on the label's known patterns + user's specific behavior.
Generate 1-2 specific, actionable suggestions referencing the user's current real situation.

### Step 6: Render Output

**First Reading** — Deep analysis format:

```
🔮 {name} · {season} Reading

小龙虾掐指一算——

**Your Core: {label}**

{evidence paragraphs — judgment + specific proof citations. 2-3 items.}

**Your Inner Drive**

{true motivation — career-type: cite value judgments; relationship-type: cite relationship patterns.}

**Your Blindspot: {title}**

{blindspot description + specific example. Must reference user's current real situation.}

**Your Energy Pattern: {pattern name}**

{pattern description + benefits + risks. Use rainbow technique to cover both sides.}

**Advice for {name}**

> {advice 1 — specific action tied to current project/relationship/situation}

> {advice 2 — a "too small to fail" proof line}

That's the reading. Give me a score — which parts were right, which made you think "the lobster still doesn't know me well enough"?
```

**Persuasion techniques** (apply silently, do not mention):
1. Barnum effect — open with 1-2 broad but resonant statements
2. Evidence citation — each judgment followed by specific proof
3. Rainbow blade — main tendency + exception, covering both possibilities
4. Language mirroring — reuse the user's own words and metaphors
5. Process praise — praise specific behaviors, not generic traits
6. Progressive feedback — L1 known → L2 hinted → L3 blindspot
7. Constructive ending — actionable advice that leaves the user better off

---

**Daily Fortune** (non-first) — Light format:

```
🦞 {name}, {date} · {solar term info}

{aha moment — solar term × personality label personalized connection}

{energy hint — tied to user's recent activity}

**Today's Micro-Action**: {one tiny, doable action today}

In one line: **{one-liner summary}**
```

Aha Moment formula: solar term / phenology data + personality label relevance + specific action.
Genre selection: Wrap-up Day (user has been planning) | Recharge Day (user has been outputting) | Connection Day (user has been working alone).

---

**Weekly Review** (Sunday trigger) — Insert before daily fortune:

```
🦞 {name}, {date} · Weekly Review

{week summary — reference this week's changes and progress}

**Personality Insight Update**
{updated observation — "Last time I said you were X, this week I'm seeing Y"}

**Today's Fortune**
{daily fortune content}
```

## Scene Adaptation Reference

| Dimension | Career-Type User | Relationship-Type User |
|-----------|-----------------|----------------------|
| Core evidence | Work patterns, decision style, project approach | Relationship patterns, emotional expression, values |
| Inner drive | What drives career choices | What drives relationship choices |
| Blindspot | Management/strategy/execution blindspots | Relationship/self-care/boundary blindspots |
| Energy pattern | Work rhythm (insight/sprint/trickle) | Emotional rhythm (burst/contained/trickle) |
| Advice | Projects, teams, direction | Relationship improvement, self-growth, life balance |
| Language style | Rational, logical, strategic | Warm, empathetic, narrative |

## Dependencies

- `oceanbus` — L0 P2P identity and messaging
- Node.js `>=18.0.0`

## External Endpoints

| Endpoint | Purpose | Data Sent |
|----------|---------|-----------|
| `OCEANBUS_URL` (L0 API) | OB identity registration, L0 messaging | `agent_id`, `api_key`, `openid`, message payloads |
| L1 CalendarSvc (via OB L0) | Solar term, lunar calendar, seasonal phenology | `date`, `city` (city-level only, not GPS) |
| L1 PersonalitySvc (via OB L0) | Personality label enrichment | `openid`, `label`, `center`, `traits` (anonymized keywords only, never raw conversation) |

No external HTTP APIs are called. All communication goes through OceanBus L0 message channel. No API keys are stored in the skill.

## Security & Privacy

**What stays on your device (never leaves):**
- Full conversation content (specific projects, names, company names)
- Memory files (roles, preferences, feedback)
- Loaded file contents
- Detailed behavior patterns
- Emotional states

**What is transmitted (anonymized, via OB L0):**
- Personality label ("布局者") and center type
- Trait keywords (e.g., ["systematic thinking", "independent decision-making"])
- City-level location (millions-level anonymity set)
- Age range and gender
- OpenID (anonymous, replaceable at any time)

**Privacy guarantees:**
- No PII ever leaves the device
- OpenID is anonymous and user-replaceable
- L1 services never see raw conversation data
- Brand partners (future) only receive anonymous aggregate statistics
- User profile (birthday, city, gender) stored locally at `~/.lucky-lobster/profile.json`

## Trust Statement

By installing this skill, you agree to send anonymized personality labels and trait keywords to OceanBus L0/L1 services for personality enrichment and calendar data. No personally identifiable information is transmitted. Your OpenID is anonymous and can be replaced at any time. Only install if you trust the OceanBus L0 and L1 service providers.

## Model Usage

This skill is designed for autonomous invocation by AI models. The model will analyze user data from available context sources and generate a personalized fortune reading without requiring user input beyond the trigger phrase. All analysis steps (2-5) are executed silently before the final reading is presented.
