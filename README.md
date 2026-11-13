# Crochet Tools

An Electron app for working through written crochet patterns. Upload a PDF
pattern, let the parser pull out its materials, abbreviations and rounds,
correct anything it got wrong, then track your progress row by row.

## Pages

| Page | What it does |
|---|---|
| Upload | Copies a PDF pattern into the app |
| Files | Lists uploaded PDFs, previews them, and runs **Analyze** |
| Review | Edit the parsed abbreviations, materials and rounds next to the PDF |
| View | Materials, abbreviations and a row tracker for the selected pattern |

## Requirements

- Node.js (for Electron Forge)
- Python 3 on your `PATH` as `python`, with PyMuPDF installed — the app runs
  `data/parse.py` to read PDFs:

```powershell
python -m pip install -r requirements.txt
```

## Running

```powershell
npm install
npm start
```

`npm run make` builds an installer into `out/`.

## Where data is kept

Uploaded PDFs and parsed patterns live in Electron's user data folder
(`%APPDATA%\crocheting-tools` on Windows), not in the repo. Row-tracker
progress is stored per pattern in the app's local storage.
