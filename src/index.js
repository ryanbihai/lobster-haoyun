#!/usr/bin/env node
/**
 * 龙虾好运势 — main entry
 *
 * Usage:
 *   node src/index.js --action status          # Show OB identity + profile + history
 *   node src/index.js --action fortune          # Full flow: calendar + fortune data for CC
 *   node src/index.js --action l1-calendar      # Call L1 CalendarSvc
 *   node src/index.js --action l1-personality --label <name> --center <c>
 */
import { createOceanBus } from "oceanbus";
import { getClient, getOpenId } from "./ob-client.js";
import { hasProfile, loadProfile, saveProfile } from "./profile.js";
import { loadHistory, addEntry, getStreak, isSunday, hasTodayReading, getWeekEntries } from "./history.js";
import { initPreferences, loadPreferences } from "./preferences.js";
import { getLocalCalendar } from "./local-calendar.js";
import { generateAha, pickGenre, generateMicroAction } from "./cal-templates.js";

const BASE_URL = process.env.OCEANBUS_URL || "https://ai-t.ihaola.com.cn/api/l0";
const L1_OPENID = process.env.LUCKY_LOBSTER_SVC_OPENID || "cOrquik8RuElUIUakY7FAmB3N5gdmXRR1Yg2b-GX3WeezJGSZVVV0fRd7eknILQodV9ATrpM93N4gYyP";

async function main() {
  const action = getArg("--action") || "status";
  switch (action) {
    case "status":       return await cmdStatus();
    case "l1-calendar":  return await cmdL1Calendar();
    case "l1-personality": return await cmdL1Personality();
    case "fortune":      return await cmdFortune();
    default:
      console.log(JSON.stringify({ error: `unknown action: ${action}` }));
      process.exit(1);
  }
}

// ── Status ──
async function cmdStatus() {
  const { ob, openid, agentId, created } = await getClient();
  const profile = loadProfile();
  const history = loadHistory();

  console.log(JSON.stringify({
    status: "ok",
    identity: { openid, agent_id: agentId, created_this_session: created },
    profile: profile ? { exists: true, birthday: profile.birthday, city: profile.city, gender: profile.gender } : { exists: false },
    history: { streak: history.streak, total_entries: history.entries.length, last_date: history.last_date },
  }, null, 2));
}

// ── Fortune (main flow) ──
async function cmdFortune() {
  await getClient(); // ensure OB identity exists
  const profile = loadProfile();
  const prefs = initPreferences();
  const today = new Date().toISOString().slice(0, 10);

  // 1. Get calendar data (L1 if available, else local fallback)
  let calendar;
  if (L1_OPENID) {
    try {
      calendar = await l1Request(L1_OPENID, "fortune:calendar", { date: today, city: profile?.city || "" });
    } catch (_) {
      calendar = getLocalCalendar(today);
    }
  } else {
    calendar = getLocalCalendar(today);
  }

  // 2. Determine flow type
  const isFirst = !hasTodayReading() && (loadHistory().entries.length === 0);
  const isSundayReview = isSunday() && !isFirst;

  // 3. Generate Aha moment data (Skill-side, no L1 needed for Phase 2)
  const ahaContext = calendar.solar_term?.name ? {
    aha_text: generateAha(calendar, "auto", "思维", ""), // center filled by CC
    genre: pickGenre("", loadHistory()),
    micro_action: generateMicroAction("充电日", "", ""), // filled by CC
  } : null;

  // 4. Build output for CC
  console.log(JSON.stringify({
    status: "ok",
    flow: isFirst ? "first_reading" : (isSundayReview ? "weekly_review" : "daily_fortune"),
    data: {
      profile: profile || { exists: false },
      calendar,
      history: {
        is_first_time: isFirst,
        is_sunday: isSundayReview,
        streak: getStreak(),
        total_entries: loadHistory().entries.length,
        week_entries: isSundayReview ? getWeekEntries() : [],
      },
      aha: ahaContext,
      preferences: {
        push_enabled: prefs.push_enabled,
        interest_tags: prefs.interest_tags,
      },
    },
    _instructions: isFirst
      ? "First reading. Execute 6-step analysis from SKILL.md. Output deep personality reading with evidence citations."
      : (isSundayReview
        ? "Sunday weekly review. Summarize this week's progress + update personality insight + append daily fortune."
        : "Daily fortune. Apply Aha Moment formula (节气×人格). Pick genre based on user's recent activity. Output light daily format."),
  }, null, 2));
}

// ── L1 Calendar ──
async function cmdL1Calendar() {
  if (!L1_OPENID) { console.log(JSON.stringify(getLocalCalendar())); return; }
  const date = getArg("--date") || new Date().toISOString().slice(0, 10);
  const city = getArg("--city") || "";
  console.log(JSON.stringify(await l1Request(L1_OPENID, "fortune:calendar", { date, city }), null, 2));
}

// ── L1 Personality ──
async function cmdL1Personality() {
  if (!L1_OPENID) { console.log(JSON.stringify({ error: "L1 not configured" })); process.exit(1); }
  const label = getArg("--label") || "";
  const center = getArg("--center") || "";
  const traits = getArg("--traits") || "";
  console.log(JSON.stringify(await l1Request(L1_OPENID, "fortune:personality", {
    label, center, traits: traits ? traits.split(",") : [],
  }), null, 2));
}

// ── L1 Request/Response helper ──
async function l1Request(to, action, data) {
  const { ob } = await getClient();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { stop(); reject(new Error(`L1 ${action} timed out`)); }, 15000);
    const stop = ob.startListening(async (msg) => {
      try {
        const resp = JSON.parse(msg.content);
        if (resp.request_id === requestId) { clearTimeout(timeout); stop(); resolve(resp); }
      } catch (_) {}
    }, { intervalMs: 500, skipSelf: true });
    ob.sendJson(to, { action, request_id: requestId, ...data }).catch((e) => { clearTimeout(timeout); stop(); reject(e); });
  });
}

function getArg(name) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
}

main().catch((e) => { console.error(JSON.stringify({ status: "error", message: e.message })); process.exit(1); });
