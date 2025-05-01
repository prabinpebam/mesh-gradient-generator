/**
 * MeshGradientData - Manages color and pattern data
 */
class MeshGradientData {
    constructor(core) {
        this.core = core;
        
        // Voronoi and color settings
        this.voronoi = new VoronoiGenerator(core.width, core.height);
        this.colorPalette = new ColorPalette();
        
        // Cell settings
        this.cellCount = 5;
        this.minCellCount = 2;
        this.maxCellCount = 20;
        
        // Blur settings
        this.maxBlurAmount = this.calculateMaxBlurAmount();
        this.blurAmount = this.calculateDefaultBlurAmount();
        
        // Color settings
        this.colorHarmony = 'analogous';
        this.colorTheme = 'none';
        this.currentColors = [];
        
        // Color overrides and locks
        this.colorOverrides = {};
        this.lockedColors = {};
        
        // Distortions
        this.distortions = new DistortionManager();
    }
    
    /**
     * Calculate the maximum blur amount based on canvas dimensions
     * @returns {Number} - Maximum blur amount
     */
    calculateMaxBlurAmount() {
        const largerDimension = Math.max(this.core.width, this.core.height);
        return Math.round(largerDimension * 0.5);
    }
    
    /**
     * Calculate the default blur amount
     * @returns {Number} - Default blur amount
     */
    calculateDefaultBlurAmount() {
        const largerDimension = Math.max(this.core.width, this.core.height);
        const defaultBlur = Math.round(largerDimension * 0.15);
        return Math.min(defaultBlur, this.maxBlurAmount);
    }
    
    /**
     * Update dimensions when canvas is resized
     * @param {Number} width - New width
     * @param {Number} height - New height
     */
    resizeDimensions(width, height) {
        this.voronoi.setDimensions(width, height);
    }
    
    /**
     * Get all constraints for UI
     * @returns {Object} - Object with constraints
     */
    getConstraints() {
        return {
            blur: {
                min: 0,
                max: this.maxBlurAmount,
                current: this.blurAmount,
                default: this.calculateDefaultBlurAmount()
            },
            cells: {
                min: this.minCellCount,
                max: this.maxCellCount,
                current: this.cellCount,
                default: 5
            }
        };
    }
    
    /**
     * Setup generation parameters
     * @param {Object} options - Generation options
     */
    setupGeneration(options = {}) {
        // Update properties with validation
        if (options.cellCount !== undefined) {
            this.cellCount = Math.max(this.minCellCount, Math.min(this.maxCellCount, options.cellCount));
        }
        if (options.blurAmount !== undefined) this.blurAmount = options.blurAmount;
        if (options.colorHarmony) this.colorHarmony = options.colorHarmony;
        
        // Generate new sites
        this.voronoi.generateRandomSites(this.cellCount);
        
        // Generate new base palette
        this.colorPalette.randomizeBaseHue();
        const colors = this.buildPalette();
        
        // Store colors and clear overrides
        this.currentColors = colors;
        this.colorOverrides = {};
    }
    
    /**
     * Process colors for rendering
     * @returns {Array} - Array of color objects
     */
    processColors() {
        // Store locked colors to preserve them
        const lockedColors = {};
        if (this.lockedCells && this.currentColors) {
            for (let i = 0; i < this.cellCount; i++) {
                if (this.lockedCells[i]) {
                    lockedColors[i] = this.currentColors[i];
                }
            }
        }
        
        // Build the color palette based on harmony and theme
        const colors = this.buildPalette();
        
        // Restore locked colors
        if (this.lockedCells) {
            for (const cellIndex in lockedColors) {
                if (lockedColors[cellIndex]) {
                    colors[cellIndex] = lockedColors[cellIndex];
                }
            }
        }
        
        this.currentColors = colors;
        return colors;
    }
    
