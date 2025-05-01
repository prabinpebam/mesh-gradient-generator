/**
 * Simplified direct fix 
 */
(function() {
    console.log("DIRECT-FIX: Starting application");
    
    // Flag to prevent multiple initializations
    let initialized = false;
    
    // Create a very minimal global meshGradient object if one doesn't exist
    function ensureMeshGradient() {
        if (!window.meshGradient) {
            console.log("DIRECT-FIX: Creating global meshGradient placeholder");
            window.meshGradient = {
                isPointInControl: function() { return false; },
                generate: function() {}
            };
        }
    }
    
    // Initialize the actual gradient when possible
    function initializeGradient() {
        if (initialized) return;
        
        console.log("DIRECT-FIX: Initializing gradient");
        ensureMeshGradient();
        
        const canvas = document.getElementById('gradientCanvas');
        if (!canvas) {
            console.log("DIRECT-FIX: Canvas not found, trying again later");
            setTimeout(initializeGradient, 100);
            return;
        }
        
        try {
            // Ensure proper size
            if (canvas.width === 0 || canvas.height === 0) {
                canvas.width = 800;
                canvas.height = 600;
            }
            
            // Clear canvas and show something
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Add a simple gradient to show something is working
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, 'purple');
                gradient.addColorStop(0.5, 'cyan');
                gradient.addColorStop(1, 'lime');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                console.log("DIRECT-FIX: Displayed temporary gradient");
            }
            
            initialized = true;
        } catch (err) {
            console.error("DIRECT-FIX: Error initializing", err);
        }
    }
    
    ensureMeshGradient();
    
    // Initialize when the DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeGradient);
    } else {
        initializeGradient();
    }
    
    // Also try again after a delay
    setTimeout(initializeGradient, 500);
    
    console.log("DIRECT-FIX: Setup complete");
})();
