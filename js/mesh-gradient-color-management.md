# Mesh Gradient Color Management

This document provides a comprehensive overview of how cell colors are defined, updated, and processed throughout the Mesh Gradient render pipeline.

## 1. Color Definition Overview

### 1.1 Primary Color Sources

- **Base Color**: Set via `setBaseColor(hexColor)` - provides a foundation for color generation
- **Color Harmony**: Set via `setColorHarmony(harmonyType)` - defines relationships between colors
- **Color Theme**: Set via `setColorTheme(theme)` - applies predefined color palettes
- **Direct Cell Colors**: Set via `setCellColor(cellIndex, hexColor)` - explicitly defines individual cell colors
- **Random Generation**: Default fallback when no specific colors are provided

### 1.2 Color Properties

Colors in the system are represented as objects with multiple formats:
```javascript
{
  hex: "#ff5500",    // Hexadecimal representation
  h: 20,             // Hue (0-360)
  s: 100,            // Saturation (0-100)
  l: 50              // Lightness (0-100)
}
```

## 2. Color Generation Flow

### 2.1 Initial Color Generation

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Generate New   │     │   Cell Count    │     │  Color Harmony  │
│    Gradient     │     │     Change      │     │  Theme Changes  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                      data.setupGeneration()                      │
└──────────────────────────────────────┬───────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                       data.processColors()                       │
└──────────────────────────────────────┬───────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Store in data.currentColors                     │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Color Access Priority

When retrieving colors, the system uses the following priority:

1. **Cell-specific colors**: Via `getCellColor(cellIndex)` (includes locked colors)
2. **Current colors**: From `data.currentColors` array
3. **Last generated palette**: From `data.colorPalette.lastGeneratedColors`

## 3. Color Update Mechanisms

### 3.1 Color Regeneration Scenarios

When `render(colors, preserveColors=false)` is called with `preserveColors=false`:

```
┌─────────────────┐     ┌─────────────────┐
│   Change Cell   │     │ Color Harmony/  │
│     Count       │     │  Theme Changes  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌──────────────────────────────────────────┐
│     render(colors, preserveColors=false) │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│         data.processColors()             │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│  Dispatch "meshColorsChanged" event      │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│      Draw cells with new colors          │
└──────────────────────────────────────────┘
```

### 3.2 Color Preservation Scenarios

When `render(colors, preserveColors=true)` is called with `preserveColors=true`:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Cell Dragging  │     │   Cell Hover    │     │   Animation     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              render(colors, preserveColors=true)                 │
└──────────────────────────────────────┬───────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│        Skip color processing, preserve existing colors           │
└──────────────────────────────────────┬───────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Draw cells with current colors                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 Direct Color Modifications

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  setCellColor   │     │  lockCellColor  │     │ unlockCellColor │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌──────────────────────────────────────────────────────────────────┐
│           Direct update to data.cellColors collection            │
└──────────────────────────────────────┬───────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              render(null, preserveColors=true)                   │
└──────────────────────────────────────────────────────────────────┘
```

### 3.4 Color Adjustment Operations

```
┌─────────────────────────────────────────────────────────────────┐
│              adjustColors({hue, saturation, lightness})         │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              data.adjustColors(options) → modified colors       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│             render(modifiedColors) - with new colors            │
└─────────────────────────────────────────────────────────────────┘
```

## 4. Animation-specific Color Handling

During cell animation, colors are carefully preserved to maintain visual consistency while positions change:

```
┌──────────────────────────┐
│    startCellAnimation    │
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│  Store originalColors =  │
│     getAllColors()       │
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│  Animation frame updates │
│ cell positions regularly │
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│ render(originalColors,   │
│   preserveColors=true)   │
└──────────────────────────┘
```

## 5. Color Rendering Pipeline

```
┌──────────────────┐
│  render() call   │
└────────┬─────────┘
         │
         ▼
┌───────────────────────────────┐     ┌──────────────────────┐
│ If !preserveColors:           │     │ If preserveColors:   │
│ - Get new colors via          │     │ - Keep existing      │
│   data.processColors()        │     │   colors             │
│ - Or use provided colors      │     └──────────┬───────────┘
│ - Dispatch meshColorsChanged  │                │
└─────────────┬─────────────────┘                │
              │                                  │
              ▼                                  ▼
┌───────────────────────────────────────────────────────────┐
│             drawCellsToCanvas with colors                 │
└─────────────────────────┬─────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────┐
│             Apply blur if blurAmount > 0                  │
└─────────────────────────┬─────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────┐
│                Apply distortion effects                   │
└─────────────────────────┬─────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────┐
│              drawUI based on interaction                  │
└─────────────────────────┬─────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────┐
│   Dispatch meshColorsAvailable (via color tracking)       │
└───────────────────────────────────────────────────────────┘
```

## 6. Color Events

The system emits two primary color-related events:

1. **meshColorsChanged**: Triggered when colors are regenerated (not during preserved color operations)
2. **meshColorsAvailable**: Triggered after every render operation through color tracking system

## 7. API Reference

### 7.1 Color Retrieval Methods

- **getCellColor(cellIndex)**: Get color for a specific cell
- **getAllColors()**: Get all colors currently used in the gradient
- **getBaseColor()**: Get the base color used for generation

### 7.2 Color Setting Methods

- **setCellColor(cellIndex, hexColor, lock=false)**: Set color for a specific cell
- **setBaseColor(hexColor)**: Set the base color for gradient generation
- **setColorHarmony(harmonyType)**: Set the color harmony relationship
- **setColorTheme(theme)**: Apply a predefined color theme

### 7.3 Color Modification Methods

- **adjustColors({ hue, saturation, lightness })**: Adjust all colors by HSL properties
- **lockCellColor(cellIndex)**: Lock a cell's color to prevent changes
- **unlockCellColor(cellIndex)**: Unlock a previously locked cell color

## 8. Technical Notes

### 8.1 Color Preservation Strategy

The system carefully distinguishes between operations that should regenerate colors (`preserveColors=false`) and those that should maintain existing colors (`preserveColors=true`). This strategy ensures UI operations like dragging cells or hovering don't cause unwanted color changes.

### 8.2 UI Color Adaptation

The system calculates the luminance of cell colors to ensure UI elements (like control pills) have appropriate contrast against their backgrounds. This adaptive approach allows UI elements to remain visible regardless of the underlying gradient colors.

### 8.3 Animation Color Handling

During animation, the system captures original colors at the start and consistently uses these throughout the animation to prevent color flashing or changes. This provides a smooth visual experience as cells move.