    /**
     * Build color palette with theme applied
     * @returns {Array} - Array of color objects
     */
    buildPalette() {
        const base = this.colorPalette.generate(this.colorHarmony, this.cellCount);
        return this.applyTheme(base);
    }
    
    /**
     * Apply theme to colors
     * @param {Array} colors - Array of color objects
     * @returns {Array} - Array of theme-adjusted color objects
     */
    applyTheme(colors) {
        if (this.colorTheme === 'none') return colors;
        
        return colors.map(c => {
            let { h, s, l } = c;
            let nh = h, ns = s, nl = l;
            
            switch (this.colorTheme) {
                case 'pastel':
                    ns = Math.max(25, Math.min(60,s));
                    nl = Math.max(70, l);
                    break;
                    
                case 'vivid':
                    ns = Math.max(80, s);
                    nl = Math.max(40, Math.min(60,l));
                    break;
                
                case 'bauhaus': {
                    /* ---------- Authentic Bauhaus RYB Target Values ---------- */
                    // Historical Bauhaus primary triad (Itten/Kandinsky)
                    const targets = [
                        { h: 354, s: 84, l: 43 },  // Red #BE1E2D
                        { h: 51,  s: 91, l: 55 },  // Yellow #FFDE17
                        { h: 225, s: 79, l: 37 }   // Blue #21409A
                    ];
                    
                    // Find closest primary - snap to red, yellow, or blue
                    let closest = targets[0];
                    let minDist = 360;
                    
                    for (const target of targets) {
                        // Calculate hue distance (in degrees)
                        // Account for hue being circular (0-360)
                        const dist = Math.min(
                            Math.abs(h - target.h), 
                            Math.abs(h - (target.h + 360))
                        );
                        
                        if (dist < minDist) {
                            minDist = dist;
                            closest = target;
                        }
                    }
                    
                    // Add black/white (Itten's contrast concept)
                    if (l < 20) {
                        // For very dark colors, push to true black
                        nh = 0; ns = 0; nl = 0;
                    } else if (l > 85) {
                        // For very light colors, push to pure white
                        nh = 0; ns = 0; nl = 100;
                    } else {
                        // Otherwise snap to closest primary hue
                        nh = closest.h;
                        // Ensure high saturation within Bauhaus range
                        ns = Math.max(65, closest.s);  
                        // Keep in mid-range lightness bounds
                        nl = Math.max(35, Math.min(55, closest.l));
                    }
                    break;
                }
                
                case 'earth': {
                    /* ---------- 1. hue clamp ---------- */
                    const inWarm   = h >= 10 && h <= 60;
                    const inGreen  = h >= 80 && h <= 140;
                    if (!inWarm && !inGreen) {
                        // snap to nearest allowed band edge
                        const candidates = [10, 60, 80, 140];
                        nh = candidates.reduce((a, b) =>
                            Math.abs(b - h) < Math.abs(a - h) ? b : a, candidates[0]);
                    }

                    /* ---------- 2. saturation / lightness clamp ---------- */
                    ns = Math.max(26, Math.min(41, s));
                    nl = Math.max(36, Math.min(77, l));

                    /* ---------- 3. tone with gray (40 % blend) ---------- */
                    // Convert to RGB, blend, convert back to HSL
                    const rgb = this.colorPalette.hslToRgb(nh, ns, nl);
                    const gray = 0.5 * 255;
                    const mix = 0.4;                        // 40 % gray
                    const toned = {
                        r: Math.round(rgb.r * (1 - mix) + gray * mix),
                        g: Math.round(rgb.g * (1 - mix) + gray * mix),
                        b: Math.round(rgb.b * (1 - mix) + gray * mix)
                    };
                    const hex = this.colorPalette.rgbToHex(toned);
                    const hsl = this.colorPalette.hexToHSL(hex);
                    nh = hsl.h; ns = hsl.s; nl = hsl.l;
                    break;
                }

                case 'scandi': {
                    // Color category determination based on initial lightness
                    if (l >= 80) {
                        // Neutral Base: Off-whites with minimal saturation
                        // S ≤ 10%, L ≥ 85%
                        ns = Math.min(10, s);
                        nl = Math.max(85, l);
                    } else if (l >= 50 && l <= 70) {
                        // Mid-tones: Light grays & beiges
                        // S ≤ 10%, L ∈ [50%, 70%]
                        ns = Math.min(10, s);
                        nl = Math.max(50, Math.min(70, l));
                    } else if (l >= 60 && l <= 90) {
                        // Soft accent hues - identify by hue ranges
                        if (h >= 200 && h <= 220) {
                            // Pale Blues
                            // H ∈ [200°, 220°], S ∈ [10%, 30%], L ∈ [80%, 90%]
                            nh = h;  // Keep hue
                            ns = Math.max(10, Math.min(30, s));
                            nl = Math.max(80, Math.min(90, l));
                        } else if (h >= 100 && h <= 140) {
                            // Muted Greens
                            // H ∈ [100°, 140°], S ∈ [20%, 40%], L ∈ [60%, 80%]
                            nh = h;  // Keep hue
                            ns = Math.max(20, Math.min(40, s));
                            nl = Math.max(60, Math.min(80, l));
                        } else if (h >= 10 && h <= 30) {
                            // Warm Terracotta
                            // H ∈ [10°, 30°], S ∈ [30%, 50%], L ∈ [60%, 80%]
                            nh = h;  // Keep hue
                            ns = Math.max(30, Math.min(50, s));
                            nl = Math.max(60, Math.min(80, l));
                        } else {
                            // Other hues - convert to nearest valid accent
                            // Default to pale blue if no specific match
                            nh = 210;  // Default pale blue
                            ns = 20;
                            nl = 85;
                        }
                    } else if (l <= 30) {
                        // Dark Accents - used sparingly
                        // S ≤ 60%, L ≤ 30%
                        nh = h;  // Keep hue
                        ns = Math.min(60, s);
                        nl = Math.min(30, l);
                    } else {
                        // Any remaining colors - convert to safe neutral
                        ns = Math.min(10, s);
                        nl = 85;  // Default light neutral
                    }
                    break;
                }

                case 'neon': {
                    // Extreme purity and brightness
                    // HSL: S≥90%, L≈50%
                    ns = Math.max(90, s);  // Very high saturation
                    nl = 50;  // Fixed mid-lightness for optimal brightness
                    break;
                }

                case 'vintage': {
                    // Desaturated, slightly muted with warm bias
                    // S ≤ 60%, L ≥ 60%
                    ns = Math.min(60, s);
                    nl = Math.max(60, l); 
                    
                    // Prefer warm hues (sepia-style) - shift toward the warm range
                    if (h < 20 || h > 50) {
                        // Gradually shift colors toward the warm/sepia center (35°)
                        // Colors already in range stay as is
                        const target = 35; // Center of sepia/warm vintage range
                        const weight = 0.7; // Strength of shift (0-1)
                        nh = h + (target - h) * weight;
                        // Ensure hue stays in 0-360 range
                        nh = ((nh % 360) + 360) % 360;
                    }
                    break;
                }

                case 'material': {
                    // Create a strong, random seed color for consistent palette generation
                    // Generate a random base hue if none exists
                    const seedHue = Math.floor(Math.random() * 360);
                    
                    // Always assign strong color properties for material palettes
                    // Determine a random palette type for each color
                    const paletteTypes = ['primary', 'secondary', 'tertiary', 'neutral', 'neutralVariant'];
                    const palette = paletteTypes[Math.floor(Math.random() * 3)]; // Favor primary/secondary/tertiary
                    
                    // Apply Material's hue logic
                    if (palette === 'tertiary') {
                        // Tertiary is 60° shifted from primary
                        nh = (seedHue + 60) % 360;
                    } else {
                        // All other palettes share the seed hue
                        nh = seedHue;
                    }
                    
                    // Apply appropriate saturation and lightness based on palette role
                    switch (palette) {
                        case 'primary':
                            ns = 80; // Higher saturation for primaries
                            nl = 40; // Strong primary color (40% lightness is vibrant)
                            break;
                            
                        case 'secondary':
                            ns = 40; // Medium saturation for secondary
                            nl = 40; // Same lightness level for consistency
                            break;
                            
                        case 'tertiary':
                            ns = 50; // Medium-high saturation
                            nl = 40; // Same lightness for consistent vibrance
                            break;
                            
                        case 'neutralVariant':
                            ns = 8;  // Very low saturation but still maintains hue
                            nl = 80; // Light neutral variant
                            break;
                            
                        case 'neutral':
                            ns = 4;  // Minimal saturation
                            nl = 95; // Very light (almost white) for neutrals
                            break;
                    }
                    break;
                }

                // Individual seasonal themes
                case 'spring': {
                    // Warm pastels
                    nh = Math.max(30, Math.min(60, h)); // Ensure hue in spring range
                    ns = Math.max(30, Math.min(60, s));
                    nl = Math.max(70, Math.min(90, l));
                    break;
                }

                case 'summer': {
                    // Cool muted
                    nh = Math.max(180, Math.min(240, h)); // Ensure hue in summer range
                    ns = Math.max(20, Math.min(50, s));
                    nl = Math.max(60, Math.min(80, l));
                    break;
                }

                case 'autumn': {
                    // Rich earth tones
                    const inWarm = h >= 10 && h <= 60;
                    const inGreen = h >= 80 && h <= 140;
                    if (!inWarm && !inGreen) {
                        // snap to nearest allowed band edge
                        const candidates = [10, 60, 80, 140];
                        nh = candidates.reduce((a, b) =>
                            Math.abs(b - h) < Math.abs(a - h) ? b : a, candidates[0]);
                    }
                    
                    // Set saturation and lightness ranges
                    ns = Math.max(30, Math.min(60, s));
                    nl = Math.max(40, Math.min(70, l));
                    break;
                }

                case 'winter': {
                    // Cool high-contrast
                    nh = Math.max(240, Math.min(300, h)); // Ensure hue in winter range
                    ns = Math.max(60, Math.min(90, s));
                    nl = Math.max(20, Math.min(60, l));
                    break;
                }
            }
            
            return {
                h: nh,
                s: ns,
                l: nl,
                hex: this.colorPalette.hslToHex(nh, ns, nl)
            };
        });
    }
    
