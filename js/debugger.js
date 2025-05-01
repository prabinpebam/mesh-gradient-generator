/**
 * Debug script for finding and fixing the isPointInControl issue
 * This should be loaded right before ui.js
 */
(function() {
    console.log("DEBUGGER: Starting deep mesh gradient analysis");
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DEBUGGER: DOM ready, setting up");
        
        // First log the original error location (line 347)
        console.log("DEBUGGER: Setting up error line monitoring");
        
        // Override addEventListener to catch and modify the problematic handler
        const origAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            // Only target canvas mouseup event which is the source of our issue
            if (this.id === 'gradientCanvas' && type === 'mouseup') {
                console.log("DEBUGGER: ⚠️ Intercepted canvas mouseup event ⚠️");
                
                // Wrap the listener in our safe version
                const safeListener = function(e) {
                    console.log("DEBUGGER: Canvas mouseup triggered:");
                    
                    try {
                        // Log the state of meshGradient before calling original handler
                        console.log("DEBUGGER: Checking meshGradient state:", {
                            exists: !!window.meshGradient,
                            isPointInControl: window.meshGradient ? typeof meshGradient.isPointInControl : 'N/A',
                            hoverControls: window.meshGradient ? !!meshGradient.hoverControls : 'N/A',
                            renderer: window.meshGradient ? !!meshGradient.renderer : 'N/A',
                            data: window.meshGradient ? !!meshGradient.data : 'N/A'
                        });
                        
                        // Modified version of the handler that uses a safe check
                        const rect = this.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        
                        // Check if we're in a hover control safely
                        if (window.meshGradient && meshGradient.hoverControls) {
                            console.log("DEBUGGER: hoverControls exists:", meshGradient.hoverControls);
                            
                            // Safe implementation for colorBtn
                            const checkColorBtn = function() {
                                try {
                                    const btn = meshGradient.hoverControls.colorBtn;
                                    if (!btn) return false;
                                    
                                    const dx = x - btn.x;
                                    const dy = y - btn.y;
                                    return (dx * dx + dy * dy) <= (btn.radius * btn.radius);
                                } catch (err) {
                                    console.error("DEBUGGER: Error checking colorBtn:", err);
                                    return false;
                                }
                            };
                            
                            // Safe implementation for lockBtn
                            const checkLockBtn = function() {
                                try {
                                    const btn = meshGradient.hoverControls.lockBtn;
                                    if (!btn) return false;
                                    
                                    const dx = x - btn.x;
                                    const dy = y - btn.y;
                                    return (dx * dx + dy * dy) <= (btn.radius * btn.radius);
                                } catch (err) {
                                    console.error("DEBUGGER: Error checking lockBtn:", err);
                                    return false;
                                }
                            };
                            
                            // Handle color button click
                            if (checkColorBtn()) {
                                console.log("DEBUGGER: Color button clicked");
                                const colorPicker = document.getElementById('cellColorPicker');
                                if (colorPicker && meshGradient.hoverCellIndex >= 0) {
                                    const currentColor = meshGradient.getCellColor(meshGradient.hoverCellIndex);
                                    colorPicker.value = currentColor.hex;
                                    colorPicker.dataset.cellIndex = meshGradient.hoverCellIndex;
                                    colorPicker.click();
                                }
                                return; // Don't call original 
                            }
                            
                            // Handle lock button click
                            if (checkLockBtn()) {
                                console.log("DEBUGGER: Lock button clicked");
                                if (meshGradient.hoverCellIndex >= 0) {
                                    const isLocked = meshGradient.isCellColorLocked(meshGradient.hoverCellIndex);
                                    if (isLocked) {
                                        meshGradient.unlockCellColor(meshGradient.hoverCellIndex);
                                    } else {
                                        meshGradient.lockCellColor(meshGradient.hoverCellIndex);
                                    }
                                }
                                return; // Don't call original
                            }
                        }
                        
                        // If we get here, call the original listener since it's not a control click
                        console.log("DEBUGGER: Calling original listener (not a control)");
                        return listener.call(this, e);
                        
                    } catch(err) {
                        console.error("DEBUGGER: Error in safe mouseup handler:", err);
                        // Call original as fallback
                        try {
                            return listener.call(this, e);
                        } catch (innerErr) {
                            console.error("DEBUGGER: Inner error in original handler:", innerErr);
                        }
                    }
                };
                
                // Call original addEventListener with our safe wrapper
                return origAddEventListener.call(this, type, safeListener, options);
            }
            
            // For all other events, proceed normally
            return origAddEventListener.call(this, type, listener, options);
        };
        
        // Also add a safer isPointInControl to meshGradient when it's available
        const createSafeMethod = function() {
            if (!window.meshGradient) {
                console.log("DEBUGGER: Waiting for meshGradient...");
                setTimeout(createSafeMethod, 100);
                return;
            }
            
            console.log("DEBUGGER: Adding safe isPointInControl to meshGradient");
            
            // Make method available no matter what
            meshGradient.isPointInControl = function(x, y, control) {
                console.log(`DEBUGGER: Safe isPointInControl called with ${x}, ${y}, ${control}`);
                
                try {
                    // Safety check for hoverControls
                    if (!this.hoverControls) {
                        console.log("DEBUGGER: No hoverControls found");
                        return false;
                    }
                    
                    const btn = this.hoverControls[control];
                    if (!btn) {
                        console.log(`DEBUGGER: No '${control}' control found`);
                        return false;
                    }
                    
                    const dx = x - btn.x;
                    const dy = y - btn.y;
                    const result = (dx * dx + dy * dy) <= (btn.radius * btn.radius);
                    console.log(`DEBUGGER: isPointInControl result: ${result}`);
                    return result;
                } catch (err) {
                    console.error("DEBUGGER: Error in isPointInControl:", err);
                    return false;
                }
            };
        };
        
        // Start the safe method creation process
        createSafeMethod();
        
        // Also examine all scripts to find other instances of isPointInControl
        const scripts = document.querySelectorAll('script:not([src])');
        console.log(`DEBUGGER: Checking ${scripts.length} inline scripts for isPointInControl`);
        
        scripts.forEach((script, index) => {
            const content = script.textContent;
            if (content.includes('isPointInControl')) {
                console.log(`DEBUGGER: Found isPointInControl in inline script #${index}`);
            }
        });
        
        console.log("DEBUGGER: Setup complete");
    });
})();
