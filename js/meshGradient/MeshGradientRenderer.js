/**
 * MeshGradientRenderer - Handles all drawing operations
 */
class MeshGradientRenderer {
    constructor(core) {
        this.core = core;
    }
    
    /**
     * Draw cells to the specified canvas context with enhanced animation support
     * @param {CanvasRenderingContext2D} ctx - Canvas context to draw on
     * @param {Array} cells - Array of cell objects
     * @param {MeshGradientData} data - Data module with color information
     */
    drawCellsToCanvas(ctx, cells, data) {
        // Ensure cells reflect latest site positions during animation
        if (this.core.animation && this.core.animation.active) {
            // Check if we need to force cell recalculation
            if (data && data.voronoi) {
                // Get fresh cells with forced recalculation
                cells = data.voronoi.getCells(true);
                
                // Update Delaunay triangulation if possible
                if (data.voronoi.delaunay && typeof data.voronoi.delaunay.update === 'function') {
                    data.voronoi.delaunay.update();
                }
            }
        }
        
        // Draw each cell with its color
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
     * Draw UI elements with animation optimization
     * @param {Array} cells - Array of cell objects
     * @param {Array} sites - Array of site coordinates
     * @param {MeshGradientData} data - Data module
     */
    drawUI(cells, sites, data) {
        const { editMode, hoverCellIndex } = this.core;

        // use overlay context
        const ctx = this.core.uiCtx;
        ctx.clearRect(0, 0, this.core.width, this.core.height);

        // Skip UI while animating
        if (this.core.animation && this.core.animation.active) return;
        
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
            
            // In edit mode, just draw cell borders (removed sites drawing)
            this.drawCellBorders(cells);
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
        const ctx = this.core.uiCtx;
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        
        cells.forEach(cell => {
            ctx.beginPath();
            const path = new Path2D(cell.path);
            ctx.stroke(path);
        });
    }
    
    /**
     * Draw Voronoi sites (cell centers) - keeping the method but making it empty
     * This method is now maintained for API compatibility but doesn't draw anything
     * @param {Array} sites - Array of site coordinates
     */
    drawSites(sites) {
        // Empty method - no longer drawing site circles in edit mode
    }
    
    /**
     * Draw UI controls for a cell
     * @param {Number} cellIndex - Index of the cell
     * @param {Array} sites - Array of site coordinates
     * @param {Array} cells - Array of cell objects
     */
    drawCellUI(cellIndex, sites, cells) {
        const ctx = this.core.uiCtx;
        const { hoveredButton, hoveredCellIndex, editMode } = this.core;
        
        const site = sites[cellIndex];
        const cell = cells[cellIndex];
        const cellColor = this.core.getCellColor(cellIndex);
        const isLocked = this.core.isCellColorLocked(cellIndex);
        
        // Calculate contrasting colors based on cell color luminance
        const luminance = this.calculateLuminance(cellColor);
        const isDark = luminance <= 0.5;
        
        // Set base pill background colors and hover states
        const pillBackgroundColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
        const pillHoverColor = isDark ? 'rgba(255, 255, 255, 1.0)' : 'rgba(0, 0, 0, 1.0)';
        
        // The icon color should contrast with pill background
        const iconColor = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        
        // Other UI colors
        const cellHighlightColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        
        // Draw cell highlight - removed glow/shadow effect
        if (cell && cell.path) {
            ctx.save();
            ctx.strokeStyle = cellHighlightColor;
            ctx.lineWidth = 3;
            
            ctx.setLineDash(isLocked ? [] : [5, 3]);
            
            // Removed shadow/glow properties
            
            ctx.beginPath();
            const path = new Path2D(cell.path);
            ctx.stroke(path);
            ctx.restore();
        }
        
        // Define three sections of the pill with asymmetric widths
        const pillWidth = 64; // Total width
        const colorSectionWidth = 24; // Make color picker section wider
        const moveSectionWidth = 20; // Middle section
        const lockSectionWidth = 20; // Right section
        const pillHeight = 24;
        const pillX = site[0] - pillWidth / 2;
        const pillY = site[1] - pillHeight / 2;
        
        // Calculate section positions
        const colorSectionX = pillX;
        const moveSectionX = pillX + colorSectionWidth;
        const lockSectionX = moveSectionX + moveSectionWidth;
        
        // Store button positions for hit testing - now with three sections
        const pillControls = {
            pill: { 
                x: site[0], 
                y: site[1], 
                width: pillWidth, 
                height: pillHeight,
                left: pillX,
                right: pillX + pillWidth,
                top: pillY,
                bottom: pillY + pillHeight
            },
            colorBtn: { 
                x: pillX + colorSectionWidth / 2, 
                y: site[1],
                left: pillX,
                right: pillX + colorSectionWidth,
                top: pillY,
                bottom: pillY + pillHeight,
                radius: 8 // Keep original radius for backward compatibility
            },
            moveBtn: { 
                x: moveSectionX + moveSectionWidth / 2, 
                y: site[1],
                left: moveSectionX,
                right: moveSectionX + moveSectionWidth,
                top: pillY,
                bottom: pillY + pillHeight
            },
            lockBtn: { 
                x: lockSectionX + lockSectionWidth / 2, 
                y: site[1],
                left: lockSectionX,
                right: lockSectionX + lockSectionWidth,
                top: pillY,
                bottom: pillY + pillHeight,
                radius: 8 // Keep original radius for backward compatibility
            }
        };
        
        if (editMode) {
            if (!this.core.hoverControls.cells) {
                this.core.hoverControls.cells = {};
            }
            this.core.hoverControls.cells[cellIndex] = pillControls;
        } else {
            this.core.hoverControls = {
                cell: cellIndex,
                ...pillControls
            };
        }
        
        // Check which section is being hovered (if any)
        let isColorBtnHovered = false;
        let isMoveBtnHovered = false;
        let isLockBtnHovered = false;
        
        if (hoveredButton && (editMode ? hoveredCellIndex === cellIndex : true)) {
            isColorBtnHovered = (hoveredButton === 'colorBtn');
            isMoveBtnHovered = (hoveredButton === 'moveBtn');
            isLockBtnHovered = (hoveredButton === 'lockBtn');
        }
        
        // Draw the pill background with three sections (each with independent hover state)
        
        // Color section (left)
        ctx.fillStyle = isColorBtnHovered ? pillHoverColor : pillBackgroundColor;
        ctx.beginPath();
        this.roundedRectSection(ctx, colorSectionX, pillY, colorSectionWidth, pillHeight, 12, true, false);
        ctx.fill();
        
        // Move section (middle)
        ctx.fillStyle = isMoveBtnHovered ? pillHoverColor : pillBackgroundColor;
        ctx.beginPath();
        this.roundedRectSection(ctx, moveSectionX, pillY, moveSectionWidth, pillHeight, 0, false, false);
        ctx.fill();
        
        // Lock section (right)
        ctx.fillStyle = isLockBtnHovered ? pillHoverColor : pillBackgroundColor;
        ctx.beginPath();
        this.roundedRectSection(ctx, lockSectionX, pillY, lockSectionWidth, pillHeight, 12, false, true);
        ctx.fill();
        
        // Draw dividers between sections
        ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
        ctx.fillRect(moveSectionX, pillY + 2, 1, pillHeight - 4);
        ctx.fillRect(lockSectionX, pillY + 2, 1, pillHeight - 4);
        
        // Draw color picker circle
        ctx.beginPath();
        ctx.fillStyle = cellColor.hex;
        ctx.arc(pillControls.colorBtn.x, pillControls.colorBtn.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a thin outline to the color circle for better visibility
        ctx.beginPath();
        ctx.strokeStyle = cellHighlightColor;
        ctx.lineWidth = 1;
        ctx.arc(pillControls.colorBtn.x, pillControls.colorBtn.y, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw move icon
        ctx.fillStyle = iconColor;
        ctx.font = '14px bootstrap-icons';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\uF14E', pillControls.moveBtn.x, pillControls.moveBtn.y); // Move icon
        
        // Draw lock icon
        const lockIcon = isLocked ? '\uF47A' : '\uF5FF'; // bootstrap-icons: lock-fill vs unlock-fill
        ctx.fillText(lockIcon, pillControls.lockBtn.x, pillControls.lockBtn.y);
        
        // Set cursor based on hovered section
        if (isMoveBtnHovered) {
            this.core.canvas.style.cursor = 'move';
        } else {
            this.core.canvas.style.cursor = 'pointer';
        }
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
                    
                    // Check which section of the pill is being hovered
                    if (this.isPointInSection(x, y, 'colorBtn', cellControls)) {
                        result.button = 'colorBtn';
                        result.cellIndex = parseInt(cellIndex);
                        result.cursor = 'pointer';
                        result.changed = true;
                        result.render = true;
                        return result;
                    } else if (this.isPointInSection(x, y, 'moveBtn', cellControls)) {
                        result.button = 'moveBtn';
                        result.cellIndex = parseInt(cellIndex);
                        result.cursor = 'move';
                        result.changed = true;
                        result.render = true;
                        return result;
                    } else if (this.isPointInSection(x, y, 'lockBtn', cellControls)) {
                        result.button = 'lockBtn';
                        result.cellIndex = parseInt(cellIndex);
                        result.cursor = 'pointer';
                        result.changed = true;
                        result.render = true;
                        return result;
                    }
                }
            }
            
            // If we got here, not hovering over any pill section
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
            
            // Check which section of the pill is being hovered
            if (this.isPointInSection(x, y, 'colorBtn', hoverControls)) {
                result.button = 'colorBtn';
                result.cursor = 'pointer';
                result.changed = this.core.hoveredButton !== 'colorBtn';
                result.render = result.changed;
                return result;
            } else if (this.isPointInSection(x, y, 'moveBtn', hoverControls)) {
                result.button = 'moveBtn';
                result.cursor = 'move';
                result.changed = this.core.hoveredButton !== 'moveBtn';
                result.render = result.changed;
                return result;
            } else if (this.isPointInSection(x, y, 'lockBtn', hoverControls)) {
                result.button = 'lockBtn';
                result.cursor = 'pointer';
                result.changed = this.core.hoveredButton !== 'lockBtn';
                result.render = result.changed;
                return result;
            }
            
            // If we got here, not hovering any section
            if (this.core.hoveredButton) {
                result.changed = true;
                result.render = true;
            }
        }
        
        return result;
    }
    
