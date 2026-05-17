import PuddiObject from '../puddi/puddiobject.js';
import Square from '../square.js';
import Triangle from '../triangle.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

type ShapeType = 'square' | 'triangle';
type DrawShape = Square | Triangle;

function makeShape(puddi: Puddi, parent: PuddiObject, type: ShapeType): DrawShape {
  if (type === 'triangle') {
    return new Triangle(puddi, parent);
  }
  return new Square(puddi, parent);
}

export default function runMouseDrawingDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  const state = {
    active: null as DrawShape | null,
    dragging: false,
    shapeType: 'square' as ShapeType,
    scale: 30,
  };

  const root = new PuddiObject(puddi, null);

  function placeShape(position: Vector2): void {
    const shape = makeShape(puddi, root, state.shapeType);
    shape.setScale(state.scale);
    shape.setPosition(position.clone());
    shape.setColor(state.shapeType === 'square' ? '#2b8cff' : '#ff5f7a');
    state.active = shape;
  }

  function getMousePos(evt: MouseEvent): Vector2 {
    const rect = canvas.getBoundingClientRect();
    return new THREE.Vector2(evt.clientX - rect.left, evt.clientY - rect.top);
  }

  function onMouseDown(evt: MouseEvent): void {
    evt.preventDefault();
    const pos = getMousePos(evt);
    placeShape(pos);
    state.dragging = true;
  }

  function onMouseMove(evt: MouseEvent): void {
    if (!state.dragging || !state.active) {
      return;
    }
    const pos = getMousePos(evt);
    state.active.setPosition(pos);
  }

  function onMouseUp(): void {
    state.dragging = false;
  }

  function onWheel(evt: WheelEvent): void {
    evt.preventDefault();
    if (evt.deltaY > 0) {
      state.scale = Math.max(5, state.scale * 0.9);
    } else {
      state.scale = Math.min(200, state.scale * 1.1);
    }
    if (state.active) {
      state.active.setScale(state.scale);
    }
  }

  function onKeyDown(evt: KeyboardEvent): void {
    if (evt.key === 't' || evt.key === 'T') {
      state.shapeType = 'triangle';
      return;
    }
    if (evt.key === 's' || evt.key === 'S') {
      state.shapeType = 'square';
      return;
    }
  }

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('keydown', onKeyDown);

  return {
    onResize() {},
    dispose() {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
      document.removeEventListener('keydown', onKeyDown);
    },
  };
}
