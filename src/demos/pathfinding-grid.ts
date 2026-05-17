import PuddiObject from '../puddi/puddiobject.js';
import Square from '../square.js';
import Circle from '../circle.js';
import Grid from '../edu/grid.js';
import Tooltip from '../edu/tooltip.js';
import { makeDraggable } from '../edu/draggable.js';
import { makeSelectable } from '../edu/selectable.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

const PFG_CELL_SIZE = 34;
type Coord = { c: number; r: number };
type GridCell = { c: number; r: number; key: string; obj: Square };
type CellControl = ReturnType<typeof makeSelectable>;

function pfgCellKey(c: number, r: number): string {
  return `${c},${r}`;
}

function pfgGetWorldPosition(puddi: Puddi, evt: PointerEvent): Vector2 {
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

export default function runPathfindingGridDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  puddi.setCentered(false);
  puddi.clearTransform();

  const state: {
    canvas: HTMLCanvasElement;
    originX: number;
    originY: number;
    cellSize: number;
    cols: number;
    rows: number;
    walls: Set<string>;
    start: Coord;
    end: Coord;
    cells: GridCell[];
    controls: CellControl[];
    dist: Map<string, number>;
    path: Set<string>;
    visited: Set<string>;
    dirty: boolean;
    pointerWorld: Vector2 | null;
  } = {
    canvas,
    originX: 24,
    originY: 88,
    cellSize: PFG_CELL_SIZE,
    cols: 0,
    rows: 0,
    walls: new Set(),
    start: { c: 1, r: 1 },
    end: { c: 8, r: 5 },
    cells: [],
    controls: [],
    dist: new Map(),
    path: new Set(),
    visited: new Set(),
    dirty: true,
    pointerWorld: null,
  };

  const root = new PuddiObject(puddi, null);

  const grid = new Grid(puddi, root, {
    centered: false,
    spacing: PFG_CELL_SIZE,
    majorSpacing: PFG_CELL_SIZE * 5,
    color: 'rgba(0, 0, 0, 0.08)',
    majorColor: 'rgba(0, 0, 0, 0.16)',
  });

  const boardRoot = new PuddiObject(puddi, root);

  const startMarker = new Circle(puddi, root);
  startMarker.setScale(state.cellSize * 0.26);
  startMarker.setColor('#2ecc71');

  const endMarker = new Circle(puddi, root);
  endMarker.setScale(state.cellSize * 0.26);
  endMarker.setColor('#ef476f');

  const hoverTip = new Tooltip(puddi, root, {
    text: '',
    size: 12,
    color: 'white',
    background: 'rgba(0, 0, 0, 0.78)',
    padding: 6,
  });
  hoverTip.setVisible(false);

  const hud = new PuddiObject(puddi, root);
  hud.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.font = '13px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Click cells to toggle walls. Drag start/end nodes. Press C to clear, R to randomize.', 16, 68);
    ctx.fillText(`Visited: ${state.visited.size}  Path length: ${state.path.size}`, 16, 88);
    ctx.restore();
  });

  function pfgWorldToCell(position: Vector2): Coord | null {
    const x = position.x - state.originX;
    const y = position.y - state.originY;
    const c = Math.floor(x / state.cellSize);
    const r = Math.floor(y / state.cellSize);
    if (c < 0 || c >= state.cols || r < 0 || r >= state.rows) {
      return null;
    }
    return { c, r };
  }

  function pfgCellCenter(c: number, r: number): Vector2 {
    return new THREE.Vector2(
      state.originX + c * state.cellSize + state.cellSize / 2,
      state.originY + r * state.cellSize + state.cellSize / 2
    );
  }

  function pfgClearBoard() {
    for (const control of state.controls) {
      control.detach();
    }
    state.controls = [];
    state.cells = [];
    boardRoot.clearChildren();
  }

  function pfgColorizeCells() {
    for (const cell of state.cells) {
      const key = pfgCellKey(cell.c, cell.r);
      const isStart = cell.c === state.start.c && cell.r === state.start.r;
      const isEnd = cell.c === state.end.c && cell.r === state.end.r;

      let color = '#f5f5f5';
      if (state.walls.has(key)) {
        color = '#3a3f52';
      } else if (state.visited.has(key)) {
        color = '#d7ecff';
      }
      if (state.path.has(key)) {
        color = '#ffd166';
      }
      if (isStart) {
        color = '#7cecb5';
      }
      if (isEnd) {
        color = '#ff8aa4';
      }

      cell.obj.setColor(color);
    }
  }

  function pfgBuildBoard() {
    pfgClearBoard();

    state.cols = Math.max(6, Math.floor((state.canvas.width - state.originX * 2) / state.cellSize));
    state.rows = Math.max(4, Math.floor((state.canvas.height - state.originY - 20) / state.cellSize));

    state.start.c = Math.min(state.start.c, state.cols - 1);
    state.start.r = Math.min(state.start.r, state.rows - 1);
    state.end.c = Math.min(state.end.c, state.cols - 1);
    state.end.r = Math.min(state.end.r, state.rows - 1);

    for (let r = 0; r < state.rows; r += 1) {
      for (let c = 0; c < state.cols; c += 1) {
        const square = new Square(puddi, boardRoot);
        square.setScale(state.cellSize - 2);
        square.setPosition(pfgCellCenter(c, r));

        const key = pfgCellKey(c, r);
        const cell: GridCell = { c, r, key, obj: square };
        state.cells.push(cell);

        const control = makeSelectable(puddi, square, {
          hitTest(position, object) {
            const local = object.worldToLocal(position.x, position.y);
            if (!local) {
              return false;
            }
            return object.containsPoint(local.x, local.y);
          },
          onChange(selected) {
            const isStart = c === state.start.c && r === state.start.r;
            const isEnd = c === state.end.c && r === state.end.r;
            if (isStart || isEnd) {
              control.setSelected(false);
              return;
            }

            if (selected) {
              state.walls.add(key);
            } else {
              state.walls.delete(key);
            }
            state.dirty = true;
          },
          maxClickMove: 5,
        });

        control.setSelected(state.walls.has(key));
        state.controls.push(control);
      }
    }

    state.dirty = true;
  }

  function pfgRecompute() {
    state.dist = new Map();
    state.path = new Set();
    state.visited = new Set();

    const startKey = pfgCellKey(state.start.c, state.start.r);
    const endKey = pfgCellKey(state.end.c, state.end.r);

    const queue: Coord[] = [{ c: state.start.c, r: state.start.r }];
    const prev = new Map<string, string>();
    state.dist.set(startKey, 0);
    state.visited.add(startKey);

    const dirs = [
      { dc: 1, dr: 0 },
      { dc: -1, dr: 0 },
      { dc: 0, dr: 1 },
      { dc: 0, dr: -1 },
    ];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        break;
      }
      const currentKey = pfgCellKey(current.c, current.r);
      if (currentKey === endKey) {
        break;
      }

      const currentDist = state.dist.get(currentKey) ?? 0;

      for (const dir of dirs) {
        const nc = current.c + dir.dc;
        const nr = current.r + dir.dr;
        if (nc < 0 || nc >= state.cols || nr < 0 || nr >= state.rows) {
          continue;
        }
        const nk = pfgCellKey(nc, nr);
        if (state.walls.has(nk) || state.dist.has(nk)) {
          continue;
        }

        state.dist.set(nk, currentDist + 1);
        state.visited.add(nk);
        prev.set(nk, currentKey);
        queue.push({ c: nc, r: nr });
      }
    }

    if (!state.dist.has(endKey)) {
      return;
    }

    let currentKey: string | null = endKey;
    while (currentKey) {
      state.path.add(currentKey);
      if (currentKey === startKey) {
        break;
      }
      currentKey = prev.get(currentKey) ?? null;
    }
  }

  function pfgSnapMarker(position: Vector2, markerType: 'start' | 'end') {
    const cell = pfgWorldToCell(position);
    if (!cell) {
      return;
    }

    const key = pfgCellKey(cell.c, cell.r);
    if (state.walls.has(key)) {
      return;
    }

    if (markerType === 'start') {
      state.start.c = cell.c;
      state.start.r = cell.r;
    } else {
      state.end.c = cell.c;
      state.end.r = cell.r;
    }
    state.dirty = true;
  }

  const dragStart = makeDraggable(puddi, startMarker, {
    hitTest(position, object) {
      return position.clone().sub(object.getPosition()).length() <= state.cellSize * 0.35;
    },
    onDrag(_, object) {
      pfgSnapMarker(object.getPosition(), 'start');
    },
    onDragEnd(position) {
      pfgSnapMarker(position, 'start');
    },
  });

  const dragEnd = makeDraggable(puddi, endMarker, {
    hitTest(position, object) {
      return position.clone().sub(object.getPosition()).length() <= state.cellSize * 0.35;
    },
    onDrag(_, object) {
      pfgSnapMarker(object.getPosition(), 'end');
    },
    onDragEnd(position) {
      pfgSnapMarker(position, 'end');
    },
  });

  const updater = new PuddiObject(puddi, root);
  updater.setUpdate(function () {
    if (state.dirty) {
      pfgRecompute();
      pfgColorizeCells();
      state.dirty = false;
    }

    startMarker.setPosition(pfgCellCenter(state.start.c, state.start.r));
    endMarker.setPosition(pfgCellCenter(state.end.c, state.end.r));

    if (!state.pointerWorld) {
      hoverTip.setVisible(false);
      return;
    }

    const cell = pfgWorldToCell(state.pointerWorld);
    if (!cell) {
      hoverTip.setVisible(false);
      return;
    }

    const key = pfgCellKey(cell.c, cell.r);
    const dist = state.dist.get(key);
    const heur = Math.abs(cell.c - state.end.c) + Math.abs(cell.r - state.end.r);
    let text = `(${cell.c}, ${cell.r})`;
    if (state.walls.has(key)) {
      text += ' wall';
    } else if (dist === undefined) {
      text += ' unreachable';
    } else {
      text += ` g=${dist} h=${heur}`;
    }

    hoverTip.setText(text);
    hoverTip.setPosition(state.pointerWorld.clone().add(new THREE.Vector2(12, -14)));
    hoverTip.setVisible(true);
  });

  function onPointerMove(evt: PointerEvent): void {
    state.pointerWorld = pfgGetWorldPosition(puddi, evt);
  }

  function onPointerLeave(): void {
    state.pointerWorld = null;
  }

  function onKeyDown(evt: KeyboardEvent): void {
    if (evt.key === 'c' || evt.key === 'C') {
      state.walls.clear();
      for (const control of state.controls) {
        control.setSelected(false);
      }
      state.dirty = true;
      return;
    }

    if (evt.key === 'r' || evt.key === 'R') {
      state.walls.clear();
      for (const control of state.controls) {
        control.setSelected(false);
      }

      for (let r = 0; r < state.rows; r += 1) {
        for (let c = 0; c < state.cols; c += 1) {
          const isStart = c === state.start.c && r === state.start.r;
          const isEnd = c === state.end.c && r === state.end.r;
          if (isStart || isEnd) {
            continue;
          }
          if (Math.random() < 0.18) {
            const key = pfgCellKey(c, r);
            state.walls.add(key);
          }
        }
      }

      for (const cell of state.cells) {
        const active = state.walls.has(cell.key);
        const control = state.controls[state.cells.indexOf(cell)];
        if (control) {
          control.setSelected(active);
        }
      }

      state.dirty = true;
    }
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  document.addEventListener('keydown', onKeyDown);

  function onResize(nextCanvas: HTMLCanvasElement): void {
    state.canvas = nextCanvas;
    grid.setSize(nextCanvas.width, nextCanvas.height);

    pfgBuildBoard();
    startMarker.setScale(state.cellSize * 0.26);
    endMarker.setScale(state.cellSize * 0.26);
  }

  onResize(canvas);

  return {
    onResize,
    dispose() {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('keydown', onKeyDown);
      dragStart.detach();
      dragEnd.detach();
      pfgClearBoard();
      puddi.setCentered(false);
      puddi.clearTransform();
    },
  };
}