    /**
     * Set color harmony type
     * @param {String} harmonyType - Color harmony type
     * @param {Function} renderCallback - Callback to trigger render
     */
    setColorHarmony(harmonyType, renderCallback = null) {
        // Store old values to preserve
        const oldHarmony = this.colorHarmony;
        const oldBaseHue = this.colorPalette.baseHue;
        
        // Set new harmony
        this.colorHarmony = harmonyType;
        
        // Use same hue for consistency when changing harmony type
        const colors = this.colorPalette.generate(harmonyType, this.cellCount, true);
        
        // Apply theme if active
        const themedColors = this.colorTheme !== 'none' ? this.applyTheme(colors) : colors;
        
        // Store processed colors
        this.currentColors = themedColors;
        
        // Call render callback if provided
        if (renderCallback) {
            renderCallback(themedColors);
        }
        
        return themedColors;
    }
    
    /**
     * Set the color theme and regenerate colors
     * @param {String} theme - The theme to use
     * @param {Function} callback - Optional callback after theme change
     */
    setColorTheme(theme, callback = null) {
        this.colorTheme = theme;
        // always regenerate to honour theme constraints
        const colors = this.buildPalette();
        this.currentColors = colors;
        if (callback) callback();
    }
    
    /**
     * Set cell count
     * @param {Number} count - New cell count
     * @param {Function} generateCallback - Callback to regenerate gradient
     */
    setCellCount(count, generateCallback = null) {
        // Store the old count
        const oldCount = this.cellCount;
        
        // Set and validate new count
        this.cellCount = Math.max(this.minCellCount, Math.min(this.maxCellCount, count));
        
        // Update Voronoi sites
        this.voronoi.setCellCount(this.cellCount);

        // Always regenerate colors when cell count changes
        // This follows the expected UX where changing cell count should generate a new gradient
        this.processColors();
        
        // Call callback if provided
        if (generateCallback) {
            generateCallback();
        }
        
        return this;
    }
    
