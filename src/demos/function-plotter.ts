import PuddiObject from '../puddi/puddiobject.js';
import Circle from '../circle.js';
import Grid from '../edu/grid.js';
import Axis2D from '../edu/axis2d.js';
import Label from '../edu/label.js';
import Tooltip from '../edu/tooltip.js';
import { makeDraggable } from '../edu/draggable.js';
import { makeSelectable } from '../edu/selectable.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

const FP_HANDLE_RADIUS = 9;
const FP_RAIL_TOP = -130;
const FP_RAIL_BOTTOM = 130;
type ParamKey = 'a' | 'b' | 'c';
type PlotMode = 'sine' | 'quadratic';
type DragHandle = ReturnType<typeof makeDraggable>;
type SelectHandle = ReturnType<typeof makeSelectable>;
type HandleConfig = {
  key: ParamKey;
  title: string;
  color: string;
  min: number;
  max: number;
  railX: number;
  obj: Circle | null;
  label: Label | null;
  drag: DragHandle | null;
};

function fpClamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function fpMap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (Math.abs(inMax - inMin) < 0.00001) {
    return outMin;
  }
  const t = (value - inMin) / (inMax - inMin);
  return outMin + (outMax - outMin) * t;
}

function fpGetWorldPosition(puddi: Puddi, evt: PointerEvent): Vector2 {
  const canvas = puddi.getCtx().canvas;
  const rect = canvas.getBoundingClientRect();
  const x = evt.clientX - rect.left;
  const y = evt.clientY - rect.top;
  const scale = puddi.getScale();
  const translate = puddi.getTranslate();
  const centered = puddi.getCentered ? puddi.getCentered() : false;
  const translateX = centered ? canvas.width / 2 + translate.x * scale : translate.x;
  const translateY = centered ? canvas.height / 2 + translate.y * scale : translate.y;
  return new THREE.Vector2((x - translateX) / scale, (y - translateY) / scale);
}

