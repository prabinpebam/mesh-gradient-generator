# Mesh Gradient Hue Animation

This document outlines the implementation plan for adding a hue animation feature to the Mesh Gradient system. This feature will allow colors in the gradient to shift their hue values over time while maintaining their relative relationships.

## 1. Goals and Requirements

### 1.1 Core Functionality
- Animate the hue of all colors in the canvas at a configurable rate
- Maintain the relative hue differences between colors during animation
- Support adjustable animation speed
- Support bidirectional hue rotation (clockwise/counterclockwise)
- Operate at an appropriate frame rate for smooth transitions
- Work both independently and alongside cell position animation

### 1.2 Integration Requirements
- Seamlessly integrate with the existing color management system
- Respect locked colors (which should not animate)
- Maintain expected UI behaviors during animation (hovering, editing, etc.)
- Ensure proper state management when starting/stopping animation

## 2. System Architecture

### 2.1 HueAnimator Module Design

```
┌─────────────────────────────────────────────────────────────┐
│                      HueAnimator                            │
├─────────────────────────────────────────────────────────────┤
│ Properties:                                                 │
│  • active: boolean                                          │
│  • frameId: number                                          │
│  • startTime: number                                        │
│  • baseColors: Array<Color>                                 │
│  • speed: number (degrees per second)                       │
│  • direction: boolean (true=clockwise, false=counter)       │
├─────────────────────────────────────────────────────────────┤
│ Methods:                                                    │
│  • start()                                                  │
│  • stop()                                                   │
│  • setSpeed(speed)                                          │
│  • setDirection(clockwise)                                  │
│  • animate(timestamp)                                       │
│  • calculateHueAdjustedColors(elapsedTime)                  │
└─────────────────────────────────────────────────────────────┘
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

## 3. Implementation Workflow

### 3.1 Hue Animation Control Flow

```
┌─────────────────┐     ┌─────────────────┐
│ Hue Animation   │     │ Direct API Call │
│ Toggle On       │     │ toggleHueAnima- │
└────────┬────────┘     │ ation(true)     │
         │              └────────┬────────┘
         └───────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       startHueAnimation()                           │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Store baseColors = getAllColors()                                  │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Start animation frame loop                                         │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  On each frame:                                                     │
│  1. Calculate elapsed time                                          │
│  2. Calculate hue offset based on speed & direction                 │
│  3. Apply hue offset to baseColors (preserving relative differences)│
│  4. Render with hue-adjusted colors (preserveColors=true)           │
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
│ if (isColorLocked(color)) {                                         │
│    return original color;      // Skip locked colors                │
│ } else {                                                            │
│    newHue = (baseColor.h + hueOffset) % 360;                        │
│    return color with updated hue and hex;                           │
│ }                                                                   │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ core.render(newColors, preserveColors=true)                         │
└─────────────────────────────────────────────────────────────────────┘
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
│    • Update baseColors for that cell                         │
│    • Continue animation with updated baseColors              │
│                                                               │
│ 2. User hovers/interacts with UI:                             │
│    • Normal UI behavior continues                             │
│    • Animation continues in background                        │
│                                                               │
│ 3. User changes color generation parameters:                  │
│    • Pause hue animation                                      │
│    • Apply requested color changes                            │
│    • Update baseColors                                       │
│    • Resume hue animation if still active                     │
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

## 5. UI Controls

Add UI controls for the hue animation feature:

```
┌───────────────────────────────────────────────────────┐
│ Hue Animation                                         │
│                                                       │
│   ┌───────────┐  Enable animation     ┌──────────┐    │
│   │           │ ◀────────────────────▶│          │    │
│   └───────────┘                       └──────────┘    │
│      OFF                                  ON          │
│                                                       │
│   Speed: [──────●──────────────────] (5-60 deg/sec)   │
│                                                       │
│   Direction:                                          │
│   ○ Clockwise    ● Counter-clockwise                  │
└───────────────────────────────────────────────────────┘
```

