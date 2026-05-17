import PuddiObject from '../puddi/puddiobject.js';
import Label from '../edu/label.js';
import Tooltip from '../edu/tooltip.js';
import { makeSelectable } from '../edu/selectable.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

type SortMode = 'bubble' | 'insertion';
type SortOp = {
  type: 'compare' | 'swap';
  i: number;
  j: number;
};

function svGetWorldPosition(puddi: Puddi, evt: PointerEvent): Vector2 {
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

function svBuildBubbleOps(values: number[]): SortOp[] {
  const arr = values.slice();
  const ops: SortOp[] = [];
  for (let i = 0; i < arr.length - 1; i += 1) {
    for (let j = 0; j < arr.length - i - 1; j += 1) {
      ops.push({ type: 'compare', i: j, j: j + 1 });
      if (arr[j] > arr[j + 1]) {
        ops.push({ type: 'swap', i: j, j: j + 1 });
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
      }
    }
  }
  return ops;
}

function svBuildInsertionOps(values: number[]): SortOp[] {
  const arr = values.slice();
  const ops: SortOp[] = [];
  for (let i = 1; i < arr.length; i += 1) {
    let j = i;
    while (j > 0) {
      ops.push({ type: 'compare', i: j - 1, j });
      if (arr[j - 1] <= arr[j]) {
        break;
      }
      ops.push({ type: 'swap', i: j - 1, j });
      const tmp = arr[j - 1];
      arr[j - 1] = arr[j];
      arr[j] = tmp;
      j -= 1;
    }
  }
  return ops;
}

export default function runSortingVisualizerDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  puddi.setCentered(false);
  puddi.clearTransform();

  class SortingBar extends PuddiObject {
    value: number;
    width: number;
    scaleY: number;
    pinned: boolean;
    active: boolean;

    constructor(runtime: Puddi, parent: PuddiObject, value: number, width: number, scaleY: number) {
      super(runtime, parent);
      this.value = value;
      this.width = width;
      this.scaleY = scaleY;
      this.pinned = false;
      this.active = false;
      this._color = '#3a86ff';
    }

    setGeometry(width: number, scaleY: number): void {
      this.width = width;
      this.scaleY = scaleY;
    }

    setActive(active: boolean): void {
      this.active = active;
    }

    setPinned(pinned: boolean): void {
      this.pinned = pinned;
    }

    _drawSelf(ctx: CanvasRenderingContext2D): void {
      const h = this.value * this.scaleY;
      const x = -this.width / 2;
      const y = -h;

      ctx.fillStyle = this.active ? '#ef476f' : this._color;
      ctx.fillRect(x, y, this.width, h);

      ctx.strokeStyle = this.pinned ? '#111111' : 'rgba(0, 0, 0, 0.32)';
      ctx.lineWidth = this.pinned ? 2 : 1;
      ctx.strokeRect(x, y, this.width, h);
    }

    containsPoint(x: number, y: number): boolean {
      const h = this.value * this.scaleY;
      return x >= -this.width / 2 && x <= this.width / 2 && y <= 0 && y >= -h;
    }
  }

  type SelectableHandle = ReturnType<typeof makeSelectable>;

  const state: {
    canvas: HTMLCanvasElement;
    mode: SortMode;
    paused: boolean;
    bars: SortingBar[];
    labels: Label[];
    selectables: SelectableHandle[];
    operations: SortOp[];
    operationIndex: number;
    elapsedMs: number;
    stepMs: number;
    highlightI: number;
    highlightJ: number;
    pointerWorld: Vector2 | null;
    baseline: number;
    leftPad: number;
    rightPad: number;
    topPad: number;
    bottomPad: number;
  } = {
    canvas,
    mode: 'bubble',
    paused: false,
    bars: [],
    labels: [],
    selectables: [],
    operations: [],
    operationIndex: 0,
    elapsedMs: 0,
    stepMs: 80,
    highlightI: -1,
    highlightJ: -1,
    pointerWorld: null,
    baseline: 0,
    leftPad: 28,
    rightPad: 28,
    topPad: 110,
    bottomPad: 24,
  };

  const root = new PuddiObject(puddi, null);
  const barRoot = new PuddiObject(puddi, root);

  const tip = new Tooltip(puddi, root, {
    text: '',
    size: 12,
    color: 'white',
    background: 'rgba(0, 0, 0, 0.8)',
    padding: 6,
  });
  tip.setVisible(false);

  const hud = new PuddiObject(puddi, root);
  hud.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.font = '13px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Sorting visualizer: press R to reshuffle, M to switch algorithm, Space to pause.', 16, 68);
    ctx.fillText(`Mode: ${state.mode}  Step: ${state.operationIndex}/${state.operations.length}`, 16, 88);
    ctx.restore();
  });

  function svDisposeBars() {
    for (const selectable of state.selectables) {
      selectable.detach();
    }
    state.selectables = [];
    state.labels = [];
    state.bars = [];
    barRoot.clearChildren();
  }

  function svCreateValues(count: number): number[] {
    const values: number[] = [];
    for (let i = 0; i < count; i += 1) {
      values.push(12 + Math.floor(Math.random() * 90));
    }
    return values;
  }

  function svLayoutBars() {
    const count = state.bars.length;
    const width = state.canvas.width - state.leftPad - state.rightPad;
    const slot = width / Math.max(1, count);
    const barWidth = Math.max(8, slot - 3);
    const drawHeight = state.canvas.height - state.topPad - state.bottomPad;
    const maxValue = Math.max(1, ...state.bars.map((bar) => bar.value));
    const scaleY = drawHeight / maxValue;

    state.baseline = state.canvas.height - state.bottomPad;

    for (let i = 0; i < count; i += 1) {
      const bar = state.bars[i];
      const x = state.leftPad + slot * i + slot * 0.5;
      bar.setPosition(new THREE.Vector2(x, state.baseline));
      bar.setGeometry(barWidth, scaleY);
      bar.setActive(i === state.highlightI || i === state.highlightJ);

      const label = state.labels[i];
      label.setText(String(bar.value));
      label.setPosition(new THREE.Vector2(0, -bar.value * scaleY - 6));
    }
  }

  function svRebuildScene() {
    svDisposeBars();

    const count = Math.max(16, Math.min(36, Math.floor((state.canvas.width - 80) / 24)));
    const values = svCreateValues(count);

    for (let i = 0; i < values.length; i += 1) {
      const bar = new SortingBar(puddi, barRoot, values[i], 16, 3);
      state.bars.push(bar);

      const label = new Label(puddi, bar, {
        text: String(values[i]),
        size: 10,
        color: '#242424',
        align: 'center',
        baseline: 'bottom',
      });
      state.labels.push(label);

      const selectable = makeSelectable(puddi, bar, {
        hitTest(position, object) {
          const local = object.worldToLocal(position.x, position.y);
          if (!local) {
            return false;
          }
          return object.containsPoint(local.x, local.y);
        },
        onChange(selected) {
          bar.setPinned(selected);
        },
      });
      state.selectables.push(selectable);
    }

    state.operations =
      state.mode === 'bubble'
        ? svBuildBubbleOps(state.bars.map((bar) => bar.value))
        : svBuildInsertionOps(state.bars.map((bar) => bar.value));

    state.operationIndex = 0;
    state.elapsedMs = 0;
    state.highlightI = -1;
    state.highlightJ = -1;

    svLayoutBars();
  }

  function svStepOperation() {
    if (state.operationIndex >= state.operations.length) {
      state.highlightI = -1;
      state.highlightJ = -1;
      return;
    }

    const op = state.operations[state.operationIndex];
    state.operationIndex += 1;

    state.highlightI = op.i;
    state.highlightJ = op.j;

    if (op.type === 'swap') {
      const tempBar = state.bars[op.i];
      state.bars[op.i] = state.bars[op.j];
      state.bars[op.j] = tempBar;

      const tempLabel = state.labels[op.i];
      state.labels[op.i] = state.labels[op.j];
      state.labels[op.j] = tempLabel;
    }
  }

  function svSyncTooltip() {
    if (!state.pointerWorld) {
      tip.setVisible(false);
      return;
    }

    for (let i = state.bars.length - 1; i >= 0; i -= 1) {
      const bar = state.bars[i];
      const local = bar.worldToLocal(state.pointerWorld.x, state.pointerWorld.y);
      if (!local || !bar.containsPoint(local.x, local.y)) {
        continue;
      }

      tip.setText(`index=${i} value=${bar.value}${bar.pinned ? ' pinned' : ''}`);
      tip.setPosition(state.pointerWorld.clone().add(new THREE.Vector2(10, -14)));
      tip.setVisible(true);
      return;
    }

    tip.setVisible(false);
  }

  const updater = new PuddiObject(puddi, root);
  updater.setUpdate(function (msElapsed) {
    if (!state.paused) {
      state.elapsedMs += msElapsed;
      while (state.elapsedMs >= state.stepMs) {
        state.elapsedMs -= state.stepMs;
        svStepOperation();
      }
    }

    svLayoutBars();
    svSyncTooltip();
  });

  function onPointerMove(evt: PointerEvent): void {
    state.pointerWorld = svGetWorldPosition(puddi, evt);
  }

  function onPointerLeave(): void {
    state.pointerWorld = null;
  }

  function onKeyDown(evt: KeyboardEvent): void {
    if (evt.key === ' ' || evt.key === 'Spacebar') {
      evt.preventDefault();
      state.paused = !state.paused;
      return;
    }

    if (evt.key === 'r' || evt.key === 'R') {
      svRebuildScene();
      return;
    }

    if (evt.key === 'm' || evt.key === 'M') {
      state.mode = state.mode === 'bubble' ? 'insertion' : 'bubble';
      svRebuildScene();
    }
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  document.addEventListener('keydown', onKeyDown);

  function onResize(nextCanvas: HTMLCanvasElement): void {
    state.canvas = nextCanvas;
    svRebuildScene();
  }

  onResize(canvas);

  return {
    onResize,
    dispose() {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('keydown', onKeyDown);
      svDisposeBars();
      puddi.setCentered(false);
      puddi.clearTransform();
    },
  };
}
