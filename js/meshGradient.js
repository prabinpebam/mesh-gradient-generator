/**
 * Mesh Gradient Generator using Voronoi patterns and color palettes
 */
class MeshGradient {
    constructor() {
        this.canvas = document.getElementById('gradientCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.width = 800;
        this.height = 600;
        
        this.voronoi = new VoronoiGenerator(this.width, this.height);
        this.colorPalette = new ColorPalette();
        
        this.cellCount = 5; // Changed from 20 to 5
        this.minCellCount = 2;
        this.maxCellCount = 20;
        this.maxBlurAmount = this.calculateMaxBlurAmount();
        this.blurAmount = this.calculateDefaultBlurAmount();
        this.colorHarmony = 'analogous';
        this.editMode = false;
        
        this.resizeCanvas(this.width, this.height);
        
        // For edit mode
        this.dragSiteIndex = -1;

        this.currentColors = [];   // <-- remember last palette

        this.offCanvas = document.createElement('canvas');
        this.offCanvas.width  = this.width;
        this.offCanvas.height = this.height;
        this.offCtx = this.offCanvas.getContext('2d');

        this.distortions = new DistortionManager();

        this.colorTheme = 'none';

        console.log("MeshGradient constructor", this);
        console.log("DistortionManager initialized", this.distortions);
    }
    
    /**
     * Calculate the maximum blur amount based on canvas dimensions (50% of larger dimension)
     * @returns {Number} - Maximum blur amount
     */
    calculateMaxBlurAmount() {
        const largerDimension = Math.max(this.width, this.height);
        return Math.round(largerDimension * 0.5); // Changed from 0.8 to 0.5
    }
    
    /**
     * Calculate the default blur amount based on canvas dimensions (15% of larger dimension)
     * @returns {Number} - Default blur amount
     */
    calculateDefaultBlurAmount() {
        const largerDimension = Math.max(this.width, this.height);
        // Explicitly calculate 15% of larger dimension (not 15% of maxBlurAmount)
        const defaultBlur = Math.round(largerDimension * 0.15);
        return Math.min(defaultBlur, this.maxBlurAmount);
    }
    
    /**
     * Resize the canvas
     * @param {Number} width - New width
     * @param {Number} height - New height
     */
    resizeCanvas(width, height) {
        this.width  = width;
        this.height = height;

        this.canvas.width  = width;
        this.canvas.height = height;

        this.voronoi.setDimensions(width, height);

        // 1️⃣ Re‑compute absolute limits
        this.maxBlurAmount = this.calculateMaxBlurAmount();

        // 2️⃣ Re‑establish a fresh default (15 % of larger side)
        this.blurAmount = this.calculateDefaultBlurAmount(); // nothing extra

        // 3️⃣ Return fresh constraints for UI
        if (this.offCanvas) {
            this.offCanvas.width = width;
            this.offCanvas.height = height;
        }

        return {
            maxBlurAmount: this.maxBlurAmount,
            currentBlurAmount: this.blurAmount,
            minCellCount: this.minCellCount,
            maxCellCount: this.maxCellCount,
            currentCellCount: this.cellCount
        };
    }
    
    /**
     * Get all current constraint values for UI updates
     * @returns {Object} - All current constraints and values
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
     * Get blur amount for UI updates
     * @returns {Number} - Current blur amount
     */
    getBlurAmount() {
        return this.blurAmount;
    }
    
    /**
     * Get maximum blur amount
     * @returns {Number} - Maximum blur amount
     */
    getMaxBlurAmount() {
        return this.maxBlurAmount;
    }
    
    /**
     * Generate a new mesh gradient
     * @param {Object} options - Generation options
     */
    generate(options = {}) {
        // Update properties from options with validation
        if (options.cellCount !== undefined) {
            this.cellCount = Math.max(this.minCellCount, Math.min(this.maxCellCount, options.cellCount));
        }
        if (options.blurAmount !== undefined) this.blurAmount = options.blurAmount;
        if (options.colorHarmony) this.colorHarmony = options.colorHarmony;
        
        // Generate Voronoi sites
        this.voronoi.generateRandomSites(this.cellCount);
        
        // Generate colors based on harmony type
        this.colorPalette.randomizeBaseHue();
        const colors = this.buildPalette();
        this.currentColors = colors;
        this.render(colors);
    }
    
    /**
     * Render the gradient on the canvas
     * @param {Array} colors - Array of colors for cells
     */
    render(colors = null) {
        console.log("MeshGradient.render called", {colors, editMode: this.editMode});
        
        // Clear original canvas
        this.offCtx.clearRect(0, 0, this.width, this.height);
        
        // Get Voronoi cells
        const cells = this.voronoi.getCells();
        console.log("Voronoi cells:", cells.length);
        
        // Use stored palette or generate new one
        if (!colors || colors.length === 0) {
            if (this.currentColors && this.currentColors.length === this.cellCount) {
                colors = this.currentColors;
            } else {
                colors = this.colorPalette.generate(this.colorHarmony, this.cellCount);
                this.currentColors = colors;
            }
        } else {
            this.currentColors = colors;
        }
        
        console.log("Using colors:", colors.length);
        
        // Draw cells to off-screen canvas
        cells.forEach((cell, index) => {
            const color = colors[index % colors.length];
            this.offCtx.beginPath();
            const path = new Path2D(cell.path);
            this.offCtx.fillStyle = color.hex;
            this.offCtx.fill(path);
        });
        
        console.log("Cells drawn to offscreen canvas");
        
        // Apply blur effect to off-screen canvas
        if (this.blurAmount > 0) {
            console.log("Applying blur:", this.blurAmount);
            // Fix: Pass the offscreen canvas, not the context
            this.applyUniformBlur(this.blurAmount);
        }
        
        // Apply distortion pipeline from off-screen to main canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        console.log("Applying distortion", {
            hasActive: this.distortions.hasActive(),
            stack: this.distortions.stack
        });
        
