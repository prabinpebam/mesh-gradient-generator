// Add this right at the beginning to disable problematic code
// This must be the very first code run in this file
(function() {
    // Flag to disable original event handlers that are causing issues
    window._disableOriginalCanvasEvents = true;
    
    console.log("UI: Preventing problematic event handlers");
    
    // Track the specific impacted function
    const origAddEventListener = EventTarget.prototype.addEventListener;
    
    // Replace addEventListener with our safer version
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        // For the specific problematic canvas events, skip if flagged
        if (window._disableOriginalCanvasEvents && 
            this.id === 'gradientCanvas' && 
            (type === 'mouseup' || type === 'click')) {
            console.log(`UI: Blocked ${type} event handler on canvas`);
            return;
        }
        
        // All other events proceed normally
        origAddEventListener.call(this, type, listener, options);
    };
    
    console.log("UI: Event handler patching installed");
})();

// Right at the top of the file - this must be the very first code executed
// Add comprehensive debugging and function mocking
(function() {
    // Wait for meshGradient to be available
    const mockAndDebug = function() {
        if (!window.meshGradient) {
            console.log("Waiting for meshGradient to be available...");
            setTimeout(mockAndDebug, 100);
            return;
        }

        console.log("Patching meshGradient for compatibility...");
        
        // Create backup of original functions if they exist
        if (meshGradient.isPointInControl) {
            console.log("Original isPointInControl exists, saving backup");
            meshGradient._originalIsPointInControl = meshGradient.isPointInControl;
        }
        
        // Override with a version that does robust error handling and logging
        meshGradient.isPointInControl = function(x, y, control) {
            console.log(`isPointInControl called: x=${x}, y=${y}, control=${control}`);
            
            try {
                // First try built-in functionality from renderer if available
                if (this.renderer && typeof this.renderer.isPointInControl === 'function') {
                    return this.renderer.isPointInControl(x, y, control, this.hoverControls);
                }
                
                // Then try original function if it was saved
                if (this._originalIsPointInControl) {
                    return this._originalIsPointInControl.call(this, x, y, control);
                }
                
                // Fall back to manual implementation
                if (!this.hoverControls) {
                    console.log("No hoverControls available");
                    return false;
                }
                
                const btn = this.hoverControls[control];
                if (!btn) {
                    console.log(`Control button '${control}' not found`);
                    return false;
                }
                
                // Check if point is within circular button
                const dx = x - btn.x;
                const dy = y - btn.y;
                const result = (dx * dx + dy * dy) <= (btn.radius * btn.radius);
                console.log(`isPointInControl result: ${result}`);
                return result;
            } catch (err) {
                console.error("Error in isPointInControl:", err);
                return false; // Safe default is to say "no"
            }
        };
        
        // Also handle updateButtonHover in a similar way if it's causing issues
        if (meshGradient.updateButtonHover) {
            meshGradient._originalUpdateButtonHover = meshGradient.updateButtonHover;
        }
        
        meshGradient.updateButtonHover = function(x, y) {
            try {
                if (this._originalUpdateButtonHover) {
                    return this._originalUpdateButtonHover.call(this, x, y);
                }
                
                // If no original function, provide basic implementation
                if (!this.hoverControls) return false;
                
                // Simple implementation for safety
                return false;
            } catch (err) {
                console.error("Error in updateButtonHover:", err);
                return false;
            }
        };
        
        console.log("MeshGradient patched successfully!");
    };
    
    // Start the patching process
    mockAndDebug();
    
    // Set a global error handler to catch any calls to isPointInControl
    window.addEventListener('error', function(event) {
        if (event.error && event.error.message && 
            event.error.message.includes('isPointInControl is not a function')) {
            console.error("Caught isPointInControl error:", event.error);
            event.preventDefault(); // Prevent default error handling
            return true; // Indicate error was handled
        }
    });
})();

