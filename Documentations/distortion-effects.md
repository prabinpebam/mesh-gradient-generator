# Mesh Gradient Distortion Effects

This document provides a comprehensive overview of the distortion effect system in the Mesh Gradient Generator. Distortion effects allow users to apply various transformations to the rendered gradient, creating more complex and interesting visual patterns.

## 1. Architecture Overview

The distortion system uses a post-processing approach where effects are applied after the gradient has been rendered to an off-screen canvas:

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│ Render Gradient   │────►│ Apply Distortions │────►│ Display Result    │
│ (Off-screen)      │     │ (Transform)       │     │ (Main Canvas)     │
└───────────────────┘     └───────────────────┘     └───────────────────┘
```

### 1.1 Core Components

1. **DistortionManager**: Central controller that manages the application of distortion effects
2. **Effect Implementations**: Individual distortion algorithms (Ripple, Polar, Wave, etc.)
3. **UI Controls**: Parameter sliders and input fields for customizing effects

### 1.2 Implementation Strategy

All distortions are implemented as **UV-coordinate transformations**. This means:

1. For each pixel in the output (x,y):
   - Transform to normalized coordinates (u,v) in range [0,1]
   - Apply distortion function to get new coordinates (u',v')
   - Sample the source gradient at (u',v')
   - Set the output pixel to the sampled color

This allows complex visual effects with relatively simple math.

## 2. Distortion Stack

The system uses a stack-based approach allowing multiple distortions to be combined:

```javascript
// Example distortion stack
[
  {
    type: 'polar',
    opts: { centerX: 0.5, centerY: 0.5, angleOffset: 0.1, zoom: 1.2 }
  },
  // Additional distortions could be stacked here
]
```

The current implementation applies the first distortion in the stack.

## 3. Distortion Types

### 3.1 Polar / Swirl

Transforms the gradient from Cartesian to Polar coordinates, creating spiral effects.

#### Parameters

| Parameter    | Description | Range | Default |
|-------------|------------|-------|---------|
| `centerX`   | Horizontal center point | 0.0-1.0 | 0.5 |
| `centerY`   | Vertical center point | 0.0-1.0 | 0.5 |
| `angleOffset` | Rotation angle | 0.0-1.0 | 0.0 |
| `zoom`      | Magnification factor | 0.1-2.0 | 1.0 |

#### Implementation Notes

To avoid visible seams at the 0-2π boundary, this distortion:
1. Creates a mirrored-wide bitmap (2× width)
2. Mirrors the original gradient horizontally
3. Uses `u' = angle * 2.0` for sampling, allowing wraparound
4. Applies bilinear sampling for smooth results

```javascript
// Simplified polar transformation
function polarTransform(u, v, opts) {
  // Normalize to center
  const dx = (u - opts.centerX) * 2;
  const dy = (v - opts.centerY) * 2;
  
  // Convert to polar coordinates
  let angle = Math.atan2(dy, dx) / (2 * Math.PI) + 0.5;
  angle = (angle + opts.angleOffset) % 1.0;
  
  const radius = Math.min(1.0, Math.sqrt(dx*dx + dy*dy) / opts.zoom);
  
  // Return new coordinates - note u is doubled for wide texture
  return { u: angle * 2.0, v: radius };
}
```

### 3.2 Ripple

Creates concentric waves emanating from a center point.

#### Parameters

| Parameter    | Description | Range | Default |
|-------------|------------|-------|---------|
| `centerX`   | Horizontal center point | 0.0-1.0 | 0.5 |
| `centerY`   | Vertical center point | 0.0-1.0 | 0.5 |
| `amplitude` | Wave height | 0.0-0.1 | 0.03 |
| `frequency` | Wave density | 1-50 | 10 |
| `speed`     | Animation speed | 0.0-5.0 | 1.0 |
| `time`      | Time parameter (for animation) | auto | auto |

#### Implementation

```javascript
// Simplified ripple transformation
function rippleTransform(u, v, opts, time) {
  // Calculate distance from center
  const dx = u - opts.centerX;
  const dy = v - opts.centerY;
  const dist = Math.sqrt(dx*dx + dy*dy);
  
  // Calculate displacement based on distance
  const angle = dist * opts.frequency - opts.time * opts.speed;
  const displacement = opts.amplitude * Math.sin(angle) / (1 + dist);
  
  // Apply radial displacement
  const factor = displacement / dist;
  return {
    u: u + dx * factor,
    v: v + dy * factor
  };
}
```

### 3.3 Wave

Creates sinusoidal displacement horizontally or vertically.

#### Parameters

| Parameter    | Description | Range | Default |
|-------------|------------|-------|---------|
| `direction` | Wave direction (0=horizontal, 1=vertical) | 0-1 | 0 |
| `amplitude` | Wave height | 0.0-0.2 | 0.05 |
| `frequency` | Wave density | 1-20 | 5 |
| `speed`     | Animation speed | 0.0-5.0 | 1.0 |
| `time`      | Time parameter (for animation) | auto | auto |

#### Implementation

