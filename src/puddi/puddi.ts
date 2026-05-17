// Puddi graphics runtime. Each instance of puddi is associated with a
// canvas element.

import PuddiObject from './puddiobject.js';
import type { Vector2 } from 'three';

type PuddiState = {
  canvas: HTMLCanvasElement;
  scale: number;
  translate: Vector2;
  time: number;
  stopCycle: number;
  centered: boolean;
  timeScale: number;
  root: PuddiObject;
};

function update(tFrame: number, state: PuddiState): number {
  // compute the time elapsed since the last update
  const timeElapsed = (tFrame - state.time) * state.timeScale;

  // update the timestamp
  state.time = tFrame;

  // update all objects
  if (state.root) {
    state.root.update(timeElapsed);
  }
  return 0;
}

function centeredTranslate(state: PuddiState): Vector2 {
  return new THREE.Vector2(
    state.canvas.width / 2 + state.translate.x * state.scale,
    state.canvas.height / 2 + state.translate.y * state.scale
  );
}

function getModTranslate(state: PuddiState): Vector2 {
  if (state.centered) {
    return centeredTranslate(state);
  }

  return state.translate;
}

function draw(ctx: CanvasRenderingContext2D, state: PuddiState): void {
  // clear canvas
  const scaleInv = 1 / state.scale;
  const modTranslate = getModTranslate(state);
  ctx.clearRect(
    -modTranslate.x * scaleInv,
    -modTranslate.y * scaleInv,
    ctx.canvas.width * scaleInv,
    ctx.canvas.height * scaleInv
  );

  // draw all objects
  if (state.root && state.root.draw) {
    state.root.draw(ctx);
  }
}

export default class Puddi {
  private _ctx: CanvasRenderingContext2D;
  private _running: boolean;
  private _root: PuddiObject;
  private _state: PuddiState;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not acquire 2D context');
    }
    this._ctx = ctx;
    this._running = false;
    this._root = PuddiObject.createRoot(this);
    this._state = {
      canvas,
      scale: 1.0,
      translate: new THREE.Vector2(0.0, 0.0),
      time: 0,
      stopCycle: 0,
      centered: false, // scaling mode
      timeScale: 1.0,
      root: this._root,
    };
  }

  run(): void {
    if (this._running) {
      return;
    }

    // initialize this._time to the current time
    this._state.time = performance.now();

    const ctx = this._ctx;
    const state = this._state;
    this._running = true;

    const cycle = (tFrame: number) => {
      if (!this._running) {
        return;
      }

      // re-register for the next frame
      state.stopCycle = window.requestAnimationFrame(cycle);

      // update
      if (update(tFrame, state) < 0) {
        this.stop();
        return;
      }

      // draw
      draw(ctx, state);
    };

    // register the cycle function with the browser update loop
    this._state.stopCycle = window.requestAnimationFrame(cycle);
  }

  // deregister from the browser update loop
  stop(): void {
    if (!this._running) {
      return;
    }

    window.cancelAnimationFrame(this._state.stopCycle);
    this._state.stopCycle = 0;
    this._running = false;
  }

  // deregister and clear objects
  dispose(): void {
    this.stop();
    this._root.clearChildren();
  }

  clearObjects(): void {
    this._root.clearChildren();
  }

  // reregister with the browser update loop
  resume(): void {
    this.run();
  }

  addObject(o: PuddiObject): void {
    if (!o) {
      return;
    }
    this._root.addChild(o);
  }

  removeObject(o: PuddiObject): void {
    if (!o) {
      return;
    }
    const parent = o.getParent ? o.getParent() : null;
    if (parent) {
      parent.removeChild(o);
      return;
    }
    this._root.removeChild(o);
  }

  getCtx(): CanvasRenderingContext2D {
    return this._ctx;
  }

  setTimeScale(scale: number): void {
    this._state.timeScale = scale;
  }

  getTimeScale(): number {
    return this._state.timeScale;
  }

  refresh(): void {
    this._state.canvas.width += 0; // reset canvas transform
    const translate = getModTranslate(this._state);
    this._ctx.transform(
      this._state.scale,
      0,
      0,
      this._state.scale,
      translate.x,
      translate.y
    );
  }

  translate(t: Vector2): void {
    this._state.translate.x += t.x;
    this._state.translate.y += t.y;
    this.refresh();
  }

  translateScaled(t: Vector2): void {
    this._state.translate.x += t.x * (1 / this._state.scale);
    this._state.translate.y += t.y * (1 / this._state.scale);
    this.refresh();
  }

  scale(s: number): void {
    this._state.scale *= s;
    this.refresh();
  }

  scaleTranslated(s: number): void {
    this._state.scale *= s;
    this.refresh();
  }

  getScale(): number {
    return this._state.scale;
  }

  clearTransform(): void {
    this._state.scale = 1.0;
    this._state.translate = new THREE.Vector2(0, 0);
    this.refresh();
  }

  setCentered(b: boolean): void {
    this._state.centered = b;
  }

  getCentered(): boolean {
    return this._state.centered;
  }

  getTranslate(): Vector2 {
    return this._state.translate;
  }

  getRoot(): PuddiObject {
    return this._root;
  }

  hitTest(x: number, y: number): PuddiObject | null {
    const list = this._root.getChildren();
    for (let i = list.length - 1; i >= 0; i--) {
      const obj = list[i];
      if (obj && obj.hitTest && obj.hitTest(x, y)) {
        return obj;
      }
    }
    return null;
  }

  hitTestDeep(x: number, y: number): PuddiObject | null {
    if (!this._root || !this._root.hitTestDeep) {
      return null;
    }
    return this._root.hitTestDeep(x, y);
  }
}
