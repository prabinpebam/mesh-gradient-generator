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
    
    // Initialize color tracking when meshGradient is ready
    let initAttempts = 0;
    const maxAttempts = 10;
    
    function initColorTracking() {
        if (initAttempts >= maxAttempts) return;
        
        if (window.meshGradient && 
            typeof window.meshGradient.initializeColorTracking === 'function') {
            window.meshGradient.initializeColorTracking();
            console.log("Color tracking initialized successfully");
        } else {
            initAttempts++;
            setTimeout(initColorTracking, 100);
        }
    }
    
    // Start initialization process
    setTimeout(initColorTracking, 300);
});