```javascript
// Simplified wave transformation
function waveTransform(u, v, opts, time) {
  if (opts.direction === 0) { // Horizontal
    return {
      u: u,
      v: v + opts.amplitude * Math.sin(u * opts.frequency + opts.time * opts.speed)
    };
  } else { // Vertical
    return {
      u: u + opts.amplitude * Math.sin(v * opts.frequency + opts.time * opts.speed),
      v: v
    };
  }
}
```

### 3.4 Twist

Creates a spiral twist effect with rotation increasing with radius.

#### Parameters

| Parameter    | Description | Range | Default |
|-------------|------------|-------|---------|
| `centerX`   | Horizontal center point | 0.0-1.0 | 0.5 |
| `centerY`   | Vertical center point | 0.0-1.0 | 0.5 |
| `maxAngle`  | Maximum rotation angle in turns | 0.0-5.0 | 1.0 |
| `radius`    | Effect radius | 0.0-1.0 | 0.5 |

#### Implementation

```javascript
// Simplified twist transformation
function twistTransform(u, v, opts) {
  // Calculate distance from center
  const dx = u - opts.centerX;
  const dy = v - opts.centerY;
  const dist = Math.sqrt(dx*dx + dy*dy);
  
  // Calculate angle based on distance
  const angleFactor = Math.min(1.0, dist / opts.radius);
  const rotationAngle = opts.maxAngle * 2 * Math.PI * angleFactor;
  
  // Apply rotation
  const sin = Math.sin(rotationAngle);
  const cos = Math.cos(rotationAngle);
  return {
    u: opts.centerX + dx * cos - dy * sin,
    v: opts.centerY + dx * sin + dy * cos
  };
}
```

### 3.5 Bulge / Pinch

Creates a lens-like effect that either inflates or squeezes the gradient.

#### Parameters

| Parameter    | Description | Range | Default |
|-------------|------------|-------|---------|
| `centerX`   | Horizontal center point | 0.0-1.0 | 0.5 |
| `centerY`   | Vertical center point | 0.0-1.0 | 0.5 |
| `radius`    | Effect radius | 0.0-1.0 | 0.5 |
| `strength`  | Effect strength (negative for pinch) | -1.0 to 1.0 | 0.5 |

#### Implementation

```javascript
// Simplified bulge/pinch transformation
function bulgeTransform(u, v, opts) {
  // Calculate distance from center
  const dx = u - opts.centerX;
  const dy = v - opts.centerY;
  const dist = Math.sqrt(dx*dx + dy*dy);
  
  // Calculate displacement factor
  const factor = Math.pow(Math.sin(Math.min(1.0, dist / opts.radius) * Math.PI / 2), Math.abs(opts.strength)) 
                 * Math.sign(opts.strength);
  
  // Calculate new distance
  const newDist = dist * (1.0 + factor);
  const scaleFactor = dist > 0 ? newDist / dist : 1;
  
  return {
    u: opts.centerX + dx * scaleFactor,
    v: opts.centerY + dy * scaleFactor
  };
}
```

### 3.6 Barrel / Fisheye

Creates a curved lens effect like a barrel or fisheye distortion.

#### Parameters

| Parameter    | Description | Range | Default |
|-------------|------------|-------|---------|
| `barrelPower` | Distortion power (negative for pincushion) | -1.0 to 1.0 | 0.5 |

#### Implementation

```javascript
// Simplified barrel/fisheye transformation
function barrelTransform(u, v, opts) {
  // Normalize coordinates to [-1, 1]
  const x = (u - 0.5) * 2;
  const y = (v - 0.5) * 2;
  
  // Calculate radius squared
  const r2 = x*x + y*y;
  
  // Apply barrel distortion
  const power = opts.barrelPower;
  const f = 1 + r2 * power;
  
  // Transform back to [0, 1]
  return {
    u: 0.5 + (x * f) / 2,
    v: 0.5 + (y * f) / 2
  };
}
```

## 4. Integration with the Rendering Pipeline

The distortion system is integrated into the main render pipeline of the MeshGradientCore class:

```javascript
render(colors = null, preserveColors = false) {
  // ... existing code ...
  
  // Draw cells to offscreen canvas
  this.renderer.drawCellsToCanvas(this.offCtx, cells, this.data);
  
  // Apply effects
  if (this.data.blurAmount > 0) {
    this.renderer.applyBlur(this.data.blurAmount);
  }
  
  // Apply distortions and draw to main canvas
  this.ctx.clearRect(0, 0, this.width, this.height);
  this.data.distortions.apply(this.offCanvas, this.ctx);
  
  // ... existing code ...
}
```

The order of operations is important:
1. Render gradient to off-screen canvas
2. Apply blur if enabled
3. Apply distortion effects
4. Draw UI elements (if in edit mode)

## 5. Dynamic Distortion Parameters

For distortions that use time-based animation (Ripple, Wave), the `time` parameter is automatically updated by an animation system:

