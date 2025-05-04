/**
 * UI Component for color-related controls
 */
import UIComponent from './UIComponent.js';

export default class ColorControls extends UIComponent {
  constructor(config) {
    super(config);
  }
  
  _findElements() {
    this.elements = {
      generateBtn: this.getElementById('generateBtn'),
      cellCountSlider: this.getElementById('cellCount'),
      cellCountValue: this.getElementById('cellCountValue'),
      blurAmountSlider: this.getElementById('blurAmount'),
      blurAmountValue: this.getElementById('blurAmountValue'),
      colorHarmonySelect: this.getElementById('colorHarmony'),
      colorThemeSelect: this.getElementById('colorTheme'),
      hueDecrease: this.getElementById('hueDecrease'),
      hueIncrease: this.getElementById('hueIncrease'),
      satDecrease: this.getElementById('satDecrease'),
      satIncrease: this.getElementById('satIncrease'),
      lightDecrease: this.getElementById('lightDecrease'),
      lightIncrease: this.getElementById('lightIncrease'),
      colorPicker: this.getElementById('cellColorPicker')
    };
    
    // Hover cell state
    this.selectedCellIndex = -1;
    this.colorPickerPosition = { x: 0, y: 0 };
  }
  
  _bindEvents() {
    // Generate button
    if (this.elements.generateBtn) {
      this.elements.generateBtn.addEventListener('click', () => this.generateGradient());
    }
    
    // Cell count slider
    if (this.elements.cellCountSlider && this.elements.cellCountValue) {
      this.elements.cellCountSlider.addEventListener('input', (e) => {
        const count = parseInt(e.target.value);
        this.elements.cellCountValue.textContent = count;
        this.updateCellCount(count);
      });
    }
    
    // Blur amount slider
    if (this.elements.blurAmountSlider && this.elements.blurAmountValue) {
      this.elements.blurAmountSlider.addEventListener('input', (e) => {
        const amount = parseInt(e.target.value);
        this.elements.blurAmountValue.textContent = amount;
        this.updateBlurAmount(amount);
      });
    }
    
    // Color harmony select
    if (this.elements.colorHarmonySelect) {
      this.elements.colorHarmonySelect.addEventListener('change', (e) => {
        this.updateColorHarmony(e.target.value);
      });
    }
    
    // Color theme select
    if (this.elements.colorThemeSelect) {
      this.elements.colorThemeSelect.addEventListener('change', (e) => {
        this.updateColorTheme(e.target.value);
      });
    }
    
    // HSL adjustment buttons
    this._bindColorAdjustmentButtons();
    
    // Cell color picker
    this._bindColorPickerEvents();
    
    // Listen for canvas click events for color control interactions
    this._bindCanvasInteractions();
    
    // Subscribe to events
    this._subscribeToEvents();
  }
  
  /**
   * Bind HSL adjustment buttons
   */
  _bindColorAdjustmentButtons() {
    const adjustmentMap = [
      { elem: 'hueDecrease', type: 'hue', value: -10 },
      { elem: 'hueIncrease', type: 'hue', value: 10 },
      { elem: 'satDecrease', type: 'saturation', value: -5 },
      { elem: 'satIncrease', type: 'saturation', value: 5 },
      { elem: 'lightDecrease', type: 'lightness', value: -5 },
      { elem: 'lightIncrease', type: 'lightness', value: 5 }
    ];
    
    adjustmentMap.forEach(({ elem, type, value }) => {
      const button = this.elements[elem];
      if (button) {
        button.addEventListener('click', () => {
          const adjustment = {};
          adjustment[type] = value;
          this.adjustColors(adjustment);
        });
      }
    });
  }
  
