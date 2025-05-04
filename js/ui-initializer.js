/**
 * Simple UI initializer
 * This helps with initializing components without dependencies
 */
(function() {
  // Wait for DOM to be loaded
  document.addEventListener('DOMContentLoaded', () => {
    console.log('UI Initializer: Setting up enhanced UI components');
    
    // Wait for meshGradient to be available
    let attempts = 0;
    const maxAttempts = 10;
    
    function initializeUI() {
      if (attempts >= maxAttempts) {
        console.warn('UI Initializer: Failed to initialize - too many attempts');
        return;
      }
      
      if (!window.meshGradient) {
        attempts++;
        console.log(`UI Initializer: MeshGradient not available, retrying (${attempts}/${maxAttempts})...`);
        setTimeout(initializeUI, 100);
        return;
      }
      
      console.log('UI Initializer: MeshGradient found, initializing components');
      
      try {
        // Initialize UI components
        initializeThemeToggle();
        initializeEditModeToggle();
        initializeColorControlEvents();
        
        // Use simple UI tools if available
        if (window.uiTools && window.uiTools.manager) {
          window.uiTools.manager.initialize();
        }
        
        console.log('UI Initializer: Initialization complete');
      } catch (err) {
        console.error('UI Initializer: Error during initialization', err);
      }
    }
    
    // Simple theme toggle initialization
    function initializeThemeToggle() {
      const themeToggle = document.getElementById('themeModeToggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          const html = document.documentElement;
          const isDarkMode = html.getAttribute('data-bs-theme') === 'dark';
          html.setAttribute('data-bs-theme', isDarkMode ? 'light' : 'dark');
          
          // Update icon
          const icon = themeToggle.querySelector('i');
          if (icon) {
            icon.className = isDarkMode ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
          }
        });
      }
    }
    
    // Simple edit mode toggle initialization
    function initializeEditModeToggle() {
      const editModeToggle = document.getElementById('editModeToggle');
      if (editModeToggle && window.meshGradient) {
        editModeToggle.addEventListener('change', (e) => {
          if (typeof meshGradient.setEditMode === 'function') {
            meshGradient.setEditMode(e.target.checked);
          }
        });
      }
    }
    
    // Simple color controls initialization
    function initializeColorControlEvents() {
      const generateBtn = document.getElementById('generateBtn');
      if (generateBtn && window.meshGradient) {
        generateBtn.addEventListener('click', () => {
          if (typeof meshGradient.generate === 'function') {
            meshGradient.generate();
          }
        });
      }
    }
    
    // Start initialization after a delay
    setTimeout(initializeUI, 300);
  });
})();
