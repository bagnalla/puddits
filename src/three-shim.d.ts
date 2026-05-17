declare module 'three' {
  export class Matrix3 {
    elements: number[];
    constructor();
    set(
      n11: number,
      n12: number,
      n13: number,
      n21: number,
      n22: number,
      n23: number,
      n31: number,
      n32: number,
      n33: number
    ): this;
    clone(): Matrix3;
    multiply(m: Matrix3): this;
    determinant(): number;
    invert(): this;
  }

  export class Vector2 {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    clone(): Vector2;
    add(v: Vector2): this;
    sub(v: Vector2): this;
    subtract(v: Vector2): this;
    dot(v: Vector2): number;
    multiply(v: Vector2 | number): this;
    multiplyScalar(s: number): this;
    length(): number;
    normalize(): this;
    applyMatrix3(m: Matrix3): this;
  }
}

declare const THREE: {
  Matrix3: typeof import('three').Matrix3;
  Vector2: typeof import('three').Vector2;
};
