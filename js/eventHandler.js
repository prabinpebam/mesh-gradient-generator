/**
 * Event Handler - Takes over canvas event handling
 * This provides safe, consistent events for the mesh gradient
 */

(function() {
    // Execute at the earliest possible moment
    function initEventHandlers() {
        console.log("EventHandler: Initializing canvas event handlers");
        
        // Wait for DOM to be ready
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", setupHandlers);
        } else {
            setupHandlers();
        }
    }
    
    function setupHandlers() {
        // Get the canvas
        const canvas = document.getElementById('gradientCanvas');
        if (!canvas) {
            console.error("EventHandler: Canvas not found, will retry");
            setTimeout(setupHandlers, 100);
            return;
        }
        
        console.log("EventHandler: Found canvas, attaching handlers");
        
        // Remove ALL existing event handlers from the canvas
        // This is a brute force approach to ensure we control all events
        const canvasClone = canvas.cloneNode(true);
        canvas.parentNode.replaceChild(canvasClone, canvas);
        
        // Reference the new canvas
        const newCanvas = document.getElementById('gradientCanvas');
        
        // Set up our verified safe handlers
        setupMouseHandlers(newCanvas);
        
        console.log("EventHandler: Safe handlers installed");
    }
    
    function setupMouseHandlers(canvas) {
        // Hover tracking
        canvas.addEventListener('mousemove', function(e) {
            try {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                if (!window.meshGradient) return;
                
                // Update hover position
                if (typeof meshGradient.setHoverPosition === 'function') {
                    meshGradient.setHoverPosition(x, y);
                }
                
                // Update button hover state
                if (typeof meshGradient.updateButtonHover === 'function') {
                    meshGradient.updateButtonHover(x, y);
                }
            } catch (err) {
                console.error("Error in mousemove handler:", err);
            }
        });
        
        // Mouse leave
        canvas.addEventListener('mouseleave', function() {
            try {
                if (!window.meshGradient) return;
                
                // Clear hover state
                if (typeof meshGradient.clearHover === 'function') {
                    meshGradient.clearHover();
                }
            } catch (err) {
                console.error("Error in mouseleave handler:", err);
            }
        });
        
        // Mouse down
        canvas.addEventListener('mousedown', function(e) {
            try {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                if (!window.meshGradient) return;
                
                // Start dragging
                if (typeof meshGradient.startDrag === 'function') {
                    meshGradient.startDrag(x, y);
                }
            } catch (err) {
                console.error("Error in mousedown handler:", err);
            }
        });
        
        // Mouse move during drag
        canvas.addEventListener('mousemove', function(e) {
            try {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                if (!window.meshGradient) return;
                
                // Continue dragging if in drag mode
                if (typeof meshGradient.drag === 'function' && 
                    meshGradient.dragSiteIndex !== undefined && 
                    meshGradient.dragSiteIndex !== -1) {
                    meshGradient.drag(x, y);
                }
            } catch (err) {
                console.error("Error in mousemove drag handler:", err);
            }
        });
        
        // Mouse up
        canvas.addEventListener('mouseup', function(e) {
            try {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                if (!window.meshGradient) return;
                
                // Handle any cell controls first
                let handledControl = false;
                
                // Safe implementation to check if a point is in a control
                function pointInControl(x, y, control) {
                    if (!meshGradient.hoverControls) return false;
                    
                    const btn = meshGradient.hoverControls[control];
                    if (!btn) return false;
                    
                    const dx = x - btn.x;
                    const dy = y - btn.y;
                    return (dx * dx + dy * dy) <= (btn.radius * btn.radius);
                }
                
                // Check for color button
                if (pointInControl(x, y, 'colorBtn')) {
                    console.log("EventHandler: Color button clicked");
                    handledControl = true;
                    
                    // Open color picker to change cell color
                    const colorPicker = document.getElementById('cellColorPicker');
                    if (colorPicker && meshGradient.hoverCellIndex >= 0) {
                        const currentColor = meshGradient.getCellColor(meshGradient.hoverCellIndex);
                        colorPicker.value = currentColor.hex;
                        colorPicker.dataset.cellIndex = meshGradient.hoverCellIndex;
                        colorPicker.click();
                    }
                }
                // Check for lock button
                else if (pointInControl(x, y, 'lockBtn')) {
                    console.log("EventHandler: Lock button clicked");
                    handledControl = true;
                    
                    // Toggle cell color lock
                    if (meshGradient.hoverCellIndex >= 0) {
                        const isLocked = meshGradient.isCellColorLocked(meshGradient.hoverCellIndex);
                        if (isLocked) {
                            meshGradient.unlockCellColor(meshGradient.hoverCellIndex);
                        } else {
                            meshGradient.lockCellColor(meshGradient.hoverCellIndex);
                        }
                    }
                }
                
                // End dragging if not handled by controls
                if (!handledControl && typeof meshGradient.endDrag === 'function') {
                    meshGradient.endDrag();
                }
            } catch (err) {
                console.error("Error in mouseup handler:", err);
                
                // Always ensure we end dragging even if there was an error
                if (window.meshGradient && typeof meshGradient.endDrag === 'function') {
                    meshGradient.endDrag();
                }
            }
        });
        
        // Color picker change handler
        const colorPicker = document.getElementById('cellColorPicker');
        if (colorPicker) {
            colorPicker.addEventListener('change', function() {
                try {
                    const cellIndex = parseInt(this.dataset.cellIndex);
                    const hexColor = this.value;
                    
                    if (!window.meshGradient || isNaN(cellIndex)) return;
                    
                    // Update cell color
                    if (typeof meshGradient.setCellColor === 'function') {
                        meshGradient.setCellColor(cellIndex, hexColor);
                    }
                } catch (err) {
                    console.error("Error in color picker handler:", err);
                }
            });
        }
    }
    
    // Start initialization
    initEventHandlers();
})();

/**
 * Event Handler - Provides safe versions of canvas interaction methods
 */
(function() {
    console.log("EventHandler: Starting initialization...");
    
    // Make sure we only run once
    if (window._eventHandlerInitialized) return;
    window._eventHandlerInitialized = true;
    
    // Provide the safe version globally so it's always available
    window.safeIsPointInControl = function(x, y, control) {
        if (!window.meshGradient) {
            console.log("EventHandler: meshGradient not available");
            return false;
        }
        
        try {
            // Robust implementation that doesn't depend on meshGradient.isPointInControl
            if (!meshGradient.hoverControls) {
                return false;
            }
            
            const btn = meshGradient.hoverControls[control];
            if (!btn) return false;
            
            const dx = x - btn.x;
            const dy = y - btn.y;
            return (dx * dx + dy * dy) <= (btn.radius * btn.radius);
        } catch (e) {
            console.error("EventHandler: Error in safeIsPointInControl", e);
            return false;
        }
    };
    
    // Add global monkeypatch for meshGradient when it becomes available
    const patchMeshGradient = function() {
        if (!window.meshGradient) {
            setTimeout(patchMeshGradient, 100);
            return;
        }
        
        console.log("EventHandler: Patching meshGradient with safe methods");
        
        // Provide a safe isPointInControl method directly on meshGradient
        meshGradient.isPointInControl = window.safeIsPointInControl;
        
        console.log("EventHandler: Patching complete");
    };
    
    // Start the patching process
    patchMeshGradient();
    
    console.log("EventHandler: Initialization complete");
})();
