# Mesh Gradient Hue Animation

This document outlines the implementation of the hue animation feature in the Mesh Gradient system. This feature allows colors in the gradient to shift their hue values over time while maintaining their relative relationships, creating dynamic and visually engaging color transitions.

## 1. Goals and Requirements

### 1.1 Core Functionality
- Animate the hue of all colors in the canvas at a configurable rate
- Maintain the relative hue differences between colors during animation
- Support adjustable animation speed (1-100 degrees per second) with default of 15
- Support bidirectional hue rotation (clockwise/counterclockwise)
- Operate at 60fps frame rate target for smooth transitions
- Work both independently and alongside cell position animation
- Support pausing/resuming animation with color state preservation
- Allow animation speed changes during active animation

### 1.2 Integration Requirements
- Seamlessly integrate with the existing color management system
- Respect locked colors (which should not animate)
- Maintain expected UI behaviors during animation (hovering, editing, etc.)
- Ensure proper state management when starting/stopping animation
- Allow continuation of animation after explicit color changes
- Handle cell count changes during active animation
- Properly update color swatches in real-time during animation
- Provide appropriate events for UI components to react to animation state changes

## 2. System Architecture

### 2.1 HueAnimator Module Design

```javascript
class HueAnimator {
   constructor(core) {
      this.core = core;              // Reference to MeshGradientCore
      this.active = false;           // Whether animation is active
      this.frameId = null;           // Animation frame ID
      this.startTime = 0;            // Animation start timestamp
      this.pauseTime = 0;            // Time when animation was paused
      this.totalPausedTime = 0;      // Total time animation was paused
      this.paused = false;           // Whether animation is paused
      this.baseColors = [];          // Original colors to transform
      this.speed = 15;               // Degrees per second (1-100)
      this.direction = true;         // true=clockwise, false=counter-clockwise
      this.previousTimestamp = 0;    // For tracking frame timing
      this.colorLockState = {};      // Track which cells have locked colors
   }

   // Core animation methods
   start() {
      if (this.active) return;
      this.active = true;
      this.paused = false;
      this.startTime = performance.now();
      this.totalPausedTime = 0;
      this.updateBaseColors();
      this.captureColorLockState();
      this.frameId = requestAnimationFrame(this.animate.bind(this));
      this.core.dispatchEvent('hueAnimationStateChanged', { active: true });
   }
   
   pause() {
      if (!this.active || this.paused) return;
      this.paused = true;
      this.pauseTime = performance.now();
      cancelAnimationFrame(this.frameId);
      this.core.dispatchEvent('hueAnimationStateChanged', { paused: true });
   }
   
   resume() {
      if (!this.active || !this.paused) return;
      this.paused = false;
      this.totalPausedTime += performance.now() - this.pauseTime;
      this.frameId = requestAnimationFrame(this.animate.bind(this));
      this.core.dispatchEvent('hueAnimationStateChanged', { paused: false });
   }
   
   stop() {
      if (!this.active) return;
      cancelAnimationFrame(this.frameId);
      this.active = false;
      this.paused = false;
      // Update baseColors to current animated colors to prevent color jumps
      this.baseColors = this.getCurrentColors();
      this.core.dispatchEvent('hueAnimationStateChanged', { active: false });
   }
   
   animate(timestamp) {
      if (!this.active || this.paused) return;
      
      // Calculate elapsed time, accounting for pauses
      const elapsedTime = (timestamp - this.startTime - this.totalPausedTime) / 1000; // in seconds
      
      // Calculate current colors based on elapsed time
      const currentColors = this.calculateHueAdjustedColors(elapsedTime);
      
      // Render with the adjusted colors
      this.core.render(currentColors, { preserveColors: true });
      
      // Track performance if needed
      this.previousTimestamp = timestamp;
      
      // Request next frame
      this.frameId = requestAnimationFrame(this.animate.bind(this));
   }
   
   // Color calculation methods
   calculateHueAdjustedColors(elapsedTime) {
      // Calculate total hue offset
      const hueOffset = (this.speed * elapsedTime) % 360 * 
                    (this.direction ? 1 : -1);
     
      // Apply offset to each base color
      return this.baseColors.map(color => {
         // Skip locked colors
         if (this.colorLockState[color.cellIndex]) {
            return {...color};
         }
        
         // Calculate new hue (0-359 range)
         let newHue = (color.h + hueOffset) % 360;
         if (newHue < 0) newHue += 360;
        
         // Create new color with updated hue
         return {
            ...color,
            h: newHue,
            s: color.s,
            l: color.l,
            hex: this.hslToHex(newHue, color.s, color.l),
            cellIndex: color.cellIndex
         };
      });
   }
   
   getCurrentColors() {
      return this.core.getAllColors();
   }
   
   updateBaseColors() {
      this.baseColors = this.getCurrentColors().map(color => ({
         ...color,
         // Ensure we have HSL values for each color
         ...(color.h === undefined ? this.hexToHSL(color.hex) : {})
      }));
   }
   
   captureColorLockState() {
      this.colorLockState = {};
      this.baseColors.forEach(color => {
         this.colorLockState[color.cellIndex] = this.core.isCellColorLocked(color.cellIndex);
      });
   }
   
   // Configuration methods
   setSpeed(speed) {
      // Clamp speed between 1 and 100
      this.speed = Math.max(1, Math.min(100, speed));
      this.core.dispatchEvent('hueAnimationConfigChanged', { speed: this.speed });
      return this.speed;
   }
   
   setDirection(clockwise) {
      this.direction = !!clockwise;
      this.core.dispatchEvent('hueAnimationConfigChanged', { direction: this.direction });
      return this.direction;
   }
   
   // Helper methods
   verifyColorTracking() {
      if (this.core && typeof this.core.initializeColorTracking === 'function') {
         this.core.initializeColorTracking();
      }
   }
   
   hslToHex(h, s, l) {
      // Convert HSL to hex color string
      // Implementation omitted for brevity
      // Returns: "#RRGGBB" format
   }
   
   hexToHSL(hex) {
      // Convert hex to HSL object
      // Implementation omitted for brevity
      // Returns: {h: 0-359, s: 0-100, l: 0-100}
   }
   
   handleColorChange(cellIndex, newColor) {
      // Called when a color is explicitly changed by the user
      // Updates the baseColors for that specific cell
      if (this.active) {
         const colorIndex = this.baseColors.findIndex(c => c.cellIndex === cellIndex);
         if (colorIndex !== -1) {
            const hslValues = this.hexToHSL(newColor.hex);
            this.baseColors[colorIndex] = {
               ...newColor,
               h: hslValues.h,
               s: hslValues.s,
               l: hslValues.l
            };
         }
      }
   }
   
   handleCellCountChange() {
      // Called when cells are added or removed
      if (this.active) {
         this.updateBaseColors();
         this.captureColorLockState();
      }
   }
}
```

