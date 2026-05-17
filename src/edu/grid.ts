import PuddiObject from '../puddi/puddiobject.js';
import type Puddi from '../puddi/puddi.js';

type GridOptions = {
  width?: number;
  height?: number;
  spacing?: number;
  majorSpacing?: number;
  lineWidth?: number;
  majorLineWidth?: number;
  color?: string;
  majorColor?: string;
  centered?: boolean;
};

export default class Grid extends PuddiObject {
  private _width: number;
  private _height: number;
  private _spacing: number;
  private _majorSpacing: number;
  private _lineWidth: number;
  private _majorLineWidth: number;
  private _majorColor: string;
  private _centered: boolean;

  constructor(puddi: Puddi, parent: PuddiObject | null, options: GridOptions = {}) {
    super(puddi, parent);
    this._width = options.width ?? 400;
    this._height = options.height ?? 400;
    this._spacing = options.spacing ?? 20;
    this._majorSpacing = options.majorSpacing ?? this._spacing * 5;
    this._lineWidth = options.lineWidth ?? 1;
    this._majorLineWidth = options.majorLineWidth ?? 1.5;
    this._color = options.color ?? 'rgba(0, 0, 0, 0.12)';
    this._majorColor = options.majorColor ?? 'rgba(0, 0, 0, 0.22)';
    this._centered = options.centered ?? true;
  }

  setSize(width: number, height: number): void {
    this._width = width;
    this._height = height;
  }

  setSpacing(spacing: number, majorSpacing?: number): void {
    this._spacing = spacing;
    if (majorSpacing !== undefined) {
      this._majorSpacing = majorSpacing;
    }
  }

  setCentered(centered: boolean): void {
    this._centered = centered;
  }

  _drawSelf(ctx: CanvasRenderingContext2D): void {
    const halfWidth = this._width / 2;
    const halfHeight = this._height / 2;
    const minX = this._centered ? -halfWidth : 0;
    const maxX = this._centered ? halfWidth : this._width;
    const minY = this._centered ? -halfHeight : 0;
    const maxY = this._centered ? halfHeight : this._height;

    const spacing = Math.max(1, this._spacing);
    const startX = Math.floor(minX / spacing) * spacing;
    const endX = Math.ceil(maxX / spacing) * spacing;
    const startY = Math.floor(minY / spacing) * spacing;
    const endY = Math.ceil(maxY / spacing) * spacing;

    const majorEvery = this._majorSpacing > 0 ? Math.max(1, Math.round(this._majorSpacing / spacing)) : 0;
    let index = 0;

    for (let x = startX; x <= endX + 0.0001; x += spacing) {
      if (x < minX - 0.001 || x > maxX + 0.001) {
        index += 1;
        continue;
      }
      const isMajor = majorEvery && index % majorEvery === 0;
      ctx.strokeStyle = isMajor ? this._majorColor : this._color;
      ctx.lineWidth = isMajor ? this._majorLineWidth : this._lineWidth;
      ctx.beginPath();
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
      ctx.stroke();
      index += 1;
    }

    index = 0;
    for (let y = startY; y <= endY + 0.0001; y += spacing) {
      if (y < minY - 0.001 || y > maxY + 0.001) {
        index += 1;
        continue;
      }
      const isMajor = majorEvery && index % majorEvery === 0;
      ctx.strokeStyle = isMajor ? this._majorColor : this._color;
      ctx.lineWidth = isMajor ? this._majorLineWidth : this._lineWidth;
      ctx.beginPath();
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
      ctx.stroke();
      index += 1;
    }
  }
}