  /**
   * Bind color picker events
   */
  _bindColorPickerEvents() {
    const colorPicker = this.elements.colorPicker;
    if (!colorPicker) return;
    
    // Prevent click from bubbling up
    colorPicker.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Live preview during color selection
    colorPicker.addEventListener('input', (e) => {
      if (this.selectedCellIndex >= 0) {
        try {
          const meshGradient = this.getMeshGradient();
          const isLocked = meshGradient.isCellColorLocked(this.selectedCellIndex);
          // Apply color but preserve color locks
          meshGradient.setCellColor(this.selectedCellIndex, e.target.value, isLocked);
        } catch (error) {
          console.error('Error applying cell color:', error);
        }
      }
    });
    
    // Final color selection
    colorPicker.addEventListener('change', (e) => {
      if (this.selectedCellIndex >= 0) {
        try {
          const meshGradient = this.getMeshGradient();
          const isLocked = meshGradient.isCellColorLocked(this.selectedCellIndex);
          
          // Apply final color
          meshGradient.setCellColor(this.selectedCellIndex, e.target.value, isLocked);
          
          // Publish event
          this.eventBus.publish('cellColorChanged', {
            cellIndex: this.selectedCellIndex,
            color: e.target.value,
            locked: isLocked
          });
          
          this.selectedCellIndex = -1; // Reset selection
        } catch (error) {
          console.error('Error applying cell color:', error);
        }
      }
    });
  }
  
  /**
   * Bind canvas interactions for cell color controls
   */
  _bindCanvasInteractions() {
    // Find the canvas element
    const canvas = document.getElementById('gradientCanvas');
    if (!canvas) return;
    
    canvas.addEventListener('click', (e) => {
      try {
        const meshGradient = this.getMeshGradient();
        if (!meshGradient) return;
        
        // Check if distortions are active
        const hasActiveDistortion = 
          meshGradient.data?.distortions?.hasActive?.() || false;
        if (hasActiveDistortion) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (meshGradient.editMode) {
          // In edit mode, check for button interactions
          if (meshGradient.hoveredButton && meshGradient.hoveredCellIndex >= 0) {
            const cellIndex = meshGradient.hoveredCellIndex;
            
            if (meshGradient.hoveredButton === 'colorBtn') {
              this._openColorPickerForCell(cellIndex, e.clientX, e.clientY);
            } else if (meshGradient.hoveredButton === 'lockBtn') {
              this._toggleCellColorLock(cellIndex);
            }
          }
        } else {
          // In hover mode
          if (meshGradient.hoverControls) {
            if (meshGradient.isPointInControl(x, y, 'colorBtn')) {
              const cellIndex = meshGradient.hoverControls.cell;
              this._openColorPickerForCell(cellIndex, e.clientX, e.clientY);
            } else if (meshGradient.isPointInControl(x, y, 'lockBtn')) {
              const cellIndex = meshGradient.hoverControls.cell;
              this._toggleCellColorLock(cellIndex);
            }
          }
        }
      } catch (error) {
        console.error('Error handling canvas click:', error);
      }
    });
  }
  
  /**
   * Open color picker for a specific cell
   * @param {number} cellIndex - Cell index
   * @param {number} x - Mouse X position
   * @param {number} y - Mouse Y position
   */
  _openColorPickerForCell(cellIndex, x, y) {
    try {
      const meshGradient = this.getMeshGradient();
      const colorPicker = this.elements.colorPicker;
      if (!colorPicker) return;
      
      // Store selected cell index
      this.selectedCellIndex = cellIndex;
      
      // Get current cell color
      const currentColor = meshGradient.getCellColor(cellIndex);
      colorPicker.value = currentColor.hex;
      
      // Store position for color picker
      this.colorPickerPosition = { x, y };
      
      // Set custom properties for positioning
      document.documentElement.style.setProperty('--color-picker-top', `${y}px`);
      document.documentElement.style.setProperty('--color-picker-left', `${x}px`);
      
      // Open the color picker
      colorPicker.click();
    } catch (error) {
      console.error('Error opening color picker:', error);
    }
  }
  
  /**
   * Toggle lock state for a cell's color
   * @param {number} cellIndex - Cell index
   */
  _toggleCellColorLock(cellIndex) {
    try {
      const meshGradient = this.getMeshGradient();
      const isLocked = meshGradient.isCellColorLocked(cellIndex);
      
      if (isLocked) {
        meshGradient.unlockCellColor(cellIndex);
        this.eventBus.publish('cellColorUnlocked', { cellIndex });
      } else {
        meshGradient.lockCellColor(cellIndex);
        this.eventBus.publish('cellColorLocked', { cellIndex });
      }
    } catch (error) {
      console.error('Error toggling cell color lock:', error);
    }
  }
  
