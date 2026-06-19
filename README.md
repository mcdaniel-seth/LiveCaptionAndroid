# Live Caption Android

An installable phone-friendly web app that listens to the microphone and shows fast live English captions.

## What It Uses

- Android Chrome's built-in speech recognition through the Web Speech API.
- A Progressive Web App shell, so it can be installed to your Android home screen.
- No server, build step, or external packages.

## Run Locally

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

Local desktop testing works on `localhost`. For Android phone microphone access, host it with HTTPS. The easiest path is GitHub Pages after pushing this repo.

## Install On Android

1. Publish this repo with GitHub Pages or another HTTPS host.
2. Open the HTTPS URL in Android Chrome.
3. Tap the browser menu.
4. Choose `Add to Home screen` or `Install app`.
5. Open the installed app and grant microphone permission.

## Notes

- English is the default language: `en-US`.
- Chrome performs speech recognition using the browser/platform service, so internet access may be required.
- For a future native Android version, the next step would be Kotlin plus Android's `SpeechRecognizer` API or an on-device model.

# LiveCaptionAndroid
