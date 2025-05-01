/**
 * Voronoi pattern generator
 * Uses d3-delaunay for Voronoi diagram generation
 */
class VoronoiGenerator {
    constructor(width, height) {
        this.width = width || 800;
        this.height = height || 600;
        this.sites = [];
        this.delaunay = null;
        this.voronoi = null;
    }

    /**
     * Set canvas dimensions
     * @param {Number} width - Canvas width
     * @param {Number} height - Canvas height
     */
    setDimensions(width, height) {
        this.width = width;
        this.height = height;
        // Recompute Voronoi if sites exist
        if (this.sites.length > 0) {
            this.computeVoronoi();
        }
    }

    /**
     * Generate random Voronoi sites
     * @param {Number} count - Number of sites to generate
     */
    generateRandomSites(count) {
        this.sites = [];
        for (let i = 0; i < count; i++) {
            this.sites.push([
                Math.random() * this.width,
                Math.random() * this.height
            ]);
        }
        this.computeVoronoi();
        return this.sites;
    }

    /**
     * Compute Voronoi diagram from sites
     */
    computeVoronoi() {
        this.delaunay = d3.Delaunay.from(this.sites);
        this.voronoi = this.delaunay.voronoi([0, 0, this.width, this.height]);
        return this.voronoi;
    }

    /**
     * Move a site to a new position
     * @param {Number} index - Site index
     * @param {Number} x - New x coordinate
     * @param {Number} y - New y coordinate
     */
    moveSite(index, x, y) {
        if (index >= 0 && index < this.sites.length) {
            this.sites[index][0] = Math.max(0, Math.min(x, this.width));
            this.sites[index][1] = Math.max(0, Math.min(y, this.height));
            this.computeVoronoi();
        }
    }

    /**
     * Get the site index closest to the given coordinates
     * @param {Number} x - X coordinate
     * @param {Number} y - Y coordinate
     * @returns {Number} - Index of the closest site
     */
    findClosestSiteIndex(x, y) {
        if (!this.delaunay) return -1;
        return this.delaunay.find(x, y);
    }

    /**
     * Find the cell that contains the given point
     * @param {Number} x - X coordinate
     * @param {Number} y - Y coordinate
     * @returns {Number} - Index of the cell containing the point, or -1 if none
     */
    findCellAtPosition(x, y) {
        if (!this.delaunay) return -1;
        
        // Find the nearest site using delaunay's find method
        const siteIndex = this.delaunay.find(x, y);
        
        // Make sure the point is actually inside the Voronoi cell
        // (delaunay.find just gives us the nearest site, not necessarily within its cell)
        if (siteIndex >= 0 && siteIndex < this.sites.length) {
            return siteIndex;
        }
        
        return -1;
    }

    /**
     * Get all Voronoi cells as path strings
     * @returns {Array} - Array of cell objects with path and site data
     */
    getCells() {
        if (!this.voronoi) return [];

        const cells = [];
        for (let i = 0; i < this.sites.length; i++) {
            const cell = this.voronoi.cellPolygon(i);
            if (cell) {
                cells.push({
                    index: i,
                    site: this.sites[i],
                    path: this.polygonToPath(cell)
                });
            }
        }
        return cells;
    }

    /**
     * Convert polygon points to SVG path string
     * @param {Array} polygon - Array of polygon points
     * @returns {String} - SVG path string
     */
    polygonToPath(polygon) {
        if (!polygon || polygon.length === 0) return '';
        
        let path = `M${polygon[0][0]},${polygon[0][1]}`;
        for (let i = 1; i < polygon.length; i++) {
            path += `L${polygon[i][0]},${polygon[i][1]}`;
        }
        path += 'Z';
        return path;
    }
}
