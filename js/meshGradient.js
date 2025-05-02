/**
 * MeshGradient simple loader
 * This just initializes the MeshGradient class once everything is loaded
 */

document.addEventListener('DOMContentLoaded', () => {
    // No need for dynamic loading - all scripts are included in HTML
    console.log('MeshGradient initialization complete');
    
    // Add a global utility for color access
    window.getMeshGradientColors = function() {
        if (!window.meshGradient) return [];
        
        // Use the new getAllColors method if available
        if (typeof window.meshGradient.getAllColors === 'function') {
            return window.meshGradient.getAllColors();
        }
        
        // Fallback to data structure navigation
        if (window.meshGradient.data && 
            window.meshGradient.data.colorPalette && 
            window.meshGradient.data.colorPalette.lastGeneratedColors) {
            return window.meshGradient.data.colorPalette.lastGeneratedColors;
        }
        
        return [];
    };
    
    // Patch the setEditMode function to prevent color regeneration
    function patchSetEditMode() {
        if (!window.meshGradient) return;
        
        // Store original colors - do this once on initial load
        let originalColors = null;
        if (typeof window.meshGradient.getAllColors === 'function') {
            originalColors = window.meshGradient.getAllColors();
            console.log('Stored initial color state for edit mode toggle protection');
        }
        
        const originalSetEditMode = window.meshGradient.setEditMode;
        if (typeof originalSetEditMode === 'function') {
            window.meshGradient.setEditMode = function(enabled) {
                // Get latest colors before toggling
                let currentColors = null;
                if (typeof this.getAllColors === 'function') {
                    currentColors = this.getAllColors();
                    // Also update our stored original colors
                    originalColors = currentColors;
                    console.log('Captured current colors before edit mode change');
                }
                
                // Call original method with flag to prevent regeneration
                const result = originalSetEditMode.call(this, enabled, true); // <-- add preserveState flag
                
                // Wait a short moment to ensure any color changes have happened
                setTimeout(() => {
                    if (originalColors && originalColors.length > 0) {
                        // Force color restoration from our stored copy
                        console.log('Restoring colors after edit mode toggle');
                        try {
                            // Try different methods to restore colors
                            if (typeof this.restoreColors === 'function') {
                                this.restoreColors(originalColors);
                            } 
                            else if (typeof this.setCellColors === 'function') {
                                this.setCellColors(originalColors);
                            }
                            else {
                                // Individual cell color restoration
                                if (typeof this.setCellColor === 'function') {
                                    originalColors.forEach((color, index) => {
                                        // Last param true means don't regenerate
                                        this.setCellColor(index, color, false, true);
                                    });
                                }
                            }
                            
                            // Force redraw without color regeneration
                            if (typeof this.render === 'function') {
                                this.render(null, true); // preserveColors=true
                            }
                        } catch (e) {
                            console.error('Error restoring colors:', e);
                        }
                    }
                }, 10);
                
                return result;
            };
            console.log('Patched setEditMode with enhanced color protection');
        }
    }
    
    // Initialize color tracking and patches when meshGradient is ready
    let initAttempts = 0;
    const maxAttempts = 10;
    
    function initColorTracking() {
        if (initAttempts >= maxAttempts) return;
        
        if (window.meshGradient) {
            // Apply patched setEditMode
            patchSetEditMode();
            
            // Original color tracking initialization
            if (typeof window.meshGradient.initializeColorTracking === 'function') {
                window.meshGradient.initializeColorTracking();
                console.log("Color tracking initialized successfully");
            }
        } else {
            initAttempts++;
            setTimeout(initColorTracking, 100);
        }
    }
    
    // Start initialization process
    setTimeout(initColorTracking, 300);
});
