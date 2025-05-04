/**
 * UI Component for edit mode controls
 */
import UIComponent from './UIComponent.js';

export default class EditModeControls extends UIComponent {
  constructor(config) {
    super(config);
  }
  
  _findElements() {
    this.elements = {
      editModeToggle: this.getElementById('editModeToggle')
    };
  }
  
  _bindEvents() {
    // Toggle edit mode
    if (this.elements.editModeToggle) {
      this.elements.editModeToggle.addEventListener('change', (e) => {
        this.toggleEditMode(e.target.checked);
      });
      
      // Listen for distortion changes to disable edit mode
      this.subscribe('distortionChanged', (data) => {
        const hasActiveDistortion = data && data.hasActiveDistortion;
        
        if (hasActiveDistortion) {
          // Disable edit mode
          if (this.elements.editModeToggle.checked) {
            this.elements.editModeToggle.checked = false;
            this.toggleEditMode(false);
          }
          
          // Disable the toggle
          this.elements.editModeToggle.disabled = true;
        } else {
          // Enable the toggle
          this.elements.editModeToggle.disabled = false;
        }
      });
    }
  }
  
  /**
   * Toggle edit mode
   * @param {boolean} enabled - Whether edit mode is enabled
   */
  toggleEditMode(enabled) {
    try {
      const meshGradient = this.getMeshGradient();
      
      if (typeof meshGradient.setEditMode === 'function') {
        meshGradient.setEditMode(enabled);
        
        // Publish event
        this.eventBus.publish('editModeChanged', {
          enabled
        });
        
        console.log(`Edit mode ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Error toggling edit mode:', error);
    }
  }
}
