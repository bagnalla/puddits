import PuddiObject from '../puddi/puddiobject.js';
import Circle from '../circle.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

function createLissajousState(canvas: HTMLCanvasElement) {
  return {
    time: 0,
    center: new THREE.Vector2(canvas.width / 2, canvas.height / 2),
    radiusX: canvas.width * 0.32,
    radiusY: canvas.height * 0.25,
    trail: [] as Vector2[],
  };
}

export default function runLissajousDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  const state = createLissajousState(canvas);

  const trail = new PuddiObject(puddi, null);
  trail.setDraw(function (ctx) {
    if (state.trail.length < 2) {
      return;
    }

    for (let i = 1; i < state.trail.length; i++) {
      const prev = state.trail[i - 1];
      const next = state.trail[i];
      const alpha = i / state.trail.length;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(next.x, next.y);
      ctx.strokeStyle = `rgba(255, 95, 122, ${0.2 * alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  const dot = new Circle(puddi, null);
  dot.setScale(10);
  dot.setColor('#2b8cff');

  const animator = new PuddiObject(puddi, null);
  animator.setUpdate(function (msElapsed) {
    state.time += msElapsed / 1000;
    const a = 2.0;
    const b = 3.0;
    const delta = Math.PI / 2;

    const x = state.center.x + Math.sin(a * state.time + delta) * state.radiusX;
    const y = state.center.y + Math.sin(b * state.time) * state.radiusY;
    const pos = new THREE.Vector2(x, y);

    dot.setPosition(pos.clone());
    state.trail.push(pos);
    if (state.trail.length > 220) {
      state.trail.shift();
    }
  });

  return {
    onResize(nextCanvas: HTMLCanvasElement) {
      state.center = new THREE.Vector2(nextCanvas.width / 2, nextCanvas.height / 2);
      state.radiusX = nextCanvas.width * 0.32;
      state.radiusY = nextCanvas.height * 0.25;
      state.trail = [];
    },
  };
}
