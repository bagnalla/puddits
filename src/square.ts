import PuddiObject from './puddi/puddiobject.js';
import type Puddi from './puddi/puddi.js';

export default class Square extends PuddiObject {
  constructor(puddi: Puddi, parent: PuddiObject | null) {
    // Call superclass constructor.
    super(puddi, parent);
    this._color = 'green';
  }

  _drawSelf(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this._color;
    ctx.fillRect(-1 / 2.0, -1 / 2.0, 1, 1);
    ctx.lineWidth = 0.05;
    ctx.strokeStyle = '#666666';
    ctx.strokeRect(-1 / 2.0, -1 / 2.0, 1, 1);
  }

  containsPoint(x: number, y: number): boolean {
    return Math.abs(x) <= 0.5 && Math.abs(y) <= 0.5;
  }
}
