import PuddiObject from '../puddi/puddiobject.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

const PALETTE = [
  [255, 95, 122],
  [43, 140, 255],
  [245, 184, 46],
  [86, 219, 164],
  [145, 92, 255],
];

class Particle extends PuddiObject {
  _velocityVec: Vector2;
  _life: number;
  _maxLife: number;
  _colorRgb: number[];
  _shape: string;
  _spin: number;

  constructor(
    puddi: Puddi,
    position: Vector2,
    velocity: Vector2,
    size: number,
    color: number[],
    life: number,
    shape: string
  ) {
    super(puddi, null);
    this.setPosition(position.clone());
    this.setScale(size);
    this._velocityVec = velocity;
    this._life = life;
    this._maxLife = life;
    this._colorRgb = color;
    this._shape = shape;
    this._spin = (Math.random() * 2 - 1) * 2.5;
  }

  update(timeElapsed: number): void {
    this._updateSelf(timeElapsed);
  }

  _updateSelf(timeElapsed: number): void {
    const s = timeElapsed / 1000;
    this.translate(this._velocityVec.clone().multiplyScalar(s));
    this._velocityVec.y += 120 * s;
    this._velocityVec.multiplyScalar(0.985);
    this.rotate(this._spin * s);

    this._life -= s;
    if (this._life <= 0) {
      this.delete();
    }
  }

  _drawSelf(ctx: CanvasRenderingContext2D): void {
    const alpha = Math.max(0, this._life / this._maxLife);
    const [r, g, b] = this._colorRgb;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

    if (this._shape === 'square') {
      ctx.fillRect(-0.5, -0.5, 1, 1);
      return;
    }

    ctx.beginPath();
    ctx.arc(0, 0, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent): Vector2 {
  const rect = canvas.getBoundingClientRect();
  return new THREE.Vector2(evt.clientX - rect.left, evt.clientY - rect.top);
}

function spawnBurst(puddi: Puddi, position: Vector2, count: number): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 180;
    const velocity = new THREE.Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
    const size = 6 + Math.random() * 14;
    const life = 0.6 + Math.random() * 1.2;
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const shape = Math.random() > 0.5 ? 'circle' : 'square';
    new Particle(puddi, position, velocity, size, color, life, shape);
  }
}

export default function runParticleBurstDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  const hint = new PuddiObject(puddi, null);
  hint.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
    let y = 56;
    const controls = document.getElementById('demo-controls');
    if (controls) {
      const canvasRect = canvas.getBoundingClientRect();
      const controlsRect = controls.getBoundingClientRect();
      y = Math.max(controlsRect.bottom - canvasRect.top + 12, y);
    }
    ctx.fillText('Click anywhere to trigger a burst', 16, y);
    ctx.restore();
  });

  function onClick(evt: MouseEvent): void {
    const pos = getMousePos(canvas, evt);
    spawnBurst(puddi, pos, 48);
  }

  canvas.addEventListener('click', onClick);

  // initial burst
  spawnBurst(
    puddi,
    new THREE.Vector2(canvas.width / 2, canvas.height / 2),
    60
  );

  return {
    onResize() {},
    dispose() {
      canvas.removeEventListener('click', onClick);
    },
  };
}
