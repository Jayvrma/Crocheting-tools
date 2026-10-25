# Crochet label

A local [Label Studio](https://labelstud.io/) setup for annotating written
crochet patterns — tagging stitches, counts, repeats and row structure as text
spans so the patterns can be parsed programmatically.

## What's here

| Path | Purpose |
|---|---|
| `.venv/` | Python 3.12 virtualenv with Label Studio installed (gitignored) |
| `requirements.txt` | The one direct dependency, `label-studio` |
| `scripts/start.ps1` | Starts the server on http://localhost:8080 |
| `label-config/crochet-pattern-ner.xml` | The labeling interface — paste into project settings |
| `label-config/ANNOTATION_GUIDE.md` | Label definitions and boundary rules |
| `data/sample-patterns.json` | Six seed tasks to import, including a deliberately messy one |
| `.label-studio/` | Runtime data: SQLite DB, uploads, exports (gitignored) |
| `.env.example` | Copy to `.env` to change port, data dir, or the bootstrap account |

## First run

```powershell
.\scripts\start.ps1
```

Then open http://localhost:8080 and create an account (it's stored locally in
`.label-studio/`; nothing leaves your machine).

## Setting up the project

1. **Create a project** — name it anything, e.g. *Crochet patterns*.
2. **Labeling setup** → *Custom template* → *Code* tab. Delete the placeholder
   and paste the contents of `label-config/crochet-pattern-ner.xml`. Save.
3. **Import** → drop in `data/sample-patterns.json`. Label Studio will read it
   as six tasks; the `title` and `source` fields show as context above the text.
4. Read `label-config/ANNOTATION_GUIDE.md` before your first pass — the
   count/stitch separation rule in particular is easy to get wrong and annoying
   to fix later.

## Exporting

Project → **Export** → `JSON` gives you spans with character offsets plus the
relations between them. `JSON-MIN` is flatter and easier to eyeball but drops
relations, so prefer full `JSON` for anything you'll train on.

## Adding your own patterns

Tasks are just a JSON array; each object needs a `data` key whose fields match
the `$variables` in the labeling config:

```json
[
  {
    "data": {
      "title": "Pattern name",
      "source": "where it came from",
      "text": "Rnd 1: 6 sc in a magic ring (6)\n..."
    }
  }
]
```

Plain `.txt` files also work — Label Studio maps the file contents to `$text`
automatically, but you lose the title/source context, so JSON is worth the
extra keystrokes.

If you're importing patterns you didn't write, keep the `source` field honest
and check the license before publishing an annotated corpus — most published
crochet patterns are copyrighted, and a span-annotated copy is still a copy.

## Notes on this environment

- Python lives at `%LOCALAPPDATA%\Programs\Python\Python312\` and is **not** on
  your `PATH`. The start script uses the venv directly, so this doesn't matter
  day to day, but `python` in a bare terminal will still hit the Microsoft Store
  stub.
- This repo sits in OneDrive. `.venv/` and `.label-studio/` are gitignored but
  OneDrive will still try to sync them — thousands of small files plus a live
  SQLite database. If startup feels slow or you see sync conflicts, right-click
  each folder → *Free up space* is not enough; exclude them via OneDrive
  settings → *Choose folders*, or move the repo outside OneDrive.
- `git` isn't on your `PATH` either, so commit from your editor or GitHub
  Desktop until that's fixed.

## Reinstalling from scratch

```powershell
Remove-Item -Recurse -Force .venv
& "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe" -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```
