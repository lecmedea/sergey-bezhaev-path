---
name: mediapipe-hands
description: MediaPipe Hands + TF.js hand landmarks in the browser. Detection, landmarks, gesture classifiers. Foundation for Path swipe/clap.
---

# MediaPipe Hands

## CDN
```
@mediapipe/hands
@mediapipe/camera_utils
@mediapipe/drawing_utils
```

## Gestures recipe
1. Track palm center over frames
2. dx threshold → swipe
3. Two hands distance → clap
4. bbox height/frame height → distance proxy

## Related
- gesture-canvas, HandCam-Control, jshg, handsfree.js models
