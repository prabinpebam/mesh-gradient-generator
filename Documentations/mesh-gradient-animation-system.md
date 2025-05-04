# Mesh Gradient Animation System

This document provides a comprehensive overview of how animation works in the Mesh Gradient system, detailing the initialization, control flow, update cycle, and parameter effects for both cell position and hue animations.

## 1. Animation Architecture Overview

### 1.1 Core Animation Components

- **Cell Animation State**: Stored in `core.animation` object
- **Hue Animation State**: Stored in `core.hueAnimator` object
- **Animation Parameters**: Controls behavior like force, speed, damping, and hue rotation
- **Animation Loop**: Each animation system runs via independent `requestAnimationFrame` loops
- **Position Updating**: Cell positions updated continuously with physics model
- **Color Updating**: Hue values cycled continuously based on time elapsed

### 1.2 Animation Data Model

```javascript
// Core animation state object (cell animation)
animation = {
  active: false,              // Whether animation is currently running
  frameId: null,              // Current animation frame ID for cancellation
  originalColors: [],         // Colors captured at animation start
  lastFrameTime: 0,           // Last frame timestamp for delta calculation
  params: {                   // Animation behavior parameters
    forceStrength: 0.12,      // How strongly cells accelerate
    damping: 0.92,            // Velocity reduction per frame (0-1)
    maxSpeed: 3,              // Maximum cell velocity
    wanderJitter: 0.3,        // Random angle variation
    wanderWeight: 0.25,       // Weight of random movement vs. directed
    arrivalThres: 30,         // Distance to target for "arrival"
    minTurnAngle: 0.79        // Minimum angle when selecting new targets (radians)
  },
  sites: [                    // Per-site animation properties
    {
      vx: 0,                  // X velocity component
      vy: 0,                  // Y velocity component
      wanderAngle: 1.5,       // Current wander direction (radians)
      targetIndex: 42,        // Current target index in Halton sequence
      lastTargetAngle: 2.1    // Previous target direction (for turn angle calc)
    },
    // ...more sites
  ]
}

// Hue animation state object
hueAnimator = {
  active: false,              // Whether hue animation is running
  frameId: null,              // Animation frame ID for cancellation
  startTime: 1621500000000,   // Timestamp when animation started
  baseColors: [],             // Original colors captured at start
  speed: 15,                  // Degrees per second (default)
  direction: true             // true=clockwise, false=counter-clockwise
}
```

## 2. Animation Initialization Flow

### 2.1 Cell Animation Initialization

```
┌─────────────────┐      ┌─────────────────┐     ┌─────────────────────┐
│ Animation Toggle│      │ direct call to  │     │ meshGradient        │
│ UI Control      │  or  │ startCell       │ or  │ initialization      │
└────────┬────────┘      │ Animation()     │     │                     │
         │               └────────┬────────┘     └──────────┬──────────┘
         │                        │                         │
         └────────────────────────┼─────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                          initAnimation()                           │
│                                                                    │
│  • Creates animation object if not exists                          │
│  • Sets default parameters                                         │
│  • Stores original site positions                                  │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                     initAnimationProperties()                      │
│                                                                    │
│  • Initializes per-site animation properties (vx, vy, etc.)        │
│  • Sets random initial wander angles                               │
│  • Sets random initial target indices                              │
└────────────────────────────────────────────────────────────────────┘
```

### 2.2 Hue Animation Initialization

```
┌─────────────────┐      ┌─────────────────┐
│ Hue Animation   │      │ direct call to  │
│ Toggle Control  │  or  │ startHue        │
└────────┬────────┘      │ Animation()     │
         │               └────────┬────────┘
         └───────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────────┐
│                      startHueAnimation()                           │
│                                                                    │
│  • Sets hueAnimator.active = true                                  │
│  • Records animation start time                                    │
│  • Captures base colors via getAllColors()                         │
│  • Starts animation loop with requestAnimationFrame                │
└────────────────────────────────────────────────────────────────────┘
```

## 3. Animation Control Flow

### 3.1 Starting Animation

```
┌─────────────────┐     ┌─────────────────┐
│ Animation Toggle│     │ Direct API Call │
│ Checked         │     │ toggleCellAnim- │
└────────┬────────┘     │ ation(true)     │
         │              └────────┬────────┘
         └───────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     startCellAnimation()                            │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Store original colors via getAllColors()                           │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Disable edit mode if active                                        │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Set animation.active = true                                        │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Set lastFrameTime = performance.now()                              │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Start animation loop with requestAnimationFrame                    │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Return true to confirm animation started                           │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Stopping Animation

```
┌─────────────────┐     ┌─────────────────┐
│ Animation Toggle│     │ Direct API Call │
│ Unchecked       │     │ toggleCellAnim- │
└────────┬────────┘     │ ation(false)    │
         │              └────────┬────────┘
         └───────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     stopCellAnimation()                             │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Set animation.active = false                                       │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Cancel animation frame via cancelAnimationFrame(animation.frameId) │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Return true to confirm animation stopped                           │
