# Distortion Library – Concept & Integration Plan


## 1. Distortion Catalogue (Normalised)

| # | Name | Short Description | Core Parameters |
|---|------|-------------------|-----------------|
| 1 | Ripple | Concentric waves from a point. | `center`, `amplitude`, `frequency`, `speed`, `time` |
| 2 | Polar / Swirl | Cartesian→Polar warp for swirls. | `center`, `scale`, `angleOffset`, `zoom` |
| 3 | Wave | Sinusoidal displacement (hor / vert). | `direction`, `amplitude`, `frequency`, `speed`, `time` |
| 4 | Twist | Angle increases with radius. | `center`, `maxAngle`, `radius` |
| 5 | Bulge / Pinch | Radial squeeze or inflate. | `center`, `radius`, `strength` |
| 6 | Barrel / Fisheye | Lens‑like outward curve. | `barrelPower` |

All distortions are **UV‑coordinate modifiers** → we ​sample the original gradient through a distortion function.

### Seamless Polar / Swirl (edge‑seam workaround)

Problem A pure Cartesian→Polar warp leaves a vertical seam because the
left & right edges of the source bitmap do not match.

Solution Pre–build a **mirrored‑wide bitmap** before entering the
distortion stage.

1. **Prepare source**  
   * Create an off‑screen canvas `wideCanvas` = `2 × width  ×  height`.  
   * `drawImage(original, 0, 0)` – left half.  
   * `ctx.scale(-1,1); drawImage(original, -2×width, 0)` – right half mirrored.

2. **Sample rule**  
   * Compute `(u', v')` as usual from screen pixels.  
   * Use **`u = (u' * 2) mod 1`** when reading from `wideCanvas`  
     (because width doubled).  
   * The polar mapping now reads identical colours at 0 and 2 π, removing the seam.

3. **Integration points**  
   * `DistortionManager.prepareSource()` – return `wideCanvas`
     when the active stack contains *Polar / Swirl*.  
   * Keep the original off‑screen canvas for all other distortions.

4. **Performance**  
   * Mirroring is an `ctx.drawImage` copy, negligible cost.  
   * Memory ↑ 2× only when effect enabled.

5. **Edit‑mode impact**  
   * Inverse mapping uses the *original* (non‑mirrored) width.  
   * Therefore the inverse for Polar first maps `(u',v')`
     → `(angle, radius)` → `(u, v)` (0‑1) **then halves `u`** to drop
     the mirrored half.

---

## 2. Proposed Architecture in Current App

```
MeshGradient (already renders to <canvas>)
       │
       ▼
Off‑screen canvas  (original gradient bitmap)
       │
DistortionPipeline.apply(ctx, distortionStack[])
       │
On‑screen canvas
```

1. **Keep the existing gradient render untouched.**  
2. Introduce `DistortionManager` (new file) that:
   * Holds an ordered stack of active distortions with their parameters.
   * Exposes `.apply(sourceCanvas, targetCtx)` which for now loops pixels in JS; later can switch to WebGL shader for perf.
3. Extend `ui.js`:
   * Add accordion section **“Distortions”** with toggle & parameter inputs per effect.
   * Live‑update `DistortionManager` stack; then call `meshGradient.render()` → passes the off‑screen to manager.

### File Map (new / changed)
```
js/
  distortion/
      ripple.js
      polar.js
      wave.js
      twist.js
      bulge.js
      barrel.js
  distortionManager.js        <-- orchestrates
  meshGradient.js             <-- minor: provide off‑screen bitmap
  ui.js                       <-- new controls
```

---

## 3. Implementation Notes

* **Performance** – Canvas 2‑D per‑pixel loops are slow; acceptable for ≤1 MP at 30 FPS. Provide a “High‑Quality” toggle that runs distortion once and caches bitmap.
* **Composability** – Distortions receive/get `u, v` in range `0‑1`, return new `u, v`.
* **Coordinate System** – Normalise to `[0,1]` to keep math simple regardless of canvas resize.
* **Animation** – A single `requestAnimationFrame` loop in `DistortionManager` updates `time` and triggers re‑render when at least one dynamic distortion (speed ≠ 0) is enabled.

---

## 4. Phase Plan

1. **Phase 1 – Infrastructure (1 day)**
   * Off‑screen render in `MeshGradient`.
   * Implement `DistortionManager` with no‑op pass.
2. **Phase 2 – Static Distortions (2 days)**
   * Bulge/Pinch, Twist → sliders.
3. **Phase 3 – Animated Distortions (2 days)**
   * Ripple, Wave with time uniform.
4. **Phase 4 – Optimisation (optional)**
   * WebGL shader path / `createImageBitmap` workers.

---

## 5. Edit‑Mode & Interaction (Distortion‑Aware)

Problem  
When a distortion is active the visual centre/border positions no longer match the original Voronoi sites.  
Dragging a site with the mouse therefore feels “off”.

### Strategy A – Inverse Mapping (preferred)
1. Each distortion must expose an **inverse (u’, v’) → (u, v)** function (analytical or numeric).
2. On **pointer events** we:
   * Normalise screen coordinates → `(u’, v’)`.
   * Pipe through the inverse stack **in reverse order** to obtain original `(u, v)`.
   * Feed that into `Voronoi.findClosestSiteIndex`.
3. For the overlay drawing we can
   * Either draw in original space then run it through the *forward* distortion stack onto an off‑screen canvas and blit it,
   * Or draw directly in distorted coordinates by pre‑distorting each vertex once.

### Strategy B – Disable Edit Mode Under Distortion
Simpler UX‑wise: if any distortion ≠ no‑op, grey‑out the “Show Cell Centres & Borders” toggle and display a tooltip *“Disable distortions to edit cells”*.

Implementation order  
1. Build inverse functions for *static* distortions (Twist, Bulge) → proof of concept.  
2. Add pointer‑transform utility in `DistortionManager`.  
3. Decide via UX testing whether Strategy A’s complexity is justified; fall back to B otherwise.

---

## 6. Phase Plan

1. **Phase 1 – Infrastructure (1 day)**
   * Off‑screen render in `MeshGradient`.
   * Implement `DistortionManager` with no‑op pass.
2. **Phase 2 – Static Distortions (2 days)**
   * Bulge/Pinch, Twist → sliders.
3. **Phase 3 – Animated Distortions (2 days)**
   * Ripple, Wave with time uniform.
4. **Phase 4 – Optimisation (optional)**
   * WebGL shader path / `createImageBitmap` workers.

---

## 7. Outstanding Questions

* **Performance** of inverse mapping on each mouse‑move? → cache per‑distortion inverse maths; keep site count small.  
* **Overlay antialiasing** when double‑sampling through distortions.  
* **Mobile**: multi‑touch pinch‑zoom plus distortion?

---

*Last updated: 2024‑06‑XX*