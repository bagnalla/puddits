import PuddiObject from './puddi/puddiobject.js';
import type Puddi from './puddi/puddi.js';

export default class Circle extends PuddiObject {
  constructor(puddi: Puddi, parent: PuddiObject | null) {
    super(puddi, parent);
    this._color = '#2b8cff';
  }

  _drawSelf(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(0, 0, 0.5, 0, Math.PI * 2);
    ctx.fillStyle = this._color;
    ctx.fill();
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 0.05;
    ctx.stroke();
  }

  containsPoint(x: number, y: number): boolean {
    return x * x + y * y <= 0.25;
  }
}
