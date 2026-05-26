/**
 * OB Identity bootstrap — auto-register on first run, restore from disk thereafter.
 * Credentials stored at ~/.lucky-lobster/ob-credentials.json
 */
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(os.homedir(), ".lucky-lobster");
const CRED_FILE = path.join(DATA_DIR, "ob-credentials.json");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function loadOrCreateIdentity(createOceanBus) {
  ensureDir(DATA_DIR);

  // 1. Try restore from disk
  const saved = loadCreds();
  if (saved) {
    const ob = await createOceanBus({
      keyStore: { type: "memory" },
      identity: {
        agent_id: saved.agent_id,
        api_key: saved.api_key,
        openid: saved.openid,
      },
    });
    return { ob, openid: saved.openid, agentId: saved.agent_id, created: false };
  }

  // 2. No saved creds → first run → auto-register
  const ob = await createOceanBus({ keyStore: { type: "memory" } });
  const reg = await ob.createIdentity();
  const openid = await ob.getAddress();

  saveCreds(reg.agent_id, reg.api_key, openid);

  return { ob, openid, agentId: reg.agent_id, created: true };
}

function loadCreds() {
  try {
    if (fs.existsSync(CRED_FILE)) {
      const raw = fs.readFileSync(CRED_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (data.agent_id && data.api_key && data.openid) return data;
    }
  } catch (_) { /* corrupt file — re-register */ }
  return null;
}

function saveCreds(agentId, apiKey, openid) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(
    CRED_FILE,
    JSON.stringify(
      { agent_id: agentId, api_key: apiKey, openid, created_at: new Date().toISOString() },
      null,
      2
    )
  );
}

export function getCredsPath() {
  return CRED_FILE;
}

export function getDataDir() {
  return DATA_DIR;
}
