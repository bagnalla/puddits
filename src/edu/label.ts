import PuddiObject from '../puddi/puddiobject.js';
import type Puddi from '../puddi/puddi.js';

type LabelMetrics = {
  width: number;
  height: number;
  ascent: number;
  descent: number;
};

type LabelOptions = {
  text?: string;
  font?: string;
  size?: number;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  color?: string;
};

export default class Label extends PuddiObject {
  protected _text: string;
  protected _font: string;
  protected _size: number;
  protected _align: CanvasTextAlign;
  protected _baseline: CanvasTextBaseline;
  protected _metrics: LabelMetrics | null;

  constructor(puddi: Puddi, parent: PuddiObject | null, options: LabelOptions = {}) {
    super(puddi, parent);
    this._text = options.text ?? '';
    this._font = options.font ?? 'sans-serif';
    this._size = options.size ?? 14;
    this._align = options.align ?? 'left';
    this._baseline = options.baseline ?? 'alphabetic';
    this._metrics = null;
    if (options.color) {
      this._color = options.color;
    }
  }

  setText(text: string): void {
    this._text = text;
  }

  getText(): string {
    return this._text;
  }

  setFont(font: string): void {
    this._font = font;
  }

  setSize(size: number): void {
    this._size = size;
  }

  setAlign(align: CanvasTextAlign): void {
    this._align = align;
  }

  setBaseline(baseline: CanvasTextBaseline): void {
    this._baseline = baseline;
  }

  getMetrics(): LabelMetrics | null {
    return this._metrics;
  }

  _applyTextStyle(ctx: CanvasRenderingContext2D): void {
    ctx.font = `${this._size}px ${this._font}`;
    ctx.textAlign = this._align;
    ctx.textBaseline = this._baseline;
  }

  _measure(ctx: CanvasRenderingContext2D): LabelMetrics {
    this._applyTextStyle(ctx);
    const metrics = ctx.measureText(this._text);
    const ascent = metrics.actualBoundingBoxAscent ?? this._size * 0.8;
    const descent = metrics.actualBoundingBoxDescent ?? this._size * 0.2;
    const width = metrics.width ?? this._text.length * this._size * 0.6;
    const height = ascent + descent;
    this._metrics = { width, height, ascent, descent };
    return this._metrics;
  }

  _drawText(ctx: CanvasRenderingContext2D): void {
    this._applyTextStyle(ctx);
    ctx.fillStyle = this._color;
    ctx.fillText(this._text, 0, 0);
  }

  _drawSelf(ctx: CanvasRenderingContext2D): void {
    this._measure(ctx);
    this._drawText(ctx);
  }

  containsPoint(x: number, y: number): boolean {
    if (!this._metrics) {
      return false;
    }

    const { width, height, ascent, descent } = this._metrics;
    let minX = 0;
    let maxX = width;

    if (this._align === 'center') {
      minX = -width / 2;
      maxX = width / 2;
    } else if (this._align === 'right' || this._align === 'end') {
      minX = -width;
      maxX = 0;
    }

    let minY = -ascent;
    let maxY = descent;

    if (this._baseline === 'top') {
      minY = 0;
      maxY = height;
    } else if (this._baseline === 'middle') {
      minY = -height / 2;
      maxY = height / 2;
    } else if (this._baseline === 'bottom' || this._baseline === 'ideographic') {
      minY = -height;
      maxY = 0;
    }

    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }
}
