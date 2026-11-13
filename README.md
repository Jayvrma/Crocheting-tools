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

## Installing

Download `crocheting-tools-1.0.0 Setup.exe` from the
[Releases](https://github.com/Jayvrma/Crocheting-tools/releases) page and run it,
or unzip the portable `.zip` and run `crocheting-tools.exe`. Windows only.
Nothing else is needed: the app carries its own copy of Python for reading PDFs.

Windows may show a "Windows protected your PC" warning because the app isn't
code-signed. Click **More info → Run anyway**.

## Developing

- Node.js (for Electron Forge)
- Python 3 on your `PATH` as `python`, with PyMuPDF installed
  (`python -m pip install -r requirements.txt`). `npm start` runs
  `data/parse.py` with it.

`npm run make` builds the installer and zip into `out/make/`. The first build
downloads Python's embeddable package into `python-dist/` and installs PyMuPDF
into it; later builds reuse it.


## Where data is kept

Uploaded PDFs and parsed patterns live in Electron's user data folder
(`%APPDATA%\crocheting-tools` on Windows), not in the repo. Row-tracker
progress is stored per pattern in the app's local storage.
