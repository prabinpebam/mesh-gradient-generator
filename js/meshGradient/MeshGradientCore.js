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

        // Initialize animation objects
        this.hueAnimator = null;
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
     * @param {Boolean} preserveColors - If true, don't regenerate colors (default: true for most operations)
     * @param {Object} options - Additional render options
     */
    render(colors = null, preserveColors = true, options = {}) {
        // Clear offscreen canvas
        this.offCtx.clearRect(0, 0, this.width, this.height);
        
        // Get data and render
        const cells = this.data.voronoi.getCells(this.animation?.active);
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
        } else if (colors) {
            // If preserveColors=true but colors are provided, use them
            // This is crucial for animations that modify colors without regenerating
            this.data.currentColors = colors;
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
        
        // Dispatch meshColorsAvailable event for color tracking
        if (this._colorTrackingInitialized) {
            const colorsAvailableEvent = new CustomEvent('meshColorsAvailable', {
                detail: { 
                    colors: this.getAllColors(),
                    cellCount: this.getCellCount(),
                    timestamp: new Date().toISOString()
                }
            });
            document.dispatchEvent(colorsAvailableEvent);
        }
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
     * @param {Boolean} preserveState - Whether to preserve the current state (default: true)
     */
    setEditMode(enabled, preserveState = true) {
        this.editMode = enabled;
        // Always preserve colors by passing true to render
        this.render(null, true);
        
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
    
    /**
     * Handle dragging with animation compatibility
     * @param {Number} x - Mouse X position
     * @param {Number} y - Mouse Y position
     */
    drag(x, y) {
        if (this.dragSiteIndex === -1) return;
        
        // Move the site
        this.data.voronoi.moveSite(this.dragSiteIndex, x, y);
        
        // If we're dragging during animation, update animation properties
        if (this.animation && this.animation.active && this.dragSiteIndex !== -1) {
            // Reset velocity when manually dragged
            if (this.animation.sites && this.animation.sites[this.dragSiteIndex]) {
                this.animation.sites[this.dragSiteIndex].vx = 0;
                this.animation.sites[this.dragSiteIndex].vy = 0;
            }
        }
        
        // Always preserve colors during drag
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
                originalColors: null,
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
    
    /**
     * Initialize per-site animation properties
     * Robust implementation that works with changing cell counts
     */
    initAnimationProperties() {
        if (!this.animation) this.initAnimation();
        
        if (this.data && this.data.voronoi && this.data.voronoi.sites) {
            const sites = this.data.voronoi.sites;
            console.log(`[ANIMATION] Initializing animation for ${sites.length} cells`);
            
            // Store original colors if not already stored
            if (typeof this.getAllColors === 'function' && !this.animation.originalColors) {
                this.animation.originalColors = this.getAllColors();
            }
            
            // (Re)create animation properties array for all current sites
            this.animation.sites = sites.map((site, index) => {
                // Preserve existing properties if possible to avoid jumps
                const existing = this.animation.sites && this.animation.sites[index];
                return {
                    vx: existing ? existing.vx : 0,
                    vy: existing ? existing.vy : 0,
                    wanderAngle: existing ? existing.wanderAngle : Math.random() * 2 * Math.PI,
                    targetIndex: existing ? existing.targetIndex : Math.floor(Math.random() * 1000) + 1,
                    lastTargetAngle: existing ? existing.lastTargetAngle : null
                };
            });
            
            console.log(`[ANIMATION] Initialized ${this.animation.sites.length} animation properties`);
            this.animation.initialized = true;
        } else {
            console.error("[ANIMATION] No sites available for animation initialization");
        }
    }
    
    /**
     * Helper: Calculate Halton sequence
     */
    halton(i, b) {
        let res = 0, f = 1 / b;
        while (i > 0) {
            res += f * (i % b);
            i = Math.floor(i / b);
            f /= b;
        }
        return res;
    }
    
    /**
     * Helper: Calculate angle between two angles
     */
    angleBetween(a1, a2) {
        let d = a1 - a2;
        d = (d + Math.PI) % (2 * Math.PI) - Math.PI;
        return Math.abs(d);
    }
    
    /**
     * Start cell animation with proper initialization
     */
    startCellAnimation() {
        // Ensure animation is properly initialized
        if (!this.animation) this.initAnimation();
        if (!this.animation.sites) this.initAnimationProperties();
        
        if (this.animation.active) return true; // Already running
        this.animation.active = true;
        
        // Capture original colors to preserve during animation
        this.animation.originalColors = this.getAllColors();
        
        // Disable edit mode during animation
        const wasEditMode = this.editMode;
        if (wasEditMode) this.setEditMode(false);
        
        let lastFrameTime = performance.now();
        
        const animate = (timestamp) => {
            if (!this.animation.active) return;
            
            // Calculate delta time in milliseconds
            const deltaTime = timestamp - lastFrameTime;
            lastFrameTime = timestamp;
            
            // Ensure animation properties are in sync with current cell count
            if (this.data && this.data.voronoi && this.data.voronoi.sites && 
                (!this.animation.sites || this.data.voronoi.sites.length !== this.animation.sites.length)) {
                this.initAnimationProperties();
            }
            
            // Update positions
            this.updateAnimationStep(deltaTime);
            
            // Get current colors - allow hue animation to provide them if active
            let currentColors = this.animation.originalColors;
            
            // Get colors from hue animator if active
            if (this.hueAnimator && this.hueAnimator.active) {
                currentColors = this.hueAnimator.getCurrentColors();
            }
            
            // Render with appropriate colors - always preserveColors=true
            this.render(currentColors, true);
            
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
    
    /**
     * Update animation step with improved Voronoi handling
     * @param {Number} deltaTime - Time elapsed since last frame in milliseconds
     */
    updateAnimationStep(deltaTime) {
        // Check for valid animation state
        if (!this.animation || !this.animation.active || !this.animation.sites) {
            return false;
        }
        
        // Scale time step to achieve consistent speed
        const timeStep = Math.min(deltaTime / (1000/60), 2); // Cap at a reasonable value
        const params = this.animation.params;
        const sites = this.data.voronoi.sites;
        const W = this.width;
        const H = this.height;
        
        // CRITICAL FIX: Ensure animation.sites exists and matches current cell count
        if (!this.animation.sites || sites.length !== this.animation.sites.length) {
            this.initAnimationProperties();
        }
        
        let anyMovement = false;
        let maxMovementDist = 0;
        let maxMovementIndex = -1;
        
        // Update every site position
        for (let i = 0; i < sites.length; i++) {
            const site = sites[i];
            const animProps = this.animation.sites[i];
            
            // Skip if animation properties not available
            if (!animProps) continue;
            
            // Store original position for tracking movement
            const origX = site[0];
            const origY = site[1];
            
            // Vector to current target
            let tx = this.halton(animProps.targetIndex, 2) * W;
            let ty = this.halton(animProps.targetIndex, 3) * H;
            let dx = tx - site[0];
            let dy = ty - site[1];
            let dist = Math.hypot(dx, dy);
            
            // On arrival → pick next target respecting minTurnAngle
            if (dist < params.arrivalThres) {
                // Get current angle
                const oldAngle = animProps.lastTargetAngle != null
                    ? animProps.lastTargetAngle
                    : Math.atan2(dy, dx);
                    
                // Try to find a new target that creates a significant turn
                let attempts = 0, chosen = animProps.targetIndex;
                while (attempts < 10) {
                    chosen++;
                    const cx = this.halton(chosen, 2) * W - site[0];
                    const cy = this.halton(chosen, 3) * H - site[0];
                    const newAngle = Math.atan2(cy, cx);
                    
                    if (animProps.lastTargetAngle === null || 
                        this.angleBetween(newAngle, oldAngle) >= params.minTurnAngle) {
                        animProps.targetIndex = chosen;
                        animProps.lastTargetAngle = newAngle;
                        break;
                    }
                    attempts++;
                }
                
                // If we couldn't find a good target, use the last one tried
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
            
            // Wander force calculation
            animProps.wanderAngle += (Math.random() * 2 - 1) * params.wanderJitter;
            const wx = Math.cos(animProps.wanderAngle);
            const wy = Math.sin(animProps.wanderAngle);
            
            // Attraction to target
            const ax = dx / (dist || 1);
            const ay = dy / (dist || 1);
            
            // Blend & normalize forces
            let sx = ax * (1 - params.wanderWeight) + wx * params.wanderWeight;
            let sy = ay * (1 - params.wanderWeight) + wy * params.wanderWeight;
            const sl = Math.hypot(sx, sy) || 1;
            sx /= sl;
            sy /= sl;
            
            // Apply force with time scaling
            animProps.vx += sx * params.forceStrength * timeStep;
            animProps.vy += sy * params.forceStrength * timeStep;
            
            // Apply damping
            animProps.vx *= params.damping;
            animProps.vy *= params.damping;
            
            // Cap speed
            const sp = Math.hypot(animProps.vx, animProps.vy);
            if (sp > params.maxSpeed) {
                animProps.vx = (animProps.vx / sp) * params.maxSpeed;
                animProps.vy = (animProps.vy / sp) * params.maxSpeed;
            }
            
            // Calculate new position with boundary constraints
            const padding = 20; // Keep cells away from the edges
            const newX = Math.min(Math.max(site[0] + animProps.vx * timeStep, padding), W - padding);
            const newY = Math.min(Math.max(site[1] + animProps.vy * timeStep, padding), H - padding);
            
            // Only update if there's significant movement
            const moveX = newX - origX;
            const moveY = newY - origY;
            const moveDist = Math.hypot(moveX, moveY);
            
            if (moveDist > 0.1) { // Threshold to avoid tiny updates
                // Use proper site movement to update the Voronoi diagram
                if (typeof this.data.voronoi.moveSite === 'function') {
                    this.data.voronoi.moveSite(i, newX, newY);
                } else {
                    // Direct update as fallback
                    site[0] = newX;
                    site[1] = newY;
                }
                anyMovement = true;
                
                if (moveDist > maxMovementDist) {
                    maxMovementDist = moveDist;
                    maxMovementIndex = i;
                }
            }
        }
        
        // Force Voronoi recalculation if there was movement
        if (anyMovement && typeof this.data.voronoi.getCells === 'function') {
            this.data.voronoi.getCells(true); // Force recalculation
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
    
    /**
     * Set the cell count
     * @param {Number} count - New cell count
     * @param {Function} callback - Callback after setting cell count
     */
    setCellCount(count) { 
        // When changing cell count while hue animation is active, 
        // we need to pause and restart the animation to capture the new cells
        const hueAnimWasActive = this.hueAnimator && this.hueAnimator.active;
        const cellAnimWasActive = this.animation && this.animation.active;
        
        // Temporarily stop animations if running
        if (hueAnimWasActive) {
            this.stopHueAnimation();
        }
        
        if (cellAnimWasActive) {
            this.stopCellAnimation();
        }
        
        // Change cell count
        const result = this.data.setCellCount(count, () => {
            // After count is changed, trigger a render
            this.render();
            
            // Reinitialize animation properties for new cell count
            if (this.animation) {
                this.initAnimationProperties();
            }
        });
        
        // Restart animations if they were active
        setTimeout(() => {
            if (cellAnimWasActive) {
                this.startCellAnimation();
            }
            
            if (hueAnimWasActive) {
                this.startHueAnimation();
            }
        }, 100); // Small delay to ensure render completes
        
        return result;
    }
    
    setColorHarmony(harmonyType) { 
        this.data.setColorHarmony(harmonyType, () => {
            this.render();
            if (this.hueAnimator && this.hueAnimator.active) {
                this.hueAnimator.updateBaseColors();
            }
        });
    }
    setColorTheme(theme) { 
        this.data.setColorTheme(theme, () => {
            this.render();
            if (this.hueAnimator && this.hueAnimator.active) {
                this.hueAnimator.updateBaseColors();
            }
        });
    }
    
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
        
        if (this.hueAnimator && this.hueAnimator.active) {
            this.hueAnimator.updateBaseColors();
        }
        
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
            
            // If colors were explicitly changed (not just preserved) and hue animation is active,
            // update the base colors in the hue animator
            if (!args[1] && this.hueAnimator && this.hueAnimator.active) {
                // args[1] is preserveColors - if false, colors were explicitly changed
                setTimeout(() => this.hueAnimator.updateBaseColors(), 0);
            }
            
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

    /**
     * Initialize hue animation
     */
    initHueAnimation() {
        if (!this.hueAnimator) {
            this.hueAnimator = new HueAnimator(this);
            console.log('[Core] Hue animator initialized');
        }
        return this.hueAnimator;
    }
    
    /**
     * Start hue animation
     */
    startHueAnimation() {
        if (!this.hueAnimator) {
            this.initHueAnimation();
        }
        
        return this.hueAnimator.start();
    }
    
    /**
     * Stop hue animation
     */
    stopHueAnimation() {
        if (this.hueAnimator) {
            return this.hueAnimator.stop();
        }
        return false;
    }
    
    /**
     * Toggle hue animation
     * @param {Boolean} enabled - Whether hue animation should be enabled
     */
    toggleHueAnimation(enabled) {
        if (enabled === undefined) {
            enabled = !this.hueAnimator?.active;
        }
        
        if (enabled) {
            return this.startHueAnimation();
        } else {
            return this.stopHueAnimation();
        }
    }
    
    /**
     * Set hue animation parameters
     * @param {Object} params - Parameters object
     */
    setHueAnimationParams(params) {
        if (!this.hueAnimator) {
            this.initHueAnimation();
        }
        
        if (params.speed !== undefined) {
            this.hueAnimator.setSpeed(params.speed);
        }
        
        if (params.direction !== undefined) {
            this.hueAnimator.setDirection(params.direction);
        }
        
        return true;
    }
}
