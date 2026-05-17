import PuddiObject from '../puddi/puddiobject.js';
import Circle from '../circle.js';
import Grid from '../edu/grid.js';
import Axis2D from '../edu/axis2d.js';
import Label from '../edu/label.js';
import Tooltip from '../edu/tooltip.js';
import { makeDraggable } from '../edu/draggable.js';
import type { Vector2 } from 'three';
import type Puddi from '../puddi/puddi.js';

const BC_HANDLE_RADIUS = 10;

function bcLerp(a: Vector2, b: Vector2, t: number): Vector2 {
  return a.clone().multiplyScalar(1 - t).add(b.clone().multiplyScalar(t));
}

function bcPointOnCubic(
  p0: Vector2,
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
  t: number
): Vector2 {
  const it = 1 - t;
  return p0
    .clone()
    .multiplyScalar(it * it * it)
    .add(p1.clone().multiplyScalar(3 * it * it * t))
    .add(p2.clone().multiplyScalar(3 * it * t * t))
    .add(p3.clone().multiplyScalar(t * t * t));
}

export default function runBezierCasteljauDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  puddi.setCentered(true);
  puddi.clearTransform();

  const state = {
    canvas,
    t: 0,
    tDirection: 1,
    paused: false,
  };

  const root = new PuddiObject(puddi, null);

  const grid = new Grid(puddi, root, {
    spacing: 20,
    majorSpacing: 100,
    centered: true,
    color: 'rgba(0, 0, 0, 0.08)',
    majorColor: 'rgba(0, 0, 0, 0.16)',
  });

  const axis = new Axis2D(puddi, root, {
    tickSpacing: 20,
    labelEvery: 5,
    showLabels: true,
    font: '11px sans-serif',
  });
  axis.setColor('rgba(0, 0, 0, 0.6)');

  const controlPoints = [
    new THREE.Vector2(-230, 120),
    new THREE.Vector2(-80, -160),
    new THREE.Vector2(100, 150),
    new THREE.Vector2(240, -80),
  ];

  const handles: Circle[] = [];
  const labels: Label[] = [];
  const handleColors = ['#ef476f', '#f39c12', '#06d6a0', '#2176ff'];

  for (let i = 0; i < controlPoints.length; i += 1) {
    const handle = new Circle(puddi, root);
    handle.setScale(BC_HANDLE_RADIUS);
    handle.setColor(handleColors[i]);
    handle.setPosition(controlPoints[i].clone());
    handles.push(handle);

    const label = new Label(puddi, root, {
      text: `P${i}`,
      size: 12,
      color: '#2f2f2f',
      align: 'center',
      baseline: 'bottom',
    });
    labels.push(label);
  }

  const curve = new PuddiObject(puddi, root);
  curve.setDraw(function (ctx) {
    const p0 = handles[0].getPosition();
    const p1 = handles[1].getPosition();
    const p2 = handles[2].getPosition();
    const p3 = handles[3].getPosition();

    ctx.strokeStyle = 'rgba(80, 80, 80, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.stroke();

    ctx.strokeStyle = '#1155cc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 120; i += 1) {
      const t = i / 120;
      const point = bcPointOnCubic(p0, p1, p2, p3, t);
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.stroke();
  });

  const construction = new PuddiObject(puddi, root);
  construction.setDraw(function (ctx) {
    const t = state.t;
    const p0 = handles[0].getPosition();
    const p1 = handles[1].getPosition();
    const p2 = handles[2].getPosition();
    const p3 = handles[3].getPosition();

    const p01 = bcLerp(p0, p1, t);
    const p12 = bcLerp(p1, p2, t);
    const p23 = bcLerp(p2, p3, t);

    const p012 = bcLerp(p01, p12, t);
    const p123 = bcLerp(p12, p23, t);

    const p = bcLerp(p012, p123, t);

    ctx.strokeStyle = 'rgba(231, 76, 60, 0.65)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(p01.x, p01.y);
    ctx.lineTo(p12.x, p12.y);
    ctx.lineTo(p23.x, p23.y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(142, 68, 173, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p012.x, p012.y);
    ctx.lineTo(p123.x, p123.y);
    ctx.stroke();

    ctx.fillStyle = '#8e44ad';
    ctx.beginPath();
    ctx.arc(p012.x, p012.y, 4, 0, Math.PI * 2);
    ctx.arc(p123.x, p123.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
    ctx.fill();
  });

  const tip = new Tooltip(puddi, root, {
    text: '',
    size: 12,
    color: 'white',
    background: 'rgba(0, 0, 0, 0.8)',
    padding: 6,
  });

  const hud = new PuddiObject(puddi, root);
  hud.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.font = '13px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Drag P0..P3. Space toggles animation of t for De Casteljau steps.', 16, 68);
    ctx.fillText(`t = ${state.t.toFixed(3)} (${state.paused ? 'paused' : 'running'})`, 16, 88);
    ctx.restore();
  });

  function bcSync() {
    for (let i = 0; i < handles.length; i += 1) {
      const p = handles[i].getPosition();
      labels[i].setPosition(p.clone().add(new THREE.Vector2(0, -12)));
    }

    const p0 = handles[0].getPosition();
    const p1 = handles[1].getPosition();
    const p2 = handles[2].getPosition();
    const p3 = handles[3].getPosition();
    const point = bcPointOnCubic(p0, p1, p2, p3, state.t);
    tip.setText(`B(t)=(${point.x.toFixed(1)}, ${(-point.y).toFixed(1)})`);
    tip.setPosition(point.clone().add(new THREE.Vector2(12, -14)));
  }

  const updater = new PuddiObject(puddi, root);
  updater.setUpdate(function (msElapsed) {
    if (!state.paused) {
      state.t += state.tDirection * (msElapsed / 1800);
      if (state.t >= 1) {
        state.t = 1;
        state.tDirection = -1;
      } else if (state.t <= 0) {
        state.t = 0;
        state.tDirection = 1;
      }
    }
    bcSync();
  });

  const drags = handles.map((handle, i) =>
    makeDraggable(puddi, handle, {
      hitTest(position, object) {
        return position.clone().sub(object.getPosition()).length() <= BC_HANDLE_RADIUS + 2;
      },
      onDragStart() {
        handle.bringToFront();
        handle.setColor('#ff7f50');
      },
      onDragEnd() {
        handle.setColor(handleColors[i]);
      },
    })
  );

  function onKeyDown(evt: KeyboardEvent): void {
    if (evt.key === ' ') {
      evt.preventDefault();
      state.paused = !state.paused;
    }
  }

  document.addEventListener('keydown', onKeyDown);

  function onResize(nextCanvas: HTMLCanvasElement): void {
    state.canvas = nextCanvas;
    grid.setSize(nextCanvas.width, nextCanvas.height);
    axis.setExtents(nextCanvas.width / 2 - 24, nextCanvas.height / 2 - 24);
  }

  onResize(canvas);
  bcSync();

  return {
    onResize,
    dispose() {
      for (const drag of drags) {
        drag.detach();
      }
      document.removeEventListener('keydown', onKeyDown);
      puddi.setCentered(false);
      puddi.clearTransform();
    },
  };
}