    /**
     * Adjust colors with options
     * @param {Object} options - Adjustment options
     * @returns {Array} - Array of adjusted colors
     */
    adjustColors(options = {}) {
        const colors = this.colorPalette.adjustColors(options);
        this.currentColors = colors;
        return colors;
    }
    
    /**
     * Set color for a specific cell
     * @param {Number} cellIndex - Index of the cell
     * @param {String} hexColor - Hex color string
     * @param {Boolean} lock - Whether to lock the color
     */
    setCellColor(cellIndex, hexColor, lock = false) {
        if (cellIndex < 0 || cellIndex >= this.cellCount) return;
        
        // Convert hex color to HSL
        const hsl = this.colorPalette.hexToHSL(hexColor);
        
        // Create color object
        const color = {
            hex: hexColor,
            h: hsl.h,
            s: hsl.s,
            l: hsl.l
        };
        
        // Update the color in the current colors array
        if (!this.currentColors) {
            this.currentColors = [];
        }
        
        // Make sure the array is large enough
        while (this.currentColors.length <= cellIndex) {
            this.currentColors.push(null);
        }
        
        // Set the color
        this.currentColors[cellIndex] = color;
        
        // Lock if needed
        if (lock) {
            this.lockCellColor(cellIndex);
        }
        
        // Important - do NOT regenerate all colors!
        // Just update the specific one
    }
    
