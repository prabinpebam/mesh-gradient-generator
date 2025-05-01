/**
 * This script provides a safety check to ensure critical methods exist
 * on the MeshGradient instance.
 */
(function() {
    console.log("UI-CHECK: Starting safety checks...");
    
    // Ensure window.meshGradient exists to prevent errors
    if (!window.meshGradient) {
        window.meshGradient = {};
        console.log("UI-CHECK: Created empty meshGradient object");
    }
    
    // Create the safe implementation that will be used if needed
    const safeImplementation = {
        isPointInControl: function(x, y, control) {
            console.log("Using backup isPointInControl", {x, y, control});
            
            try {
                // Safety checks
                if (!this.hoverControls) return false;
                
                const btn = this.hoverControls[control];
                if (!btn) return false;
                
                // Check if point is within circular button
                const dx = x - btn.x;
                const dy = y - btn.y;
                return (dx * dx + dy * dy) <= (btn.radius * btn.radius);
            } catch (err) {
                console.error("UI-CHECK: Error in isPointInControl", err);
                return false;
            }
        },
        
        updateButtonHover: function(x, y) {
            console.log("Using backup updateButtonHover", {x, y});
            
            try {
                if (!this.hoverControls) return;
                
                // Simple implementation
                this.canvas.style.cursor = 'default';
            } catch (err) {
                console.error("UI-CHECK: Error in updateButtonHover", err);
            }
        }
    };
    
    // Add safe methods to window.meshGradient immediately
    if (typeof window.meshGradient.isPointInControl !== 'function') {
        console.log("UI-CHECK: Adding isPointInControl immediately");
        window.meshGradient.isPointInControl = safeImplementation.isPointInControl;
    }
    
    if (typeof window.meshGradient.updateButtonHover !== 'function') {
        console.log("UI-CHECK: Adding updateButtonHover immediately");
        window.meshGradient.updateButtonHover = safeImplementation.updateButtonHover;
    }
    
    // Wait for document load
    document.addEventListener('DOMContentLoaded', function() {
        // Check at various intervals to catch the object when it becomes available
        setTimeout(checkMeshGradient, 10);
        setTimeout(checkMeshGradient, 100);
        setTimeout(checkMeshGradient, 500);
    });
    
    function checkMeshGradient() {
        console.log("UI-CHECK: Checking meshGradient state");
        
        try {
            // Check if the real meshGradient has been created by the main script
            if (window.meshGradient && window.meshGradient.renderer) {
                console.log("UI-CHECK: Full meshGradient object detected");
                
                // Only update the functions if they don't already contain our implementations
                if (typeof window.meshGradient.isPointInControl !== 'function' || 
                    window.meshGradient.isPointInControl.toString().includes("backup")) {
                    console.log("UI-CHECK: Updating isPointInControl with proper implementation");
                    
                    // Use the real implementation if it exists in the renderer
                    if (window.meshGradient.renderer && 
                        typeof window.meshGradient.renderer.isPointInControl === 'function') {
                        window.meshGradient.isPointInControl = function(x, y, control) {
                            return this.renderer.isPointInControl(x, y, control, this.hoverControls);
                        };
                    } else {
                        window.meshGradient.isPointInControl = safeImplementation.isPointInControl;
                    }
                } else {
                    console.log("UI-CHECK: isPointInControl already exists");
                }
                
                // Perform similar check for updateButtonHover
                if (typeof window.meshGradient.updateButtonHover !== 'function') {
                    console.log("UI-CHECK: Adding updateButtonHover method");
                    window.meshGradient.updateButtonHover = safeImplementation.updateButtonHover;
                }
            } else {
                console.log("UI-CHECK: meshGradient not fully initialized yet");
            }
        } catch (err) {
            console.error("UI-CHECK: Error during method check:", err);
            // No need to throw - just log the error
        }
        
        console.log("UI-CHECK: Check completed");
    }
    
    console.log("UI-CHECK: Setup complete");
})();
