# Hypixel Personal Stats

A small, self-hosted web app for **personal use** that looks up a Minecraft
player's Hypixel general profile and a summary of their SkyBlock stats.

> **Not affiliated with, endorsed by, or connected to Hypixel Inc. or
> Mojang/Microsoft.** Minecraft and Hypixel are trademarks of their respective
> owners. This project only reads data from the official public Hypixel API.

---

## How to run it

1. **Install [Node.js](https://nodejs.org/) 18 or newer.**
2. **Get a personal API key.** Sign in at
   [developer.hypixel.net](https://developer.hypixel.net/), create an
   application (see the suggested description below), and generate a key.
3. In this folder:
   ```bash
   npm install
   cp .env.example .env        # then paste your key into .env
   npm start
   ```
4. Open <http://localhost:3000> and search a username.

Your key lives only in `.env` (which is git-ignored) and is used **server-side
only** — it is never sent to the browser.

---

## How this app stays within the Hypixel API Terms

The Hypixel [developer policies](https://developer.hypixel.net/policies/) allow
personal tools but forbid a few specific things. Here's how each is handled:

| Rule in the ToS | How this app complies |
| --- | --- |
| *"designed to be used by players, not automated data collection at scale"* | Every request is triggered by **you clicking Look up**. There is no background job, scraper, cron, or queue. |
| *No session tracking / continuous stat polling* | The app never re-fetches on a timer and stores nothing between runs. One search = one on-demand fetch. |
| *No tracking or de-anonymizing specific players* | Nothing is persisted. Results live in memory only, briefly, then expire. |
| *"utilize caching to reduce requests"* | Responses are cached in memory (2 min for stats, 1 h for username→UUID) via `lib/cache.js`. |
| *Respect the rate limit* | A local guard keeps requests under the 300-per-5-minute default in `lib/hypixel.js`, and it honors Hypixel's `403`/`429` responses. |
| *Never share/expose your key* | The key is read from `.env` on the server. It is git-ignored and never reaches client code. |
| *No proxy-for-third-parties, gambling, or recreating the game* | This is a read-only stats viewer bound to your local machine. |
| *State non-affiliation* | Shown in the UI footer and at the top of this README. |

### Keep it personal-use

- Run it **locally** (`localhost`). Don't deploy it as a public service on a
  shared host — the ToS specifically warns against putting keys on shared IPs.
- Don't add scheduled/bulk lookups. Keep it one-search-at-a-time.
- Make at least one request every couple of weeks, or Hypixel may disable an
  idle application.

---

## Suggested text for the developer portal application

When you register the app on developer.hypixel.net, it asks what the app does.
Something honest and specific like this is what gets personal keys approved:

> **Name:** Personal Stats Viewer
> **Description:** A private, self-hosted web page I run on my own computer to
> look up my friends' and my own general Hypixel profile and SkyBlock stats on
> demand. It is not public, has no users other than me, does no automated or
> scheduled polling, caches responses to minimize requests, and stores no data.

---

## What it shows

- **General profile:** rank, network level, achievement points, karma, first/last login.
- **SkyBlock:** selected profile, skill average and per-skill levels, catacombs
  level, purse/bank coins, total slayer XP. (Some fields are hidden if the
  player has that API setting turned off — that's normal and respected.)

## Project layout

```
server.js          Express server + general-profile parsing
lib/hypixel.js     API client: key handling, caching, rate-limit guard
lib/skyblock.js    SkyBlock stat summarizer
lib/cache.js       Tiny in-memory TTL cache
public/            Front-end (HTML/CSS/JS) — no key ever reaches here
```

## License

MIT. Use at your own discretion and follow the current Hypixel API Terms.
