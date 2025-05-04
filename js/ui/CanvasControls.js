/**
 * UI Component for canvas size and export controls
 */
import UIComponent from './UIComponent.js';

export default class CanvasControls extends UIComponent {
  constructor(config) {
    super(config);
  }
  
  _findElements() {
    this.elements = {
      canvasWidthInput: this.getElementById('canvasWidth'),
      canvasHeightInput: this.getElementById('canvasHeight'),
      resizeCanvasBtn: this.getElementById('resizeCanvas'),
      exportPngBtn: this.getElementById('exportPngBtn')
    };
  }
  
  _bindEvents() {
    // Resize canvas when inputs change
    if (this.elements.canvasWidthInput) {
      this.elements.canvasWidthInput.addEventListener('change', () => this.applyCanvasResize());
    }
    
    if (this.elements.canvasHeightInput) {
      this.elements.canvasHeightInput.addEventListener('change', () => this.applyCanvasResize());
    }
    
    // Resize canvas when button is clicked
    if (this.elements.resizeCanvasBtn) {
      this.elements.resizeCanvasBtn.addEventListener('click', () => this.applyCanvasResize());
    }
    
    // Export as PNG when button is clicked
    if (this.elements.exportPngBtn) {
      this.elements.exportPngBtn.addEventListener('click', () => this.exportAsPNG());
    }
  }
  
  /**
   * Apply canvas resize from input values
   */
  applyCanvasResize() {
    const { canvasWidthInput, canvasHeightInput } = this.elements;
    
    if (!canvasWidthInput || !canvasHeightInput) {
      console.error('Canvas size inputs not found');
      return;
    }
    
    const width = parseInt(canvasWidthInput.value);
    const height = parseInt(canvasHeightInput.value);
    
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      alert('Please enter valid dimensions');
      return;
    }
    
    try {
      const meshGradient = this.getMeshGradient();
      const constraints = meshGradient.resizeCanvas(width, height);
      
      // Publish event with new constraints
      this.eventBus.publish('canvasResized', {
        width,
        height,
        constraints
      });
      
      // Re-render
      if (meshGradient.render) {
        meshGradient.render();
      }
      
      console.log(`Canvas resized to ${width}x${height}`);
    } catch (error) {
      console.error('Error resizing canvas:', error);
    }
  }
  
  /**
   * Export canvas as PNG
   */
  exportAsPNG() {
    try {
      const meshGradient = this.getMeshGradient();
      
      // Get edit mode state before export
      const wasEditMode = meshGradient.editMode;
      
      // Disable edit mode for export if active
      if (wasEditMode) {
        meshGradient.setEditMode(false);
        meshGradient.render();
      }
      
      // Export to PNG
      if (typeof meshGradient.exportAsPNG === 'function') {
        meshGradient.exportAsPNG();
      } else {
        // Fallback export method
        const link = document.createElement('a');
        link.download = 'mesh-gradient.png';
        link.href = meshGradient.canvas.toDataURL('image/png');
        link.click();
      }
      
      // Restore edit mode if it was active
      if (wasEditMode) {
        meshGradient.setEditMode(true);
      }
      
      console.log('Exported gradient as PNG');
    } catch (error) {
      console.error('Error exporting as PNG:', error);
    }
  }
}