// Add this at the beginning of the file to ensure it's available to all functions
// Overriding the isPointInControl method globally to ensure compatibility
if (window.meshGradient && !meshGradient.isPointInControl) {
    meshGradient.isPointInControl = function(x, y, control) {
        if (!this.hoverControls) return false;
        
        const btn = this.hoverControls[control];
        if (!btn) return false;
        
        // Check if point is within circular button
        const dx = x - btn.x;
        const dy = y - btn.y;
        return (dx * dx + dy * dy) <= (btn.radius * btn.radius);
    };
}

// Initialize UI only after all scripts are loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('UI initializing...');
    
    // Add a small delay to ensure MeshGradient is fully initialized
    setTimeout(() => {
        if (typeof MeshGradient === 'undefined') {
            console.error("MeshGradient not found. Check script loading order.");
            return;
        }
        
        console.log("MeshGradient found, continuing with UI initialization");
        // ...existing code...
    }, 100);
});

// ...existing code...

// Add defensive check for distortions.hasActive()
function safeHasActiveDistortion() {
    if (!window.meshGradient) return false;
    if (!window.meshGradient.data) return false;
    if (!window.meshGradient.data.distortions) return false;
    
    return typeof window.meshGradient.data.distortions.hasActive === 'function' 
        ? window.meshGradient.data.distortions.hasActive() 
        : false;
}

// Find line 278 and add defensive check
// Replace code like:
// if (meshGradient.data.distortions.hasActive()) {
// with:
if (safeHasActiveDistortion()) {
    // ...existing code...
}

// Add this helper function to safely check if a point is in a control
function safeIsPointInControl(x, y, control) {
    if (!window.meshGradient) return false;
    
    // Check if the function exists directly on meshGradient (old structure)
    if (typeof meshGradient.isPointInControl === 'function') {
        return meshGradient.isPointInControl(x, y, control);
    }
    
    // Check if the function exists in renderer (new structure)
    if (meshGradient.renderer && typeof meshGradient.renderer.isPointInControl === 'function') {
        return meshGradient.renderer.isPointInControl(x, y, control, meshGradient.hoverControls);
    }
    
    // Manual implementation as fallback
    if (!meshGradient.hoverControls) return false;
    
    const btn = meshGradient.hoverControls[control];
    if (!btn) return false;
    
    // Check if point is within circular button
    const dx = x - btn.x;
    const dy = y - btn.y;
    return (dx * dx + dy * dy) <= (btn.radius * btn.radius);
}

// ...existing code...