└─────────────────────────────────────────────────────────────────────┘
```

## 4. Animation Update Cycle

### 4.1 Cell Position Animation

```
┌────────────────────────┐
│ requestAnimationFrame  │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Calculate deltaTime:   │
│ now - lastFrameTime    │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ updateAnimationStep()  │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────────────────┐
│ For Each Cell:                                                         │
│                                                                        │
│  1. Check if current target reached (dist < arrivalThres)              │
│     └─► If yes, select new target with minimum turn angle              │
│                                                                        │
│  2. Calculate forces:                                                  │
│     • Wander force (random movement)                                   │
│     • Attraction force (toward target)                                 │
│     • Blend forces based on wanderWeight                               │
│                                                                        │
│  3. Update velocity:                                                   │
│     • Apply force * forceStrength * timeStep                           │
│     • Apply damping                                                    │
│     • Limit to maxSpeed                                                │
│                                                                        │
│  4. Update position:                                                   │
│     • Apply velocity * timeStep                                        │
│     • Constrain to canvas boundaries                                   │
└───────────┬────────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────┐
│ Force Voronoi          │
│ recalculation          │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ render() with          │
│ preserveColors=true    │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Schedule next frame if │
│ animation.active       │
└────────────────────────┘
```

### 4.2 Hue Animation

```
┌────────────────────────┐
│ requestAnimationFrame  │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Calculate elapsed time:│
│ now - startTime        │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────────────────┐
│ For Each Cell:                                                         │
│                                                                        │
│  1. Get base color                                                     │
│  2. Convert RGB to HSL                                                 │
│  3. Modify hue value:                                                  │
│     • Calculate rotation amount = elapsedTime * speed / 1000           │
│     • Apply rotation in specified direction                            │
│     • Normalize hue value to 0-360 range                               │
│  4. Convert HSL back to RGB                                            │
│  5. Update cell color                                                  │
└───────────┬────────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────┐
│ Render with updated    │
│ colors                 │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Schedule next frame if │
│ hueAnimator.active     │
└────────────────────────┘
```

## 5. Cell Movement Physics

### 5.1 Target Selection Using Halton Sequence

```
┌────────────────────────┐
│ Current target reached │
│ (dist < arrivalThres)  │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────────────┐
│ Calculate angle to current target                                  │
└───────────┬────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────────────┐
│ Try up to 10 potential next targets (incremental targetIndex)      │
│ Each candidate evaluated with Halton(2,3) sequence                 │
└───────────┬────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────────────┐
│ Select first candidate with turn angle >= minTurnAngle             │
│ or last candidate if none meet minimum angle                       │
└───────────┬────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────────────┐
│ Store new targetIndex & lastTargetAngle                            │
└────────────────────────────────────────────────────────────────────┘
```

### 5.2 Force Calculation

```
┌──────────────────┐     ┌──────────────────┐
│ Wander Force     │     │ Direction to     │
│ (Semi-random)    │     │ Target           │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         │                        │
         ▼                        ▼
┌──────────────────────────────────────────────┐
│ Blend forces based on wanderWeight           │
│                                              │
│ direction = target * (1-wanderWeight) +      │
│            wander * wanderWeight             │
└────────┬───────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ Normalize direction vector                   │
└────────┬───────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ Apply force:                                 │
│ velocity += direction * forceStrength * dt   │
└──────────────────────────────────────────────┘
```

## 6. Parameter Effects on Animation

### 6.1 Primary Parameters

| Parameter | Effect | Low Values | High Values |
|-----------|--------|------------|------------|
| `forceStrength` | Acceleration intensity | Sluggish, slow movement | Rapid, jerky movement |
| `damping` | Velocity preservation | Quick stops, robotic | Long glides, fluid |
| `maxSpeed` | Speed limit | Slow, careful movement | Fast, energetic movement |
| `wanderWeight` | Randomness vs. directedness | Predictable paths to targets | Chaotic, meandering paths |
| `wanderJitter` | Random direction changes | Smooth, consistent paths | Erratic, twitchy movement |
| `arrivalThres` | Target switching distance | Precise targeting, frequent stops | Approximate paths, continuous movement |
| `minTurnAngle` | Direction change minimum | Straight paths with small turns | Sharp turns, dramatic direction changes |

### 6.2 Hue Animation Parameters

| Parameter | Effect | Low Values | High Values |
|-----------|--------|------------|------------|
| `speed` | Rotation rate (degrees/second) | Slow, subtle color changes | Rapid, vibrant color cycling |
| `direction` | Rotation direction | Counter-clockwise (false) | Clockwise (true) |

### 6.3 Parameter Relationships Diagram

```
                    ┌─────────────┐
         ┌──────────┤ forceStrength ├───────┐
         │          └─────────────┘        │
         │                                 │
         │                                 │
         ▼                                 ▼
