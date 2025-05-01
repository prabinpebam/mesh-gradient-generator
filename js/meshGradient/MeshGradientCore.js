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
        this.data.setupGeneration(options);
        this.render();
    }
    
    /**
     * Render the gradient on the canvas
     * @param {Array} colors - Optional array of colors
     */
    render(colors = null) {
        // Clear offscreen canvas
        this.offCtx.clearRect(0, 0, this.width, this.height);
        
        // Get data and render
        const cells = this.data.voronoi.getCells();
        const sites = this.data.voronoi.sites;
        
        // Process colors
        if (!colors) {
            colors = this.data.processColors();
        } else {
            this.data.currentColors = colors;
        }
        
        // Notify color changes
        const colorsChangedEvent = new CustomEvent('meshColorsChanged', {
            detail: { colors: this.data.currentColors }
        });
        document.dispatchEvent(colorsChangedEvent);
        
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
        this.render();
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
            this.render();
        }
    }
    
    /**
     * Reset hover state when mouse leaves
     */
    clearHover() {
        if (this.hoverCellIndex !== -1) {
            this.hoverCellIndex = -1;
            this.render();
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
            if (result.render) this.render();
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
        this.render();
    }
    
    setCellCount(count) { return this.data.setCellCount(count, () => this.render()); }
    setColorHarmony(harmonyType) { this.data.setColorHarmony(harmonyType, () => this.render()); }
    setColorTheme(theme) { this.data.setColorTheme(theme, () => this.render()); }
    
    setCellColor(cellIndex, hexColor, lock = false) {
        this.data.setCellColor(cellIndex, hexColor, lock);
        this.render();
    }
    
    lockCellColor(cellIndex) {
        this.data.lockCellColor(cellIndex);
        this.render();
    }
    
    unlockCellColor(cellIndex) {
        this.data.unlockCellColor(cellIndex);
        this.render();
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
