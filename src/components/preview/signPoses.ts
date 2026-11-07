// Hand positions for the placeholder sign figure, drawn from the written descriptions in
// mockData.ts. They illustrate where each sign happens, nothing more. They have not been checked
// by a Pakistan Sign Language signer, and the real avatar replaces them in FYP-2.
// Coordinates use the figure's 240 x 200 canvas. "right" is the figure's right hand, which
// appears on the viewer's left.

export type HandShape = 'open' | 'fist' | 'point' | 'two' | 'three';

export interface HandPose {
  x: number;
  y: number;
  shape: HandShape;
  /** Oscillates between (x, y) and (x + dx, y + dy). */
  dx?: number;
  dy?: number;
  /** Radius of a circular motion, used instead of dx / dy. */
  circle?: number;
}

export interface SignPose {
  right: HandPose;
  left: HandPose;
}

const restRight: HandPose = { x: 84, y: 168, shape: 'open' };
const restLeft: HandPose = { x: 156, y: 168, shape: 'open' };

export const signPoses: Record<string, SignPose> = {
  psl_001: { right: { x: 94, y: 34, shape: 'open', dx: -20, dy: 8 }, left: restLeft }, // hello
  psl_002: { right: { x: 112, y: 62, shape: 'open', dx: -10, dy: 22 }, left: restLeft }, // thank you
  psl_003: { right: { x: 120, y: 102, shape: 'open', circle: 9 }, left: restLeft }, // please
  psl_004: { right: { x: 120, y: 100, shape: 'fist', dy: -16 }, left: { x: 120, y: 116, shape: 'open', dy: -16 } }, // help
  psl_005: { right: { x: 124, y: 104, shape: 'two', dy: 9 }, left: { x: 142, y: 118, shape: 'open' } }, // doctor
  psl_006: { right: { x: 158, y: 84, shape: 'two', dx: 6, dy: 8 }, left: restLeft }, // hospital
  psl_007: { right: { x: 112, y: 60, shape: 'three', dy: -6 }, left: restLeft }, // water
  psl_008: { right: { x: 118, y: 76, shape: 'fist', dy: -18 }, left: restLeft }, // food
  psl_009: { right: { x: 106, y: 106, shape: 'open', dx: -20, dy: -4 }, left: { x: 134, y: 106, shape: 'open', dx: 20, dy: -4 } }, // how are you
  psl_010: { right: { x: 92, y: 84, shape: 'fist', dy: 13 }, left: restLeft }, // yes
  psl_011: { right: { x: 88, y: 76, shape: 'two', dx: 16 }, left: restLeft }, // no
  psl_012: { right: { x: 84, y: 60, shape: 'point', dx: 14 }, left: restLeft }, // where
  psl_013: { right: { x: 112, y: 102, shape: 'two', dy: 7 }, left: { x: 128, y: 108, shape: 'two' } }, // name
  psl_014: { right: { x: 108, y: 106, shape: 'point', circle: 4 }, left: { x: 132, y: 106, shape: 'point', circle: 4 } }, // pain
  psl_015: { right: { x: 126, y: 102, shape: 'point', circle: 5 }, left: { x: 130, y: 116, shape: 'open' } }, // medicine
  psl_016: { right: { x: 112, y: 82, shape: 'open', dy: -4 }, left: { x: 128, y: 82, shape: 'open', dy: -4 } }, // home
  psl_017: { right: { x: 100, y: 96, shape: 'open', circle: 14 }, left: restLeft }, // pakistan
  psl_018: { right: { x: 100, y: 98, shape: 'open', circle: 10 }, left: { x: 140, y: 98, shape: 'open', circle: 10 } }, // sign language
};

export const restPose: SignPose = { right: restRight, left: restLeft };
