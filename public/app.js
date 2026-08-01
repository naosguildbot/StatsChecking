const form = document.getElementById("search");
const input = document.getElementById("username");
const go = document.getElementById("go");
const statusEl = document.getElementById("status");
const results = document.getElementById("results");

const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString("en-US"));
const shortNum = (n) => {
  if (n == null) return "—";
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (a >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (a >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(Math.round(n));
};
const date = (ms) =>
  ms ? new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle("error", isError);
}

function stat(label, value) {
  return `<div class="stat"><div class="label">${label}</div><div class="value">${value}</div></div>`;
}

function renderProfile(name, uuid, profile) {
  const avatar = `https://crafatar.com/avatars/${uuid}?size=112&overlay`;
  const head = `
    <div class="player-head">
      <img src="${avatar}" alt="" width="56" height="56"
           onerror="this.style.visibility='hidden'" />
      <div class="who">
        <span class="name">${name}</span>
        <span class="badge">${profile.hasData ? profile.rank : "No Hypixel data"}</span>
      </div>
    </div>`;

  if (!profile.hasData) {
    return `<div class="card">${head}<p class="note">${profile.reason}</p></div>`;
  }

  const grid = [
    stat("Network level", fmt(profile.networkLevel)),
    stat("Achievement points", fmt(profile.achievementPoints)),
    stat("Karma", fmt(profile.karma)),
    stat("First login", date(profile.firstLogin)),
    stat("Last login", date(profile.lastLogin)),
  ].join("");

  return `<div class="card">${head}<div class="grid" style="margin-top:16px">${grid}</div></div>`;
}

function renderGames(games) {
  if (!games || games.length === 0) {
    return `<div class="card"><h2>Minigames</h2><p class="note">No minigame stats found (the player may have their API off, or hasn't played these).</p></div>`;
  }
  return games
    .map((g) => {
      const tiles = g.stats
        .map((t) => stat(t.label, typeof t.value === "number" ? fmt(t.value) : t.value))
        .join("");
      return `<div class="card"><h2>${g.name}</h2><div class="grid">${tiles}</div></div>`;
    })
    .join("");
}

function renderSkyblock(sb) {
  if (!sb.hasData) {
    return `<div class="card"><h2>SkyBlock</h2><p class="note">${sb.reason}</p></div>`;
  }

  const top = [
    stat("Profile", sb.profileName),
    stat("Skill average", sb.skillAverage == null ? "Hidden" : sb.skillAverage.toFixed(2)),
    sb.catacombs ? stat("Catacombs", sb.catacombs.level) : "",
    stat("Purse", shortNum(sb.purse)),
    stat("Bank", shortNum(sb.bank)),
    stat("Slayer XP", shortNum(sb.slayerTotalXp)),
  ].join("");

  let skillsBlock = "";
  if (sb.skillApiEnabled) {
    const rows = Object.entries(sb.skills)
      .sort((a, b) => b[1].level - a[1].level)
      .map(([name, s]) => {
        const pct = Math.min(100, (s.level / 60) * 100);
        return `<div class="skill-row">
          <span class="sname">${name}</span>
          <span class="bar"><span style="width:${pct}%"></span></span>
          <span class="slvl">${s.level}</span>
        </div>`;
      })
      .join("");
    skillsBlock = `<h2 style="margin-top:18px">Skills</h2><div class="skills">${rows}</div>`;
  } else {
    skillsBlock = `<p class="note">This player has their Skills API turned off, so skill levels are hidden.</p>`;
  }

  return `<div class="card">
    <h2>SkyBlock — ${sb.profileName}</h2>
    <div class="grid">${top}</div>
    ${skillsBlock}
  </div>`;
}

async function lookup(name) {
  go.disabled = true;
  results.hidden = true;
  results.innerHTML = "";
  setStatus("Looking up " + name + "…");
  try {
    const res = await fetch("/api/stats?name=" + encodeURIComponent(name));
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lookup failed.");

    results.innerHTML =
      renderProfile(data.name, data.uuid, data.profile) +
      renderGames(data.games) +
      renderSkyblock(data.skyblock);
    results.hidden = false;
    setStatus(data.cached ? "Showing cached result (refreshes automatically)." : "");
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    go.disabled = false;
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = input.value.trim();
  if (name) lookup(name);
});