### 2.2 Integration Points

```
┌─────────────────────┐       ┌─────────────────────┐
│   MeshGradientCore  │◄──────┤     HueAnimator     │
└─────────┬───────────┘       └─────────────────────┘
        │                             ▲
        │                             │
        ▼                             │
┌─────────────────────┐                │
│  render() pipeline  │────────────────┘
└─────────┬───────────┘   provides adjusted colors
        │
        ▼
┌─────────────────────┐
│    Color Display    │
└─────────────────────┘
```

### 2.3 Event System Integration

```javascript
// Events dispatched by HueAnimator
{
   // Triggered when animation starts, stops, pauses or resumes
   'hueAnimationStateChanged': {
      active: boolean,     // whether animation is running
      paused: boolean      // whether animation is paused
   },
   
   // Triggered when animation settings change
   'hueAnimationConfigChanged': {
      speed?: number,      // degrees per second
      direction?: boolean  // true=clockwise, false=counter
   }
}
```

## 3. Implementation Workflow

### 3.1 Hue Animation Control Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ UI Toggle       │     │ Direct API Call │     │ Keyboard        │
│ Button Clicked  │     │ toggleHueAnima- │     │ Shortcut        │
└────────┬────────┘     │ tion(true)      │     │ (e.g., Alt+H)   │
       │              └────────┬────────┘     └────────┬────────┘
       └───────────────────────┴───────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       startHueAnimation()                           │
