/**
 * MeshGradientRenderer - Handles all drawing operations
 */
class MeshGradientRenderer {
    constructor(core) {
        this.core = core;
    }
    
    /**
     * Draw cells to the specified canvas context
     * @param {CanvasRenderingContext2D} ctx - Canvas context to draw on
     * @param {Array} cells - Array of cell objects
     * @param {MeshGradientData} data - Data module with color information
     */
    drawCellsToCanvas(ctx, cells, data) {
        cells.forEach((cell, index) => {
            const color = data.getCellColor(index);
            ctx.beginPath();
            const path = new Path2D(cell.path);
            ctx.fillStyle = color.hex;
            ctx.fill(path);
        });
    }
    
    /**
     * Apply blur effect to the core's offscreen canvas
     * @param {Number} blurAmount - Amount of blur to apply
     */
    applyBlur(blurAmount) {
        // Use references to core properties
        const { width, height, offCanvas, offCtx } = this.core;
        
        // Mobile detection
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Adjust blur for mobile devices
        const adjustedBlurAmount = isMobileDevice ? 
            Math.min(blurAmount, Math.round(Math.max(width, height) * 0.05)) : 
            blurAmount;
            
        try {
            // Create a temporary canvas with padding
            const tempCanvas = document.createElement('canvas');
            const padding = Math.ceil(adjustedBlurAmount * 2.5);
            tempCanvas.width = width + padding * 2;
            tempCanvas.height = height + padding * 2;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Copy offscreen content to temp canvas center
            tempCtx.drawImage(offCanvas, 0, 0, width, height, padding, padding, width, height);
            
            // Extend edge pixels to padding
            this.extendEdgePixels(tempCtx, padding);
            
            // Try standard CSS filter blur
            try {
                tempCtx.filter = `blur(${adjustedBlurAmount}px)`;
                tempCtx.drawImage(tempCanvas, 0, 0);
                tempCtx.filter = 'none';
            } catch (err) {
                console.warn("Canvas filter not supported, using fallback blur");
                this.applyFallbackBlur(tempCanvas, adjustedBlurAmount);
            }
            
            // Copy blurred content back to offscreen canvas
            offCtx.clearRect(0, 0, width, height);
            offCtx.drawImage(tempCanvas, padding, padding, width, height, 0, 0, width, height);
            
        } catch (err) {
            console.error("Error applying blur effect:", err);
        }
    }
    
    /**
     * Simple blur fallback for devices without filter support
     * @param {HTMLCanvasElement} canvas - Canvas to blur
     * @param {Number} blurAmount - Blur amount
     */
    applyFallbackBlur(canvas, blurAmount) {
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        
        // Use smaller blur for fallback
        const simplifiedBlur = Math.min(blurAmount, 5);
        
        // Simple box blur
        const tempData = new Uint8ClampedArray(pixels);
        
        for (let y = simplifiedBlur; y < canvas.height - simplifiedBlur; y++) {
            for (let x = simplifiedBlur; x < canvas.width - simplifiedBlur; x++) {
                const idx = (y * canvas.width + x) * 4;
                
                for (let c = 0; c < 4; c++) {
                    pixels[idx + c] = (
                        tempData[idx + c] +
                        tempData[idx - canvas.width * 4 + c] +
                        tempData[idx + canvas.width * 4 + c]
                    ) / 3;
                }
            }
        }
        
        ctx.putImageData(imgData, 0, 0);
    }
    
    /**
     * Extend edge pixels into padding area
     * @param {CanvasRenderingContext2D} ctx - Context of temporary canvas
     * @param {Number} padding - Padding size
     */
    extendEdgePixels(ctx, padding) {
        const { width: w, height: h } = this.core;
        const p = padding;
        
        // Extend top edge
        ctx.drawImage(ctx.canvas, p, p, w, 1, p, 0, w, p);
        
        // Extend bottom edge
        ctx.drawImage(ctx.canvas, p, p + h - 1, w, 1, p, p + h, w, p);
        
        // Extend left edge
        ctx.drawImage(ctx.canvas, p, 0, 1, p*2 + h, 0, 0, p, p*2 + h);
        
        // Extend right edge
        ctx.drawImage(ctx.canvas, p + w - 1, 0, 1, p*2 + h, p + w, 0, p, p*2 + h);
        
        // Fill corners
        ctx.drawImage(ctx.canvas, p, p, 1, 1, 0, 0, p, p);
        ctx.drawImage(ctx.canvas, p + w - 1, p, 1, 1, p + w, 0, p, p);
        ctx.drawImage(ctx.canvas, p, p + h - 1, 1, 1, 0, p + h, p, p);
        ctx.drawImage(ctx.canvas, p + w - 1, p + h - 1, 1, 1, p + w, p + h, p, p);
    }
    
