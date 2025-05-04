# Mesh Gradient Generator

A powerful web application for creating beautiful, customizable mesh gradients using Voronoi diagrams. Create unique gradients for your design projects with an intuitive interface that offers extensive customization options.

## Features

- **Canvas Size Control**: Customize the dimensions of your gradient canvas
- **Voronoi Cell Manipulation**:
  - Adjust number of cells (2-20)
  - Fine-tune cell positions and colors in Edit Mode
- **Blur Control**: Modify the softness of gradient transitions
- **Color Harmonies**:
  - Analogous, Complementary, Triadic, Tetradic
  - Monochromatic, Split-Complementary, Random
- **Color Themes**:
  - Pastel, Vivid, Earth tones, Bauhaus
  - Scandinavian, Neon, Vintage/Retro
  - Material Design, Seasonal themes
- **Color Adjustments**:
  - Hue, Saturation, and Lightness controls
  - Color swatch palette
- **Animation Systems**:
  - **Cell Animation**: Physics-based movement with adjustable parameters
  - **Hue Animation**: Dynamic color cycling with speed and direction controls
  - Both animations can work simultaneously for complex effects
- **Distortion Effects**:
  - Polar/Swirl, Ripple, Wave
  - Twist, Bulge/Pinch, Barrel/Fisheye
- **Export Capability**: Save your creation as PNG
- **UI Features**:
  - Light/Dark theme toggle
  - Interactive color picker
  - Real-time parameter adjustments

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/prabinpebam/mesh-gradient.git
   ```
2. Navigate to the project directory:
   ```
   cd mesh-gradient
   ```
3. Open `index.html` in a modern web browser

## Usage

1. **Generate a Gradient**: Click the "Generate new gradient" button to create a random mesh gradient based on current settings
2. **Customize Parameters**:
   - Adjust cell count using the slider
   - Change blur amount to control gradient smoothness
   - Select color harmony and theme options
   - Apply distortion effects as desired
3. **Edit Mode**: Toggle Edit Mode to manually adjust individual cell colors
4. **Animate Your Gradient**:
   - **Cell Animation**: Enable cell movement with physics-based controls
     - Adjust force strength, damping, and maximum speed
     - Watch cells organically move across the canvas
   - **Hue Animation**: Enable color cycling through the hue spectrum
     - Control animation speed (degrees per second)
     - Set direction (clockwise or counter-clockwise)
     - Works with color-locked cells and custom color settings
5. **Export**: Click "Export as PNG" to save your creation

## Technologies Used

- HTML5 Canvas
- CSS3
- JavaScript (ES6+)
- Bootstrap 5.3.0
- Bootstrap Icons
- d3-delaunay (for Voronoi diagrams)

## Project Structure

```
mesh-gradient/
├── index.html
├── styles/
│   └── main.css
├── js/
│   ├── colorPalette.js        # Color generation and harmony logic
│   ├── voronoi.js             # Voronoi diagram generation
│   ├── meshGradient.js        # Main gradient logic
│   ├── meshGradient/          # Core gradient components
│   │   ├── MeshGradientData.js
│   │   ├── MeshGradientRenderer.js
│   │   ├── MeshGradientCore.js
│   │   └── index.js
│   ├── distortion/            # Distortion effect modules
│   │   ├── ripple.js
│   │   ├── polar.js
│   │   ├── wave.js
│   │   ├── twist.js
│   │   ├── bulge.js
│   │   ├── barrel.js
│   │   └── distortionManager.js
│   ├── ui.js                  # UI interaction handling
│   ├── themeManager.js        # Light/dark theme handling
│   └── ui-check.js            # Safety checks for browser compatibility
└── screenshots/               # Project screenshots
```

## Browser Compatibility

This application works best with modern browsers that support HTML5 Canvas and ES6+ JavaScript features:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

[MIT License](LICENSE)

## Author

Created by Prabin Pebam

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
