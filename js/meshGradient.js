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
        
        this.cellCount = 20; // Changed from 30 to 20
        this.blurAmount = 10;
        this.colorHarmony = 'analogous';
        this.editMode = false;
        
        this.maxBlurAmount = this.calculateMaxBlurAmount();
        
        this.resizeCanvas(this.width, this.height);
        
        // For edit mode
        this.dragSiteIndex = -1;
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
     * Resize the canvas
     * @param {Number} width - New width
     * @param {Number} height - New height
     */
    resizeCanvas(width, height) {
        this.width = width;
        this.height = height;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.voronoi.setDimensions(width, height);
        
        // Update max blur amount when canvas is resized
        this.maxBlurAmount = this.calculateMaxBlurAmount();
        
        // Make sure blur amount doesn't exceed the new maximum
        if (this.blurAmount > this.maxBlurAmount) {
            this.blurAmount = this.maxBlurAmount;
        }
        
        // Return the updated max blur amount so UI can be updated
        return this.maxBlurAmount;
    }
    
    /**
     * Generate a new mesh gradient
     * @param {Object} options - Generation options
     */
    generate(options = {}) {
        // Update properties from options
        if (options.cellCount) this.cellCount = options.cellCount;
        if (options.blurAmount) this.blurAmount = options.blurAmount;
        if (options.colorHarmony) this.colorHarmony = options.colorHarmony;
        
        // Generate Voronoi sites
        this.voronoi.generateRandomSites(this.cellCount);
        
        // Generate colors based on harmony type
        this.colorPalette.randomizeBaseHue();
        const colors = this.colorPalette.generate(this.colorHarmony, this.cellCount);
        
        // Render the gradient
        this.render(colors);
    }
    
    /**
     * Render the gradient on the canvas
     * @param {Array} colors - Array of colors for cells
     */
    render(colors = null) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Get Voronoi cells
        const cells = this.voronoi.getCells();
        
        if (!colors) {
            colors = this.colorPalette.generate(this.colorHarmony, this.cellCount);
        }
        
        // Draw cells
        cells.forEach((cell, index) => {
            const color = colors[index % colors.length];
            this.ctx.beginPath();
            const path = new Path2D(cell.path);
            this.ctx.fillStyle = color.hex;
            this.ctx.fill(path);
        });
        
        // Apply blur effect if not in edit mode
        if (!this.editMode && this.blurAmount > 0) {
            this.applyUniformBlur(this.blurAmount);
        }
        
        // If in edit mode, draw cell borders and centers
        if (this.editMode) {
            this.drawCellBorders(cells);
            this.drawSites(this.voronoi.sites);
        }
    }
    
    /**
     * Apply uniform blur to the entire canvas including edges
     * @param {Number} blurAmount - Amount of blur to apply
     */
    applyUniformBlur(blurAmount) {
        // Create a temporary canvas with padding for the blur
        const tempCanvas = document.createElement('canvas');
        const padding = Math.ceil(blurAmount * 2.5); // Generous padding to avoid edge artifacts
        tempCanvas.width = this.width + padding * 2;
        tempCanvas.height = this.height + padding * 2;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Copy original content to the center of temp canvas
        tempCtx.drawImage(this.canvas, 0, 0, this.width, this.height, padding, padding, this.width, this.height);
        
        // Extend edge pixels to padding area to avoid dark edges
        this.extendEdgePixels(tempCtx, padding);
        
        // Apply blur to the temporary canvas
        tempCtx.filter = `blur(${blurAmount}px)`;
        tempCtx.drawImage(tempCanvas, 0, 0);
        tempCtx.filter = 'none';
        
        // Copy the blurred content back to the original canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(tempCanvas, padding, padding, this.width, this.height, 0, 0, this.width, this.height);
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
     * Set color harmony type
     * @param {String} harmonyType - Color harmony type
     */
    setColorHarmony(harmonyType) {
        this.colorHarmony = harmonyType;
        const colors = this.colorPalette.generate(this.colorHarmony, this.cellCount);
        this.render(colors);
    }
}
