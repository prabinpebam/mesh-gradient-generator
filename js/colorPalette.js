/**
 * Color palette generator with different harmony types
 */
class ColorPalette {
    constructor() {
        this.baseHue = 0;
    }

    /**
     * Generate a random base hue (0-360)
     */
    randomizeBaseHue() {
        this.baseHue = Math.floor(Math.random() * 360);
        return this.baseHue;
    }
    
    /**
     * Convert HSL to RGB
     * @param {Number} h - Hue (0-360)
     * @param {Number} s - Saturation (0-100)
     * @param {Number} l - Lightness (0-100)
     * @returns {Object} - RGB object {r, g, b}
     */
    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
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

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
    
    /**
     * Convert RGB to hex color string
     * @param {Object} rgb - RGB object {r, g, b}
     * @returns {String} - Hex color string
     */
    rgbToHex(rgb) {
        return '#' + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
    }
    
    /**
     * Create a color in HSL format
     * @param {Number} hue - Hue (0-360)
     * @param {Number} saturation - Saturation (0-100)
     * @param {Number} lightness - Lightness (0-100)
     * @returns {Object} - Color object with hex and rgb
     */
    createColor(hue, saturation, lightness) {
        // Normalize hue to 0-360
        hue = ((hue % 360) + 360) % 360;
        
        const rgb = this.hslToRgb(hue, saturation, lightness);
        const hex = this.rgbToHex(rgb);
        
        return {
            h: hue,
            s: saturation,
            l: lightness,
            rgb: rgb,
            hex: hex
        };
    }
    
    /**
     * Generate a color palette based on harmony type
     * @param {String} harmonyType - Type of color harmony
     * @param {Number} count - Number of colors to generate
     * @returns {Array} - Array of color objects
     */
    generate(harmonyType, count = 5) {
        if (!this.baseHue) {
            this.randomizeBaseHue();
        }
        
        let colors = [];
        let baseS = 70 + Math.random() * 20; // Saturation between 70-90
        let baseL = 40 + Math.random() * 30; // Lightness between 40-70
        
        switch (harmonyType.toLowerCase()) {
            case 'analogous':
                // Colors that are next to each other on the color wheel
                for (let i = 0; i < count; i++) {
                    let hue = (this.baseHue + (i - Math.floor(count/2)) * 15) % 360;
                    colors.push(this.createColor(hue, baseS, baseL));
                }
                break;
                
            case 'complementary':
                // Colors opposite each other on the color wheel
                for (let i = 0; i < count; i++) {
                    let ratio = i / (count - 1);
                    let hue = this.baseHue + 180 * ratio;
                    colors.push(this.createColor(hue, baseS, baseL));
                }
                break;
                
            case 'triadic':
                // Three colors evenly spaced on the color wheel
                for (let i = 0; i < count; i++) {
                    let step = Math.floor(i * 3 / count);
                    let subStep = (i * 3 / count) - step;
                    let hue = this.baseHue + (step * 120) + (subStep * 120);
                    colors.push(this.createColor(hue, baseS, baseL));
                }
                break;
                
            case 'tetradic':
                // Four colors forming a rectangle on the color wheel
                for (let i = 0; i < count; i++) {
                    let step = Math.floor(i * 4 / count);
                    let subStep = (i * 4 / count) - step;
                    let hue = this.baseHue + (step * 90) + (subStep * 90);
                    colors.push(this.createColor(hue, baseS, baseL));
                }
                break;
                
            case 'monochromatic':
                // Different shades and tints of one color
                for (let i = 0; i < count; i++) {
                    let lightness = 30 + (i * 40 / (count - 1));
                    colors.push(this.createColor(this.baseHue, baseS, lightness));
                }
                break;
                
            case 'split-complementary':
                // Base color plus two colors adjacent to its complement
                for (let i = 0; i < count; i++) {
                    let ratio = i / (count - 1);
                    let hue = this.baseHue;
                    if (ratio > 0.3 && ratio <= 0.65) {
                        hue = this.baseHue + 150 + (ratio - 0.3) * 60 / 0.35;
                    } else if (ratio > 0.65) {
                        hue = this.baseHue + 210;
                    }
                    colors.push(this.createColor(hue, baseS, baseL));
                }
                break;
                
            case 'random':
                // Random colors
                for (let i = 0; i < count; i++) {
                    const hue = Math.floor(Math.random() * 360);
                    colors.push(this.createColor(hue, baseS, baseL));
                }
                break;
                
            default:
                // Default to analogous
                return this.generate('analogous', count);
        }
        
        this.lastGeneratedColors = colors;
        return colors;
    }

    /**
     * Adjust HSL values of all generated colors
     * @param {Object} options - Adjustment options
     * @returns {Array} - Array of adjusted colors
     */
    adjustColors(options = {}) {
        // If no colors have been generated yet, generate some
        if (!this.lastGeneratedColors || this.lastGeneratedColors.length === 0) {
            this.lastGeneratedColors = this.generate('analogous', 5);
        }
        
        // Clone the colors to avoid modifying the originals
        const adjustedColors = this.lastGeneratedColors.map(color => {
            // Parse current HSL values
            const hsl = this.hexToHSL(color.hex);
            
            // Apply adjustments
            if (options.hue !== undefined) {
                hsl.h = (hsl.h + options.hue) % 360;
                if (hsl.h < 0) hsl.h += 360; // Handle negative hue
            }
            
            if (options.saturation !== undefined) {
                hsl.s = Math.max(0, Math.min(100, hsl.s + options.saturation));
            }
            
            if (options.lightness !== undefined) {
                hsl.l = Math.max(0, Math.min(100, hsl.l + options.lightness));
            }
            
            // Convert back to hex
            const newHex = this.hslToHex(hsl.h, hsl.s, hsl.l);
            
            return {
                hex: newHex,
                hsl: hsl
            };
        });
        
        // Save the adjusted colors for future adjustments
        this.lastGeneratedColors = adjustedColors;
        
        return adjustedColors;
    }
    
    /**
     * Convert hex color to HSL
     * @param {String} hex - Hex color code
     * @returns {Object} - HSL values
     */
    hexToHSL(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Convert hex to RGB
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        
        // Find max and min values
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        
        // Calculate lightness
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            // Achromatic
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h *= 60;
        }
        
        // Convert to percentages and round
        s = Math.round(s * 100);
        l = Math.round(l * 100);
        h = Math.round(h);
        
        return { h, s, l };
    }
    
    /**
     * Convert HSL to hex color
     * @param {Number} h - Hue (0-360)
     * @param {Number} s - Saturation (0-100)
     * @param {Number} l - Lightness (0-100)
     * @returns {String} - Hex color code
     */
    hslToHex(h, s, l) {
        // Convert to 0-1 range
        h /= 360;
        s /= 100;
        l /= 100;
        
        let r, g, b;
        
        if (s === 0) {
            // Achromatic
            r = g = b = l;
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
        
        // Convert to hex
        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
}