    /**
     * Lock a cell's current color
     * @param {Number} cellIndex - Index of the cell
     */
    lockCellColor(cellIndex) {
        if (cellIndex < 0 || cellIndex >= this.cellCount) return;
        
        // Get current color and store in locked colors
        const currentColor = this.getCellColor(cellIndex);
        this.lockedColors[cellIndex] = currentColor;
        
        // Remove from temporary overrides if present
        delete this.colorOverrides[cellIndex];
    }
    
    /**
     * Unlock a cell's color
     * @param {Number} cellIndex - Index of the cell
     */
    unlockCellColor(cellIndex) {
        if (cellIndex < 0 || cellIndex >= this.cellCount) return;
        
        // Remove from locked colors and overrides
        delete this.lockedColors[cellIndex];
        delete this.colorOverrides[cellIndex];
    }
    
    /**
     * Check if cell color is locked
     * @param {Number} cellIndex - Index of the cell
     * @returns {Boolean} - Whether the cell color is locked
     */
    isCellColorLocked(cellIndex) {
        return this.lockedColors.hasOwnProperty(cellIndex);
    }
    
    /**
     * Get color for a specific cell
     * @param {Number} cellIndex - Index of the cell
     * @returns {Object} - Color object
     */
    getCellColor(cellIndex) {
        // Check for locked color first
        if (this.lockedColors[cellIndex]) {
            return this.lockedColors[cellIndex];
        }
        
        // Then check for override
        if (this.colorOverrides[cellIndex]) {
            return this.colorOverrides[cellIndex];
        }
        
        // Otherwise use palette color
        if (this.currentColors && this.currentColors.length > 0) {
            return this.currentColors[cellIndex % this.currentColors.length];
        }
        
        // Default fallback
        return { h: 0, s: 0, l: 50, hex: '#808080' };
    }
}
