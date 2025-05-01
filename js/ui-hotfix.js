/**
 * Targeted hot-fix for the specific line 347 issue in ui.js
 */
(function() {
    console.log("UI-HOTFIX: Starting...");
    
    // Wait for DOM loaded
    window.addEventListener('DOMContentLoaded', function() {
        console.log("UI-HOTFIX: DOM loaded, starting hotfix");
        
        // Find the canvas
        const canvasCheck = function() {
            const canvas = document.getElementById('gradientCanvas');
            if (!canvas) {
                console.log("UI-HOTFIX: Canvas not found yet, waiting...");
                setTimeout(canvasCheck, 100);
                return;
            }
            
            console.log("UI-HOTFIX: Found canvas, applying fixes");
            
            // Phase 1: Add direct getAttribute/getAttribute overrides for safety
            const origAddEventListener = canvas.addEventListener;
            
            canvas.addEventListener = function(type, listener, options) {
                console.log(`UI-HOTFIX: Canvas addEventListener called for '${type}'`);
                
                // If it's mouseup, replace with our safe version
                if (type === 'mouseup') {
                    console.log("UI-HOTFIX: Intercepting mouseup handler");
                    
                    // Create safe version of the listener
                    const safeListener = function(e) {
                        console.log("UI-HOTFIX: Safe mouseup handler running");
                        
                        try {
                            const rect = this.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            
                            // Log the full state for debugging
                            console.log("UI-HOTFIX: meshGradient state:", {
                                exists: !!window.meshGradient,
                                hoverControls: window.meshGradient ? JSON.stringify(meshGradient.hoverControls) : 'N/A',
                                x: x,
                                y: y
                            });
                            
                            // Manual check for controls instead of using isPointInControl
                            if (window.meshGradient && meshGradient.hoverControls) {
                                // Check for color button
                                const colorBtn = meshGradient.hoverControls.colorBtn || 
                                                (meshGradient.hoverControls.cells && 
                                                  meshGradient.hoverControls.cells[meshGradient.hoverCellIndex]?.colorBtn);
                                
                                if (colorBtn) {
                                    const dx = x - colorBtn.x;
                                    const dy = y - colorBtn.y;
                                    if ((dx * dx + dy * dy) <= (colorBtn.radius * colorBtn.radius)) {
                                        console.log("UI-HOTFIX: Color button clicked");
                                        // Open color picker to change cell color
                                        const colorPicker = document.getElementById('cellColorPicker');
                                        if (colorPicker && meshGradient.hoverCellIndex >= 0) {
                                            const currentColor = meshGradient.getCellColor(meshGradient.hoverCellIndex);
                                            colorPicker.value = currentColor.hex;
                                            colorPicker.dataset.cellIndex = meshGradient.hoverCellIndex;
                                            colorPicker.click();
                                        }
                                        return;
                                    }
                                }
                                
                                // Check for lock button
                                const lockBtn = meshGradient.hoverControls.lockBtn || 
                                              (meshGradient.hoverControls.cells && 
                                                meshGradient.hoverControls.cells[meshGradient.hoverCellIndex]?.lockBtn);
                                
                                if (lockBtn) {
                                    const dx = x - lockBtn.x;
                                    const dy = y - lockBtn.y;
                                    if ((dx * dx + dy * dy) <= (lockBtn.radius * lockBtn.radius)) {
                                        console.log("UI-HOTFIX: Lock button clicked");
                                        // Toggle cell color lock
                                        if (meshGradient.hoverCellIndex >= 0) {
                                            const isLocked = meshGradient.isCellColorLocked(meshGradient.hoverCellIndex);
                                            if (isLocked) {
                                                meshGradient.unlockCellColor(meshGradient.hoverCellIndex);
                                            } else {
                                                meshGradient.lockCellColor(meshGradient.hoverCellIndex);
                                            }
                                        }
                                        return;
                                    }
                                }
                            }
                            
                            // If we get here, no control was clicked, call original listener
                            console.log("UI-HOTFIX: No control clicked, passing to original handler");
                            return listener.call(this, e);
                            
                        } catch (err) {
                            console.error("UI-HOTFIX: Error in safe handler:", err);
                            
                            // Still try to run the original handler as a fallback
                            try {
                                return listener.call(this, e);
                            } catch (innerErr) {
                                console.error("UI-HOTFIX: Inner error in original handler:", innerErr);
                            }
                        }
                    };
                    
                    // Use the original addEventListener with our safe listener
                    return origAddEventListener.call(this, type, safeListener, options);
                }
                
                // For all other events, use the original implementation
                return origAddEventListener.call(this, type, listener, options);
            };
            
            console.log("UI-HOTFIX: Canvas addEventListener successfully patched");
        };
        
        // Start the check process
        canvasCheck();
    });
    
    console.log("UI-HOTFIX: Setup complete");
})();
