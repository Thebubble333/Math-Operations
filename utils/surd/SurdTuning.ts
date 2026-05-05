export interface InterpolationParam {
    start: number;
    end: number;
    lockHeight: number;
    easing?: 'linear' | 'quadratic';
    easingPower?: number;
}

export interface SurdTuning {
    upstrokeAngle: InterpolationParam;
    downstrokeAngle: InterpolationParam;
    downstrokeHeightRatio: InterpolationParam;
    hookRotation: InterpolationParam;
    hookLengthScale: InterpolationParam;
}

export const DEFAULT_TUNING: SurdTuning = {
    upstrokeAngle: { start: 65, end: 65, lockHeight: 20 },
    downstrokeAngle: { start: 65, end: 65, lockHeight: 20 },
    downstrokeHeightRatio: { start: 0.5, end: 0.5, lockHeight: 20 },
    hookRotation: { start: 0, end: 0, lockHeight: 20 },
    hookLengthScale: { start: 1, end: 1, lockHeight: 20 }
};
