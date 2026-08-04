# Hypixel Personal Stats

A small, self-hosted web app that looks up a Minecraft player's Hypixel general
profile and a summary of their SkyBlock stats.

> Not affiliated with Hypixel Inc. or Mojang/Microsoft. Reads data from the
> official public Hypixel API.

---

## Setup

1. Install [Node.js](https://nodejs.org/) 18 or newer.
2. Get an API key: sign in at [developer.hypixel.net](https://developer.hypixel.net/),
   create an application, and generate a key.
3. In this folder:
   ```bash
   npm install
   cp .env.example .env        # then paste your key into .env
   npm start
   ```
4. Open <http://localhost:3000> and search a username.

Your key lives only in `.env` (git-ignored) and is used server-side — it never
reaches the browser.

### Changing the key later

When you regenerate/renew your key, swap it in with:

```bash
./set-key.sh <new-api-key>
```

Then restart the app (`pkill -f 'node server.js'; npm start`). Or just edit the
`HYPIXEL_API_KEY` line in `.env` by hand.

---

## What it shows

- **General profile:** rank, network level, achievement points, karma, first/last login.
- **Minigames:** BedWars, SkyWars, Duels, Murder Mystery, Build Battle, The Pit,
  and TNT Games — wins, ratios, and key per-mode stats.
- **SkyBlock:** selected profile, skill average and per-skill levels, catacombs
  level, purse/bank coins, total slayer XP. (Some fields are hidden if the
  player has that API setting turned off.)

## Project layout

```
server.js          Express server + general-profile parsing
lib/hypixel.js     API client: key handling, caching, rate-limit guard
lib/skyblock.js    SkyBlock stat summarizer
lib/cache.js       Tiny in-memory TTL cache
public/            Front-end (HTML/CSS/JS)
```

## License

MIT.
