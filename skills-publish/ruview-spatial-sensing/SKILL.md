---
name: ruview-spatial-sensing
description: Integrate RuView WiFi DensePose / spatial intelligence patterns. ESP32 CSI presence, motion, vitals. Not pure browser — edge hardware. For Grok, Codex, Kimi agents building sensing products.
---

# RuView Spatial Sensing

## Upstream
https://github.com/ruvnet/RuView — WiFi CSI → presence, breathing, heart rate, motion, optional pose. ESP32 + optional Cognitum Seed.

## When to use
- Contactless room presence without cameras
- Through-wall / dark-room sensing
- Smart home (HA / Matter / Apple Home)

## When NOT to use in pure web
Browser JS cannot read WiFi CSI. For **website hand control**, use `gesture-path-control` (MediaPipe).

## Agent checklist
1. Hardware: ESP32-S3 CSI node (~$9)
2. Firmware flash + provision WiFi
3. Docker sim: `docker run -p 3000:3000 ruvnet/wifi-densepose:latest`
4. Python: `pip install ruview` or `wifi-densepose`
5. Map events → product actions (presence → welcome sound, fall → alert)

## Mapping to Bezhaev Path (concept)
- Presence near display → enable gesture layer
- No presence → dim HUD
- Still requires camera for precise hand swipe on GH Pages without ESP32 mesh
