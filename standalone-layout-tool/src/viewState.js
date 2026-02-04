// This WeakMap stores the zoom/pan state for each canvas
export const viewStates = new WeakMap();

/**
 * Gets the current view state for a given canvas,
 * or creates a default state if one doesn't exist.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @returns {object} The view state object.
 */
export function getViewState(canvas) {
    if (!viewStates.has(canvas)) {
        viewStates.set(canvas, {
            scale: 1.0,
            offsetX: 0,
            offsetY: 0,
            isPanning: false,
            lastPanX: 0,
            lastPanY: 0,
            initialFit: null,
        });
    }
    return viewStates.get(canvas);
}