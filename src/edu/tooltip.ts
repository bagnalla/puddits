import Label from './label.js';
import type Puddi from '../puddi/puddi.js';
import type PuddiObject from '../puddi/puddiobject.js';

type TooltipOptions = {
  text?: string;
  font?: string;
  size?: number;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  color?: string;
  background?: string;
  borderColor?: string;
  padding?: number;
  radius?: number;
};

export default class Tooltip extends Label {
  private _background: string;
  private _borderColor: string | null;
  private _padding: number;
  private _radius: number;

  constructor(puddi: Puddi, parent: PuddiObject | null, options: TooltipOptions = {}) {
    super(puddi, parent, options);
    this._background = options.background ?? 'rgba(0, 0, 0, 0.75)';
    this._borderColor = options.borderColor ?? null;
    this._padding = options.padding ?? 6;
    this._radius = options.radius ?? 6;
  }

  setBackground(color: string): void {
    this._background = color;
  }

  setBorder(color: string | null): void {
    this._borderColor = color;
  }

  setPadding(padding: number): void {
    this._padding = padding;
  }

  setRadius(radius: number): void {
    this._radius = radius;
  }

  _drawSelf(ctx: CanvasRenderingContext2D): void {
    const metrics = this._measure(ctx);
    const padding = this._padding;
    const width = metrics.width + padding * 2;
    const height = metrics.height + padding * 2;

    let x = 0;
    if (this._align === 'center') {
      x = -width / 2;
    } else if (this._align === 'right' || this._align === 'end') {
      x = -width;
    }

    let y = 0;
    if (this._baseline === 'middle') {
      y = -height / 2;
    } else if (this._baseline === 'bottom' || this._baseline === 'ideographic') {
      y = -height;
    } else if (this._baseline === 'alphabetic') {
      y = -metrics.ascent - padding;
    }

    const radius = Math.min(this._radius, width / 2, height / 2);

    ctx.fillStyle = this._background;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    if (this._borderColor) {
      ctx.strokeStyle = this._borderColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    let anchorX = x + padding;
    if (this._align === 'center') {
      anchorX = x + width / 2;
    } else if (this._align === 'right' || this._align === 'end') {
      anchorX = x + width - padding;
    }

    let anchorY = y + padding + metrics.ascent;
    if (this._baseline === 'top') {
      anchorY = y + padding;
    } else if (this._baseline === 'middle') {
      anchorY = y + height / 2;
    } else if (this._baseline === 'bottom' || this._baseline === 'ideographic') {
      anchorY = y + height - padding;
    }

    ctx.save();
    ctx.translate(anchorX, anchorY);
    this._drawText(ctx);
    ctx.restore();
  }
}
