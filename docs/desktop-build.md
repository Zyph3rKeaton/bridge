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

1. Add the Apple signing secrets listed in `docs/macos-signing.md`.
2. Push this branch to GitHub.
3. Open GitHub Actions.
4. Run the `Desktop Builds` workflow.
5. Download the `bridge-scoring-macos-dmg` artifact, or use the draft GitHub Release created by the workflow.

The workflow now requires signing secrets. If they are missing, the macOS job fails instead of creating an unsigned DMG.

## AI OCR key

Grandma's copy should use Keaton's OpenAI API key so the AI photo reader works and billing stays on Keaton's account.

Do not commit the key and do not package a raw key into a public release. Grandma should paste the key once in **Settings** -> **OpenAI Key** -> **Save Key**. The app stores it in its private app data folder and reuses it on future launches.

For troubleshooting, the app writes a local `bridge.env` file in the app data folder:

```text
OPENAI_API_KEY=your-key-here
```

On Windows this folder is usually `%APPDATA%\Bridge Scoring`.
On macOS this folder is usually `~/Library/Application Support/Bridge Scoring`.

The AI scan workflow is the main score-entry path for grandma. Choosing a photo only previews it, and AI OCR runs only when `AI Parse`, `AI Parse & Import`, or `Find Edges` is pressed.
