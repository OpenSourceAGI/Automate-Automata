/** Re-exports so the tests import the same modules the built CLI does. */
export { gridHeightForRows, renderFrame, toAnsi256 } from '../src/render.js';
export { stripAnsi as stripAnsiForTest } from '../src/session.js';