export default function runFunctionPlotterDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  puddi.setCentered(true);
  puddi.clearTransform();

  const state: {
    canvas: HTMLCanvasElement;
    mode: PlotMode;
    paused: boolean;
    pointerWorld: Vector2 | null;
    params: Record<ParamKey, number>;
    railsX: number[];
  } = {
    canvas,
    mode: 'sine',
    paused: false,
    pointerWorld: null,
    params: {
      a: 90,
      b: 1.5,
      c: 0,
    },
    railsX: [-260, -214, -168],
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

  function fpEval(x: number): number {
    if (state.mode === 'quadratic') {
      const u = x / 130;
      return state.params.a * u * u + state.params.b * 45 * u + state.params.c;
    }
    return state.params.a * Math.sin((x / 75) * state.params.b) + state.params.c;
  }

  const curve = new PuddiObject(puddi, root);
  curve.setDraw(function (ctx) {
    const width = state.canvas.width;
    const span = width / 2 - 10;

    ctx.strokeStyle = '#0b84f3';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let started = false;
    for (let x = -span; x <= span; x += 4) {
      const y = fpEval(x);
      if (!Number.isFinite(y)) {
        continue;
      }
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  });

  const rails = new PuddiObject(puddi, root);
  rails.setDraw(function (ctx) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1.4;
    for (const x of state.railsX) {
      ctx.beginPath();
      ctx.moveTo(x, FP_RAIL_TOP);
      ctx.lineTo(x, FP_RAIL_BOTTOM);
      ctx.stroke();
    }
  });

  const modeLabel = new Label(puddi, root, {
    text: '',
    size: 13,
    color: '#2f2f2f',
    align: 'right',
    baseline: 'top',
  });

  const handles: HandleConfig[] = [
    {
      key: 'a',
      title: 'A',
      color: '#ef476f',
      min: -140,
      max: 140,
      railX: state.railsX[0],
      obj: null,
      label: null,
      drag: null,
    },
    {
      key: 'b',
      title: 'B',
      color: '#06d6a0',
      min: -3.5,
      max: 3.5,
      railX: state.railsX[1],
      obj: null,
      label: null,
      drag: null,
    },
    {
      key: 'c',
      title: 'C',
      color: '#f39c12',
      min: -160,
      max: 160,
      railX: state.railsX[2],
      obj: null,
      label: null,
      drag: null,
    },
  ];

  for (const config of handles) {
    const handle = new Circle(puddi, root);
    handle.setScale(FP_HANDLE_RADIUS);
    handle.setColor(config.color);
    config.obj = handle;

    const label = new Label(puddi, root, {
      text: '',
      size: 12,
      color: '#333333',
      align: 'center',
      baseline: 'bottom',
    });
    config.label = label;

    const y = fpMap(state.params[config.key], config.min, config.max, FP_RAIL_BOTTOM, FP_RAIL_TOP);
    handle.setPosition(new THREE.Vector2(config.railX, y));

    config.drag = makeDraggable(puddi, handle, {
      hitTest(position, object) {
        return position.clone().sub(object.getPosition()).length() <= FP_HANDLE_RADIUS + 2;
      },
      onDragStart() {
        handle.bringToFront();
      },
      onDrag(_, object) {
        const pos = object.getPosition().clone();
        const clampedY = fpClamp(pos.y, FP_RAIL_TOP, FP_RAIL_BOTTOM);
        object.setPosition(new THREE.Vector2(config.railX, clampedY));
      },
    });
  }

  const probeDot = new Circle(puddi, root);
  probeDot.setScale(6);
  probeDot.setColor('#1f2a44');
  probeDot.setVisible(false);

  const probeTip = new Tooltip(puddi, root, {
    text: '',
    size: 12,
    color: 'white',
    background: 'rgba(0, 0, 0, 0.78)',
    padding: 6,
  });
  probeTip.setVisible(false);

  const hud = new PuddiObject(puddi, root);
  hud.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.font = '13px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Drag A/B/C handles. Click top-right mode label to switch sine/quadratic.', 16, 68);
    ctx.fillText('Hover anywhere to sample f(x). Press Space to pause curve updates.', 16, 88);
    ctx.restore();
  });

  let modeToggle: SelectHandle | null = null;
  modeToggle = makeSelectable(puddi, modeLabel, {
    hitTest(position, object) {
      const local = object.worldToLocal(position.x, position.y);
      if (!local) {
        return false;
      }
      return object.containsPoint(local.x, local.y);
    },
    onChange(selected) {
      if (!selected) {
        return;
      }
      state.mode = state.mode === 'sine' ? 'quadratic' : 'sine';
      if (modeToggle) {
        modeToggle.setSelected(false);
      }
    },
  });

  function fpSyncParamsFromHandles() {
    if (state.paused) {
      return;
    }

    for (const config of handles) {
      if (!config.obj || !config.label) {
        continue;
      }
      const y = config.obj.getPosition().y;
      state.params[config.key] = fpMap(y, FP_RAIL_BOTTOM, FP_RAIL_TOP, config.min, config.max);
      config.label.setText(`${config.title}: ${state.params[config.key].toFixed(2)}`);
      config.label.setPosition(new THREE.Vector2(config.railX, FP_RAIL_TOP - 6));
    }

    modeLabel.setText(`Mode: ${state.mode} (click)`);
  }

  function fpSyncProbe() {
    if (!state.pointerWorld) {
      probeDot.setVisible(false);
      probeTip.setVisible(false);
      return;
    }

    const x = state.pointerWorld.x;
    const y = fpEval(x);
    const maxY = state.canvas.height / 2 + 40;

    if (!Number.isFinite(y) || Math.abs(y) > maxY) {
      probeDot.setVisible(false);
      probeTip.setVisible(false);
      return;
    }

    const point = new THREE.Vector2(x, y);
    probeDot.setPosition(point);
    probeDot.setVisible(true);
    probeTip.setVisible(true);
    probeTip.setPosition(point.clone().add(new THREE.Vector2(12, -16)));
    probeTip.setText(`f(${x.toFixed(1)}) = ${(-y).toFixed(2)} math-y`);
  }

  const updater = new PuddiObject(puddi, root);
  updater.setUpdate(function () {
    fpSyncParamsFromHandles();
    fpSyncProbe();
  });

  function onPointerMove(evt: PointerEvent): void {
    state.pointerWorld = fpGetWorldPosition(puddi, evt);
  }

  function onPointerLeave(): void {
    state.pointerWorld = null;
  }

  function onKeyDown(evt: KeyboardEvent): void {
    if (evt.key === ' ') {
      evt.preventDefault();
      state.paused = !state.paused;
    }
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  document.addEventListener('keydown', onKeyDown);

  function onResize(nextCanvas: HTMLCanvasElement): void {
    state.canvas = nextCanvas;
    grid.setSize(nextCanvas.width, nextCanvas.height);
    axis.setExtents(nextCanvas.width / 2 - 24, nextCanvas.height / 2 - 24);

    const left = -nextCanvas.width / 2 + 70;
    state.railsX = [left, left + 46, left + 92];

    for (let i = 0; i < handles.length; i += 1) {
      const config = handles[i];
      config.railX = state.railsX[i];
      const y = fpMap(state.params[config.key], config.min, config.max, FP_RAIL_BOTTOM, FP_RAIL_TOP);
      if (config.obj) {
        config.obj.setPosition(new THREE.Vector2(config.railX, fpClamp(y, FP_RAIL_TOP, FP_RAIL_BOTTOM)));
      }
    }

    modeLabel.setPosition(new THREE.Vector2(nextCanvas.width / 2 - 16, -nextCanvas.height / 2 + 22));
  }

  onResize(canvas);

  return {
    onResize,
    dispose() {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('keydown', onKeyDown);

      for (const config of handles) {
        if (config.drag) {
          config.drag.detach();
        }
      }

      if (modeToggle) {
        modeToggle.detach();
      }
      puddi.setCentered(false);
      puddi.clearTransform();
    },
  };
}
