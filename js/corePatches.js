/**
 * Core patches for MeshGradient internals
 * This file applies patches to fix various behaviors in the MeshGradient core
 * 
 * Note: Most patches have been consolidated into their respective core files.
 * This file is kept for backwards compatibility and to handle edge cases.
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
        
        // Run final initialization checks
        finalizeInitialization();
    }
    
    function finalizeInitialization() {
        // Ensure color tracking is initialized
        if (window.meshGradient && !meshGradient._colorTrackingInitialized && 
            typeof meshGradient.initializeColorTracking === 'function') {
            meshGradient.initializeColorTracking();
            console.log("Color tracking initialized");
        }
        
        // Ensure animation is properly initialized
        if (window.meshGradient && meshGradient.animation && !meshGradient.animation.initialized) {
            if (typeof meshGradient.initAnimationProperties === 'function') {
                console.log("[ANIMATION] Auto-initializing animation properties");
                meshGradient.initAnimationProperties();
            }
        }
        
        console.log("Core initialization checks completed");
    }
    
    // Start applying fixes
    setTimeout(applyCoreFixes, 300);
});
