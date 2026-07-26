---
name: jarvis-holo-lab
description: Build dual holographic voice assistants (JARVIS male cyan + SOPHIA pink) on static portfolio sites. Web Speech STT/TTS male voice selection, draggable FABs, Gemini chat, holopanel UI. Inspired by open Jarvis/Sophia repos. For Grok, Codex, Gemini, Kimi.
---

# JARVIS Holo Lab (Bezhaev)

## When to use
User wants a Stark-lab style dual assistant on a web portfolio without a heavy backend.

## Stack
- Web Speech API (STT + TTS)
- Male voice picker (filter OS voices: Yuri/Pavel/David/Daniel; pitch ~0.82)
- Gemini REST optional (`localStorage` API key)
- Draggable FABs (pointer/touch, persist position)
- Cyan hologram panel CSS + scanlines
- Second agent Sophia (pink/violet) for future multi-agent debate

## Reference repos (patterns only)
- https://github.com/RustamovAkrom/JARVIS
- https://github.com/Saka1r/Jarvis
- https://github.com/K0mp0t/jarvis
- https://github.com/kishanrajput23/Jarvis-Desktop-Voice-Assistant
- https://github.com/ganeshnikhil/J.A.R.V.I.S.2.0
- https://github.com/small-cactus/M.I.L.E.S
- https://github.com/pratit989/JARVIS
- https://github.com/Arnav3241/Jarvis-v13
- https://github.com/gabrielcdb/RealJarvis
- https://github.com/MrAliHasan/Sophia-AI-Assistant

## Implementation map (Path site)
- `js/jarvis.js` — JARVIS
- `js/sophia.js` — SOPHIA
- `assets/ui/jarvis-fab.gif` / `sophia-fab.gif`
- `css/boot.css` hologram classes

## Multi-agent future
Shared event bus `path-assistant-message` so agents can interrupt/argue.
