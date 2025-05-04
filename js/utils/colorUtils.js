/**
 * Color utility functions for the Mesh Gradient application
 */

/**
 * Generate a random hex color
 * @returns {string} Random hex color
 */
export function generateRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
 * Convert HEX color to HSL
 * @param {string} hex - HEX color code
 * @returns {Object} HSL color values
 */
export function hexToHSL(hex) {
  // Remove the # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Find min and max RGB components
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch(max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Convert HSL values to HEX color
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} HEX color code
 */
export function hslToHex(h, s, l) {
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

/**
 * Calculate color luminance
 * @param {Object} color - Color object with l property
 * @returns {number} Luminance value (0-1)
 */
export function calculateLuminance(color) {
  return color.l / 100;
}

/**
 * Get contrasting text color (black or white)
 * @param {string} hexColor - HEX color code
 * @returns {string} '#000000' or '#FFFFFF'
 */
export function getContrastColor(hexColor) {
  const { l } = hexToHSL(hexColor);
  return l > 50 ? '#000000' : '#FFFFFF';
}

/**
 * Get unique colors from an array (based on hex value)
 * @param {Array} colors - Array of color objects with hex property
 * @returns {Array} Unique colors
 */
export function getUniqueColors(colors) {
  const uniqueHexColors = new Set();
  const uniqueColors = [];
  
  colors.forEach(color => {
    const hexColor = typeof color === 'string' ? color : (color && color.hex);
    if (hexColor && !uniqueHexColors.has(hexColor)) {
      uniqueHexColors.add(hexColor);
      uniqueColors.push(color);
    }
  });
  
  return uniqueColors;
}
