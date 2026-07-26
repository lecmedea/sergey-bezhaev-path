---
name: gesture-path-control
description: Browser gesture navigation for horizontal portfolio sites using MediaPipe Hands. Wave L/R, clap home, near-range (~2m) heuristic. For Grok, Codex, Kimi.
---

# Gesture Path Control

## When to use
User wants camera hand-control on a static site (GitHub Pages): swipe bays, clap to home, no native app.

## Stack
- MediaPipe Hands (CDN `@mediapipe/hands`)
- `getUserMedia` user-facing camera
- Optional: WebGazer for gaze (separate skill)
- RuView is **WiFi CSI** (ESP32) — not a drop-in browser module; document hardware path separately

## Site integration (Path)
1. Expose `window.PathAPI = { goNext, goPrev, goHome, goToIndex }`
2. Load `js/gestures.js` after path engine
3. UI toggle in Settings
4. Map:
   - hand swipe left/right → prev/next
   - two-hand clap (palms close) → home
   - hand bbox size → near-field gate (~2m heuristic)

## Privacy
- Camera local only; no upload
- Explicit user enable

## Sources
- https://github.com/google-ai-edge/mediapipe
- https://github.com/tensorflow/tfjs
- https://handsfreejs.netlify.app/#models
- https://nhudinhtuan.github.io/jshg/
- https://github.com/brownhci/WebGazer
- https://github.com/GreenHacker420/gesture-canvas
- https://github.com/Johnsuuuu/gesture-recognition
- https://github.com/fikriaf/HandCam-Control