└────────────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. Set active = true                                               │
│  2. Store baseColors = getCurrentColors()                           │
│  3. Capture color lock state                                        │
│  4. Record startTime                                                │
│  5. Dispatch hueAnimationStateChanged event                         │
└────────────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Start animation frame loop with requestAnimationFrame              │
└────────────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  On each frame:                                                     │
│  1. Calculate elapsed time (accounting for pauses)                  │
│  2. Calculate hue offset based on speed & direction                 │
│  3. Apply hue offset to baseColors (preserving relative differences)│
│  4. Skip locked colors based on colorLockState                      │
│  5. Render with hue-adjusted colors (preserveColors=true)           │
│  6. Request next animation frame                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Color Processing During Hue Animation

```
┌─────────────────────┐
│   Animation Loop    │
└────────┬────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Calculate total hue offset: speed × elapsedTime × direction         │
└────────────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ For each baseColor:                                                 │
│                                                                     │
│ if (colorLockState[color.cellIndex]) {                             │
│    return original color;      // Skip locked colors                │
│ } else {                                                            │
│    newHue = (baseColor.h + hueOffset) % 360;                        │
│    if (newHue < 0) newHue += 360;                                   │
│    return color with updated hue and hex;                           │
│ }                                                                   │
└────────────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ core.render(newColors, { preserveColors: true })                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Pause and Resume Flow

```
┌───────────────────┐        ┌───────────────────┐
│ Pause Button      │        │ Resume Button     │
│ Clicked           │        │ Clicked           │
└────────┬──────────┘        └────────┬──────────┘
       │                            │
       ▼                            ▼
┌───────────────────┐        ┌───────────────────┐
│ pause()           │        │ resume()          │
└────────┬──────────┘        └────────┬──────────┘
       │                            │
       ▼                            ▼
┌───────────────────────┐   ┌───────────────────────┐
│ 1. Set paused = true  │   │ 1. Set paused = false │
│ 2. Record pauseTime   │   │ 2. Update pausedTime  │
│ 3. Cancel animation   │   │ 3. Restart animation  │
│ 4. Dispatch event     │   │ 4. Dispatch event     │
└───────────────────────┘   └───────────────────────┘
```

## 4. Interaction with Existing Features

### 4.1 Interaction with Cell Animation

When both hue animation and cell animation are active simultaneously:

```
┌────────────────────┐     ┌────────────────────┐
│  Hue Animation     │     │  Cell Animation    │
└────────┬───────────┘     └────────┬───────────┘
       │                          │
       ▼                          ▼
┌────────────────────┐     ┌────────────────────┐
│ Capture baseColors │     │  Capture original  │
│ when started       │     │  positions & colors│
└────────┬───────────┘     └────────┬───────────┘
       │                          │
       │     ┌───────────┐        │
       └────►│  Render   │◄───────┘
            │  Pipeline │
            └─────┬─────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│ 1. Cell Animation Frame:                                     │
│    • Update cell positions                                   │
│                                                              │
│ 2. Hue Animation Frame:                                      │
│    • Calculate hue-adjusted colors based on baseColors       │
│                                                              │
│ 3. Render with:                                              │
│    • Updated positions from cell animation                   │
│    • Updated colors from hue animation                       │
│    • preserveColors=true                                     │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Interaction with User Actions

```
┌─────────────────────┐     ┌─────────────────────┐
│ Hue Animation       │     │ User Interaction    │
│ Active              │     │ (Edit, Hover, etc.) │
└─────────┬───────────┘     └─────────┬───────────┘
        │                           │
        │                           │
        ▼                           ▼
┌───────────────────────────────────────────────────────────────┐
│ 1. User explicitly sets a cell color:                         │
│    • Record new color in cell-specific colors                 │
│    • Call handleColorChange() to update baseColors           │
│    • Continue animation with updated baseColors              │
│                                                               │
│ 2. User hovers/interacts with UI:                             │
│    • Normal UI behavior continues                             │
│    • Animation continues in background                        │
│                                                               │
│ 3. User changes color generation parameters:                  │
│    • Temporarily pause hue animation                          │
│    • Apply requested color changes                            │
│    • Call updateBaseColors()                                 │
│    • Resume hue animation if previously active                │
│                                                               │
│ 4. User adds/removes cells:                                   │
│    • Call handleCellCountChange() to update baseColors       │
│    • Animation continues with updated cell structure          │
└───────────────────────────────────────────────────────────────┘
```