    /**
     * Draw UI elements based on mode
     * @param {Array} cells - Array of cell objects
     * @param {Array} sites - Array of site coordinates
     * @param {MeshGradientData} data - Data module
     */
    drawUI(cells, sites, data) {
        const { editMode, hoverCellIndex, hoverControls } = this.core;
        
        // Reset hover controls
        if (editMode) {
            this.core.hoverControls = { cells: {} };
        }
        
        // Draw appropriate UI based on mode and hover state
        if (hoverCellIndex >= 0 && !editMode && !data.distortions.hasActive()) {
            if (hoverCellIndex < sites.length && hoverCellIndex < cells.length) {
                this.drawCellUI(hoverCellIndex, sites, cells);
            }
        } 
        else if (editMode && !data.distortions.hasActive()) {
            cells.forEach((cell, index) => {
                if (index < sites.length) {
                    this.drawCellUI(index, sites, cells);
                }
            });
            
            // In edit mode, also draw cell borders and sites
            this.drawCellBorders(cells);
            this.drawSites(sites);
        }
        else {
            // Reset when not hovering or in edit mode
            this.core.hoverControls = null;
            this.core.hoveredButton = null;
            this.core.canvas.style.cursor = this.core.dragSiteIndex !== -1 ? 'grabbing' : 'default';
        }
    }
    
    /**
     * Draw cell borders (for edit mode)
     * @param {Array} cells - Array of cell objects
     */
    drawCellBorders(cells) {
        const ctx = this.core.ctx;
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        
        cells.forEach(cell => {
            ctx.beginPath();
            const path = new Path2D(cell.path);
            ctx.stroke(path);
        });
    }
    
