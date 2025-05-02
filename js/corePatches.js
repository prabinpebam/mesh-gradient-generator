/**
 * Core patches for MeshGradient internals
 * This file applies patches to fix various behaviors in the MeshGradient core
 */
document.addEventListener('DOMContentLoaded', () => {
    // Wait for meshGradient to be available
    let attempts = 0;
    const maxAttempts = 10;
    
    function applyCoreFixes() {
        if (attempts >= maxAttempts) {
            console.warn('Failed to apply core MeshGradient fixes - too many attempts');
            return;
        }
        
        if (!window.meshGradient) {
            attempts++;
            setTimeout(applyCoreFixes, 100);
            return;
        }
        
        console.log('Applying MeshGradient core fixes...');
        
        // Fix 1: Patch the internal setEditMode method in MeshGradientCore
        try {
            // Get MeshGradientCore prototype if possible
            const core = Object.getPrototypeOf(meshGradient);
            if (core && typeof core.setEditMode === 'function') {
                const originalCoreSetEditMode = core.setEditMode;
                core.setEditMode = function(enabled, preserveState) {
                    // Store colors before changing modes
                    const oldColors = this.getAllColors ? this.getAllColors() : [];
                    
                    // Call the original method
                    const result = originalCoreSetEditMode.call(this, enabled);
                    
                    // If preserveState flag is set, restore colors
                    if (preserveState && oldColors.length > 0) {
                        console.log('Core preserving colors during edit mode change');
                        if (this.restoreColors) {
                            this.restoreColors(oldColors);
                        } else {
                            // Manual restoration
                            oldColors.forEach((color, idx) => {
                                if (this.setCellColor) {
                                    this.setCellColor(idx, color, false, true);
                                }
                            });
                        }
                    }
                    
                    return result;
                };
                console.log('Successfully patched MeshGradientCore.setEditMode');
            }
        } catch (e) {
            console.warn('Failed to patch MeshGradientCore.setEditMode:', e);
        }
        
        // Fix 2: Ensure render doesn't regenerate colors by default
        try {
            if (typeof meshGradient.render === 'function') {
                const originalRender = meshGradient.render;
                meshGradient.render = function(force, preserveColors) {
                    // Default preserveColors to true if not specified
                    if (preserveColors === undefined) preserveColors = true;
                    return originalRender.call(this, force, preserveColors);
                };
                console.log('Successfully patched MeshGradient.render with preserveColors default');
            }
        } catch (e) {
            console.warn('Failed to patch MeshGradient.render:', e);
        }
    }
    
    // Start applying fixes
    setTimeout(applyCoreFixes, 300);
});
