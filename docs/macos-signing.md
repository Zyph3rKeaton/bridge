# macOS Signed DMG Release Setup

This repo is configured to build a signed and notarized macOS DMG through GitHub Actions.

The workflow cannot complete until the Apple signing secrets are added to the GitHub repository.

## Why This Is Required

For a Mac app shared outside the App Store, Apple expects the app to be signed with a Developer ID certificate and notarized before normal users open it. This is what avoids the scary "Apple cannot check it" warning for most users.

References:

- Apple platform security: https://support.apple.com/guide/security/app-code-signing-process-sec3ad8e6e53/web
- Apple notarization: https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution
- electron-builder signing: https://www.electron.build/code-signing.html
- electron-builder macOS notarization: https://www.electron.build/electron-builder.interface.macconfiguration#notarize

## Required GitHub Secrets

Add these in GitHub:

Repository -> Settings -> Secrets and variables -> Actions -> New repository secret

| Secret | What It Is |
| --- | --- |
| `CSC_LINK` | Base64 text of the exported Developer ID Application `.p12` certificate |
| `CSC_KEY_PASSWORD` | Password used when exporting the `.p12` certificate |
| `APPLE_ID` | Apple ID email for the Apple Developer account |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for that Apple ID |
| `APPLE_TEAM_ID` | Apple Developer Team ID |

Never commit these values to the repo.

## Create The Certificate Secret

On a Mac signed in to the Apple Developer account:

1. Open **Keychain Access**.
2. Find the **Developer ID Application** certificate.
3. Export it as a `.p12` file.
4. Give the exported file a strong password.
5. Convert the `.p12` to base64 text:

```bash
base64 -i DeveloperIDApplication.p12 -o DeveloperIDApplication.base64.txt
```

6. Open `DeveloperIDApplication.base64.txt`.
7. Copy the full contents into the GitHub secret named `CSC_LINK`.
8. Put the export password into `CSC_KEY_PASSWORD`.

## Create The Apple Password

1. Go to https://appleid.apple.com/
2. Sign in with the Apple ID used for the developer account.
3. Create an app-specific password.
4. Save that value as `APPLE_APP_SPECIFIC_PASSWORD`.

## Find The Team ID

Go to:

https://developer.apple.com/account

Copy the Team ID and save it as `APPLE_TEAM_ID`.

## Build The Grandma DMG

1. Go to GitHub Actions.
2. Open **Desktop Builds**.
3. Click **Run workflow**.
4. Leave **Attach the signed DMG to a draft GitHub Release** checked.
5. Run it on `release/latest`.

The workflow will:

1. Build the app.
2. Sign the app.
3. Send it to Apple for notarization.
4. Check the notarization ticket.
5. Upload the DMG artifact.
6. Create a draft GitHub Release with only the DMG attached.

## Before Giving It To Grandma

On a Mac that is not the build machine:

1. Download the DMG from the draft release.
2. Open the DMG.
3. Drag **Bridge Scoring** into **Applications**.
4. Open **Bridge Scoring** from **Applications**.
5. Create a session.
6. Enter one score.
7. Open Results and confirm the score appears.

Only publish or send the release after this test passes.