### 4.3 Interaction with Color Swatches

The color swatches in the UI need to accurately reflect the current animated colors:

```
┌──────────────────┐       ┌─────────────────────┐       ┌──────────────────┐
│  Hue Animation   │──────►│ meshColorsAvailable │──────►│  Update Color    │
│  Frame Render    │       │      Event          │       │    Swatches      │
└──────────────────┘       └─────────────────────┘       └──────────────────┘
```

The swatch update process leverages the existing event system:

1. **Event-Driven Architecture**: The system uses a `meshColorsAvailable` event that fires after every render
   
2. **Automatic Integration**: Due to the use of the core's `render()` method and color tracking system:
   - Each hue animation frame triggers a render with current hue-adjusted colors
   - The `render()` method dispatches the `meshColorsAvailable` event
   - UI components listening for this event update their swatches automatically

3. **Color Source Consistency**:
   - Swatches always reflect the actual displayed colors via `getAllColors()`
   - No additional synchronization code is needed specifically for swatches

4. **Edge Case Handling**:
   - When hue animation stops, the final colors are preserved in the system
   - If cell color is locked during animation, both the cell and its swatch maintain fixed color

### 4.4 Animation Control Integration

```javascript
// Example API for integration with UI controls
class MeshGradientAPI {
   // Hue animation controls
   toggleHueAnimation(active) {
      if (active) {
         this.core.hueAnimator.start();
      } else {
         this.core.hueAnimator.stop();
      }
      return this.isHueAnimationActive();
   }
   
   pauseHueAnimation() {
      this.core.hueAnimator.pause();
      return this.isHueAnimationPaused();
   }
   
   resumeHueAnimation() {
      this.core.hueAnimator.resume();
      return !this.isHueAnimationPaused();
   }
   
   isHueAnimationActive() {
      return this.core.hueAnimator.active;
   }
   
   isHueAnimationPaused() {
      return this.core.hueAnimator.paused;
   }
   
   setHueAnimationSpeed(speed) {
      return this.core.hueAnimator.setSpeed(speed);
   }
   
   setHueAnimationDirection(clockwise) {
      return this.core.hueAnimator.setDirection(clockwise);
   }
}
```

## 5. UI Controls

Add UI controls for the hue animation feature:

```
┌───────────────────────────────────────────────────────┐
│ Hue Animation                                         │
│                                                       │
│   ┌───────┐    ┌─────┐    ┌────────┐    ┌──────────┐  │
│   │ Start │    │Pause│    │ Resume │    │   Stop   │  │
│   └───────┘    └─────┘    └────────┘    └──────────┘  │
│                                                       │
│   Speed: [──────●──────────────────] 15 deg/sec       │
│          1                         100                │
│                                                       │
│   Direction:                                          │
│   ○ Clockwise    ● Counter-clockwise                  │
│                                                       │
│   [ ] Keep colors on stop                             │
└───────────────────────────────────────────────────────┘
```

### 5.1 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Alt+H    | Toggle hue animation on/off |
| Alt+P    | Pause/resume animation |
| Alt+[ / Alt+] | Decrease/increase animation speed |
| Alt+D    | Toggle animation direction |

## 6. Technical Implementation Details

### 6.1 Core Algorithm

The core algorithm for calculating hue-adjusted colors:

```javascript
calculateHueAdjustedColors(elapsedTime) {
  // Calculate total hue offset based on elapsed time and speed setting
  const hueOffset = (this.speed * elapsedTime) % 360 * 
               (this.direction ? 1 : -1);
  
  // Apply offset to each base color
  return this.baseColors.map(color => {
   // Skip locked colors using our cached lock state
   if (this.colorLockState[color.cellIndex]) {
     return {...color};
   }
   
   // Calculate new hue (0-359 range)
   let newHue = (color.h + hueOffset) % 360;
   if (newHue < 0) newHue += 360;
   
   // Create new color with updated hue but preserve saturation and lightness
   return {
     ...color,
     h: newHue,
     hex: this.hslToHex(newHue, color.s, color.l)
   };
  });
}
```