## 6. Technical Implementation Details

### 6.1 Core Algorithm

The core algorithm for calculating hue-adjusted colors:

```javascript
calculateHueAdjustedColors(elapsedTime) {
  // Calculate total hue offset
  const hueOffset = (this.speed * elapsedTime) % 360 * 
                    (this.direction ? 1 : -1);
  
  // Apply offset to each base color
  return this.baseColors.map(color => {
    // Skip locked colors
    if (this.core.isCellColorLocked(color.cellIndex)) {
      return {...color};
    }
    
    // Calculate new hue (0-359 range)
    let newHue = (color.h + hueOffset) % 360;
    if (newHue < 0) newHue += 360;
    
    // Create new color with updated hue
    return {
      ...color,
      h: newHue,
      hex: this.hslToHex(newHue, color.s, color.l)
    };
  });
}
```

### 6.2 Performance Considerations

- Use `requestAnimationFrame` for optimal frame timing
- Time-based animation for consistent speed regardless of frame rate
- Skip unnecessary calculations and renders when possible
- Consider lowering frame rate on mobile devices
- Track performance metrics to ensure smooth animation

### 6.3 State Management

The system maintains several types of color state:
- **baseColors**: Original colors captured when animation starts
- **cell-specific colors**: Explicitly set colors for specific cells
- **locked colors**: Colors that don't change during animation
- **current rendered colors**: What's currently displayed

During animation, the render pipeline needs to:
1. Start with the appropriate base colors
2. Apply hue adjustments based on elapsed time
3. Preserve colors during rendering to avoid regeneration

### 6.4 Color Tracking for UI Updates

To ensure swatches and other UI elements update with animated colors:

1. The system will leverage the existing `initializeColorTracking()` method which:
   - Ensures `meshColorsAvailable` event fires after every render
   - Includes updated color information in the event payload

2. The `HueAnimator` will verify this system is active during initialization:
   ```javascript
   verifyColorTracking() {
     if (this.core && typeof this.core.initializeColorTracking === 'function') {
       this.core.initializeColorTracking();
     }
   }
   ```

3. No additional code will be needed in UI components if they already listen for this event

## 7. Potential Challenges and Solutions

### 7.1 Color Consistency

**Challenge**: Ensuring colors don't unexpectedly change when animation starts/stops or during user interaction.

**Solution**: Carefully capture original colors as a baseline and apply transformations without modifying the baseline. When animation stops, the current colors become the new baseline.

### 7.2 Render Pipeline Integration

**Challenge**: Integrating with the existing render pipeline without breaking its color regeneration logic.

**Solution**: Use the `preserveColors=true` option during animation to avoid unexpected color regeneration, while providing updated colors explicitly for each render.

### 7.3 Performance

**Challenge**: Maintaining smooth animations on lower-end devices.

**Solution**: Implement adaptive frame rate and simplify calculations when performance is an issue.

### 7.4 Multiple Animation Coordination

**Challenge**: Coordinating hue animation with cell animation.

**Solution**: Design animations to be independent but compatible, where each handles its own aspect (position vs. color) and combines at render time.

## 8. Testing Strategy

1. **Unit Tests**:
   - Test hue calculation logic
   - Test color transformation functions
   - Test animation timing functions

2. **Integration Tests**:
   - Test interaction with cell animation
   - Test interaction with color editing
   - Test preservation of locked colors

3. **User Experience Tests**:
   - Test animation smoothness
   - Test UI responsiveness during animation
   - Test intuitive behavior of controls

## 9. Implementation Phases

1. **Phase 1**: Create HueAnimator module with core functionality
2. **Phase 2**: Integrate with render pipeline
3. **Phase 3**: Add UI controls and configuration options
4. **Phase 4**: Optimize performance and fix edge cases
5. **Phase 5**: Add additional features (presets, easing functions, etc.)