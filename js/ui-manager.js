/**
 * Simple UI Manager for Mesh Gradient Generator
 */

// Use window-scoped objects and IIFE to prevent namespace collisions
(function() {
  // Create window.uiTools if it doesn't exist
  if (!window.uiTools) {
    window.uiTools = {};
  }

  // Simple event system
  window.uiTools.eventBus = {
    events: {},
    
    subscribe: function(eventName, callback) {
      if (!this.events[eventName]) {
        this.events[eventName] = [];
      }
      
      this.events[eventName].push(callback);
      return () => this.unsubscribe(eventName, callback);
    },
    
    unsubscribe: function(eventName, callback) {
      if (!this.events[eventName]) return;
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    },
    
    publish: function(eventName, data) {
      if (!this.events[eventName]) return;
      this.events[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in event handler for ${eventName}:`, err);
        }
      });
    }
  };

  // Simple UI manager
  window.uiTools.manager = {
    initialized: false,
    
    initialize: function() {
      if (this.initialized) return;
      
      console.log('Simple UI Manager: Initializing');
      
      // Check for meshGradient
      if (!window.meshGradient) {
        console.warn('Simple UI Manager: MeshGradient not available');
        return;
      }
      
      // Set up canvas resize handler
      const canvasWidthInput = document.getElementById('canvasWidth');
      const canvasHeightInput = document.getElementById('canvasHeight');
      const resizeCanvasBtn = document.getElementById('resizeCanvas');
      
      if (resizeCanvasBtn) {
        resizeCanvasBtn.addEventListener('click', () => {
          const width = parseInt(canvasWidthInput?.value || '800');
          const height = parseInt(canvasHeightInput?.value || '600');
          
          if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            alert('Please enter valid dimensions');
            return;
          }
          
          try {
            const constraints = meshGradient.resizeCanvas(width, height);
            meshGradient.render();
            console.log(`Canvas resized to ${width}x${height}`);
            
            // Update UI with new constraints
            if (constraints) {
              const blurAmountSlider = document.getElementById('blurAmount');
              const blurAmountValue = document.getElementById('blurAmountValue');
              const maxBlurValue = document.getElementById('maxBlurValue');
              
              if (blurAmountSlider && constraints.maxBlurAmount) {
                blurAmountSlider.max = constraints.maxBlurAmount;
              }
              
              if (blurAmountValue && constraints.currentBlurAmount) {
                blurAmountValue.textContent = constraints.currentBlurAmount;
              }
              
              if (maxBlurValue && constraints.maxBlurAmount) {
                maxBlurValue.textContent = constraints.maxBlurAmount;
              }
            }
          } catch (err) {
            console.error('Error resizing canvas:', err);
          }
        });
      }
      
      // Set up export handler
      const exportPngBtn = document.getElementById('exportPngBtn');
      if (exportPngBtn) {
        exportPngBtn.addEventListener('click', () => {
          try {
            if (typeof meshGradient.exportAsPNG === 'function') {
              meshGradient.exportAsPNG();
            }
          } catch (err) {
            console.error('Error exporting PNG:', err);
          }
        });
      }
      
      this.initialized = true;
      console.log('Simple UI Manager: Initialization complete');
    }
  };

  // Initialize when the DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for meshGradient to be available
    setTimeout(() => {
      window.uiTools.manager.initialize();
    }, 500);
  });
})();
