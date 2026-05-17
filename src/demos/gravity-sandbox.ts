import PuddiObject from '../puddi/puddiobject.js';
import Square from '../square.js';
import Circle from '../circle.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

const GRAVITY_COLORS = ['#2b8cff', '#ff5f7a', '#f5b82e', '#56dba4', '#915cff'];
type SpawnShape = 'circle' | 'square';

function sandboxGetMousePos(canvas: HTMLCanvasElement, evt: MouseEvent): Vector2 {
  const rect = canvas.getBoundingClientRect();
  return new THREE.Vector2(evt.clientX - rect.left, evt.clientY - rect.top);
}

function sandboxHintY(canvas: HTMLCanvasElement): number {
  let y = 56;
  const controls = document.getElementById('demo-controls');
  if (controls) {
    const canvasRect = canvas.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    y = Math.max(controlsRect.bottom - canvasRect.top + 12, y);
  }
  return y;
}

class Body {
  obj: Circle | Square;
  velocity: Vector2;
  size: number;
  shape: SpawnShape;

  constructor(
    puddi: Puddi,
    position: Vector2,
    velocity: Vector2,
    size: number,
    shape: SpawnShape,
    color: string
  ) {
    this.obj = shape === 'circle' ? new Circle(puddi, null) : new Square(puddi, null);
    this.obj.setPosition(position.clone());
    this.obj.setScale(size);
    this.obj.setColor(color);
    this.velocity = velocity;
    this.size = size;
    this.shape = shape;
  }
}

export default function runGravitySandboxDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  const state: {
    bodies: Body[];
    gravityOn: boolean;
    spawnShape: SpawnShape;
    canvas: HTMLCanvasElement;
  } = {
    bodies: [],
    gravityOn: true,
    spawnShape: 'circle',
    canvas,
  };

  const hint = new PuddiObject(puddi, null);
  hint.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Click to drop shapes • Press G to toggle gravity • Press C/S to switch shape', 16, sandboxHintY(canvas));
    ctx.restore();
  });

  const animator = new PuddiObject(puddi, null);
  animator.setUpdate(function (msElapsed) {
    const dt = Math.min(msElapsed / 1000, 0.05);
    const gravity = state.gravityOn ? 420 : 0;
    const damp = 0.72;
    const floor = state.canvas.height - 20;
    const left = 20;
    const right = state.canvas.width - 20;
    const top = 20;
    const restitution = 0.65;

    for (const body of state.bodies) {
      body.velocity.y += gravity * dt;
      const pos = body.obj.getPosition();
      pos.x += body.velocity.x * dt;
      pos.y += body.velocity.y * dt;

      const radius = body.size * 0.5;
      if (pos.y + radius > floor) {
        pos.y = floor - radius;
        body.velocity.y *= -damp;
      }
      if (pos.x - radius < left) {
        pos.x = left + radius;
        body.velocity.x *= -damp;
      }
      if (pos.x + radius > right) {
        pos.x = right - radius;
        body.velocity.x *= -damp;
      }
      if (pos.y - radius < top) {
        pos.y = top + radius;
        body.velocity.y *= -damp;
      }

      body.obj.setPosition(pos);
    }

    for (let i = 0; i < state.bodies.length; i++) {
      for (let j = i + 1; j < state.bodies.length; j++) {
        const a = state.bodies[i];
        const b = state.bodies[j];
        const posA = a.obj.getPosition();
        const posB = b.obj.getPosition();
        const delta = posB.clone().sub(posA);
        const dist = delta.length();
        const minDist = a.size * 0.5 + b.size * 0.5;

        if (dist === 0 || dist >= minDist) {
          continue;
        }

        const normal = delta.clone().multiplyScalar(1 / dist);
        const overlap = minDist - dist;
        const correction = normal.clone().multiplyScalar(overlap * 0.5);
        posA.add(correction.clone().multiplyScalar(-1));
        posB.add(correction);
        a.obj.setPosition(posA);
        b.obj.setPosition(posB);

        const relVel = new THREE.Vector2(
          b.velocity.x - a.velocity.x,
          b.velocity.y - a.velocity.y
        );
        const relAlongNormal = relVel.x * normal.x + relVel.y * normal.y;
        if (relAlongNormal > 0) {
          continue;
        }

        const massA = Math.max(1, a.size * a.size);
        const massB = Math.max(1, b.size * b.size);
        const impulseScalar =
          (-(1 + restitution) * relAlongNormal) / (1 / massA + 1 / massB);
        const impulse = normal.clone().multiplyScalar(impulseScalar);

        a.velocity.x -= impulse.x / massA;
        a.velocity.y -= impulse.y / massA;
        b.velocity.x += impulse.x / massB;
        b.velocity.y += impulse.y / massB;
      }
    }
  });

  function spawnBody(position: Vector2): void {
    const size = 16 + Math.random() * 18;
    const velocity = new THREE.Vector2((Math.random() - 0.5) * 120, Math.random() * -80);
    const color = GRAVITY_COLORS[Math.floor(Math.random() * GRAVITY_COLORS.length)];
    const body = new Body(puddi, position, velocity, size, state.spawnShape, color);
    state.bodies.push(body);
  }

  function onClick(evt: MouseEvent): void {
    const pos = sandboxGetMousePos(state.canvas, evt);
    spawnBody(pos);
  }

  function onKeyDown(evt: KeyboardEvent): void {
    if (evt.key === 'g' || evt.key === 'G') {
      state.gravityOn = !state.gravityOn;
      return;
    }
    if (evt.key === 'c' || evt.key === 'C') {
      state.spawnShape = 'circle';
      return;
    }
    if (evt.key === 's' || evt.key === 'S') {
      state.spawnShape = 'square';
    }
  }

  state.canvas.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeyDown);

  return {
    onResize(nextCanvas: HTMLCanvasElement) {
      state.canvas = nextCanvas;
    },
    dispose() {
      state.canvas.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
    },
  };
}
