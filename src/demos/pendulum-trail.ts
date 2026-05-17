import PuddiObject from '../puddi/puddiobject.js';
import Circle from '../circle.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

function createPendulumState(canvas: HTMLCanvasElement) {
  const length = Math.min(canvas.width, canvas.height) * 0.35;
  return {
    time: 0,
    length,
    anchor: new THREE.Vector2(canvas.width / 2, canvas.height * 0.2),
    angle: 0,
    bob: new THREE.Vector2(0, 0),
    trail: [] as Vector2[],
  };
}

export default function runPendulumTrailDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  const state = createPendulumState(canvas);

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
      ctx.strokeStyle = `rgba(43, 140, 255, ${0.15 * alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  const rod = new PuddiObject(puddi, null);
  rod.setDraw(function (ctx) {
    ctx.beginPath();
    ctx.moveTo(state.anchor.x, state.anchor.y);
    ctx.lineTo(state.bob.x, state.bob.y);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  });

  const anchor = new Circle(puddi, null);
  anchor.setScale(10);
  anchor.setPosition(state.anchor.clone());
  anchor.setColor('#444444');

  const bob = new Circle(puddi, null);
  bob.setScale(18);
  bob.setColor('#ff5f7a');

  const animator = new PuddiObject(puddi, null);
  animator.setUpdate(function (msElapsed) {
    state.time += msElapsed / 1000;
    state.angle = Math.sin(state.time * 1.3) * 0.8;

    const x = state.anchor.x + Math.sin(state.angle) * state.length;
    const y = state.anchor.y + Math.cos(state.angle) * state.length;
    state.bob = new THREE.Vector2(x, y);
    bob.setPosition(state.bob.clone());

    state.trail.push(state.bob.clone());
    if (state.trail.length > 160) {
      state.trail.shift();
    }
  });

  return {
    onResize(nextCanvas: HTMLCanvasElement) {
      const nextState = createPendulumState(nextCanvas);
      state.length = nextState.length;
      state.anchor = nextState.anchor;
      state.trail = [];
      anchor.setPosition(state.anchor.clone());
    },
  };
}
