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
}
