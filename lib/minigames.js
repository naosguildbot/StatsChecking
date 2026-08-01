// Parse minigame stats out of the /v2/player response (player.stats.<Game>).
// No extra API calls — it's all in the player object we already fetched.

function ratio(a, b) {
  a = a || 0;
  b = b || 0;
  if (b === 0) return a === 0 ? "0" : String(a);
  return (a / b).toFixed(2);
}

function skywarsLevel(xp) {
  const table = [0, 20, 70, 150, 250, 500, 1000, 2000, 3500, 6000, 10000, 15000];
  if (!xp) return 0;
  if (xp >= 15000) return Math.floor((xp - 15000) / 10000) + 12;
  let level = 0;
  for (let i = 0; i < table.length; i++) {
    if (xp >= table[i]) level = i + 1;
    else break;
  }
  return level;
}

// Each entry -> a card: { key, name, stats: [{label, value}] }.
export function summarizeGames(player) {
  const s = player?.stats || {};
  const ach = player?.achievements || {};
  const games = [];

  // BedWars
  const bw = s.Bedwars;
  if (bw) {
    games.push({
      key: "bedwars",
      name: "BedWars",
      stats: [
        { label: "Star", value: ach.bedwars_level ?? "—" },
        { label: "Wins", value: bw.wins_bedwars ?? 0 },
        { label: "WLR", value: ratio(bw.wins_bedwars, bw.losses_bedwars) },
        { label: "FKDR", value: ratio(bw.final_kills_bedwars, bw.final_deaths_bedwars) },
        { label: "Final kills", value: bw.final_kills_bedwars ?? 0 },
        { label: "Beds broken", value: bw.beds_broken_bedwars ?? 0 },
        { label: "Winstreak", value: bw.winstreak ?? "—" },
      ],
    });
  }

  // SkyWars
  const sw = s.SkyWars;
  if (sw) {
    games.push({
      key: "skywars",
      name: "SkyWars",
      stats: [
        { label: "Star", value: skywarsLevel(sw.skywars_experience) },
        { label: "Wins", value: sw.wins ?? 0 },
        { label: "WLR", value: ratio(sw.wins, sw.losses) },
        { label: "Kills", value: sw.kills ?? 0 },
        { label: "KDR", value: ratio(sw.kills, sw.deaths) },
        { label: "Winstreak", value: sw.win_streak ?? "—" },
      ],
    });
  }

  // Duels
  const du = s.Duels;
  if (du) {
    games.push({
      key: "duels",
      name: "Duels",
      stats: [
        { label: "Wins", value: du.wins ?? 0 },
        { label: "WLR", value: ratio(du.wins, du.losses) },
        { label: "Kills", value: du.kills ?? 0 },
        { label: "KDR", value: ratio(du.kills, du.deaths) },
        { label: "Current WS", value: du.current_winstreak ?? "—" },
        { label: "Best WS", value: du.best_overall_winstreak ?? "—" },
      ],
    });
  }

  // Murder Mystery
  const mm = s.MurderMystery;
  if (mm) {
    games.push({
      key: "murdermystery",
      name: "Murder Mystery",
      stats: [
        { label: "Wins", value: mm.wins ?? 0 },
        { label: "Kills", value: mm.kills ?? 0 },
        { label: "Games", value: mm.games ?? 0 },
        { label: "Detective wins", value: mm.detective_wins ?? 0 },
        { label: "Murderer wins", value: mm.murderer_wins ?? 0 },
      ],
    });
  }

  // Build Battle
  const bb = s.BuildBattle;
  if (bb) {
    games.push({
      key: "buildbattle",
      name: "Build Battle",
      stats: [
        { label: "Wins", value: bb.wins ?? 0 },
        { label: "Score", value: bb.score ?? 0 },
        { label: "Games", value: bb.games_played ?? 0 },
        { label: "Correct guesses", value: bb.correct_guesses ?? 0 },
      ],
    });
  }

  // The Pit
  const pit = s.Pit?.pit_stats_ptl;
  if (pit) {
    games.push({
      key: "pit",
      name: "The Pit",
      stats: [
        { label: "Kills", value: pit.kills ?? 0 },
        { label: "KDR", value: ratio(pit.kills, pit.deaths) },
        { label: "Assists", value: pit.assists ?? 0 },
        { label: "Max streak", value: pit.max_streak ?? "—" },
      ],
    });
  }

  // TNT Games
  const tnt = s.TNTGames;
  if (tnt) {
    games.push({
      key: "tntgames",
      name: "TNT Games",
      stats: [
        { label: "Wins", value: tnt.wins ?? 0 },
        { label: "TNT Run wins", value: tnt.wins_tntrun ?? 0 },
        { label: "PVP Run wins", value: tnt.wins_pvprun ?? 0 },
        { label: "Bowspleef wins", value: tnt.wins_bowspleef ?? 0 },
      ],
    });
  }

  return games;
}
