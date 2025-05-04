/**
 * Hue Animation Controls for MeshGradient
 * Adds UI controls for the hue animation feature
 */
document.addEventListener('DOMContentLoaded', () => {
  // Wait for meshGradient to be available
  let attempts = 0;
  const maxAttempts = 10;
  
  function initHueAnimationControls() {
    if (attempts >= maxAttempts) {
      console.warn('Failed to initialize hue animation controls - too many attempts');
      return;
    }
    
    if (!window.meshGradient) {
      attempts++;
      setTimeout(initHueAnimationControls, 100);
      return;
    }
    
    console.log('Initializing hue animation controls...');
    
    // Setup UI controls
    setupControls();
  }
  
  function setupControls() {
    // Get hue animation parameters div
    const hueAnimParams = document.getElementById('hueAnimationParameters');
    
    // Initially hide animation parameters
    if (hueAnimParams) {
      hueAnimParams.style.display = 'none';
    }
    
    // Hue Animation toggle
    const hueAnimToggle = document.getElementById('hueAnimationToggle');
    if (hueAnimToggle) {
      // Ensure correct initial state
      hueAnimToggle.checked = false;
      
      hueAnimToggle.addEventListener('change', (e) => {
        console.log(`Hue animation toggle changed: ${e.target.checked}`);
        
        // Show/hide parameters based on toggle state
        if (hueAnimParams) {
          hueAnimParams.style.display = e.target.checked ? 'block' : 'none';
        }
        
        // Check if required methods exist
        if (typeof meshGradient.toggleHueAnimation !== 'function') {
          console.error('meshGradient.toggleHueAnimation function not found!');
          return;
        }
        
        // Call animation toggle method
        try {
          const result = meshGradient.toggleHueAnimation(e.target.checked);
          console.log(`toggleHueAnimation returned: ${result}`);
        } catch (err) {
          console.error('Error calling toggleHueAnimation:', err);
        }
      });
    }
    
    // Hue speed slider
    const hueSpeedSlider = document.getElementById('hueSpeed');
    const hueSpeedValue = document.getElementById('hueSpeedValue');
    
    if (hueSpeedSlider && hueSpeedValue) {
      hueSpeedSlider.addEventListener('input', (e) => {
        const speed = parseInt(e.target.value);
        hueSpeedValue.textContent = speed;
        
        if (meshGradient && typeof meshGradient.setHueAnimationParams === 'function') {
          meshGradient.setHueAnimationParams({ speed });
        }
      });
    }
    
    // Direction radio buttons
    const clockwiseBtn = document.getElementById('hueDirectionClockwise');
    const counterBtn = document.getElementById('hueDirectionCounter');
    
    if (clockwiseBtn && counterBtn) {
      clockwiseBtn.addEventListener('change', () => {
        if (clockwiseBtn.checked && meshGradient && 
            typeof meshGradient.setHueAnimationParams === 'function') {
          meshGradient.setHueAnimationParams({ direction: true });
        }
      });
      
      counterBtn.addEventListener('change', () => {
        if (counterBtn.checked && meshGradient && 
            typeof meshGradient.setHueAnimationParams === 'function') {
          meshGradient.setHueAnimationParams({ direction: false });
        }
      });
    }
    
    // Subscribe to animation state changes
    document.addEventListener('hueAnimationStateChanged', (e) => {
      if (e.detail && hueAnimToggle) {
        hueAnimToggle.checked = e.detail.active && !e.detail.paused;
      }
    });
    
    console.log('Hue animation controls initialized');
  }
  
  // Start initialization
  setTimeout(initHueAnimationControls, 300);
});
