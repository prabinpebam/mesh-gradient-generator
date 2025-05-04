class SwatchManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.swatchContainer = document.getElementById('colorSwatches');
  }

  updateSwatches(colors) {
    if (!this.swatchContainer) return;

    // Clear existing swatches
    this.swatchContainer.innerHTML = '';

    // Create swatches for each unique color
    colors.forEach(color => {
      const swatch = document.createElement('div');
      swatch.style.width = '40px';
      swatch.style.height = '40px';
      swatch.style.backgroundColor = color.hex;
      swatch.style.border = '1px solid #ccc';
      swatch.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      swatch.style.borderRadius = '4px';
      swatch.style.cursor = 'pointer';
      swatch.addEventListener('click', () => this.handleSwatchClick(color.hex));
      this.swatchContainer.appendChild(swatch);
    });
  }

  handleSwatchClick(hexColor) {
    try {
      const meshGradient = this.getMeshGradient();
      
      // If in edit mode and a cell is selected, apply to that cell
      if (document.getElementById('editModeToggle')?.checked && 
          meshGradient.hoverCellIndex >= 0) {
        meshGradient.setCellColor(meshGradient.hoverCellIndex, hexColor);
        
        this.eventBus.publish('cellColorChanged', {
          cellIndex: meshGradient.hoverCellIndex,
          color: hexColor
        });
      } else {
        // Otherwise use as base color for new gradient
        if (typeof meshGradient.setBaseColor === 'function') {
          meshGradient.setBaseColor(hexColor);
          meshGradient.generate();
          
          this.eventBus.publish('baseColorChanged', {
            color: hexColor
          });
        }
      }
    } catch (error) {
      console.error('Error handling swatch click:', error);
    }
  }

  getMeshGradient() {
    return window.meshGradient;
  }
}

export default SwatchManager;