### 6.2 Performance Considerations

- **Timing Precision**: Use `performance.now()` for high-resolution timing
- **Frame Rate Management**: Use `requestAnimationFrame` with time-based animation
- **Throttling**: Consider frame skipping on low-end devices if performance drops
- **Memory Optimization**: Avoid unnecessary object creation in animation loop
- **Selective Rendering**: Only trigger DOM updates when colors change significantly
- **Mobile Considerations**: Detect mobile devices and optimize accordingly:
  ```javascript
  // Example of mobile detection and optimization
  const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobileDevice) {
   // Lower animation framerate on mobile devices
   this.frameSkip = 2; // Only process every nth frame
  }
  ```

### 6.3 State Management

The system maintains several types of color state:

- **baseColors**: Original colors captured when animation starts
- **cell-specific colors**: Explicitly set colors for specific cells
- **locked colors**: Colors that don't change during animation (tracked in colorLockState)
- **current rendered colors**: What's currently displayed

During animation, state is managed through:

```javascript
// Example state management during user color changes
handleUserColorChange(cellIndex, newColor) {
  // Update the cell color in the core system
  this.core.setCellColor(cellIndex, newColor);
  
  // If animation is active, update the base color
  if (this.active) {
   this.handleColorChange(cellIndex, newColor);
  }
  
  // If the color is locked, update the lock state
  if (this.core.isCellColorLocked(cellIndex)) {
   this.colorLockState[cellIndex] = true;
  }
}
```

### 6.4 Color Conversion Functions

```javascript
// Convert HSL values to hex color string
hslToHex(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;
  
  if (s === 0) {
   r = g = b = l; // achromatic
  } else {
   const hue2rgb = (p, q, t) => {
     if (t < 0) t += 1;
     if (t > 1) t -= 1;
     if (t < 1/6) return p + (q - p) * 6 * t;
     if (t < 1/2) return q;
     if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
     return p;
   };
   
   const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
   const p = 2 * l - q;
   
   r = hue2rgb(p, q, h + 1/3);
   g = hue2rgb(p, q, h);
   b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = x => {
   const hex = Math.round(x * 255).toString(16);
   return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert hex color string to HSL values
hexToHSL(hex) {
  // Remove the # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Find min and max RGB components
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  // Calculate lightness
  let l = (max + min) / 2;
  
  // Calculate saturation
  let s = 0;
  if (max !== min) {
   s = l > 0.5 
      ? (max - min) / (2 - max - min) 
      : (max - min) / (max + min);
  }
  
  // Calculate hue
  let h = 0;
  if (max !== min) {
   switch(max) {
     case r: h = (g - b) / (max - min) + (g < b ? 6 : 0); break;
     case g: h = (b - r) / (max - min) + 2; break;
     case b: h = (r - g) / (max - min) + 4; break;
   }
   h /= 6;
  }
  
  // Convert to degrees, percentages
  return {
   h: Math.round(h * 360),
   s: Math.round(s * 100),
   l: Math.round(l * 100)
  };
}
```

## 7. Potential Challenges and Solutions

### 7.1 Color Consistency

**Challenge**: Ensuring colors don't unexpectedly change when animation starts/stops or during user interaction.

**Solution**: 
- Capture original colors precisely at animation start
- When stopping, persist the final animated colors as the new baseline
- Handle explicit color changes during animation by updating baseColors
- Use HSL color space for animations to maintain perceptual consistency

```javascript
// Example implementation for stopping animation with color preservation
stop(preserveColors = true) {
  if (!this.active) return;
  
  cancelAnimationFrame(this.frameId);
  this.active = false;
  this.paused = false;
  
  if (preserveColors) {
   // Calculate the final colors based on time elapsed
   const elapsedTime = (performance.now() - this.startTime - this.totalPausedTime) / 1000;
   const finalColors = this.calculateHueAdjustedColors(elapsedTime);
   
   // Apply these colors as the new "real" colors
   this.core.render(finalColors, { preserveColors: true, finalizeColors: true });
  }
  
  this.core.dispatchEvent('hueAnimationStateChanged', { active: false });
}
```

