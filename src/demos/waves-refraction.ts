import PuddiObject from '../puddi/puddiobject.js';
import Circle from '../circle.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

const WAVES_COLORS = ['#2b8cff', '#56dba4', '#f5b82e', '#ff5f7a'];
type WaveCell = {
  obj: Circle;
  pos: Vector2;
  phase: number;
};
type Ripple = {
  origin: Vector2;
  start: number;
};
type WavesState = {
  time: number;
  baseScale: number;
  cells: WaveCell[];
  ripples: Ripple[];
};

function wavesGetMousePos(canvas: HTMLCanvasElement, evt: MouseEvent): Vector2 {
  const rect = canvas.getBoundingClientRect();
  return new THREE.Vector2(evt.clientX - rect.left, evt.clientY - rect.top);
}

function wavesBuildGrid(puddi: Puddi, canvas: HTMLCanvasElement) {
  const cells: WaveCell[] = [];
  const cols = Math.max(8, Math.floor(canvas.width / 60));
  const rows = Math.max(6, Math.floor(canvas.height / 60));
  const spacing = Math.min(canvas.width / (cols + 1), canvas.height / (rows + 1));
  const startX = (canvas.width - cols * spacing) / 2 + spacing / 2;
  const startY = (canvas.height - rows * spacing) / 2 + spacing / 2;
  const baseScale = Math.max(8, spacing * 0.28);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const circle = new Circle(puddi, null);
      const pos = new THREE.Vector2(startX + x * spacing, startY + y * spacing);
      circle.setPosition(pos.clone());
      circle.setScale(baseScale);
      circle.setColor(WAVES_COLORS[(x + y) % WAVES_COLORS.length]);
      cells.push({
        obj: circle,
        pos,
        phase: (x + y) * 0.35,
      });
    }
  }

  return { cells, baseScale };
}

function wavesHintY(canvas: HTMLCanvasElement): number {
  let y = 56;
  const controls = document.getElementById('demo-controls');
  if (controls) {
    const canvasRect = canvas.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    y = Math.max(controlsRect.bottom - canvasRect.top + 12, y);
  }
  return y;
}

function wavesBuildScene(puddi: Puddi, canvas: HTMLCanvasElement, state: WavesState): void {
  const grid = wavesBuildGrid(puddi, canvas);
  state.cells = grid.cells;
  state.baseScale = grid.baseScale;
  state.time = 0;
  state.ripples = [];

  const hint = new PuddiObject(puddi, null);
  hint.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Click to create a ripple', 16, wavesHintY(canvas));
    ctx.restore();
  });

  const originMarker = new PuddiObject(puddi, null);
  originMarker.setDraw(function (ctx) {
    if (state.ripples.length === 0) {
      return;
    }
    const latest = state.ripples[state.ripples.length - 1];
    const age = state.time - latest.start;
    if (age > 0.8) {
      return;
    }
    ctx.save();
    ctx.resetTransform();
    ctx.beginPath();
    ctx.arc(latest.origin.x, latest.origin.y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 0, 0, ${0.4 * (1 - age / 0.8)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });

  const animator = new PuddiObject(puddi, null);
  animator.setUpdate(function (msElapsed) {
    state.time += msElapsed / 1000;
    const speed = 240;
    const decay = 0.95;
    const amplitude = 1.7;
    const ringWidth = 58;

    const activeRipples: Ripple[] = [];
    for (const ripple of state.ripples) {
      const age = state.time - ripple.start;
      if (age < 2.6) {
        activeRipples.push(ripple);
      }
    }
    state.ripples = activeRipples;

    for (const cell of state.cells) {
      let offset = Math.sin(state.time * 1.05 + cell.phase) * 0.1;
      for (const ripple of state.ripples) {
        const age = state.time - ripple.start;
        const dist = cell.pos.clone().sub(ripple.origin).length();
        const travel = speed * age;
        const ringDist = Math.abs(dist - travel);
        if (ringDist < ringWidth) {
          const ring = 1 - ringDist / ringWidth;
          offset += ring * amplitude * Math.exp(-decay * age);
        }
      }

      const scale = Math.max(4, state.baseScale * (1 + offset));
      cell.obj.setScale(scale);
    }
  });
}

export default function runWavesRefractionDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  const state: WavesState = {
    time: 0,
    baseScale: 12,
    cells: [],
    ripples: [],
  };

  function onClick(evt: MouseEvent): void {
    const pos = wavesGetMousePos(canvas, evt);
    state.ripples.push({
      origin: pos,
      start: state.time,
    });
  }

  canvas.addEventListener('click', onClick);
  wavesBuildScene(puddi, canvas, state);

  return {
    onResize(nextCanvas: HTMLCanvasElement) {
      puddi.clearObjects();
      wavesBuildScene(puddi, nextCanvas, state);
    },
    dispose() {
      canvas.removeEventListener('click', onClick);
    },
  };
}
