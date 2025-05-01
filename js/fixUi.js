/**
 * UI Fixer - Direct patch for problematic ui.js code
 */
(function() {
    console.log("UI Fixer: Starting initialization...");
    
    // Make sure we only run once
    if (window._uiFixerInitialized) return;
    window._uiFixerInitialized = true;
    
    // Fix for the specific line 347 error
    const fixSpecificError = function() {
        try {
            if (!window.meshGradient) {
                setTimeout(fixSpecificError, 100);
                return;
            }
            
            // Find all canvas mouseup events and replace them
            const canvas = document.getElementById('gradientCanvas');
            if (!canvas) {
                setTimeout(fixSpecificError, 100);
                return;
            }
            
            console.log("UI Fixer: Found canvas, fixing event handlers");
            
            // Clone the canvas to remove all existing event handlers
            const clone = canvas.cloneNode(true);
            canvas.parentNode.replaceChild(clone, canvas);
            const newCanvas = document.getElementById('gradientCanvas');
            
            // Add our safe version of the handler
            newCanvas.addEventListener('mouseup', function(e) {
                const rect = newCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                if (!window.meshGradient) return;
                
                // Use the safe version that's always available
                if (window.safeIsPointInControl(x, y, 'colorBtn')) {
                    // Color button was clicked
                    const colorPicker = document.getElementById('cellColorPicker');
                    if (colorPicker && meshGradient.hoverCellIndex >= 0) {
                        const currentColor = meshGradient.getCellColor(meshGradient.hoverCellIndex);
                        colorPicker.value = currentColor.hex;
                        colorPicker.dataset.cellIndex = meshGradient.hoverCellIndex;
                        colorPicker.click();
                    }
                } else if (window.safeIsPointInControl(x, y, 'lockBtn')) {
                    // Lock button was clicked
                    if (meshGradient.hoverCellIndex >= 0) {
                        const isLocked = meshGradient.isCellColorLocked(meshGradient.hoverCellIndex);
                        if (isLocked) {
                            meshGradient.unlockCellColor(meshGradient.hoverCellIndex);
                        } else {
                            meshGradient.lockCellColor(meshGradient.hoverCellIndex);
                        }
                    }
                } else if (meshGradient.dragSiteIndex !== -1) {
                    // End drag operation
                    meshGradient.endDrag();
                }
            });
            
            console.log("UI Fixer: Added safe event handler");
        } catch (e) {
            console.error("UI Fixer: Error fixing UI", e);
        }
    };
    
    // Wait for DOM content loaded to begin fixes
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", fixSpecificError);
    } else {
        // DOM already loaded, start immediately
        fixSpecificError();
    }
    
    console.log("UI Fixer: Initialization complete");
})();
