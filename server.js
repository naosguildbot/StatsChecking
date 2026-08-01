import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveUuid,
  getPlayer,
  getSkyblockProfiles,
  ApiError,
} from "./lib/hypixel.js";
import { summarizeProfiles } from "./lib/skyblock.js";
import { summarizeGames } from "./lib/minigames.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// --- General-profile parsing ---------------------------------------------

// Hypixel network level (Plancke's reverse formula).
function networkLevel(exp) {
  if (!exp || exp < 0) return 1;
  return Math.floor(1 + -3.5 + Math.sqrt(12.25 + 0.0008 * exp));
}

const STRIP_COLOR = /§./g;

function resolveRank(p) {
  if (!p) return "NONE";
  if (p.prefix) return p.prefix.replace(STRIP_COLOR, "").replace(/[[\]]/g, "").trim();
  if (p.rank && p.rank !== "NORMAL") {
    return { YOUTUBER: "YouTube", GAME_MASTER: "Game Master" }[p.rank] || titleCase(p.rank);
  }
  if (p.monthlyPackageRank === "SUPERSTAR") return "MVP++";
  const pkg = p.newPackageRank || p.packageRank;
  return (
    {
      MVP_PLUS: "MVP+",
      MVP: "MVP",
      VIP_PLUS: "VIP+",
      VIP: "VIP",
    }[pkg] || "None"
  );
}

function titleCase(s) {
  return String(s)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function summarizePlayer(player, fallbackName) {
  if (!player) {
    return { hasData: false, reason: "This player has never logged into Hypixel." };
  }
  return {
    hasData: true,
    name: player.displayname || fallbackName,
    rank: resolveRank(player),
    networkLevel: networkLevel(player.networkExp || 0),
    karma: player.karma || 0,
    achievementPoints: player.achievementPoints || 0,
    firstLogin: player.firstLogin || null,
    lastLogin: player.lastLogin || null,
  };
}

// --- API route ------------------------------------------------------------

app.get("/api/stats", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) throw new ApiError("Provide a Minecraft username.", 400);

    const { uuid, name: canonicalName } = await resolveUuid(name);

    const [playerRes, sbRes] = await Promise.all([
      getPlayer(uuid),
      getSkyblockProfiles(uuid),
    ]);

    res.json({
      uuid,
      name: canonicalName,
      cached: playerRes.cached && sbRes.cached,
      profile: summarizePlayer(playerRes.data.player, canonicalName),
      games: summarizeGames(playerRes.data.player),
      skyblock: summarizeProfiles(sbRes.data, uuid),
    });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    if (!(err instanceof ApiError)) console.error(err);
    res.status(status || 500).json({ error: err.message || "Something went wrong." });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, keyConfigured: Boolean(process.env.HYPIXEL_API_KEY) });
});

// --- Static UI ------------------------------------------------------------

app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`\n  Hypixel personal stats running at http://localhost:${PORT}`);
  if (!process.env.HYPIXEL_API_KEY) {
    console.log("  ⚠  No HYPIXEL_API_KEY set — copy .env.example to .env and add your key.\n");
  }
});