// Now find all canvas-related event handlers and fix them directly
// 1. Look for mouseup event handler around line 347 and replace it completely
document.addEventListener('DOMContentLoaded', function() {
    // Wait for canvas to be available
    setTimeout(function() {
        const canvas = document.getElementById('gradientCanvas');
        if (!canvas) {
            console.error("Canvas not found");
            return;
        }
        
        console.log("Adding safe event handlers to canvas");
        
        // Remove all existing mouseup handlers (clean slate)
        const oldMouseUp = canvas.onmouseup;
        canvas.onmouseup = null;
        
        // Add our safe handler that doesn't rely on meshGradient.isPointInControl
        canvas.addEventListener('mouseup', function(e) {
            console.log("Safe mouseup handler called");
            
            try {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                if (!window.meshGradient) {
                    console.error("meshGradient not available in mouseup handler");
                    return;
                }
                
                // Use safeIsPointInControl function or the patched one
                if (typeof safeIsPointInControl === 'function') {
                    console.log("Using safeIsPointInControl function");
                    
                    if (safeIsPointInControl(x, y, 'colorBtn')) {
                        console.log("Color button clicked");
                        // Open color picker to change cell color
                        const colorPicker = document.getElementById('cellColorPicker');
                        if (colorPicker && meshGradient.hoverCellIndex >= 0) {
                            const currentColor = meshGradient.getCellColor(meshGradient.hoverCellIndex);
                            colorPicker.value = currentColor.hex;
                            colorPicker.dataset.cellIndex = meshGradient.hoverCellIndex;
                            colorPicker.click();
                        }
                    } else if (safeIsPointInControl(x, y, 'lockBtn')) {
                        console.log("Lock button clicked");
                        // Toggle cell color lock
                        if (meshGradient.hoverCellIndex >= 0) {
                            const isLocked = meshGradient.isCellColorLocked(meshGradient.hoverCellIndex);
                            if (isLocked) {
                                meshGradient.unlockCellColor(meshGradient.hoverCellIndex);
                            } else {
                                meshGradient.lockCellColor(meshGradient.hoverCellIndex);
                            }
                        }
                    } else {
                        // Handle other mouseup events
                        if (typeof oldMouseUp === 'function') {
                            oldMouseUp.call(this, e);
                        }
                    }
                }
                // Use the patched meshGradient.isPointInControl as fallback
                else {
                    console.log("Using patched meshGradient.isPointInControl");
                    
                    if (meshGradient.isPointInControl(x, y, 'colorBtn')) {
                        console.log("Color button clicked (patched)");
                        // Open color picker to change cell color
                        const colorPicker = document.getElementById('cellColorPicker');
                        if (colorPicker && meshGradient.hoverCellIndex >= 0) {
                            const currentColor = meshGradient.getCellColor(meshGradient.hoverCellIndex);
                            colorPicker.value = currentColor.hex;
                            colorPicker.dataset.cellIndex = meshGradient.hoverCellIndex;
                            colorPicker.click();
                        }
                    } else if (meshGradient.isPointInControl(x, y, 'lockBtn')) {
                        console.log("Lock button clicked (patched)");
                        // Toggle cell color lock
                        if (meshGradient.hoverCellIndex >= 0) {
                            const isLocked = meshGradient.isCellColorLocked(meshGradient.hoverCellIndex);
                            if (isLocked) {
                                meshGradient.unlockCellColor(meshGradient.hoverCellIndex);
                            } else {
                                meshGradient.lockCellColor(meshGradient.hoverCellIndex);
                            }
                        }
                    } else {
                        // Handle other mouseup events
                        if (typeof oldMouseUp === 'function') {
                            oldMouseUp.call(this, e);
                        }
                    }
                }
            } catch (err) {
                console.error("Error in mouseup handler:", err);
            }
        });
        
        console.log("Safe event handlers added to canvas");
    }, 500); // Give enough time for everything to load
});

// Find and replace the specific problematic code at line 347
// This is a targeted approach that directly addresses the error location

// Search for this code block in ui.js:
/* 
canvas.addEventListener('mouseup', function(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (meshGradient.isPointInControl(x, y, 'colorBtn')) {  // <-- THIS IS LINE 347
        // ...
    }
});
*/

// Replace it with this safer version:
// Find the canvas mouseup handler and replace it with this safer version
document.addEventListener("DOMContentLoaded", function() {
    // Wait for the canvas to be ready
    setTimeout(function() {
        const canvas = document.getElementById('gradientCanvas');
        if (!canvas) return;
        
        console.log("UI: Removing existing handlers and adding safe ones");
        
        // Remove all existing mouseup handlers to be safe
        const newCanvas = canvas.cloneNode(true);
        if (canvas.parentNode) {
            canvas.parentNode.replaceChild(newCanvas, canvas);
        }
        
        // Get reference to the new canvas
        const safeCanvas = document.getElementById('gradientCanvas');
        if (!safeCanvas) return;
        
        // Add safe mouseup handler
        safeCanvas.addEventListener('mouseup', function(e) {
            const rect = safeCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Use window.safeIsPointInControl which should be available from eventHandler.js
            if (window.safeIsPointInControl && window.safeIsPointInControl(x, y, 'colorBtn')) {
                // Open color picker to change cell color
                const colorPicker = document.getElementById('cellColorPicker');
                if (colorPicker && meshGradient.hoverCellIndex >= 0) {
                    const currentColor = meshGradient.getCellColor(meshGradient.hoverCellIndex);
                    colorPicker.value = currentColor.hex;
                    colorPicker.dataset.cellIndex = meshGradient.hoverCellIndex;
                    colorPicker.click();
                }
            } else if (window.safeIsPointInControl && window.safeIsPointInControl(x, y, 'lockBtn')) {
                // Toggle cell color lock
                if (meshGradient.hoverCellIndex >= 0) {
                    const isLocked = meshGradient.isCellColorLocked(meshGradient.hoverCellIndex);
                    if (isLocked) {
                        meshGradient.unlockCellColor(meshGradient.hoverCellIndex);
                    } else {
                        meshGradient.lockCellColor(meshGradient.hoverCellIndex);
                    }
                }
            } else if (meshGradient.dragSiteIndex !== -1) {
                // End drag if we were dragging
                meshGradient.endDrag();
            }
        });
        
        console.log("UI: Safe mouseup handler added");
    }, 300); // Wait for everything else to load first
});

