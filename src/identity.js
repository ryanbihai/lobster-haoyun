/**
 * OB Identity bootstrap — memory keystore + manual persistence.
 *
 * SDK v0.14.2: file keystore auto-generates keys but sendJson fails after
 * createIdentity(). Workaround: use memory keystore and save/restore
 * { agent_id, api_key, openid } manually to ~/.lucky-lobster/ob-credentials.json.
 */
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(os.homedir(), ".lucky-lobster");
const CRED_FILE = path.join(DATA_DIR, "ob-credentials.json");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadCreds() {
  try {
    if (fs.existsSync(CRED_FILE)) {
      const data = JSON.parse(fs.readFileSync(CRED_FILE, "utf-8"));
      if (data.agent_id && data.api_key && data.openid) return data;
    }
  } catch (_) {}
  return null;
}

function saveCreds(agentId, apiKey, openid) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(CRED_FILE, JSON.stringify({
    agent_id: agentId, api_key: apiKey, openid,
    created_at: new Date().toISOString(),
  }, null, 2));
}

export async function loadOrCreateIdentity(createOceanBus) {
  ensureDir(DATA_DIR);

  const saved = loadCreds();

  if (saved) {
    // Restore existing identity
    const ob = await createOceanBus({
      keyStore: { type: "memory" },
      identity: {
        agent_id: saved.agent_id,
        api_key: saved.api_key,
        openid: saved.openid,
      },
    });
    const openid = await (typeof ob.getAddress === 'function'
      ? ob.getAddress()
      : ob.getOpenId());
    return { ob, openid, agentId: saved.agent_id, created: false };
  }

  // First run — create fresh identity (triggers PoW)
  const ob = await createOceanBus({ keyStore: { type: "memory" } });
  const reg = await (typeof ob.createIdentity === 'function'
    ? ob.createIdentity()
    : ob.register());
  const openid = await (typeof ob.getAddress === 'function'
    ? ob.getAddress()
    : ob.getOpenId());

  saveCreds(reg.agent_id, reg.api_key, openid);

  return { ob, openid, agentId: reg.agent_id, created: true };
}

export function getDataDir() {
  return DATA_DIR;
}
