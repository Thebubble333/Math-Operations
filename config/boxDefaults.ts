/*
 * -----------------------------------------------------------------------------
 * Box Builder Defaults
 * Centralized configuration for "Fill in the Blank" tools.
 * -----------------------------------------------------------------------------
 */

export const BOX_DEFAULTS = {
    // General Metrics
    xHeightRatio: 0.45,

    equationBox: {
        widthRatio: 13.3333, 
        heightRatio: 4.4444, 
        yOffsetRatio: 0.1, 
        horizontalPadding: 0.4, 
        strokeWidth: 1.0,
        fill: 'none',
        stroke: 'black',

        paddingLeft: 4,
        paddingRight: 4,
        shiftX: 0,
        shiftY: 0
    },

    matrix: {
        mode: 'underline', 
        widthRatio: 2.5, 
        strokeWidth: 0.25,
        yOffsetRatio: 0.3,

        paddingLeft: 0,
        paddingRight: 0,
        shiftX: 0,
        shiftY: 0
    }
};
