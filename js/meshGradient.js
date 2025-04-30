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
        const colors = this.colorPalette.generate(this.colorHarmony, this.cellCount);

        this.currentColors = colors;         // <-- save palette
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
        // Get current colors
        const colors = this.colorPalette.adjustColors(options);
        this.currentColors = colors;          // keep palette updated
        this.render(colors);
        
        return colors;
    }
    
    /**
     * Set color harmony type
     * @param {String} harmonyType - Color harmony type
     */
    setColorHarmony(harmonyType) {
        this.colorHarmony = harmonyType;
        const colors = this.colorPalette.generate(this.colorHarmony, this.cellCount);
        this.currentColors = colors;          // store new palette
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
}
