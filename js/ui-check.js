/**
 * UI Safety Check - Ensures meshGradient is available with required methods
 * This runs very early in the page lifecycle to provide fallbacks
 */
(function() {
  console.log("UI-CHECK: Starting safety checks...");
  
  // Create empty meshGradient if it doesn't exist yet to prevent errors
  if (!window.meshGradient) {
    window.meshGradient = {};
    console.log("UI-CHECK: Created empty meshGradient object");
  }
  
  // Function to check meshGradient state and add missing methods
  function checkMeshGradientState() {
    if (typeof window.meshGradient !== 'object') return;
    
    console.log("UI-CHECK: Checking meshGradient state");
    
    // Check if it's a full object or just a placeholder
    const isFullObject = window.meshGradient.data && 
                      window.meshGradient.renderer &&
                      typeof window.meshGradient.render === 'function';
    
    if (isFullObject) {
      console.log("UI-CHECK: Full meshGradient object detected");
    }
    
    // Ensure critical methods exist
    if (!window.meshGradient.isPointInControl) {
      console.log("UI-CHECK: Adding isPointInControl");
      window.meshGradient.isPointInControl = function(x, y, control) {
        if (!this.hoverControls) return false;
        const btn = this.hoverControls[control];
        if (!btn) return false;
        const dx = x - btn.x;
        const dy = y - btn.y;
        return (dx * dx + dy * dy) <= (btn.radius * btn.radius);
      };
    } else {
      console.log("UI-CHECK: isPointInControl already exists");
    }
    
    // Ensure updateButtonHover exists
    if (!window.meshGradient.updateButtonHover) {
      console.log("UI-CHECK: Adding updateButtonHover");
      window.meshGradient.updateButtonHover = function(x, y) {
        if (!this.renderer || !this.hoverControls) return { changed: false };
        return { changed: false, cursor: 'default' };
      };
    }
    
    // Ensure getAllColors exists
    if (!window.meshGradient.getAllColors) {
      console.log("UI-CHECK: Adding getAllColors");
      window.meshGradient.getAllColors = function() {
        // Default implementation
        if (this.data && this.data.currentColors) {
          return this.data.currentColors;
        }
        return [];
      };
    }
    
    console.log("UI-CHECK: Check completed");
  }
  
  // Run immediately
  checkMeshGradientState();
  
  // Add isPointInControl immediately in case needed
  if (!window.meshGradient.isPointInControl) {
    console.log("UI-CHECK: Adding isPointInControl immediately");
    window.meshGradient.isPointInControl = function(x, y, control) {
      return false; // Safe default
    };
  }
  
  // Add updateButtonHover immediately
  if (!window.meshGradient.updateButtonHover) {
    console.log("UI-CHECK: Adding updateButtonHover immediately");
    window.meshGradient.updateButtonHover = function() {
      return { changed: false };
    };
  }
  
  // Schedule repeated checks
  const maxChecks = 5;
  let checkCount = 0;
  
  function runScheduledCheck() {
    checkCount++;
    if (checkCount <= maxChecks) {
      checkMeshGradientState();
      setTimeout(runScheduledCheck, 500);
    }
  }
  
  // Start scheduled checks
  setTimeout(runScheduledCheck, 500);
  
  console.log("UI-CHECK: Setup complete");
})();
