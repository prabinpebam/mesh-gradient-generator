/**
 * Bypass script - Simplified version
 */
(function() {
    console.log("BYPASS: Installing one-time event handler setup");
    
    // Flag to ensure we only install once
    let installed = false;
    
    // Handler for canvas
    function setupCanvas(canvas) {
        if (!canvas || canvas._bypassInstalled) return;
        console.log("BYPASS: Setting up canvas", canvas);
        
        // Mark as installed to prevent infinite loops
        canvas._bypassInstalled = true;
        
        // Create the gradient
        setTimeout(() => {
            if (window.meshGradient) {
                console.log("BYPASS: Initializing gradient");
                try {
                    // Generate a new gradient
                    meshGradient.generate();
                } catch (err) {
                    console.error("BYPASS: Error initializing gradient", err);
                }
            }
        }, 200);
    }
    
    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        if (installed) return;
        installed = true;
        
        console.log("BYPASS: DOM loaded");
        const canvas = document.getElementById('gradientCanvas');
        if (canvas) {
            setupCanvas(canvas);
        }
        
        // Also watch for any new canvas elements
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes) {
                    mutation.addedNodes.forEach(node => {
                        if (node.id === 'gradientCanvas') {
                            setupCanvas(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
        
        console.log("BYPASS: Initialization complete");
    });
})();
