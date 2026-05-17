import PuddiObject from '../puddi/puddiobject.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

export default class VectorArrow extends PuddiObject {
  private _start: Vector2;
  private _end: Vector2;
  private _headLength: number;
  private _headWidth: number;
  private _lineWidth: number;

  constructor(puddi: Puddi, parent: PuddiObject | null, start?: Vector2, end?: Vector2) {
    super(puddi, parent);
    this._start = start ? start.clone() : new THREE.Vector2(0, 0);
    this._end = end ? end.clone() : new THREE.Vector2(100, 0);
    this._headLength = 12;
    this._headWidth = 10;
    this._lineWidth = 2;
  }

  setStart(start: Vector2): void {
    this._start = start.clone();
  }

  setEnd(end: Vector2): void {
    this._end = end.clone();
  }

  setVector(vector: Vector2): void {
    this._start = new THREE.Vector2(0, 0);
    this._end = vector.clone();
  }

  setHeadSize(length: number, width?: number): void {
    this._headLength = length;
    if (width !== undefined) {
      this._headWidth = width;
    }
  }

  setLineWidth(width: number): void {
    this._lineWidth = width;
  }

  _drawSelf(ctx: CanvasRenderingContext2D): void {
    const start = this._start;
    const end = this._end;
    const dir = end.clone().sub(start);
    const length = dir.length();

    if (length <= 0.0001) {
      return;
    }

    const headLength = Math.min(this._headLength, length * 0.5);
    const headWidth = this._headWidth;
    dir.normalize();

    const base = end.clone().sub(dir.clone().multiplyScalar(headLength));
    const perp = new THREE.Vector2(-dir.y, dir.x);
    const left = base.clone().add(perp.clone().multiplyScalar(headWidth / 2));
    const right = base.clone().sub(perp.clone().multiplyScalar(headWidth / 2));

    ctx.strokeStyle = this._color;
    ctx.lineWidth = this._lineWidth;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(base.x, base.y);
    ctx.stroke();

    ctx.fillStyle = this._color;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.closePath();
    ctx.fill();
  }
}
