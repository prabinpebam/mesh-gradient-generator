/**
 * MeshGradientCore - Main controller class
 */
class MeshGradientCore {
    constructor() {
        this.canvas = document.getElementById('gradientCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.width = 800;
        this.height = 600;
        
        // State properties
        this.editMode = false;
        this.dragSiteIndex = -1;
        this.hoverCellIndex = -1;
        this.hoverControls = null;
        this.hoveredButton = null;
        
        // Initialize sub-modules
        this.data = new MeshGradientData(this);
        this.renderer = new MeshGradientRenderer(this);
        
        // Create off-screen canvas
        this.offCanvas = document.createElement('canvas');
        this.offCanvas.width = this.width;
        this.offCanvas.height = this.height;
        this.offCtx = this.offCanvas.getContext('2d');
        
        // Initialize with default dimensions
        this.resizeCanvas(this.width, this.height);

        // Add a reliable color tracking system
        this._colorTrackingInitialized = false;
    }
    
    /**
     * Resize the canvas
     * @param {Number} width - New width
     * @param {Number} height - New height
     */
    resizeCanvas(width, height) {
        this.width = width;
        this.height = height;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.data.resizeDimensions(width, height);
        
        // Re-compute blur limits
        this.data.maxBlurAmount = this.data.calculateMaxBlurAmount();
        this.data.blurAmount = this.data.calculateDefaultBlurAmount();
        
        if (this.offCanvas) {
            this.offCanvas.width = width;
            this.offCanvas.height = height;
        }
        
        return {
            maxBlurAmount: this.data.maxBlurAmount,
            currentBlurAmount: this.data.blurAmount,
            minCellCount: this.data.minCellCount,
            maxCellCount: this.data.maxCellCount,
            currentCellCount: this.data.cellCount
        };
    }
    
    /**
     * Generate a new mesh gradient
     * @param {Object} options - Generation options
     */
    generate(options = {}) {
        // When cell count changes, force immediate regeneration
        if (options.cellCount !== undefined && 
            options.cellCount !== this.data.cellCount) {
            console.log(`Cell count changing from ${this.data.cellCount} to ${options.cellCount}`);
            
            // Make sure this is handled with high priority
            requestAnimationFrame(() => {
                this.data.setupGeneration(options);
                this.render();
            });
        } else {
            // Normal generation for other cases
            this.data.setupGeneration(options);
            this.render();
        }
    }
    
    /**
     * Render the gradient on the canvas
     * @param {Array} colors - Optional array of colors
     * @param {Boolean} preserveColors - If true, don't regenerate colors (for hover/drag)
     */
    render(colors = null, preserveColors = false) {
        // Clear offscreen canvas
        this.offCtx.clearRect(0, 0, this.width, this.height);
        
        // Get data and render
        const cells = this.data.voronoi.getCells();
        const sites = this.data.voronoi.sites;
        
        // Process colors only if not preserving colors (hover/drag should preserve)
        if (!preserveColors) {
            if (!colors) {
                colors = this.data.processColors();
            } else {
                this.data.currentColors = colors;
            }
            
            // Notify color changes - only when colors actually change
            const colorsChangedEvent = new CustomEvent('meshColorsChanged', {
                detail: { colors: this.data.currentColors }
            });
            document.dispatchEvent(colorsChangedEvent);
        }
        
        // Draw cells to offscreen canvas
        this.renderer.drawCellsToCanvas(this.offCtx, cells, this.data);
        
        // Apply effects
        if (this.data.blurAmount > 0) {
            this.renderer.applyBlur(this.data.blurAmount);
        }
        
        // Apply distortions and draw to main canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.data.distortions.apply(this.offCanvas, this.ctx);
        
        // Handle UI drawing based on edit mode and hover state
        this.renderer.drawUI(cells, sites, this.data);
    }
    
    /**
     * Get all current constraint values for UI updates
     */
    getConstraints() {
        return this.data.getConstraints();
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
     * Mouse interaction handlers
     */
    startDrag(x, y) {
        this.dragSiteIndex = this.data.voronoi.findClosestSiteIndex(x, y);
        
        if (!this.editMode && this.dragSiteIndex !== -1) {
            this.hoverCellIndex = this.dragSiteIndex;
            this.canvas.classList.add('cell-dragging');
        }
    }
    
    drag(x, y) {
        if (this.dragSiteIndex === -1) return;
        
        this.data.voronoi.moveSite(this.dragSiteIndex, x, y);
        // Pass true to preserve colors during drag
        this.render(null, true);
    }
    
    endDrag() {
        if (this.dragSiteIndex !== -1) {
            this.canvas.classList.remove('cell-dragging');
            this.dragSiteIndex = -1;
        }
    }
    
    /**
     * Set hover position
     */
    setHoverPosition(x, y) {
        if (this.data.distortions.hasActive() || this.dragSiteIndex !== -1) return;
        
        const cellIndex = this.data.voronoi.findClosestSiteIndex(x, y);
        
        if (cellIndex !== this.hoverCellIndex) {
            this.hoverCellIndex = cellIndex;
            // Always preserve colors during hover (true)
            this.render(null, true);
        }
    }
    
    /**
     * Animation methods for Voronoi cells
     */
    // Initialize animation properties
    initAnimation() {
        if (!this.animation) {
            this.animation = {
                active: false,
                frameId: null,
                params: {
                    forceStrength: 0.12,
                    damping: 0.92,
                    maxSpeed: 3,
                    wanderJitter: 0.3,
                    wanderWeight: 0.25,
                    arrivalThres: 30,
                    minTurnAngle: 45 * Math.PI/180
                }
            };
            
            // Store original site positions
            this.originalSites = [];
            if (this.data && this.data.voronoi && this.data.voronoi.sites) {
                this.originalSites = JSON.parse(JSON.stringify(this.data.voronoi.sites));
            }
            
            // Initialize animation properties for each site
            this.initAnimationProperties();
        }
        return this.animation;
    }
    
    // Initialize per-site animation properties
    initAnimationProperties() {
        if (!this.animation) this.initAnimation();
        
        if (this.data && this.data.voronoi && this.data.voronoi.sites) {
            const sites = this.data.voronoi.sites;
            this.animation.sites = sites.map((site, index) => {
                return {
                    vx: 0,
                    vy: 0,
                    wanderAngle: Math.random() * 2 * Math.PI,
                    targetIndex: Math.floor(Math.random() * 1000) + 1,
                    lastTargetAngle: null
                };
            });
        }
    }
    
    // Helper: Calculate Halton sequence
    halton(i, b) {
        let res = 0, f = 1 / b;
        while (i > 0) {
            res += f * (i % b);
            i = Math.floor(i / b);
            f /= b;
        }
        return res;
    }
    
    // Helper: Calculate angle between two angles
    angleBetween(a1, a2) {
        let d = a1 - a2;
        d = (d + Math.PI) % (2 * Math.PI) - Math.PI;
        return Math.abs(d);
    }
    
    // Start animation
    startCellAnimation() {
        if (!this.animation) this.initAnimation();
        
        if (this.animation.active) return; // Already running
        this.animation.active = true;
        
        // Capture original colors for preservation
        if (typeof this.getAllColors === 'function') {
            this.animation.originalColors = this.getAllColors();
        }
        
        // Disable edit mode during animation
        const wasEditMode = this.editMode;
        if (wasEditMode) this.setEditMode(false);
        
        let lastFrameTime = performance.now();
        
        const animate = (timestamp) => {
            if (!this.animation.active) return;
            
            // Calculate delta time in milliseconds
            const deltaTime = timestamp - lastFrameTime;
            lastFrameTime = timestamp;
            
            // Update positions
            this.updateAnimationStep(deltaTime);
            
            // Render with preserved colors
            this.render(this.animation.originalColors, true);
            
            // Continue animation if active
            if (this.animation.active) {
                this.animation.frameId = requestAnimationFrame(animate);
            }
        };
        
        this.animation.frameId = requestAnimationFrame(animate);
        return true;
    }
    
    // Stop animation
    stopCellAnimation() {
        if (!this.animation) return;
        
        this.animation.active = false;
        
        if (this.animation.frameId) {
            cancelAnimationFrame(this.animation.frameId);
            this.animation.frameId = null;
        }
        
        // Reset to original positions (optional)
        if (this.animation.resetOnStop && this.originalSites.length > 0) {
            if (this.data && this.data.voronoi && this.data.voronoi.sites) {
                this.data.voronoi.sites = JSON.parse(JSON.stringify(this.originalSites));
                this.render(null, true);
            }
        }
        
        return true;
    }
    
    // Update animation for one step
    updateAnimationStep(deltaTime) {
        // Check for valid animation state
        if (!this.animation || !this.animation.active) {
            return false;
        }
        
        // CRITICAL FIX: Ensure animation.sites exists and matches current cell count
        if (!this.animation.sites || 
            !this.data || 
            !this.data.voronoi || 
            !this.data.voronoi.sites ||
            this.data.voronoi.sites.length !== this.animation.sites.length) {
            
            console.log("[ANIMATION] Cell count mismatch detected in updateAnimationStep, reinitializing");
            this.initAnimationProperties();
            
            // If still no sites, give up
            if (!this.animation.sites || this.animation.sites.length === 0) {
                return false;
            }
        }
        
        // Scale time step to achieve consistent speed
        const timeStep = Math.min(deltaTime / (1000/60), 2); // Cap at a reasonable value
        const params = this.animation.params;
        const sites = this.data.voronoi.sites;
        const W = this.width;
        const H = this.height;
        
        // Additional check for site count
        if (Math.random() < 0.01) { // ~1% of frames
            console.log(`[ANIMATION] Animating ${sites.length} cells (animation sites: ${this.animation.sites.length})`);
        }
        
        let anyMovement = false;
        
        // Update every site position
        for (let i = 0; i < sites.length; i++) {
            // CRITICAL FIX: Ensure animation properties exist for this site
            if (!this.animation.sites[i]) {
                console.log(`[ANIMATION] Missing animation properties for site ${i}, creating...`);
                this.animation.sites[i] = {
                    vx: 0,
                    vy: 0,
                    wanderAngle: Math.random() * 2 * Math.PI,
                    targetIndex: Math.floor(Math.random() * 1000) + 1,
                    lastTargetAngle: null
                };
            }
            
            // Store original position for tracking movement
            const origX = site[0];
            const origY = site[1];
            
            // ...existing cell animation physics logic...
            
            // Vector to current target
            let tx = this.halton(animProps.targetIndex, 2) * W;
            let ty = this.halton(animProps.targetIndex, 3) * H;
            let dx = tx - site[0];
            let dy = ty - site[1];
            let dist = Math.hypot(dx, dy);
            
            // On arrival → pick next target respecting minTurnAngle
            if (dist < params.arrivalThres) {
                // ...existing target selection logic...
                
                const oldAngle = animProps.lastTargetAngle != null
                    ? animProps.lastTargetAngle
                    : Math.atan2(dy, dx);
                    
                let attempts = 0, chosen = animProps.targetIndex;
                while (attempts < 10) {
                    chosen++;
                    const cx = this.halton(chosen, 2) * W - site[0];
                    const cy = this.halton(chosen, 3) * H - site[1];
                    const newAngle = Math.atan2(cy, cx);
                    
                    if (animProps.lastTargetAngle === null || 
                        this.angleBetween(newAngle, oldAngle) >= params.minTurnAngle) {
                        animProps.targetIndex = chosen;
                        animProps.lastTargetAngle = newAngle;
                        break;
                    }
                    attempts++;
                }
                
                if (attempts === 10) {
                    animProps.targetIndex = chosen;
                    animProps.lastTargetAngle = Math.atan2(
                        this.halton(chosen, 3) * H - site[1],
                        this.halton(chosen, 2) * W - site[0]
                    );
                }
                
                // Recalculate vector to new target
                tx = this.halton(animProps.targetIndex, 2) * W;
                ty = this.halton(animProps.targetIndex, 3) * H;
                dx = tx - site[0];
                dy = ty - site[1];
                dist = Math.hypot(dx, dy);
            }
            
            // Wander force
            animProps.wanderAngle += (Math.random() * 2 - 1) * params.wanderJitter;
            const wx = Math.cos(animProps.wanderAngle);
            const wy = Math.sin(animProps.wanderAngle);
            
            // Attraction to target
            const ax = dx / (dist || 1);
            const ay = dy / (dist || 1);
            
            // Blend & normalize
            let sx = ax * (1 - params.wanderWeight) + wx * params.wanderWeight;
            let sy = ay * (1 - params.wanderWeight) + wy * params.wanderWeight;
            const sl = Math.hypot(sx, sy) || 1;
            sx /= sl;
            sy /= sl;
            
            // Apply thrust with time scaling
            animProps.vx += sx * params.forceStrength * timeStep;
            animProps.vy += sy * params.forceStrength * timeStep;
            
            // Damping & cap
            animProps.vx *= params.damping;
            animProps.vy *= params.damping;
            const sp = Math.hypot(animProps.vx, animProps.vy);
            if (sp > params.maxSpeed) {
                animProps.vx = (animProps.vx / sp) * params.maxSpeed;
                animProps.vy = (animProps.vy / sp) * params.maxSpeed;
            }
            
            // Move & clamp
            const padding = 20; // Keep away from edges
            site[0] = Math.min(Math.max(site[0] + animProps.vx * timeStep, padding), W - padding);
            site[1] = Math.min(Math.max(site[1] + animProps.vy * timeStep, padding), H - padding);
            
            // Track movement for logging
            const moveX = site[0] - origX;
            const moveY = site[1] - origY;
            const moveDist = Math.sqrt(moveX*moveX + moveY*moveY);
            
            if (moveDist > maxMovementDist) {
                maxMovementDist = moveDist;
                maxMovementIndex = i;
            }
            
            if (moveDist > 0.001) {
                anyMovement = true;
                
                // Log direct position changes for first cell
                if (i === 0 && Math.random() < 0.05) {
                    console.log(`[POSITION] Cell 0 moved: [${origX.toFixed(2)},${origY.toFixed(2)}] → [${site[0].toFixed(2)},${site[1].toFixed(2)}], delta: ${moveDist.toFixed(4)}`);
                }
            }
        }
        
        // Log max movement
        if (anyMovement && Math.random() < 0.02) {
            console.log(`[ANIMATION] Max movement: Cell ${maxMovementIndex} moved ${maxMovementDist.toFixed(4)}px`);
        }
        
        // Fix: Force Voronoi diagram update
        if (anyMovement) {
            try {
                // Update the Voronoi diagram with new cell positions
                if (this.data && this.data.voronoi) {
                    // Trigger a recalculation if possible 
                    if (typeof this.data.voronoi.getCells === 'function') {
                        console.log("[ANIMATION] Forcing Voronoi recalculation");
                        this.data.voronoi.getCells(true); // Force recalculation
                    }
                    
                    // Update the Delaunay triangulation if possible
                    if (this.data.voronoi.delaunay && 
                        typeof this.data.voronoi.delaunay.update === 'function') {
                        this.data.voronoi.delaunay.update();
                    }
                }
                
                // Get colors to preserve
                let currentColors = null;
                if (typeof this.getAllColors === 'function') {
                    currentColors = this.getAllColors();
                }
                
                // Force a render with preserveColors=true
                if (typeof this.render === 'function') {
                    this.render(currentColors, true);
                }
            } catch (err) {
                console.error("[ANIMATION] Error updating Voronoi:", err);
            }
        }
        
        return anyMovement;
    }
    
    // Update animation parameters
    setAnimationParam(param, value) {
        if (!this.animation) this.initAnimation();
        
        if (param === 'minTurnAngle') {
            // Convert from degrees to radians
            this.animation.params[param] = value * Math.PI / 180;
        } else {
            this.animation.params[param] = value;
        }
        
        return true;
    }
    
    // Toggle animation
    toggleCellAnimation(enabled) {
        if (enabled === undefined) {
            enabled = !this.animation?.active;
        }
        
        if (enabled) {
            return this.startCellAnimation();
        } else {
            return this.stopCellAnimation();
        }
    }
    
    /**
     * Reset hover state when mouse leaves
     */
    clearHover() {
        if (this.hoverCellIndex !== -1) {
            this.hoverCellIndex = -1;
            // Always preserve colors when clearing hover
            this.render(null, true);
        }
    }
    
    /**
     * Update button hover state
     */
    updateButtonHover(x, y) {
        // Delegate to renderer
        const result = this.renderer.updateHoverState(x, y, this.editMode, this.hoverControls);
        
        if (result.changed) {
            this.hoveredButton = result.button;
            this.hoveredCellIndex = result.cellIndex;
            this.canvas.style.cursor = result.cursor;
            if (result.render) {
                // Always preserve colors during button hover updates
                this.render(null, true);
            }
        }
    }
    
    /**
     * Check if a point is within a specific hover control button
     * @param {Number} x - Mouse X position
     * @param {Number} y - Mouse Y position
     * @param {String} control - Control type ('colorBtn' or 'lockBtn')
     * @returns {Boolean} - Whether the point is within the control
     */
    isPointInControl(x, y, control) {
        if (!this.hoverControls) return false;
        
        const btn = this.hoverControls[control];
        if (!btn) return false;
        
        // Check if point is within circular button
        const dx = x - btn.x;
        const dy = y - btn.y;
        return (dx * dx + dy * dy) <= (btn.radius * btn.radius);
    }
    
    /**
     * Proxy methods for data manipulation
     */
    getBlurAmount() { return this.data.blurAmount; }
    getMaxBlurAmount() { return this.data.maxBlurAmount; }
    setBlurAmount(amount) { 
        this.data.blurAmount = Math.min(amount, this.data.maxBlurAmount);
        // Use preserveColors=true to apply blur without regenerating colors
        this.render(null, true);
    }
    
    setCellCount(count) { 
        // When changing cell count, regenerate the gradient without preserving colors
        return this.data.setCellCount(count, () => this.render()); 
    }
    setColorHarmony(harmonyType) { this.data.setColorHarmony(harmonyType, () => this.render()); }
    setColorTheme(theme) { this.data.setColorTheme(theme, () => this.render()); }
    
    setCellColor(cellIndex, hexColor, lock = false) {
        this.data.setCellColor(cellIndex, hexColor, lock);
        // Don't regenerate all colors, just render with current colors preserved
        this.render(null, true);
    }
    
    lockCellColor(cellIndex) {
        this.data.lockCellColor(cellIndex);
        // Don't regenerate colors, just render with current colors preserved
        this.render(null, true);
    }
    
    unlockCellColor(cellIndex) {
        this.data.unlockCellColor(cellIndex);
        // Don't regenerate colors, just render with current colors preserved
        this.render(null, true);
    }
    
    isCellColorLocked(cellIndex) {
        return this.data.isCellColorLocked(cellIndex);
    }
    
    getCellColor(cellIndex) {
        return this.data.getCellColor(cellIndex);
    }
    
    adjustColors(options = {}) {
        const colors = this.data.adjustColors(options);
        this.render(colors);
        return colors;
    }
    
    /**
     * Export functionality
     */
    exportAsPNG() {
        const wasEditMode = this.editMode;
        if (wasEditMode) {
            this.setEditMode(false);
            this.render();
        }
        
        const link = document.createElement('a');
        link.download = 'mesh-gradient.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        
        if (wasEditMode) {
            this.setEditMode(true);
        }
    }
    
    setDistortionStack(stack) {
        this.data.distortions.setStack(stack);
        if (this.data.distortions.hasActive() && this.editMode) {
            this.setEditMode(false);
        }
        this.render();
    }

    /**
     * Get all colors currently used in the gradient
     * @returns {Array} Array of color objects with hex and HSL values
     */
    getAllColors() {
        const colors = [];
        const uniqueHexColors = new Set(); // Track unique colors to avoid duplicates
        
        try {
            // First try to get colors from each cell directly - most accurate approach
            if (this.data && this.data.voronoi) {
                // Try to get the most accurate cell count
                let cellCount = 0;
                if (typeof this.getCellCount === 'function') {
                    cellCount = this.getCellCount();
                } else if (this.data.voronoi.sites && Array.isArray(this.data.voronoi.sites)) {
                    cellCount = this.data.voronoi.sites.length;
                } else if (this.data.cellCount) {
                    cellCount = this.data.cellCount;
                }
                
                console.log(`Getting colors from ${cellCount} cells`);
                
                for (let i = 0; i < cellCount; i++) {
                    const color = this.getCellColor(i);
                    if (color && color.hex) {
                        // Only add if we haven't seen this hex color before
                        if (!uniqueHexColors.has(color.hex)) {
                            uniqueHexColors.add(color.hex);
                            colors.push(color);
                        }
                    }
                }
                
                // Log detailed info about found colors
                if (colors.length > 0) {
                    console.log(`Found ${colors.length} unique colors from ${cellCount} cells: `, 
                        colors.map(c => c.hex));
                    return colors;
                }
            }
            
            // Direct access to current colors if available - fallback 1
            if (this.data && this.data.currentColors && Array.isArray(this.data.currentColors)) {
                const currentColors = this.data.currentColors.filter(c => c && c.hex);
                if (currentColors.length > 0) {
                    console.log(`Found ${currentColors.length} colors in currentColors`);
                    return currentColors;
                }
            }
            
            // Check colorPalette - fallback 2
            if (this.data && this.data.colorPalette && 
                this.data.colorPalette.lastGeneratedColors) {
                const paletteColors = [...this.data.colorPalette.lastGeneratedColors].filter(c => c);
                if (paletteColors.length > 0) {
                    console.log(`Found ${paletteColors.length} colors in colorPalette`);
                    return paletteColors;
                }
            }
        } catch (err) {
            console.error("Error in getAllColors:", err);
        }
        
        console.log(`Returning ${colors.length} total colors`);
        return colors;
    }
    
    /**
     * Get the cell count from the most reliable source
     * @returns {Number} Number of cells in the gradient
     */
    getCellCount() {
        try {
            // First check direct property if it exists
            if (typeof this.cellCount === 'number') {
                return this.cellCount;
            }
            
            // Then check data structure
            if (this.data) {
                if (typeof this.data.cellCount === 'number') {
                    return this.data.cellCount;
                }
                
                // Then check voronoi data structures
                if (this.data.voronoi) {
                    if (typeof this.data.voronoi.getCellCount === 'function') {
                        return this.data.voronoi.getCellCount();
                    }
                    if (this.data.voronoi.sites && Array.isArray(this.data.voronoi.sites)) {
                        return this.data.voronoi.sites.length;
                    }
                    if (this.data.voronoi.cells && Array.isArray(this.data.voronoi.cells)) {
                        return this.data.voronoi.cells.length;
                    }
                }
                
                // Check for cells directly
                if (this.data.cells && Array.isArray(this.data.cells)) {
                    return this.data.cells.length;
                }
            }
            
            // Check for direct properties on the instance
            if (this.voronoi) {
                if (typeof this.voronoi.getCellCount === 'function') {
                    return this.voronoi.getCellCount();
                }
                if (this.voronoi.sites && Array.isArray(this.voronoi.sites)) {
                    return this.voronoi.sites.length;
                }
                if (this.voronoi.cells && Array.isArray(this.voronoi.cells)) {
                    return this.voronoi.cells.length;
                }
            }
            
            // Check UI as last resort 
            const cellCountSlider = document.getElementById('cellCount');
            if (cellCountSlider) {
                return parseInt(cellCountSlider.value) || 0;
            }
        } catch (err) {
            console.error("Error getting cell count:", err);
        }
        
        return 0;
    }
    
    /**
     * Initialize color tracking for reliable access
     */
    initializeColorTracking() {
        if (this._colorTrackingInitialized) return;
        
        const originalRender = this.render;
        
        // Override render to consistently notify about color changes
        this.render = (...args) => {
            const result = originalRender.apply(this, args);
            
            // Create a custom event with full color data
            const colorsData = this.getAllColors();
            const cellCount = this.getCellCount();
            
            const event = new CustomEvent('meshColorsAvailable', {
                detail: { 
                    colors: colorsData,
                    cellCount: cellCount,
                    timestamp: new Date().toISOString()
                }
            });
            
            document.dispatchEvent(event);
            return result;
        };
        
        this._colorTrackingInitialized = true;
    }

    /**
     * Get the base color used for generation (if available)
     * @returns {Object|null} The base color object or null
     */
    getBaseColor() {
        return this.data && this.data.baseColor ? this.data.baseColor : null;
    }
    
    /**
     * Set the base color for gradient generation
     * @param {String} hexColor - Hex color to use as base
     */
    setBaseColor(hexColor) {
        if (!this.data) return;
        this.data.baseColor = hexColor;
    }
}