### 7.2 Render Pipeline Integration

**Challenge**: Integrating with the existing render pipeline without breaking its color regeneration logic.

**Solution**: 
- Use the `preserveColors` option to maintain control over color state
- Store a reference to the original colors before animation begins
- Create a `finalizeColors` option to signal when animated colors should become permanent

```javascript
// Integration with render pipeline
core.render = function(colors, options = {}) {
  const { preserveColors = false, finalizeColors = false } = options;
  
  // Normal render logic
  // ...
  
  // If finalizeColors is true, store these colors as the new baseline
  if (finalizeColors) {
   this.colorState.setCellColors(colors);
  }
  
  // Dispatch colors available event
  this.dispatchEvent('meshColorsAvailable', { colors: this.getAllColors() });
}
```

### 7.3 Performance

**Challenge**: Maintaining smooth animations on lower-end devices.

**Solution**: 
- Implement adaptive frame rates based on device capabilities
- Use time-based animation to ensure consistent speed regardless of frame rate
- Batch DOM updates to reduce layout thrashing
- Use requestAnimationFrame intelligently with fallbacks

```javascript
// Adaptive performance management
class PerformanceMonitor {
  constructor(animation) {
   this.animation = animation;
   this.frameHistory = [];
   this.frameLimit = 10; // Track last 10 frames
   this.thresholdFps = 40; // Minimum acceptable FPS
   this.adaptationActive = false;
  }
  
  recordFrame(timestamp) {
   if (this.lastFrameTime) {
     const delta = timestamp - this.lastFrameTime;
     this.frameHistory.push(delta);
     
     // Keep only last N frames
     if (this.frameHistory.length > this.frameLimit) {
      this.frameHistory.shift();
     }
     
     // Check if we need to adapt
     this.checkPerformance();
   }
   
   this.lastFrameTime = timestamp;
  }
  
  checkPerformance() {
   if (this.frameHistory.length < this.frameLimit) return;
   
   // Calculate average FPS
   const avgDelta = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length;
   const currentFps = 1000 / avgDelta;
   
   // Adapt if FPS is too low
   if (!this.adaptationActive && currentFps < this.thresholdFps) {
     this.adaptationActive = true;
     this.animation.setFrameSkip(2); // Process every other frame
   } 
   // Return to normal if FPS is good again
   else if (this.adaptationActive && currentFps > this.thresholdFps * 1.2) {
     this.adaptationActive = false;
     this.animation.setFrameSkip(1); // Process every frame
   }
  }
}
```

### 7.4 Multiple Animation Coordination

**Challenge**: Coordinating hue animation with cell animation.

**Solution**: 
- Design animation systems to modify orthogonal properties (position vs. color)
- Run animations in parallel but with clear priorities
- Use a shared animation manager to coordinate different animation types
- Allow animations to react to each other's events

```javascript
// Animation coordination
class AnimationCoordinator {
  constructor(core) {
   this.core = core;
   this.activeAnimations = {
     hue: false,
     cell: false
   };
   this.animationPriority = ['cell', 'hue']; // Cell animation takes precedence
  }
  
  startAnimation(type) {
   this.activeAnimations[type] = true;
   this.updateAnimationState();
  }
  
  stopAnimation(type) {
   this.activeAnimations[type] = false;
   this.updateAnimationState();
  }
  
  updateAnimationState() {
   // Determine which animations should be running
   const anyActive = Object.values(this.activeAnimations).some(Boolean);
   
   // Update performance settings based on number of active animations
   if (Object.values(this.activeAnimations).filter(Boolean).length > 1) {
     // Multiple animations running, may need to optimize
     this.core.setPerformanceMode('optimized');
   } else {
     this.core.setPerformanceMode('default');
   }
   
   // Dispatch event for other systems to react
   this.core.dispatchEvent('animationStateChanged', {
     active: anyActive,
     types: {...this.activeAnimations}
   });
  }
}
```

## 8. Testing Strategy

### 8.1 Unit Tests

