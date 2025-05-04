/**
 * HueAnimator - Handles hue animation for MeshGradient
 */
class HueAnimator {
    constructor(core) {
        this.core = core;
        this.active = false;
        this.frameId = null;
        this.startTime = 0;
        this.baseColors = [];
        this.speed = 15; // degrees per second - default
        this.direction = true; // true=clockwise, false=counter-clockwise
        
        // Verify swatch update system is initialized
        this.verifyColorTracking();
    }
    
    /**
     * Ensure color tracking is initialized for swatch updates
     */
    verifyColorTracking() {
        if (this.core && typeof this.core.initializeColorTracking === 'function') {
            this.core.initializeColorTracking();
            console.log('[HueAnimator] Verified color tracking system for swatch updates');
        } else {
            console.warn('[HueAnimator] Color tracking system not available - swatch updates may not work');
        }
    }
    
    /**
     * Start the hue animation
     */
    start() {
        if (this.active) return false;
        
        // Store base colors to apply transformations to
        this.baseColors = this.core.getAllColors();
        if (!this.baseColors || this.baseColors.length === 0) {
            console.error('[HueAnimator] No colors available to animate');
            return false;
        }
        
        // Add cell indices to colors if not present
        this.baseColors = this.baseColors.map((color, index) => ({
            ...color,
            cellIndex: color.cellIndex !== undefined ? color.cellIndex : index
        }));
        
        this.active = true;
        this.startTime = performance.now();
        this.animate(this.startTime);
        
        console.log(`[HueAnimator] Started with ${this.baseColors.length} colors at speed ${this.speed}°/s`);
        return true;
    }
    
    /**
     * Stop the hue animation
     */
    stop() {
        if (!this.active) return false;
        
        this.active = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        
        console.log('[HueAnimator] Stopped');
        return true;
    }
    
    /**
     * Set animation speed
     * @param {Number} speed - Degrees per second
     */
    setSpeed(speed) {
        this.speed = Math.max(1, Math.min(60, speed));
        return this.speed;
    }
    
    /**
     * Set animation direction
     * @param {Boolean} clockwise - True for clockwise, false for counter-clockwise
     */
    setDirection(clockwise) {
        this.direction = clockwise;
        return this.direction;
    }
    
    /**
     * Animation frame function
     * @param {Number} timestamp - Current timestamp
     */
    animate(timestamp) {
        if (!this.active) return;
        
        // Calculate elapsed seconds
        const elapsedSeconds = (timestamp - this.startTime) / 1000;
        
        // Calculate colors with adjusted hue
        const adjustedColors = this.calculateHueAdjustedColors(elapsedSeconds);
        
        // Add debug logging for color changes
        if (Math.random() < 0.05) { // Only log occasionally to avoid flooding
            console.log(`[HueAnimator] Elapsed time: ${elapsedSeconds.toFixed(2)}s`);
            if (this.baseColors.length > 0 && adjustedColors.length > 0) {
                console.log(`[HueAnimator] Original hue: ${this.baseColors[0].h.toFixed(1)}, Adjusted: ${adjustedColors[0].h.toFixed(1)}`);
                console.log(`[HueAnimator] Original color: ${this.baseColors[0].hex}, Adjusted: ${adjustedColors[0].hex}`);
            }
        }
        
        // Render with adjusted colors and preserve colors to avoid regeneration
        this.core.render(adjustedColors, true);
        
        // Schedule next frame
        this.frameId = requestAnimationFrame(this.animate.bind(this));
    }
    
    /**
     * Calculate hue-adjusted colors based on elapsed time
     * @param {Number} elapsedTime - Time in seconds
     * @returns {Array} - Array of adjusted color objects
     */
    calculateHueAdjustedColors(elapsedTime) {
        // Calculate total hue offset - fix the calculation
        const hueOffset = (this.speed * elapsedTime) % 360;
        const directionMultiplier = this.direction ? 1 : -1;
        const finalHueOffset = hueOffset * directionMultiplier;
        
        // Apply offset to each base color
        return this.baseColors.map(color => {
            // Skip locked colors if method exists
            if (this.core.isCellColorLocked && this.core.isCellColorLocked(color.cellIndex)) {
                return {...color};
            }
            
            // Calculate new hue (0-359 range)
            let newHue = color.h + finalHueOffset;
            while (newHue < 0) newHue += 360;
            while (newHue >= 360) newHue %= 360;
            
            // Create new color with updated hue
            return {
                ...color,
                h: newHue,
                hex: this.hslToHex(newHue, color.s, color.l),
                cellIndex: color.cellIndex
            };
        });
    }
    
    /**
     * Convert HSL to hex color - Fixed implementation
     * @param {Number} h - Hue (0-360)
     * @param {Number} s - Saturation (0-100)
     * @param {Number} l - Lightness (0-100)
     * @returns {String} - Hex color
     */
    hslToHex(h, s, l) {
        // Convert to 0-1 range
        h = h / 360;
        s = s / 100;
        l = l / 100;
        
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
        
        // Convert to hex
        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
}
