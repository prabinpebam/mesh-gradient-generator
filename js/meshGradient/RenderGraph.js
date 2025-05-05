/**
 * RenderGraph – tiny stage scheduler
 * Stages: cells  → bitmap → post-fx → UI
 * Down-stream stages are marked dirty when an upstream stage changes.
 */
class RenderGraph {
    constructor(core) {
        this.core  = core;
        this.order = ['cells', 'bitmap', 'postFx', 'ui'];
        this.dirty = { cells: true, bitmap: true, postFx: true, ui: true };

        // Cached per-frame data
        this.cells = null;
        this.sites = null;
    }

    /** mark this stage ‑and everything after- as dirty */
    markDirtyFrom(stage) {
        const idx = this.order.indexOf(stage);
        if (idx === -1) return;
        for (let i = idx; i < this.order.length; i++) {
            this.dirty[this.order[i]] = true;
        }
    }

    /** main render dispatcher; mirrors MeshGradientCore.render()’s public API */
    render(colors = null, preserveColors = true) {
        const { core } = this;

        /* ---------- CELLS ---------- */
        if (this.dirty.cells) {
            this.cells = core.data.voronoi.getCells(core.animation?.active);
            this.sites = core.data.voronoi.sites;
            this.dirty.bitmap = this.dirty.postFx = this.dirty.ui = true;
            this.dirty.cells = false;
        }

        /* ---------- BITMAP (draw crisp cells) ---------- */
        if (this.dirty.bitmap) {
            core.offCtx.clearRect(0, 0, core.width, core.height);

            // colour preparation (logic kept identical to old render())
            if (!preserveColors) {
                if (!colors) colors = core.data.processColors();
                else core.data.currentColors = colors;
            } else if (colors) {
                core.data.currentColors = colors;
            }

            core.renderer.drawCellsToCanvas(core.offCtx, this.cells, core.data);
            this.dirty.postFx = this.dirty.ui = true;
            this.dirty.bitmap = false;
        }

        /* ---------- POST-FX (blur / distort) ---------- */
        if (this.dirty.postFx) {
            if (core.data.blurAmount > 0) {
                core.renderer.applyBlur(core.data.blurAmount);
            }
            this.dirty.ui = true;
            this.dirty.postFx = false;
        }

        /* ---------- UI / COMPOSITE ---------- */
        if (this.dirty.ui) {
            core.ctx.clearRect(0, 0, core.width, core.height);
            core.data.distortions.apply(core.offCanvas, core.ctx);
            core.renderer.drawUI(this.cells, this.sites, core.data);
            this.dirty.ui = false;
        }
    }
}