```javascript
// Example of how time is managed
applyDistortion(canvas, ctx, opts) {
  // Update time parameter for animated effects
  if (this.animated) {
    const now = performance.now() / 1000;
    opts.time = (opts.time || 0) + (now - this.lastTime) * opts.speed;
    this.lastTime = now;
  }
  
  // Apply the distortion
  this.applyTransformation(canvas, ctx, opts);
}
```

## 6. Interaction with Edit Mode

When distortions are active, edit mode is disabled to prevent confusion with cell positions:

```javascript
setDistortionStack(stack) {
  this.data.distortions.setStack(stack);
  if (this.data.distortions.hasActive() && this.editMode) {
    this.setEditMode(false);
  }
  this.render();
}
```

This ensures that the user experience remains intuitive and avoids the complexity of inverse-mapping mouse coordinates through distortions.

## 7. Bilinear Sampling

For high-quality results, distortions use bilinear sampling when reading source pixels:

```javascript
const bilinearSample = (imgData, x, y, w, h) => {
  // Clamp coordinates to valid range
  x = Math.max(0, Math.min(w - 1.001, x));
  y = Math.max(0, Math.min(h - 1.001, y));
  
  const x1 = Math.floor(x);
  const y1 = Math.floor(y);
  const x2 = Math.min(x1 + 1, w - 1);
  const y2 = Math.min(y1 + 1, h - 1);
  
  const dx = x - x1;
  const dy = y - y1;
  
  // Get pixel indices
  const i1 = (y1 * w + x1) * 4;
  const i2 = (y1 * w + x2) * 4;
  const i3 = (y2 * w + x1) * 4;
  const i4 = (y2 * w + x2) * 4;
  
  // Bilinear interpolation
  const r = (1-dx)*(1-dy)*imgData[i1]   + dx*(1-dy)*imgData[i2]   + (1-dx)*dy*imgData[i3]   + dx*dy*imgData[i4];
  const g = (1-dx)*(1-dy)*imgData[i1+1] + dx*(1-dy)*imgData[i2+1] + (1-dx)*dy*imgData[i3+1] + dx*dy*imgData[i4+1];
  const b = (1-dx)*(1-dy)*imgData[i1+2] + dx*(1-dy)*imgData[i2+2] + (1-dx)*dy*imgData[i3+2] + dx*dy*imgData[i4+2];
  const a = (1-dx)*(1-dy)*imgData[i1+3] + dx*(1-dy)*imgData[i2+3] + (1-dx)*dy*imgData[i3+3] + dx*dy*imgData[i4+3];
  
  return [r, g, b, a];
};
```

This ensures smooth transformations without pixelation artifacts.

## 8. Creating Custom Distortion Effects

To add a new distortion effect:

1. Create a new file (`myEffect.js`) in the `distortion/` directory
2. Implement the distortion object with an `apply` method:

```javascript
const DistortionMyEffect = {
  apply: function(srcCanvas, targetContext, options) {
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    const srcCtx = srcCanvas.getContext('2d');
    const srcImg = srcCtx.getImageData(0, 0, w, h);
    const dstImg = targetContext.createImageData(w, h);
    
    // Default options
    const opts = {
      param1: options.param1 || 0.5,
      param2: options.param2 || 0.5
    };
    
    // For each pixel in the output
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Normalize coordinates to [0,1]
        const u = x / w;
        const v = y / h;
        
        // Apply your transformation
        const { u: u2, v: v2 } = myTransformFunction(u, v, opts);
        
        // Convert back to pixel coordinates
        const sx = u2 * w;
        const sy = v2 * h;
        
        // Sample source (with bilinear sampling)
        const [r, g, b, a] = bilinearSample(srcImg.data, sx, sy, w, h);
        
        // Write to destination
        const i = (y * w + x) * 4;
        dstImg.data[i]     = r;
        dstImg.data[i + 1] = g;
        dstImg.data[i + 2] = b;
        dstImg.data[i + 3] = a;
      }
    }
    
    targetContext.putImageData(dstImg, 0, 0);
  }
};
```

3. Add the effect to the distortionManager.js handler map:

```javascript
const map = {
  // ... existing effects ...
  myEffect: DistortionMyEffect.apply
};
```

4. Update the UI to include options for your new effect.

## 9. Performance Considerations

Distortion effects can be computationally intensive, especially at larger canvas sizes:

- The system uses a pixel-by-pixel approach in JavaScript for maximum compatibility
- Each pixel requires multiple operations and memory accesses
- For animated effects, performance impact is more noticeable

Potential optimizations:
- Use WebGL shaders for GPU-accelerated distortions
- Apply distortions at reduced resolution for previewing
- Cache static distortion results
- Use Web Workers for parallel processing

## 10. Future Enhancements

Potential improvements to the distortion system:

1. **WebGL implementation**: Use shaders for GPU acceleration
2. **Full distortion stack support**: Apply multiple distortions in sequence
3. **Parameter animations**: Animate distortion parameters for more dynamic effects
4. **Masking support**: Apply distortions selectively to parts of the gradient
5. **Custom distortion paths**: Allow users to draw custom distortion paths
6. **Edit-mode integration**: Implement inverse mapping for distorted edit mode

---