// Base puddi object class

import type Puddi from './puddi.js';
import type { Matrix3 as Matrix3Type, Vector2 } from 'three';

// Every object has a unique ID. Equality of objects is determined by
// their IDs.
let idCounter = 0;

function invertTransform(m: Matrix3Type): Matrix3Type | null {
  const det = m.determinant();
  if (det === 0) {
    return null;
  }
  return m.clone().invert();
}


function reorderItem<T>(list: T[], item: T, toFront: boolean): void {
  const index = list.indexOf(item);
  if (index === -1) {
    return;
  }
  list.splice(index, 1);
  if (toFront) {
    list.push(item);
  } else {
    list.unshift(item);
  }
}

// If parent is non-null, this object adds itself automatically as a
// child of the parent object.
export default class PuddiObject {
  private static _rootCreationDepth = 0;
  protected _puddi: Puddi;
  protected _parent: PuddiObject | null;
  protected _id: number;
  protected _position: Vector2;
  protected _rotation: number;
  protected _scale_x: number;
  protected _scale_y: number;
  protected _targetPosition: Vector2;
  protected _velocity: number;
  protected _children: PuddiObject[];
  protected _color: string;
  protected _visible: boolean;

  static createRoot(puddi: Puddi): PuddiObject {
    PuddiObject._rootCreationDepth += 1;
    try {
      return new PuddiObject(puddi, null);
    } finally {
      PuddiObject._rootCreationDepth -= 1;
    }
  }

  constructor(puddi: Puddi, parent: PuddiObject | null) {
    this._puddi = puddi;
    this._parent = parent || null;
    this._id = idCounter++;
    this._position = new THREE.Vector2(0, 0);
    this._rotation = 0.0;
    this._scale_x = 1.0;
    this._scale_y = 1.0;
    this._targetPosition = new THREE.Vector2(0, 0);
    this._velocity = 0.0;
    this._children = [];
    this._color = 'black';
    this._visible = true;

    if (parent) {
      parent.addChild(this);
    } else if (PuddiObject._rootCreationDepth === 0) {
      puddi.addObject(this);
    }
  }

  equals(o: PuddiObject | null): boolean {
    if (!o || o._id === undefined) {
      return false;
    }

    return this._id === o._id;
  }

  getId(): number {
    return this._id;
  }

  getPosition(): Vector2 {
    return this._position;
  }

  getRotation(): number {
    return this._rotation;
  }

  getScaleX(): number {
    return this._scale_x;
  }

  getScaleT(): number {
    return this._scale_y;
  }

  getScaleY(): number {
    return this._scale_y;
  }

  getTargetPosition(): Vector2 {
    return this._targetPosition;
  }

  getVelocity(): number {
    return this._velocity;
  }

  getParent(): PuddiObject | null {
    return this._parent;
  }

  getChildren(): PuddiObject[] {
    return this._children;
  }

  isVisible(): boolean {
    return this._visible;
  }

  setPosition(p: Vector2): void {
    this._position = p;
  }

  setRotation(r: number): void {
    this._rotation = r;
  }

  setScaleX(s: number): void {
    this._scale_x = s;
  }

  setScaleY(s: number): void {
    this._scale_y = s;
  }

  setScale(s: number): void {
    this._scale_x = s;
    this._scale_y = s;
  }

  setTargetPosition(tp: Vector2): void {
    this._targetPosition = tp;
  }

  setVelocity(v: number): void {
    if (v < 0) {
      console.warn('WARNING: setting object velocity to a negative value: ' + v);
    }
    this._velocity = v;
  }

  setVisible(v: boolean): void {
    this._visible = Boolean(v);
  }

  translate(v: Vector2): void {
    this.setPosition(this._position.add(v));
  }

  rotate(r: number): void {
    this._rotation += r;
  }

  scale(s: number): void {
    this._scale_x *= s;
    this._scale_y *= s;
  }

  addChild(o: PuddiObject): void {
    o._parent = this;
    this._children.push(o);
  }

  removeChild(o: PuddiObject): void {
    for (let i = 0; i < this._children.length; i++) {
      if (o.equals(this._children[i])) {
        this._children.splice(i, 1);
        o._parent = null;
        break;
      }
    }
  }

  removeChildAt(i: number): void {
    const child = this._children[i];
    if (child) {
      child._parent = null;
    }
    this._children.splice(i, 1);
  }

  clearChildren(): void {
    for (const child of this._children) {
      child._parent = null;
    }
    this._children.length = 0;
  }