/**
 * Log all current cell colors to the console
 */
function logCellColors() {
  console.log("Logging cell colors");
  if (!window.meshGradient) return;
  
  // Get the total number of cells
  const cellCount = meshGradient.cellCount || 0;
  const cells = [];
  
  // Get the color of each individual cell
  for (let i = 0; i < cellCount; i++) {
    const color = meshGradient.getCellColor(i);
    cells.push({
      cellIndex: i,
      color: color.hex,
      hsl: `h:${Math.round(color.h)}, s:${Math.round(color.s)}%, l:${Math.round(color.l)}%`
    });
  }
  
  console.log(`Canvas contains ${cells.length} cells with colors:`, cells);
}

/**
 * Update the color swatches based on the current colors in the gradient
 */
function updateSwatches() {
  if (!window.meshGradient) return;
  
  // Get the swatches container
  const swatchContainer = document.getElementById('colorSwatches');
  if (!swatchContainer) return;
  
  // Get all unique colors from the gradient
  const uniqueColors = [];
  
  // Check for colors in meshGradient.currentColors
  if (meshGradient.currentColors && meshGradient.currentColors.length > 0) {
    // Extract unique hex colors
    meshGradient.currentColors.forEach(color => {
      if (color && color.hex && !uniqueColors.includes(color.hex)) {
        uniqueColors.push(color.hex);
      }
    });
  }
  
  // If no colors found, try getting them from each cell directly
  if (uniqueColors.length === 0) {
    const cellCount = meshGradient.cellCount || 0;
    for (let i = 0; i < cellCount; i++) {
      const color = meshGradient.getCellColor(i);
      if (color && color.hex && !uniqueColors.includes(color.hex)) {
        uniqueColors.push(color.hex);
      }
    }
  }
  
  // Clear existing swatches
  swatchContainer.innerHTML = '';
  
  // Create swatches for each unique color
  uniqueColors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.style.width = '40px';
    swatch.style.height = '40px';
    swatch.style.backgroundColor = color;
    swatch.style.border = '1px solid #ccc';
    swatch.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    swatch.style.borderRadius = '4px';
    swatchContainer.appendChild(swatch);
  });
}

// Listen for color changes via custom event
document.addEventListener('meshColorsChanged', () => {
  updateSwatches();
});

// Initialize on page load
window.addEventListener('load', () => {
  // Initial swatch update
  setTimeout(updateSwatches, 500);
  
  // Update swatches whenever gradient is generated
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      // Allow time for gradient to render
      setTimeout(updateSwatches, 100);
    });
  }
  
  // Update after color adjustment controls are used
  const adjustmentButtons = document.querySelectorAll('#hueIncrease, #hueDecrease, #satIncrease, #satDecrease, #lightIncrease, #lightDecrease');
  adjustmentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(updateSwatches, 100);
    });
  });
  
  // Update after theme or harmony changes
  document.getElementById('colorTheme')?.addEventListener('change', () => setTimeout(updateSwatches, 100));
  document.getElementById('colorHarmony')?.addEventListener('change', () => setTimeout(updateSwatches, 100));
});

// ...existing code...