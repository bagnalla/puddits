import PuddiObject from './puddi/puddiobject.js';
import type Puddi from './puddi/puddi.js';
import type { Vector2 } from 'three';

export default class Triangle extends PuddiObject {
  private _p1: Vector2;
  private _p2: Vector2;
  private _p3: Vector2;

  constructor(puddi: Puddi, parent: PuddiObject | null) {
    // Call superclass constructor.
    super(puddi, parent);
    this._color = 'red';

    // Compute the points of an equilateral triangle with edge length
    // 1, so that the center of the triangle is at the origin (0, 0).
    const height = Math.sqrt(3 / 4);
    const y1 = 1 / Math.sqrt(3);
    const y2 = height - y1;
    this._p1 = new THREE.Vector2(0, -y1);
    this._p2 = new THREE.Vector2(-0.5, y2);
    this._p3 = new THREE.Vector2(0.5, y2);
  }

  _drawSelf(ctx: CanvasRenderingContext2D): void {
    // Make triangle path.
    ctx.beginPath();
    ctx.moveTo(this._p1.x, this._p1.y);
    ctx.lineTo(this._p2.x, this._p2.y);
    ctx.lineTo(this._p3.x, this._p3.y);
    ctx.closePath();

    // Outline.
    ctx.lineWidth = 0.05;
    ctx.strokeStyle = '#666666';
    ctx.stroke();

    // Fill.
    ctx.fillStyle = this._color;
    ctx.fill();
  }

  containsPoint(x: number, y: number): boolean {
    const p1 = this._p1;
    const p2 = this._p2;
    const p3 = this._p3;
    const d1 = (x - p2.x) * (p1.y - p2.y) - (p1.x - p2.x) * (y - p2.y);
    const d2 = (x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (y - p3.y);
    const d3 = (x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (y - p1.y);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);
  }

  getP1(): Vector2 {
    return this._p1;
  }

  getP2(): Vector2 {
    return this._p2;
  }

  getP3(): Vector2 {
    return this._p3;
  }
}
