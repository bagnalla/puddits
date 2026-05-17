import PuddiObject from '../puddi/puddiobject.js';
import type Puddi from '../puddi/puddi.js';

type AxisOptions = {
  extentX?: number;
  extentY?: number;
  tickSpacing?: number;
  tickSize?: number;
  lineWidth?: number;
  labelEvery?: number;
  showTicks?: boolean;
  showLabels?: boolean;
  font?: string;
  labelColor?: string;
};

export default class Axis2D extends PuddiObject {
  private _extentX: number;
  private _extentY: number;
  private _tickSpacing: number;
  private _tickSize: number;
  private _lineWidth: number;
  private _labelEvery: number;
  private _showTicks: boolean;
  private _showLabels: boolean;
  private _font: string;
  private _labelColor: string;

  constructor(puddi: Puddi, parent: PuddiObject | null, options: AxisOptions = {}) {
    super(puddi, parent);
    this._extentX = options.extentX ?? 200;
    this._extentY = options.extentY ?? 200;
    this._tickSpacing = options.tickSpacing ?? 20;
    this._tickSize = options.tickSize ?? 4;
    this._lineWidth = options.lineWidth ?? 1.5;
    this._labelEvery = options.labelEvery ?? 2;
    this._showTicks = options.showTicks ?? true;
    this._showLabels = options.showLabels ?? false;
    this._font = options.font ?? '12px sans-serif';
    this._labelColor = options.labelColor ?? this._color;
  }

  setExtents(extentX: number, extentY: number): void {
    this._extentX = extentX;
    this._extentY = extentY;
  }

  setTicks(spacing: number, size?: number): void {
    this._tickSpacing = spacing;
    if (size !== undefined) {
      this._tickSize = size;
    }
  }

  setShowLabels(show: boolean): void {
    this._showLabels = show;
  }

  _drawSelf(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = this._color;
    ctx.lineWidth = this._lineWidth;

    ctx.beginPath();
    ctx.moveTo(-this._extentX, 0);
    ctx.lineTo(this._extentX, 0);
    ctx.moveTo(0, -this._extentY);
    ctx.lineTo(0, this._extentY);
    ctx.stroke();

    if (!this._showTicks) {
      return;
    }

    const spacing = Math.max(1, this._tickSpacing);
    const tickSize = this._tickSize;

    for (let x = -this._extentX; x <= this._extentX + 0.0001; x += spacing) {
      if (Math.abs(x) < 0.001) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(x, -tickSize);
      ctx.lineTo(x, tickSize);
      ctx.stroke();
    }

    for (let y = -this._extentY; y <= this._extentY + 0.0001; y += spacing) {
      if (Math.abs(y) < 0.001) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(-tickSize, y);
      ctx.lineTo(tickSize, y);
      ctx.stroke();
    }

    if (this._showLabels) {
      ctx.fillStyle = this._labelColor;
      ctx.font = this._font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      let index = 0;
      for (let x = -this._extentX; x <= this._extentX + 0.0001; x += spacing) {
        if (Math.abs(x) < 0.001) {
          index += 1;
          continue;
        }
        if (index % this._labelEvery === 0) {
          ctx.fillText(String(Math.round(x)), x, tickSize + 2);
        }
        index += 1;
      }

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      index = 0;
      for (let y = -this._extentY; y <= this._extentY + 0.0001; y += spacing) {
        if (Math.abs(y) < 0.001) {
          index += 1;
          continue;
        }
        if (index % this._labelEvery === 0) {
          ctx.fillText(String(Math.round(-y)), -tickSize - 2, y);
        }
        index += 1;
      }
    }
  }
}
