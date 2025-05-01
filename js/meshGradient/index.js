/**
 * Entry point for MeshGradient library
 * Creates the main class and exports it globally
 */

// Create the MeshGradient class that extends MeshGradientCore
class MeshGradient extends MeshGradientCore {
    constructor() {
        super();
        console.log('MeshGradient initialized');
        
        // Run generate immediately to show something
        setTimeout(() => {
            try {
                this.generate();
                console.log("Initial gradient generated");
            } catch (err) {
                console.error("Error generating initial gradient", err);
            }
        }, 10);
    }
}

// Create a global instance immediately
window.meshGradient = new MeshGradient();

// Also expose the class constructor globally
window.MeshGradient = MeshGradient;

console.log("MeshGradient global instance created:", window.meshGradient ? "success" : "failed");