        this.distortions.apply(this.offCanvas, this.ctx);
        
        // Draw edit mode overlays if enabled and no distortions
        if (this.editMode && !this.distortions.hasActive()) {
            this.drawCellBorders(cells);
            this.drawSites(this.voronoi.sites);
        }
    }
    
    /**
     * Apply uniform blur to the entire canvas including edges
     * @param {Number} blurAmount - Amount of blur to apply
     */
    applyUniformBlur(blurAmount) {
        console.log("applyUniformBlur called with amount:", blurAmount);
        
        // Create a temporary canvas with padding for the blur
        const tempCanvas = document.createElement('canvas');
        const padding = Math.ceil(blurAmount * 2.5); // Generous padding to avoid edge artifacts
        tempCanvas.width = this.width + padding * 2;
        tempCanvas.height = this.height + padding * 2;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Copy original content from offscreen canvas to the center of temp canvas
        tempCtx.drawImage(this.offCanvas, 0, 0, this.width, this.height, padding, padding, this.width, this.height);
        
        // Extend edge pixels to padding area to avoid dark edges
        this.extendEdgePixels(tempCtx, padding);
        
        // Apply blur to the temporary canvas
        tempCtx.filter = `blur(${blurAmount}px)`;
        tempCtx.drawImage(tempCanvas, 0, 0);
        tempCtx.filter = 'none';
        
        // Copy the blurred content back to the offscreen canvas
        this.offCtx.clearRect(0, 0, this.width, this.height);
        this.offCtx.drawImage(tempCanvas, padding, padding, this.width, this.height, 0, 0, this.width, this.height);
        
        console.log("Blur applied to offscreen canvas");
    }
    
    /**
     * Extend the edge pixels into the padding area
     * @param {CanvasRenderingContext2D} ctx - Context of the temporary canvas
     * @param {Number} padding - Padding size
     */
    extendEdgePixels(ctx, padding) {
        const w = this.width;
        const h = this.height;
        const p = padding;
        
        // Extend top edge
        ctx.drawImage(ctx.canvas, p, p, w, 1, p, 0, w, p);
        
        // Extend bottom edge
        ctx.drawImage(ctx.canvas, p, p + h - 1, w, 1, p, p + h, w, p);
        
        // Extend left edge (including the corners)
        ctx.drawImage(ctx.canvas, p, 0, 1, p*2 + h, 0, 0, p, p*2 + h);
        
        // Extend right edge (including the corners)
        ctx.drawImage(ctx.canvas, p + w - 1, 0, 1, p*2 + h, p + w, 0, p, p*2 + h);
        
        // Fill in the corners to ensure proper blending
        // Top left corner
        ctx.drawImage(ctx.canvas, p, p, 1, 1, 0, 0, p, p);
        
        // Top right corner
        ctx.drawImage(ctx.canvas, p + w - 1, p, 1, 1, p + w, 0, p, p);
        
        // Bottom left corner
        ctx.drawImage(ctx.canvas, p, p + h - 1, 1, 1, 0, p + h, p, p);
        
        // Bottom right corner
        ctx.drawImage(ctx.canvas, p + w - 1, p + h - 1, 1, 1, p + w, p + h, p, p);
    }
    
    /**
     * Draw Voronoi cell borders
     * @param {Array} cells - Array of cell objects
     */
    drawCellBorders(cells) {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.lineWidth = 1;
        
        cells.forEach(cell => {
            this.ctx.beginPath();
            const path = new Path2D(cell.path);
            this.ctx.stroke(path);
        });
    }
    
    /**
     * Draw Voronoi sites (cell centers)
     * @param {Array} sites - Array of site coordinates
     */
    drawSites(sites) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.lineWidth = 1;
        
        sites.forEach(site => {
            this.ctx.beginPath();
            this.ctx.arc(site[0], site[1], 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        });
    }
    
    /**
     * Toggle edit mode
     * @param {Boolean} enabled - Whether edit mode is enabled
     */
    setEditMode(enabled) {
        this.editMode = enabled;
        this.render();
        
        if (enabled) {
            document.body.classList.add('edit-mode');
        } else {
            document.body.classList.remove('edit-mode');
        }
    }
    
    /**
     * Start dragging a site
     * @param {Number} x - Mouse X position
     * @param {Number} y - Mouse Y position
     */
    startDrag(x, y) {
        if (!this.editMode) return;
        this.dragSiteIndex = this.voronoi.findClosestSiteIndex(x, y);
    }
    
    /**
     * Drag a site to a new position
     * @param {Number} x - Mouse X position
     * @param {Number} y - Mouse Y position
     */
    drag(x, y) {
        if (!this.editMode || this.dragSiteIndex === -1) return;
        this.voronoi.moveSite(this.dragSiteIndex, x, y);
        this.render();
    }
    
    /**
     * End site dragging
     */
    endDrag() {
        this.dragSiteIndex = -1;
    }
    
    /**
     * Export the gradient as a PNG image
     */
    exportAsPNG() {
        // Temporarily disable edit mode indicators for export
        const wasEditMode = this.editMode;
        if (wasEditMode) {
            this.setEditMode(false);
            this.render();
        }
        
        // Create download link
        const link = document.createElement('a');
        link.download = 'mesh-gradient.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        
        // Restore edit mode if it was active
        if (wasEditMode) {
            this.setEditMode(true);
        }
    }
    
    /**
     * Update the blur amount
     * @param {Number} amount - Blur amount (0-50)
     */
    setBlurAmount(amount) {
        // Ensure blur amount doesn't exceed the maximum
        this.blurAmount = Math.min(amount, this.maxBlurAmount);
        this.render();
    }
    
    /**
     * Adjust the HSL values of all colors
     * @param {Object} options - Adjustment options (hue, saturation, lightness)
     */
    adjustColors(options = {}) {
        // Get current colors and adjust them without theme constraints
        const colors = this.colorPalette.adjustColors(options);
        
        // Bypass theme restrictions - use adjusted colors directly
        this.currentColors = colors;
        this.render(colors);
        
        return colors;
    }
    
    /**
     * Set color harmony type
     * @param {String} harmonyType - Color harmony type
     */
    setColorHarmony(harmonyType) {
        this.colorHarmony = harmonyType;
        const colors = this.buildPalette();
        this.currentColors = colors;
        this.render(colors);
    }
    
    /**
     * Set cell count with validation
     * @param {Number} count - Number of Voronoi cells
     */
    setCellCount(count) {
        this.cellCount = Math.max(this.minCellCount, Math.min(this.maxCellCount, count));
        
        // Regenerate with the new cell count
        this.generate({
            cellCount: this.cellCount
        });
        
        return this.cellCount;
    }

    setDistortionStack(stack){
        console.log("Setting distortion stack:", stack);
        this.distortions.setStack(stack);
        // auto disable overlay when active
        if (this.distortions.hasActive() && this.editMode){
            this.setEditMode(false);
        }
        this.render();
    }

    /* ------------- theme helper ---------------- */
    applyTheme(colors) {
        if (this.colorTheme === 'none') return colors;

        return colors.map(c => {
            let { h, s, l } = c;                  // existing HSL
            let nh = h, ns = s, nl = l;

            switch (this.colorTheme) {
                case 'pastel':      ns = Math.max(25, Math.min(60,s)); nl = Math.max(70, l); break;
                case 'vivid':       ns = Math.max(80, s);              nl = Math.max(40, Math.min(60,l)); break;
                
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

                    /* ---------- 3. tone with gray (40 % blend) ---------- */
                    // Convert to RGB, blend, convert back to HSL
                    const rgb = this.colorPalette.hslToRgb(nh, ns, nl);
                    const gray = 0.5 * 255;
                    const mix = 0.4;                        // 40 % gray
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
                    if (l >= 0.8) {
                        // Neutral Base: Off-whites with minimal saturation
                        // S ≤ 10%, L ≥ 85%
                        ns = Math.min(10, s);
                        nl = Math.max(85, l);
                    } else if (l >= 0.5 && l <= 0.7) {
                        // Mid-tones: Light grays & beiges
                        // S ≤ 10%, L ∈ [50%, 70%]
                        ns = Math.min(10, s);
                        nl = Math.max(50, Math.min(70, l));
                    } else if (l >= 0.6 && l <= 0.9) {
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
                    } else if (l <= 0.3) {
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
                    // SOLUTION: Create a strong, random seed color for consistent palette generation
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

                // Replace the 'seasonal' case with individual seasons
                case 'spring': {
                    // Warm pastels
                    // H∈[30°,60°], S∈[0.3,0.6], L∈[0.7,0.9]
                    nh = Math.max(30, Math.min(60, h)); // Ensure hue in spring range
                    ns = Math.max(30, Math.min(60, s));
                    nl = Math.max(70, Math.min(90, l));
                    break;
                }

                case 'summer': {
                    // Cool muted
                    // H∈[180°,240°], S∈[0.2,0.5], L∈[0.6,0.8]
                    nh = Math.max(180, Math.min(240, h)); // Ensure hue in summer range
                    ns = Math.max(20, Math.min(50, s));
                    nl = Math.max(60, Math.min(80, l));
                    break;
                }

                case 'autumn': {
                    // Rich earth tones (same as earth-tones)
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
                    // H∈[240°,300°], S∈[0.6,0.9], L∈[0.2,0.6]
                    nh = Math.max(240, Math.min(300, h)); // Ensure hue in winter range
                    ns = Math.max(60, Math.min(90, s));
                    nl = Math.max(20, Math.min(60, l));
                    break;
                }
            }

            return {
                h: nh, s: ns, l: nl,
                hex: this.colorPalette.hslToHex(nh, ns, nl)
            };
        });
    }

    /* when theme / harmony / palette regenerated */
    setColorTheme(theme){
        this.colorTheme=theme;
        // always regenerate to honour theme constraints
        const colors = this.buildPalette();
        this.currentColors = colors;
        this.render(colors);
    }

    buildPalette() {
        const base = this.colorPalette.generate(this.colorHarmony, this.cellCount);
        return this.applyTheme(base);
    }
}
