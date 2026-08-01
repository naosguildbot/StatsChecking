import { TTLCache } from "./cache.js";

const HYPIXEL_BASE = "https://api.hypixel.net";
const MOJANG_BASE = "https://api.mojang.com";

// Player-facing data changes slowly, so cache it briefly to cut down on
// requests while still feeling live.
const cache = new TTLCache();
const UUID_TTL = 60 * 60 * 1000; // usernames -> uuid rarely change: 1h
const PLAYER_TTL = 2 * 60 * 1000; // profile / skyblock: 2 min

// Guard for the 300 requests / 5 minutes default key limit.
const WINDOW_MS = 5 * 60 * 1000;
const MAX_IN_WINDOW = 280; // headroom under 300
let callTimestamps = [];

function noteCall() {
  const now = Date.now();
  callTimestamps = callTimestamps.filter((t) => now - t < WINDOW_MS);
  callTimestamps.push(now);
}

function underLimit() {
  const now = Date.now();
  callTimestamps = callTimestamps.filter((t) => now - t < WINDOW_MS);
  return callTimestamps.length < MAX_IN_WINDOW;
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
export { ApiError };

function getKey() {
  const key = process.env.HYPIXEL_API_KEY;
  if (!key || key === "your-personal-api-key-here") {
    throw new ApiError(
      "No Hypixel API key configured. Copy .env.example to .env and add your key.",
      500
    );
  }
  return key;
}

// Resolve a Minecraft username to a UUID via Mojang (no Hypixel key needed).
export async function resolveUuid(username) {
  const clean = String(username || "").trim();
  if (!/^[a-zA-Z0-9_]{1,16}$/.test(clean)) {
    throw new ApiError("Invalid Minecraft username.", 400);
  }
  const cacheKey = `uuid:${clean.toLowerCase()}`;
  const { value } = await cache.wrap(cacheKey, UUID_TTL, async () => {
    const res = await fetch(
      `${MOJANG_BASE}/users/profiles/minecraft/${encodeURIComponent(clean)}`
    );
    if (res.status === 404 || res.status === 204) {
      throw new ApiError(`No Minecraft account named "${clean}".`, 404);
    }
    if (!res.ok) {
      throw new ApiError("Could not reach Mojang to resolve the username.", 502);
    }
    const data = await res.json();
    return { uuid: data.id, name: data.name };
  });
  return value;
}

async function hypixelGet(path, params) {
  if (!underLimit()) {
    throw new ApiError(
      "Local rate-limit guard tripped (protecting your key). Try again shortly.",
      429
    );
  }
  const url = new URL(HYPIXEL_BASE + path);
  for (const [k, v] of Object.entries(params || {})) {
    url.searchParams.set(k, v);
  }
  noteCall();
  const res = await fetch(url, { headers: { "API-Key": getKey() } });

  if (res.status === 429) {
    throw new ApiError("Hypixel rate limit hit. Please wait a bit.", 429);
  }
  if (res.status === 403) {
    throw new ApiError("Hypixel rejected the API key (invalid or expired).", 403);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new ApiError(data?.cause || `Hypixel API error (${res.status}).`, res.status || 502);
  }
  return data;
}

export async function getPlayer(uuid) {
  const { value, cached } = await cache.wrap(
    `player:${uuid}`,
    PLAYER_TTL,
    () => hypixelGet("/v2/player", { uuid })
  );
  return { data: value, cached };
}

export async function getSkyblockProfiles(uuid) {
  const { value, cached } = await cache.wrap(
    `sbprofiles:${uuid}`,
    PLAYER_TTL,
    () => hypixelGet("/v2/skyblock/profiles", { uuid })
  );
  return { data: value, cached };
}