    /**
     * Check if point is within a specific section of the pill
     * @param {Number} x - X coordinate
     * @param {Number} y - Y coordinate
     * @param {String} section - Section name (colorBtn, moveBtn, lockBtn)
     * @param {Object} controls - Hover controls object
     * @returns {Boolean} - Whether point is in the section
     */
    isPointInSection(x, y, section, controls) {
        if (!controls || !controls[section]) return false;
        
        const sec = controls[section];
        return x >= sec.left && x <= sec.right && y >= sec.top && y <= sec.bottom;
    }
    
    /**
     * Draw a rounded rectangle section (for pill UI)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Number} x - X coordinate
     * @param {Number} y - Y coordinate
     * @param {Number} width - Rectangle width
     * @param {Number} height - Rectangle height
     * @param {Number} radius - Corner radius
     * @param {Boolean} roundLeft - Round left corners
     * @param {Boolean} roundRight - Round right corners
     */
    roundedRectSection(ctx, x, y, width, height, radius, roundLeft, roundRight) {
        ctx.beginPath();
        
        // Top edge
        if (roundLeft) {
            ctx.moveTo(x + radius, y);
        } else {
            ctx.moveTo(x, y);
        }
        
        if (roundRight) {
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        } else {
            ctx.lineTo(x + width, y);
        }
        
        // Right edge
        if (roundRight) {
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        } else {
            ctx.lineTo(x + width, y + height);
        }
        
        // Bottom edge
        if (roundLeft) {
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        } else {
            ctx.lineTo(x, y + height);
        }
        
        // Left edge
        if (roundLeft) {
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        ctx.closePath();
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
        
        // First try section-based detection
        if (this.isPointInSection(x, y, control, hoverControls)) {
            return true;
        }
        
        // Fallback to original radius-based detection for backward compatibility
        const btn = hoverControls[control];
        if (!btn) return false;
        
        // Only use radius if it exists
        if (btn.radius) {
            const dx = x - btn.x;
            const dy = y - btn.y;
            return (dx * dx + dy * dy) <= (btn.radius * btn.radius);
        }
        
        return false;
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