  /**
   * Subscribe to events
   */
  _subscribeToEvents() {
    // Listen for constraint changes
    this.subscribe('canvasResized', (data) => {
      if (data && data.constraints) {
        this._updateConstraints(data.constraints);
      }
    });
  }
  
  /**
   * Update UI with new constraints
   * @param {Object} constraints - Constraint values
   */
  _updateConstraints(constraints) {
    // Update blur slider limits
    if (constraints.maxBlurAmount !== undefined && this.elements.blurAmountSlider) {
      this.elements.blurAmountSlider.max = constraints.maxBlurAmount;
      
      if (this.getElementById('maxBlurValue')) {
        this.getElementById('maxBlurValue').textContent = constraints.maxBlurAmount;
      }
    }
    
    // Update current blur value display
    if (constraints.currentBlurAmount !== undefined && this.elements.blurAmountValue) {
      this.elements.blurAmountSlider.value = constraints.currentBlurAmount;
      this.elements.blurAmountValue.textContent = constraints.currentBlurAmount;
    }
    
    // Update cell count limits
    if (constraints.minCellCount !== undefined && this.getElementById('minCellCount')) {
      this.getElementById('minCellCount').textContent = constraints.minCellCount;
    }
    
    if (constraints.maxCellCount !== undefined && this.getElementById('maxCellCount')) {
      this.getElementById('maxCellCount').textContent = constraints.maxCellCount;
    }
    
    // Update current cell count
    if (constraints.currentCellCount !== undefined && this.elements.cellCountSlider) {
      this.elements.cellCountSlider.value = constraints.currentCellCount;
      if (this.elements.cellCountValue) {
        this.elements.cellCountValue.textContent = constraints.currentCellCount;
      }
    }
  }
  
  /**
   * Generate a new gradient
   */
  generateGradient() {
    try {
      const meshGradient = this.getMeshGradient();
      meshGradient.generate();
      
      this.eventBus.publish('gradientGenerated', {
        source: 'generate-button',
        timestamp: new Date().toISOString()
      });
      
      console.log('New gradient generated');
    } catch (error) {
      console.error('Error generating gradient:', error);
    }
  }
  
  /**
   * Update cell count
   * @param {number} count - New cell count
   */
  updateCellCount(count) {
    try {
      const meshGradient = this.getMeshGradient();
      
      // Set cell count and regenerate (don't preserve colors)
      meshGradient.setCellCount(count);
      
      this.eventBus.publish('cellCountChanged', {
        count,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating cell count:', error);
    }
  }
  
  /**
   * Update blur amount
   * @param {number} amount - New blur amount
   */
  updateBlurAmount(amount) {
    try {
      const meshGradient = this.getMeshGradient();
      meshGradient.setBlurAmount(amount);
      
      this.eventBus.publish('blurAmountChanged', {
        amount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating blur amount:', error);
    }
  }
  
  /**
   * Update color harmony
   * @param {string} harmonyType - Harmony type
   */
  updateColorHarmony(harmonyType) {
    try {
      const meshGradient = this.getMeshGradient();
      meshGradient.setColorHarmony(harmonyType);
      
      this.eventBus.publish('colorHarmonyChanged', {
        harmony: harmonyType,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating color harmony:', error);
    }
  }
  
  /**
   * Update color theme
   * @param {string} theme - Theme name
   */
  updateColorTheme(theme) {
    try {
      const meshGradient = this.getMeshGradient();
      meshGradient.setColorTheme(theme);
      
      this.eventBus.publish('colorThemeChanged', {
        theme,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating color theme:', error);
    }
  }
  
  /**
   * Adjust colors
   * @param {Object} adjustment - HSL adjustments
   */
  adjustColors(adjustment) {
    try {
      const meshGradient = this.getMeshGradient();
      meshGradient.adjustColors(adjustment);
      
      this.eventBus.publish('colorsAdjusted', {
        adjustment,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adjusting colors:', error);
    }
  }
}