- Test hue calculation logic with known input/output pairs
- Test color conversion functions (hex to HSL, HSL to hex)
- Test animation timing calculations and pause/resume logic
- Test state management for locked colors

```javascript
// Example Jest test for hue calculations
test('calculateHueAdjustedColors rotates hue correctly', () => {
  // Setup
  const animator = new HueAnimator(mockCore);
  animator.baseColors = [
   { hex: '#ff0000', h: 0, s: 100, l: 50, cellIndex: 0 },
   { hex: '#00ff00', h: 120, s: 100, l: 50, cellIndex: 1 }
  ];
  animator.colorLockState = { 0: false, 1: false };
  animator.speed = 10; // 10 degrees per second
  animator.direction = true; // clockwise
  
  // Execute: simulate 1 second of animation
  const result = animator.calculateHueAdjustedColors(1);
  
  // Verify
  expect(result[0].h).toBe(10); // 0 + 10 degrees
  expect(result[1].h).toBe(130); // 120 + 10 degrees
  expect(result[0].hex).toBe('#ff2b00'); // hex for hsl(10,100,50)
});
```

### 8.2 Integration Tests

- Test interaction with cell animation
- Test interaction with color editing
- Test preservation of locked colors
- Test UI event handling and state updates

```javascript
// Example integration test for locked colors
test('Locked colors do not change during animation', async () => {
  // Setup
  const meshGradient = new MeshGradient('#canvas');
  const lockedColor = '#ff0000';
  
  // Set a locked color on cell 0
  meshGradient.setCellColor(0, lockedColor);
  meshGradient.lockCellColor(0);
  
  // Start animation
  meshGradient.toggleHueAnimation(true);
  
  // Wait for several animation frames
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Verify locked color hasn't changed
  const currentColors = meshGradient.getAllColors();
  expect(currentColors[0].hex).toBe(lockedColor);
});
```

### 8.3 User Experience Tests

- Test animation smoothness on different devices
- Test UI responsiveness during animation
- Test intuitive behavior of controls
- Verify animation speed settings produce visually expected results

```javascript
// Example performance test
test('Animation maintains target framerate', async () => {
  // Setup
  const meshGradient = new MeshGradient('#canvas');
  const frameRates = [];
  let lastTimestamp = performance.now();
  
  // Hook into animation loop to monitor frame rate
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = callback => {
   return originalRequestAnimationFrame(timestamp => {
     if (lastTimestamp) {
      const delta = timestamp - lastTimestamp;
      frameRates.push(1000 / delta);
     }
     lastTimestamp = timestamp;
     callback(timestamp);
   });
  };
  
  // Start animation
  meshGradient.toggleHueAnimation(true);
  
  // Run for 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Stop animation
  meshGradient.toggleHueAnimation(false);
  
  // Restore original requestAnimationFrame
  window.requestAnimationFrame = originalRequestAnimationFrame;
  
  // Calculate average FPS
  const avgFps = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
  
  // Verify we're near target framerate (60fps +/- 5fps)
  expect(avgFps).toBeGreaterThan(55);
  expect(avgFps).toBeLessThan(65);
});
```

## 9. Implementation Phases

1. **Phase 1**: Create HueAnimator module with core functionality
   - Implement basic hue animation algorithm
   - Add start/stop functionality
   - Implement color conversion utilities

2. **Phase 2**: Integrate with render pipeline
   - Connect with MeshGradientCore
   - Implement color preservation during animation
   - Add events for animation state changes

3. **Phase 3**: Add UI controls and configuration options
   - Create animation control buttons and sliders
   - Implement keyboard shortcuts
   - Add direction and speed controls

4. **Phase 4**: Enhance state management
   - Add pause/resume functionality
   - Implement locked color handling
   - Add support for explicit color changes during animation

5. **Phase 5**: Optimize for performance
   - Implement performance monitoring
   - Add adaptive frame rates
   - Optimize color calculations

6. **Phase 6**: Add advanced features
   - Implement animation presets
   - Add custom easing functions
   - Support animation sequencing

7. **Phase 7**: Final testing and polishing
   - Cross-browser compatibility testing
   - Performance testing on various devices
   - Fix edge cases and bugs