    /**
     * Draw Voronoi sites (cell centers)
     * @param {Array} sites - Array of site coordinates
     */
    drawSites(sites) {
        const ctx = this.core.ctx;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 1;
        
        sites.forEach(site => {
            ctx.beginPath();
            ctx.arc(site[0], site[1], 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }
    
    /**
     * Draw UI controls for a cell
     * @param {Number} cellIndex - Index of the cell
     * @param {Array} sites - Array of site coordinates
     * @param {Array} cells - Array of cell objects
     */
    drawCellUI(cellIndex, sites, cells) {
        const ctx = this.core.ctx;
        const { hoveredButton, hoveredCellIndex, editMode } = this.core;
        
        const site = sites[cellIndex];
        const cell = cells[cellIndex];
        const cellColor = this.core.getCellColor(cellIndex);
        const isLocked = this.core.isCellColorLocked(cellIndex);
        
        // Calculate contrasting colors based on cell color luminance
        const luminance = this.calculateLuminance(cellColor);
        const isDark = luminance <= 0.5;
        
        // Step 1: Set pill background colors - base and hover states
        const pillBackgroundColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
        const pillHoverColor = isDark ? 'rgba(255, 255, 255, 1.0)' : 'rgba(0, 0, 0, 1.0)';
        
        // Step 2: The lock icon should be opposite of pill background
        const iconColor = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        
        // Other UI colors
        const cellHighlightColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        const innerGlowColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
        
        // Draw cell highlight
        if (cell && cell.path) {
            ctx.save();
            ctx.strokeStyle = cellHighlightColor;
            ctx.lineWidth = 3;
            
            ctx.setLineDash(isLocked ? [] : [5, 3]);
            
            ctx.shadowColor = innerGlowColor;
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.beginPath();
            const path = new Path2D(cell.path);
            ctx.stroke(path);
            ctx.restore();
        }
        
        // Store button positions for hit testing - now including the entire pill
        if (editMode) {
            if (!this.core.hoverControls.cells) {
                this.core.hoverControls.cells = {};
            }
            
            this.core.hoverControls.cells[cellIndex] = {
                pill: { 
                    x: site[0], 
                    y: site[1], 
                    width: 48, 
                    height: 24,
                    left: site[0] - 24,
                    right: site[0] + 24,
                    top: site[1] - 12,
                    bottom: site[1] + 12
                },
                colorBtn: { x: site[0] - 12, y: site[1], radius: 8 },
                lockBtn: { x: site[0] + 12, y: site[1], radius: 8 }
            };
        } else {
            this.core.hoverControls = {
                cell: cellIndex,
                pill: { 
                    x: site[0], 
                    y: site[1], 
                    width: 48, 
                    height: 24,
                    left: site[0] - 24,
                    right: site[0] + 24,
                    top: site[1] - 12,
                    bottom: site[1] + 12
                },
                colorBtn: { x: site[0] - 12, y: site[1], radius: 8 },
                lockBtn: { x: site[0] + 12, y: site[1], radius: 8 }
            };
        }
        
        // Check if any part of the pill is being hovered
        const isPillHovered = hoveredButton && 
                            (editMode ? hoveredCellIndex === cellIndex : true);
        
        // Draw pill background with hover state
        ctx.fillStyle = isPillHovered ? pillHoverColor : pillBackgroundColor;
        ctx.beginPath();
        this.roundedRect(ctx, site[0] - 24, site[1] - 12, 48, 24, 12);
        ctx.fill();
        
        // Draw divider
        ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
        ctx.fillRect(site[0], site[1] - 10, 1, 20);
        
        // Draw color picker - now filling the entire circle with cell color
        ctx.beginPath();
        ctx.fillStyle = cellColor.hex;
        ctx.arc(site[0] - 12, site[1], 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a thin outline to the color circle for better visibility
        ctx.beginPath();
        ctx.strokeStyle = cellHighlightColor;
        ctx.lineWidth = 1;
        ctx.arc(site[0] - 12, site[1], 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw lock icon directly without a button background
        ctx.fillStyle = iconColor;
        ctx.font = '14px bootstrap-icons'; // Slightly larger for better visibility
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const lockIcon = isLocked ? '\uF47A' : '\uF5FF'; // bootstrap-icons: lock-fill vs unlock-fill
        ctx.fillText(lockIcon, site[0] + 12, site[1]);
        
        // Set cursor to pointer
        this.core.canvas.style.cursor = 'pointer';
    }
    
    /**
     * Update hover state for UI controls
     * @returns {Object} - Result with changed, button, cellIndex, cursor, render properties
     */
    updateHoverState(x, y, editMode, hoverControls) {
        let result = { 
            changed: false, 
            button: null, 
            cellIndex: -1, 
            cursor: 'default',
            render: false
        };
        
        if (editMode) {
            // Handle edit mode hover logic
            const previousButton = this.core.hoveredButton;
            const previousIndex = this.core.hoveredCellIndex;
            
            this.core.hoveredButton = null;
            this.core.hoveredCellIndex = -1;
            
            if (hoverControls && hoverControls.cells) {
                for (const cellIndex in hoverControls.cells) {
                    const cellControls = hoverControls.cells[cellIndex];
                    
                    // First check if point is within the pill - primary hit detection
                    const pill = cellControls.pill;
                    if (x >= pill.left && x <= pill.right && y >= pill.top && y <= pill.bottom) {
                        // If inside pill, check which side (left = color, right = lock)
                        const middleX = pill.x;
                        if (x < middleX) {
                            result.button = 'colorBtn';
                        } else {
                            result.button = 'lockBtn';
                        }
                        
                        result.cellIndex = parseInt(cellIndex);
                        result.cursor = 'pointer';
                        result.changed = true;
                        result.render = true;
                        return result;
                    }
                }
            }
            
            // If we got here, not hovering over any pill
            if (previousButton) {
                result.changed = true;
                result.render = true;
            }
        } 
        else {
            // Non-edit mode hover logic
            if (!hoverControls) {
                return result;
            }
            
            // Check if point is within the pill
            const pill = hoverControls.pill;
            if (pill && x >= pill.left && x <= pill.right && y >= pill.top && y <= pill.bottom) {
                // Determine which side of the pill the hover is on
                const middleX = pill.x;
                if (x < middleX) {
                    result.button = 'colorBtn';
                } else {
                    result.button = 'lockBtn';
                }
                
                result.cursor = 'pointer';
                result.changed = this.core.hoveredButton !== result.button;
                result.render = result.changed;
                return result;
            }
            
            // If we got here, not hovering any button
            if (this.core.hoveredButton) {
                result.changed = true;
                result.render = true;
            }
        }
        
        return result;
    }
    
    /**
     * Check if point is within a control
     * @param {Number} x - X coordinate
     * @param {Number} y - Y coordinate
     * @param {String} control - Control name
     * @param {Object} hoverControls - Hover controls object
     * @returns {Boolean} - Whether point is in control
     */
    isPointInControl(x, y, control, hoverControls) {
        if (!hoverControls) return false;
        
        const btn = hoverControls[control];
        if (!btn) return false;
        
        const dx = x - btn.x;
        const dy = y - btn.y;
        return (dx * dx + dy * dy) <= (btn.radius * btn.radius);
    }
    
    /**
     * Calculate luminance from color
     * @param {Object} color - Color object with h, s, l properties
     * @returns {Number} - Luminance value (0-1)
     */
    calculateLuminance(color) {
        return color.l / 100;
    }
    
    /**
     * Draw a rounded rectangle
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Number} x - X coordinate
     * @param {Number} y - Y coordinate
     * @param {Number} width - Rectangle width
     * @param {Number} height - Rectangle height
     * @param {Number} radius - Corner radius
     */
    roundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}
