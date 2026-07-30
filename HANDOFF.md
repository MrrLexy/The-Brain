# The Brain — System Handoff

Everything needed to pick this project up cold. Written for someone who has not
seen it before.

---

## 1. What this is

A personal, phone-first set of small web apps. One hub page links out to each
one; NFC tags can be written to jump straight to any of them.

Design constraints that explain most of the decisions below:

- **Static hosting only.** Every page is plain HTML/CSS/JS on GitHub Pages. No
  build step, no framework, no server to keep running.
- **Free tier only.** GitHub Pages requires a **public** repo on a free plan
  (private repos need Pro). That's why everything here is public, and why no
  secret may ever live in page JavaScript.
- **iPhone is the target.** Safari has no Web NFC API, so a page can never read
  or write a tag itself. iOS *does* read NDEF URL tags natively at the OS level,
  so tags just carry URLs, and writing them is done once via the Shortcuts app.

---

## 2. The pieces

| Repo | Lives at | What it is |
|---|---|---|
| [The-Brain](https://github.com/MrrLexy/The-Brain) | [/The-Brain/](https://mrrlexy.github.io/The-Brain/) | Hub + Planner page. **You are here.** |
| [boardgame](https://github.com/MrrLexy/boardgame) | [/boardgame/](https://mrrlexy.github.io/boardgame/) | Game Night Menu — 146-game catalog |
| [boardgame-assets](https://github.com/MrrLexy/boardgame-assets) | jsDelivr CDN | Cover art + BGG data for the above |
| [morning-briefing](https://github.com/MrrLexy/morning-briefing) | [/morning-briefing/](https://mrrlexy.github.io/morning-briefing/) | Fixed income desk briefing |
| the-brain-worker | Cloudflare Worker | Write-side backend for the Planner |

**⚠️ `the-brain-worker` is not yet on GitHub.** It is committed locally at
`Documents\Claude\Projects\the-brain-worker` but has no remote. Create a repo
and push it — right now the Worker source exists on exactly one machine, while
the deployed Worker it corresponds to is load-bearing for the Planner.

```
                    ┌──────────────────────────┐
                    │  The Brain (hub)         │
                    │  data/manifest.json      │  ← add new pages here
                    └────────────┬─────────────┘
                                 │ links to
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                      ▼
    Game Night Menu         Planner & Ideas       Morning Briefing
          │                      │                      │
          │ reads covers         │ reads issues         │ reads data.json
          ▼                      │ (public API)         ▼
   boardgame-assets              │                 (local only,
   via jsDelivr CDN              │ writes via       gitignored)
                                 ▼
                          Cloudflare Worker ──> GitHub Issues API
                          (holds GitHub token)
```

---

## 3. Local checkouts

All under `C:\Users\a96ve\Documents\Claude\Projects\`:

| Folder | Remote |
|---|---|
| `the-brain\` | `MrrLexy/The-Brain` |
| `boardgame-repo\` | `MrrLexy/boardgame` — note the folder/repo names differ |
| `boardgame-assets\` | `MrrLexy/boardgame-assets` |
| `briefing\` | `MrrLexy/morning-briefing` — folder/repo names differ |
| `the-brain-worker\` | **none yet** |

Deploying anything is just `git push`. GitHub Pages redeploys in ~1–2 minutes.
There is no CI, no staging, no build.

---

## 4. Adding a page to the hub

1. Build it. Either a folder inside The-Brain (like `planner/`) or its own repo
   with its own Pages site (like `boardgame`).
2. Add an entry to `data/manifest.json`:
   ```json
   { "id": "slug", "title": "...", "description": "...", "url": "...", "emoji": "📌" }
   ```
   `url` may be relative (`planner/`) or absolute.
3. Give the new page a link back to the hub. Every page has one; match the
   host page's own styling rather than importing the hub's CSS:
   ```html
   <a class="back-link" href="https://mrrlexy.github.io/The-Brain/">← The Brain</a>
   ```
4. Push.

`app.js` reads the manifest, renders one card per entry, and — when the URL has
`?id=slug` — redirects straight to that entry instead of showing the list. That
redirect is the whole NFC mechanism.

---

## 5. NFC tags

A tag stores one URL:

```
https://mrrlexy.github.io/The-Brain/?id=boardgame
```

Writing one (iPhone, no third-party app needed):
**Shortcuts → Automation → + → NFC → Scan → Add Action → "Open URL" → paste →
turn off "Ask Before Running".**

Because the tag points at the hub with `?id=`, retargeting a tag later is a
one-line edit to `manifest.json` — the physical tag never needs rewriting.

---

## 6. Planner & Ideas — how the write path works

Storage is **GitHub Issues on the The-Brain repo itself**. No database.

- Category is a title prefix: `[Task] buy milk`, `[Idea] ...`, `[Goal] ...`,
  `[Skill] ...`
- Reading: the page calls the public GitHub API directly. No auth. Rate-limited
  to 60 requests/hour per IP unauthenticated — if the list briefly fails to
  load, that's usually why, and it clears itself within the hour.
- Writing: goes through the Cloudflare Worker (see its README). The page never
  holds a token; it sends a PIN, and the Worker holds the token.
- Closing an issue on GitHub = marking it done. Done items are hidden unless
  "Show done" is ticked.

**Known failure mode:** the GitHub token is a fine-grained PAT and **expires**.
When it does, Add fails with `GitHub API error 401: Bad credentials`. Fix is to
mint a new token and re-run `wrangler secret put GITHUB_TOKEN` — see the Worker
README. Nothing is lost; existing issues are unaffected.

---

## 7. Game Night Menu

Single `index.html`, self-contained. The 146-game collection is inlined as JSON
in `<script id="games-data">`.

Cover art and descriptions are **not** fetched live. BoardGameGeek's `xmlapi2`
now returns `401 Unauthorized` to unauthenticated requests, which broke the
original approach (it went through a public CORS proxy). Instead:

- `boardgame-assets` holds pre-fetched covers + `data/enrichment.json`
- the app loads them from jsDelivr's CDN in one request
- refresh with `node scripts/fetch-bgg-assets.mjs` in that repo, then commit and push

That script scrapes BGG's regular game pages (`GEEK.geekitemPreload`), which are
not locked down, and it shells out to `curl` deliberately: plain Node `fetch()`
gets a Cloudflare 403 on that domain due to TLS fingerprinting, `curl` does not.
It reads the game list straight out of `../boardgame-repo/index.html`, so the
two repos must sit side by side.

---

## 8. Morning Briefing

Fixed income desk briefing, PnR-styled. Published `index.html` is a finished
rendered document.

**Data policy is a hard constraint, not a preference.** Bloomberg's ToS
prohibits redistributing Terminal data. `data.json` is gitignored and must stay
local; only the rendered `index.html` is ever published. Read `DATA_POLICY.md`
in that repo before touching anything data-related.

Four ways to produce `data.json`, all writing the identical schema:

| Path | When |
|---|---|
| **`bbg_template.xlsx` → converter** | **Default.** Excel add-in only, no Python. Open the template, formulas refresh, Save As CSV, then convert via [the browser page](https://mrrlexy.github.io/morning-briefing/import/) or `import_bbg_paste.py`. Regenerate the template with `make_bbg_template.py` after changing the security list. |
| `fetch_bloomberg.py` | Bloomberg Terminal running locally. Needs `blpapi` + Terminal on port 8194. |
| `import_bbg_paste.py` | BBG Anywhere / web terminal. Paste a monitor grid; it maps real Bloomberg syntax (`GT10 Govt`) to internal shorthand (`GT10:GOV`) for you. |
| `import_manual_export.py` | You already have a CSV whose first column is internal shorthand. |

**The browser converter makes no network requests by design** — it parses the
file in-tab and hands back a download. That's what keeps it compatible with the
data policy; don't "improve" it by adding a server-side upload.

**⚠️ The payload schema is implemented twice** — `build_payload()` in Python and
`buildPayload()` in `import/index.html`. Change one, change the other. They were
verified byte-identical on the same input.

**⚠️ `index.html` is regenerated by an external process.** The back-link to the
hub is marked with an HTML comment asking to preserve it, but whatever
regenerates that file will drop it unless it's taught not to. If the back-link
disappears after a briefing run, that's why.

---

## 9. Open threads

- **Push `the-brain-worker` to GitHub.** Highest priority; single point of failure.
- **Token rotation.** The Planner's GitHub PAT expires. Calendar a reminder or
  switch to a longer expiry.
- **Briefing improvement backlog.** A list of ~25 suggestions (responsive
  ticker, "Desk Take" summary block, per-block timestamps, unit checks on IG
  OAS, curve context, template/data split) was raised but deliberately not
  acted on — it's a PM-facing document and the changes are judgment calls, not
  bugs. Two actual bugs from that list *were* fixed (TOC ordering). Reported
  mojibake was not reproducible in the file.
- **`data.json` timestamp reads `1970-01-01`**, i.e. the current local file is
  stale/placeholder. Fine for layout work; run one of the three importers before
  treating any displayed number as real.
