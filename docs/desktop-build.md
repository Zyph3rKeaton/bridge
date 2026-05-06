# Desktop Build

## Windows testing

Run from the repo root:

```powershell
npm run desktop:win
```

The local test app is written to `apps/electron/dist/win-unpacked/`.
Run `apps/electron/dist/win-unpacked/Bridge Scoring.exe`.

## macOS DMG

Windows cannot build or run a DMG. To make one for testing:

1. Push this branch to GitHub.
2. Open GitHub Actions.
3. Run the `Desktop Builds` workflow.
4. Download the `bridge-scoring-macos-dmg` artifact.

This DMG is for testing. It is unsigned and not notarized.

## AI OCR key

Do not package an OpenAI API key into the app. For desktop testing, create a local `bridge.env` file in the app data folder:

```text
OPENAI_API_KEY=your-key-here
```

On Windows this folder is usually `%APPDATA%\Bridge Scoring`.
On macOS this folder is usually `~/Library/Application Support/Bridge Scoring`.

The AI scan workflow is click-driven: choosing a photo only previews it, and AI OCR runs only when `AI Parse`, `AI Parse & Import`, or `Find Edges` is pressed.
