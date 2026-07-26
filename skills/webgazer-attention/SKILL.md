---
name: webgazer-attention
description: Eye-tracking UI with WebGazer.js for attention-aware web experiences. Calibrate, stream gaze, heatmaps. Complements hand gestures.
---

# WebGazer Attention

## Upstream
https://github.com/brownhci/WebGazer

## Pattern
```html
<script src="webgazer.js"></script>
<script>
webgazer.setGazeListener((data, elapsed) => {
  if (!data) return;
  // data.x, data.y
}).begin();
</script>
```

## Use with Path
- Gaze dwell on bay pill → soft-highlight section
- Combined with gestures skill for multimodal control
- Always consent UI for camera