  _getLocalTransform(): Matrix3Type {
    const cos = Math.cos(this._rotation);
    const sin = Math.sin(this._rotation);
    const a = this._scale_x * cos;
    const b = this._scale_y * sin;
    const c = -this._scale_x * sin;
    const d = this._scale_y * cos;
    const e = this._position.x;
    const f = this._position.y;
    const transform = new THREE.Matrix3();
    transform.set(a, c, e, b, d, f, 0, 0, 1);
    return transform;
  }

  getWorldTransform(): Matrix3Type {
    let transform = this._getLocalTransform();
    let current = this._parent;
    while (current) {
      transform = current._getLocalTransform().clone().multiply(transform);
      current = current._parent;
    }
    return transform;
  }

  worldToLocal(x: number, y: number): Vector2 | null {
    const transform = this.getWorldTransform();
    const inverse = invertTransform(transform);
    if (!inverse) {
      return null;
    }
    return new THREE.Vector2(x, y).applyMatrix3(inverse);
  }

  containsPoint(x: number, y: number): boolean {
    return false;
  }

  hitTest(x: number, y: number): boolean {
    if (!this._visible) {
      return false;
    }
    const local = this.worldToLocal(x, y);
    if (!local) {
      return false;
    }
    return this.containsPoint(local.x, local.y);
  }

  hitTestDeep(x: number, y: number): PuddiObject | null {
    if (!this._visible) {
      return null;
    }
    for (let i = this._children.length - 1; i >= 0; i--) {
      const child = this._children[i];
      if (!child) {
        continue;
      }
      const hit = child.hitTestDeep(x, y);
      if (hit) {
        return hit;
      }
    }
    if (this.hitTest(x, y)) {
      return this;
    }
    return null;
  }

  transform(ctx: CanvasRenderingContext2D): void {
    ctx.transform(
      this._scale_x,
      0,
      0,
      this._scale_y,
      this._position.x,
      this._position.y
    );
    ctx.rotate(this._rotation);
  }

  // subclasses should override this for their update code
  _updateSelf(timeElapsed: number): void {}

  update(timeElapsed: number): void {
    if (
      this._position.x !== this._targetPosition.x ||
      this._position.y !== this._targetPosition.y
    ) {
      const v = this._velocity * timeElapsed;
      const displacement = this._targetPosition.clone().sub(this._position);
      if (displacement.length() <= v) {
        this.setPosition(this._targetPosition.clone());
      } else {
        this.translate(displacement.normalize().multiplyScalar(v));
      }
    }

    this._updateSelf(timeElapsed);

    for (const o of this._children) {
      o.update(timeElapsed);
    }
  }

  delete(): void {
    for (const o of this._children) {
      o.delete();
    }
    if (this._parent) {
      this._parent.removeChild(this);
    } else {
      this._puddi.removeObject(this);
    }
  }

  getColor(): string {
    return this._color;
  }

  setColor(c: string): void {
    this._color = c;
  }

  _drawSelf(ctx: CanvasRenderingContext2D): void {}

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this._visible) {
      return;
    }
    ctx.save();
    this.transform(ctx);

    ctx.fillStyle = this._color;
    ctx.strokeStyle = this._color;

    // draw myself
    this._drawSelf(ctx);

    // draw children
    for (const o of this._children) {
      if (o.draw) {
        o.draw(ctx);
      }
    }

    ctx.restore();
  }

  setDraw(f: (this: this, ctx: CanvasRenderingContext2D) => void): void {
    this._drawSelf = f;
  }

  setUpdate(f: (this: this, timeElapsed: number) => void): void {
    this._updateSelf = f;
  }

  bringToFront(): void {
    if (this._parent) {
      reorderItem(this._parent._children, this, true);
    } else {
      const root = this._puddi.getRoot();
      const rootChildren = root.getChildren();
      if (rootChildren.indexOf(this) !== -1) {
        reorderItem(rootChildren, this, true);
        this._parent = root;
      } else {
        root.addChild(this);
      }
    }
  }

  sendToBack(): void {
    if (this._parent) {
      reorderItem(this._parent._children, this, false);
    } else {
      const root = this._puddi.getRoot();
      const rootChildren = root.getChildren();
      if (rootChildren.indexOf(this) !== -1) {
        reorderItem(rootChildren, this, false);
      } else {
        rootChildren.unshift(this);
      }
      this._parent = root;
    }
  }
}