┌─────────────┐                 ┌─────────────┐
│   damping   │◄───────────────►│  maxSpeed   │
└─────┬───────┘                 └────────┬────┘
      │                                  │
      │         ┌────────────┐           │
      ├────────►│ Perceived  │◄──────────┤
      │         │ Movement   │           │
      │         │   Speed    │           │
      │         └────────────┘           │
      │                                  │
┌─────▼──────┐                  ┌────────▼────┐
│wanderWeight│◄────────────────►│wanderJitter │
└────────────┘                  └─────────────┘
      │                                 │
      │                                 │
      ▼                                 ▼
┌────────────┐                  ┌─────────────┐
│arrivalThres│◄────────────────►│ minTurnAngle│
└────────────┘                  └─────────────┘
```

## 7. Color & Performance Management

### 7.1 Color Preservation During Animation

```
┌──────────────────────────┐
│    startCellAnimation    │
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│ animation.originalColors │
│ = getAllColors()         │
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│  Animation frame updates │
│  cell positions          │
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────┐
│ render(animation.originalColors, true)                       │
│                               ┌─────┘                        │
│                               │ preserveColors=true ensures  │
│                               │ colors remain constant       │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 HSL Color Transformation for Hue Animation

```javascript
// Implementation of color transformation for hue animation
function animateHues(timestamp) {
  if (!hueAnimator.active) return;
  
  // Calculate elapsed time and rotation amount
  const elapsed = timestamp - hueAnimator.startTime;
  const rotationAmount = (hueAnimator.speed * elapsed / 1000) % 360;
  
  // Process each cell color
  for (let i = 0; i < hueAnimator.baseColors.length; i++) {
    const baseColor = hueAnimator.baseColors[i];
    
    // Convert RGB to HSL
    const hsl = rgbToHsl(baseColor.r, baseColor.g, baseColor.b);
    
    // Apply hue rotation
    hsl[0] = hueAnimator.direction 
      ? (hsl[0] + rotationAmount) % 360 
      : (hsl[0] - rotationAmount + 360) % 360;
    
    // Convert back to RGB
    const rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
    
    // Update color
    updateCellColor(i, rgb[0], rgb[1], rgb[2]);
  }
  
  // Render and continue animation
  render();
  hueAnimator.frameId = requestAnimationFrame(animateHues);
}
```

### 7.3 Performance Optimizations

- **UI Optimization**: The system skips drawing UI elements during animation to improve frame rate
- **Time Scaling**: Animation speed is adjusted based on actual frame rate to ensure consistent motion
- **Delta Time**: Time-based animation ensures consistent speed regardless of frame rate
- **Limited Logging**: Debug logging reduced during animation frames
- **Bounded Movement**: Cell position changes capped to prevent visual glitches
- **Targeted Rerendering**: Only updates what's necessary during animation cycles

## 8. Animation API Reference

### 8.1 Cell Animation Control Methods

- **toggleCellAnimation(enabled)**: Start or stop animation
- **startCellAnimation()**: Start the animation
- **stopCellAnimation()**: Stop the animation
- **setAnimationParam(param, value)**: Set a specific animation parameter
- **initAnimation()**: Initialize animation system
- **initAnimationProperties()**: Setup per-cell animation properties

### 8.2 Hue Animation Control Methods

- **toggleHueAnimation(enabled)**: Start or stop hue animation
- **startHueAnimation()**: Start the hue animation
- **stopHueAnimation()**: Stop the hue animation
- **setHueAnimationSpeed(speed)**: Set hue rotation speed (degrees/second)
- **setHueAnimationDirection(clockwise)**: Set rotation direction

### 8.3 Animation Event Hooks

- **onAnimationStart**: Called when animation begins
- **onAnimationStop**: Called when animation ends
- **onAnimationFrame**: Called each animation update (if registered)

## 9. Animation UI Controls

The animation UI provides controls for:

- Toggling cell animation on/off
- Toggling hue animation on/off
- Adjusting force strength (acceleration)
- Setting damping factor (deceleration)
- Setting maximum speed
- Controlling hue animation speed
- Setting hue rotation direction

Advanced parameters are set to carefully tuned defaults:
- Wander jitter: 0.3
- Wander weight: 0.25
- Arrival threshold: 30
- Minimum turn angle: 45 degrees (0.79 radians)

These parameters ensure smooth, visually pleasing motion with interesting paths and behaviors without overwhelming the user with too many controls.

## 10. Implementation Considerations

### 10.1 Combining Cell and Hue Animation

Both animation systems can run independently or simultaneously:

- Cell animation: Controls position of Voronoi cells
- Hue animation: Controls color cycling independent of position

When both are active, the renderer preserves the current hue-adjusted colors while updating positions.

### 10.2 Animation State Persistence

Animation states are preserved when:
- Resizing the canvas
- Adding/removing controls
- Exporting/importing configurations

Animation is automatically paused during:
- Edit mode
- Export operations
- When window loses focus (optional setting)