// SkyBlock stat parsing helpers. Kept intentionally lightweight — this is a
// personal profile summary, not a full networth calculator.

// Cumulative XP required to reach each skill level (index = level, 0..60).
const SKILL_XP = [
  0, 50, 175, 375, 675, 1175, 1925, 2925, 4425, 6425, 9925, 14925, 22425,
  32425, 47425, 67425, 97425, 147425, 222425, 322425, 522425, 822425, 1222425,
  1722425, 2322425, 3022425, 3822425, 4722425, 5722425, 6822425, 8022425,
  9322425, 10722425, 12222425, 13822425, 15522425, 17322425, 19222425,
  21222425, 23322425, 25522425, 27822425, 30222425, 32722425, 35322425,
  38072425, 40972425, 44072425, 47472425, 51172425, 55172425, 59472425,
  64072425, 68972425, 74172425, 79672425, 85472425, 91572425, 97972425,
  104672425,
];

// Cumulative XP for dungeon / catacombs levels (index = level, 0..50).
const CATA_XP = [
  0, 50, 125, 235, 395, 625, 955, 1425, 2095, 3045, 4375, 6255, 8875, 12525,
  17685, 24945, 35165, 49535, 69715, 98035, 137795, 193605, 271925, 381935,
  536135, 752335, 1055535, 1481135, 2078135, 2915135, 4089135, 5734135,
  8032135, 11256135, 15777135, 22112135, 30980135, 43390135, 60766135,
  85115135, 119215135, 166940135, 233740135, 327140135, 457940135, 641140135,
  897640135, 1256640135, 1758640135, 2460640135, 3443640135,
];

// Skills counted toward the "skill average" (excludes carpentry/runecrafting/social).
const AVERAGE_SKILLS = [
  "farming", "mining", "combat", "foraging", "fishing",
  "enchanting", "alchemy", "taming",
];

function levelFromTable(xp, table) {
  if (!xp || xp <= 0) return 0;
  let level = 0;
  for (let i = 0; i < table.length; i++) {
    if (xp >= table[i]) level = i;
    else break;
  }
  return level;
}

// The SkyBlock API has moved fields around over the years. Read the new
// location first, fall back to the legacy one, so this keeps working.
function pick(...vals) {
  return vals.find((v) => v !== undefined && v !== null);
}

function getSkillXp(member, skill) {
  return pick(
    member?.player_data?.experience?.[`SKILL_${skill.toUpperCase()}`],
    member?.[`experience_skill_${skill}`]
  );
}

function getSlayerBosses(member) {
  return pick(member?.slayer?.slayer_bosses, member?.slayer_bosses) || {};
}

// Given a full /v2/skyblock/profiles response, summarise one player's stats.
export function summarizeProfiles(profilesResponse, uuid) {
  const profiles = profilesResponse?.profiles || [];
  if (profiles.length === 0) {
    return { hasData: false, reason: "No SkyBlock profiles found for this player." };
  }

  // Prefer the profile flagged as "selected" for this member; else the first.
  const selected =
    profiles.find((p) => p?.members?.[uuid]?.selected) ||
    profiles.find((p) => p?.selected) ||
    profiles[0];

  const member = selected?.members?.[uuid];
  if (!member) {
    return { hasData: false, reason: "This player has no data on their profiles." };
  }

  // Skills — may be hidden if the player disabled the Skills API setting.
  const skills = {};
  let skillApiEnabled = false;
  const allSkills = [...AVERAGE_SKILLS, "carpentry", "runecrafting", "social"];
  for (const s of allSkills) {
    const xp = getSkillXp(member, s);
    if (xp !== undefined) {
      skillApiEnabled = true;
      skills[s] = { xp, level: levelFromTable(xp, SKILL_XP) };
    }
  }

  let skillAverage = null;
  if (skillApiEnabled) {
    const counted = AVERAGE_SKILLS.map((s) => skills[s]?.level).filter(
      (l) => l !== undefined
    );
    if (counted.length) {
      skillAverage =
        Math.round((counted.reduce((a, b) => a + b, 0) / counted.length) * 100) /
        100;
    }
  }

  // Slayers.
  const bosses = getSlayerBosses(member);
  const slayers = {};
  let slayerTotalXp = 0;
  for (const [name, data] of Object.entries(bosses)) {
    const xp = data?.xp || 0;
    slayerTotalXp += xp;
    slayers[name] = xp;
  }

  // Dungeons / catacombs.
  const cataXp =
    member?.dungeons?.dungeon_types?.catacombs?.experience ?? null;
  const catacombs =
    cataXp !== null
      ? { xp: cataXp, level: levelFromTable(cataXp, CATA_XP) }
      : null;

  // Coins.
  const purse = pick(member?.currencies?.coin_purse, member?.coin_purse) ?? null;
  const bank = selected?.banking?.balance ?? null;

  return {
    hasData: true,
    profileName: selected?.cute_name || "Unknown",
    profileId: selected?.profile_id,
    skillApiEnabled,
    skillAverage,
    skills,
    slayers,
    slayerTotalXp,
    catacombs,
    purse,
    bank,
  };
}
