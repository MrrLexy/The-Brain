# The Brain

Personal NFC-tag hub. Each tag encodes a URL like:

```
https://mrrlexy.github.io/The-Brain/?id=<item-id>
```

Tapping a tag opens this page, which looks up `<item-id>` in `data/manifest.json`
and redirects straight to that item's own URL. Visiting the root with no `?id`
shows a directory of everything registered.

Standalone apps (like the board game menu) stay in their own repos — this hub
just points at them. `data/manifest.json` is the only file you edit to add,
rename, or retarget a tag; no redeploy of the linked app needed.

## Adding a new item

1. Add an entry to `data/manifest.json`:
   ```json
   { "id": "my-thing", "title": "...", "description": "...", "url": "...", "emoji": "..." }
   ```
2. Commit and push (or edit directly on github.com from your phone).
3. Write an NFC tag with `https://mrrlexy.github.io/The-Brain/?id=my-thing`
   (iOS: Shortcuts app → Automation → "Write Tags").

## Current items

- `boardgame` → [Game Night Menu](https://mrrlexy.github.io/boardgame/)
