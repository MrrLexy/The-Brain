# The Brain

Personal phone-first hub. One page that links to every small app, plus NFC tag
support so a physical tap opens any of them.

**Live:** <https://mrrlexy.github.io/The-Brain/>

> New to this project? Read **[HANDOFF.md](HANDOFF.md)** — full architecture,
> every repo, known failure modes, and open threads.

## Layout

```
index.html          hub shell
app.js              reads manifest, renders cards, handles ?id= redirect
style.css           shared styling (planner extends it)
data/manifest.json  the list of pages — edit this to add one
planner/            Planner & Ideas page
```

## Pages

| | Page | Where |
|---|---|---|
| 🎲 | Game Night Menu | [own repo](https://github.com/MrrLexy/boardgame) |
| 🗒️ | Planner & Ideas | `planner/` here |
| 📈 | Morning Market Update | [own repo](https://github.com/MrrLexy/morning-briefing) |

## Adding a page

Add an entry to `data/manifest.json`:

```json
{ "id": "slug", "title": "...", "description": "...", "url": "planner/", "emoji": "📌" }
```

`url` can be relative or absolute. Push; Pages redeploys in a minute or two.
Then give the new page a back-link to the hub — see HANDOFF.md §4.

## NFC tags

Each tag stores `https://mrrlexy.github.io/The-Brain/?id=<slug>`. Visiting with
`?id=` redirects straight to that page; without it you get the card list.
Retargeting a tag is a manifest edit, not a rewrite of the tag.

To write one on iPhone: **Shortcuts → Automation → NFC → Scan tag → Open URL →**
paste the URL, then turn off "Ask Before Running".

## Planner & Ideas

Notes are stored as **GitHub Issues on this repo**, categorized by title prefix
(`[Task]`, `[Idea]`, `[Goal]`, `[Skill]`). Closing an issue marks it done.

Reading needs no auth. Writing goes through a small Cloudflare Worker that holds
a GitHub token server-side — a static page can't hold one safely. The page
prompts once for a PIN and caches it locally.

If **Add** starts failing with `Bad credentials`, the GitHub token has expired.
See the Worker's README for rotation steps.
