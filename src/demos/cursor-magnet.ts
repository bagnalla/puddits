import PuddiObject from '../puddi/puddiobject.js';
import Circle from '../circle.js';
import type { Vector2 } from 'three';
import type Puddi from '../puddi/puddi.js';

const MAGNET_COLORS = ['#2b8cff', '#ff5f7a', '#f5b82e', '#56dba4', '#915cff'];

function magnetGetMousePos(canvas: HTMLCanvasElement, evt: MouseEvent): Vector2 {
  const rect = canvas.getBoundingClientRect();
  return new THREE.Vector2(evt.clientX - rect.left, evt.clientY - rect.top);
}

function magnetHintY(canvas: HTMLCanvasElement): number {
  let y = 56;
  const controls = document.getElementById('demo-controls');
  if (controls) {
    const canvasRect = canvas.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    y = Math.max(controlsRect.bottom - canvasRect.top + 12, y);
  }
  return y;
}

export default function runCursorMagnetDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  const state = {
    pointer: new THREE.Vector2(canvas.width / 2, canvas.height / 2),
    active: false,
    repel: false,
  };

  const count = 40;
  const particles: Circle[] = [];
  const velocities: Vector2[] = [];
  const center = new THREE.Vector2(canvas.width / 2, canvas.height / 2);

  for (let i = 0; i < count; i++) {
    const particle = new Circle(puddi, null);
    const angle = (i / count) * Math.PI * 2;
    const radius = 80 + Math.random() * 140;
    particle.setPosition(
      new THREE.Vector2(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius)
    );
    particle.setScale(10 + Math.random() * 8);
    particle.setColor(MAGNET_COLORS[i % MAGNET_COLORS.length]);
    particles.push(particle);
    velocities.push(new THREE.Vector2(0, 0));
  }

  const hint = new PuddiObject(puddi, null);
  hint.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Move the mouse to attract the field (hold Shift to repel)', 16, magnetHintY(canvas));
    ctx.restore();
  });

  const animator = new PuddiObject(puddi, null);
  animator.setUpdate(function (msElapsed) {
    const dt = Math.min(msElapsed / 1000, 0.05);
    const pointer = state.pointer;
    const falloff = 260;
    const strength = state.active ? 320 : 120;
    const drag = 0.92;

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const pos = particle.getPosition();
      const vel = velocities[i];

      const dir = pointer.clone().sub(pos);
      const dist = Math.max(12, dir.length());
      const pull = Math.max(0, 1 - dist / falloff);
      dir.normalize();

      const polarity = state.active && state.repel ? -1 : 1;
      const force = dir.multiplyScalar(pull * strength * polarity);

      vel.add(force.multiplyScalar(dt));
      vel.multiplyScalar(drag);
      pos.add(vel.clone().multiplyScalar(dt));

      particle.setPosition(pos);
    }
  });

  function onMouseMove(evt: MouseEvent): void {
    state.pointer = magnetGetMousePos(canvas, evt);
    state.active = true;
  }

  function onMouseLeave(): void {
    state.active = false;
  }

  function onKeyDown(evt: KeyboardEvent): void {
    if (evt.key === 'Shift') {
      state.repel = true;
    }
  }

  function onKeyUp(evt: KeyboardEvent): void {
    if (evt.key === 'Shift') {
      state.repel = false;
    }
  }

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', onMouseLeave);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  return {
    onResize(nextCanvas: HTMLCanvasElement) {
      state.pointer = new THREE.Vector2(nextCanvas.width / 2, nextCanvas.height / 2);
    },
    dispose() {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    },
  };
}
