/**
 * Canvas painting for a running automaton.
 *
 * The grid is drawn at one device pixel per cell into a small offscreen canvas
 * and then scaled up with smoothing off. That keeps a full redraw proportional
 * to the number of cells rather than the number of screen pixels, which is what
 * makes a 300×600 grid comfortable on a phone.
 */

/**
 * @typedef {object} PaintOptions
 * @property {[number, number, number]} [background] Colour behind dead cells.
 * @property {number} [cellSize] Screen pixels per cell. Defaults to a fit.
 */

/** Create the offscreen buffer a renderer paints into. */
export function createBuffer(width, height) {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * A painter bound to one visible canvas. Recreate it when the grid size
 * changes; call `paint(automata)` once per generation.
 */
export class CanvasPainter {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ width: number, height: number }} grid
   * @param {PaintOptions} [options]
   */
  constructor(canvas, grid, options = {}) {
    this.canvas = canvas;
    this.width = grid.width;
    this.height = grid.height;
    this.background = options.background ?? [8, 10, 16];
    this.context = canvas.getContext('2d', { alpha: false });
    this.buffer = createBuffer(this.width, this.height);
    this.bufferContext = this.buffer.getContext('2d', { alpha: false });
    this.image = this.bufferContext.createImageData(this.width, this.height);
    if (this.context) this.context.imageSmoothingEnabled = false;
  }

  /** Draw the current state of the grid. */
  paint(automata) {
    if (!this.context || !this.bufferContext) return;
    const { data } = this.image;
    const [br, bg, bb] = this.background;
    const cells = automata.cells;
    const colors = automata.colors;
    const tracksColor = colors.length > 0;

    for (let i = 0; i < cells.length; i++) {
      const p = i * 4;
      if (cells[i]) {
        data[p] = tracksColor ? colors[i * 3] : 235;
        data[p + 1] = tracksColor ? colors[i * 3 + 1] : 235;
        data[p + 2] = tracksColor ? colors[i * 3 + 2] : 235;
      } else {
        data[p] = br;
        data[p + 1] = bg;
        data[p + 2] = bb;
      }
      data[p + 3] = 255;
    }

    this.bufferContext.putImageData(this.image, 0, 0);
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(this.buffer, 0, 0, this.width, this.height, 0, 0, this.canvas.width, this.canvas.height);
  }
}

/**
 * How big the grid should be for a given viewport.
 *
 * `cellSize` is in CSS pixels; smaller cells mean a bigger universe. Phones get
 * a larger cell so the simulation stays cheap and the cells stay visible.
 */
export function gridSizeFor(viewportWidth, viewportHeight, cellSize = 4) {
  const size = Math.max(1, cellSize);
  return {
    width: Math.max(8, Math.floor(viewportWidth / size)),
    height: Math.max(8, Math.floor(viewportHeight / size)),
  };
}

/** Which cell a pointer at these client coordinates is over. */
export function cellAtPointer(canvas, automata, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((clientX - rect.left) / rect.width) * automata.width);
  const y = Math.floor(((clientY - rect.top) / rect.height) * automata.height);
  return { x, y };
}
