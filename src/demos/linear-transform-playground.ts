import PuddiObject from '../puddi/puddiobject.js';
import Circle from '../circle.js';
import Grid from '../edu/grid.js';
import Axis2D from '../edu/axis2d.js';
import Label from '../edu/label.js';
import VectorArrow from '../edu/vector-arrow.js';
import Tooltip from '../edu/tooltip.js';
import { makeDraggable } from '../edu/draggable.js';
import { makeSelectable } from '../edu/selectable.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

const LTP_HANDLE_RADIUS = 11;
const LTP_UNIT = 90;

function ltpRoundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export default function runLinearTransformPlaygroundDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  puddi.setCentered(true);
  puddi.clearTransform();

  const state = {
    canvas,
    basisX: new THREE.Vector2(LTP_UNIT, 0),
    basisY: new THREE.Vector2(0, -LTP_UNIT),
    snapToGrid: false,
    determinant: 1,
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

  const transformedGrid = new PuddiObject(puddi, root);
  transformedGrid.setDraw(function (ctx) {
    const ex = state.basisX;
    const ey = state.basisY;
    const range = 4;

    ctx.strokeStyle = 'rgba(0, 110, 255, 0.25)';
    ctx.lineWidth = 1;

    function drawLine(p1: Vector2, p2: Vector2): void {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    for (let u = -range; u <= range; u += 1) {
      const p1 = ex.clone().multiplyScalar(u).add(ey.clone().multiplyScalar(-range));
      const p2 = ex.clone().multiplyScalar(u).add(ey.clone().multiplyScalar(range));
      drawLine(p1, p2);
    }

    for (let v = -range; v <= range; v += 1) {
      const p1 = ey.clone().multiplyScalar(v).add(ex.clone().multiplyScalar(-range));
      const p2 = ey.clone().multiplyScalar(v).add(ex.clone().multiplyScalar(range));
      drawLine(p1, p2);
    }

    const p0 = new THREE.Vector2(0, 0);
    const p1 = ex.clone();
    const p2 = ex.clone().add(ey);
    const p3 = ey.clone();

    ctx.fillStyle = 'rgba(255, 183, 3, 0.25)';
    ctx.strokeStyle = 'rgba(255, 143, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  const basisArrowX = new VectorArrow(puddi, root, new THREE.Vector2(0, 0), state.basisX.clone());
  basisArrowX.setColor('#2176ff');
  basisArrowX.setLineWidth(3);

  const basisArrowY = new VectorArrow(puddi, root, new THREE.Vector2(0, 0), state.basisY.clone());
  basisArrowY.setColor('#ef476f');
  basisArrowY.setLineWidth(3);

  const sampleSource = new VectorArrow(
    puddi,
    root,
    new THREE.Vector2(0, 0),
    new THREE.Vector2(LTP_UNIT * 1.2, -LTP_UNIT * 0.8)
  );
  sampleSource.setColor('rgba(70, 70, 70, 0.45)');
  sampleSource.setLineWidth(1.6);

  const sampleTransformed = new VectorArrow(puddi, root, new THREE.Vector2(0, 0), new THREE.Vector2(0, 0));
  sampleTransformed.setColor('#2ecc71');
  sampleTransformed.setLineWidth(2.6);

  const handleX = new Circle(puddi, root);
  handleX.setScale(LTP_HANDLE_RADIUS);
  handleX.setColor('#2176ff');
  handleX.setPosition(state.basisX.clone());

  const handleY = new Circle(puddi, root);
  handleY.setScale(LTP_HANDLE_RADIUS);
  handleY.setColor('#ef476f');
  handleY.setPosition(state.basisY.clone());

  const tipX = new Tooltip(puddi, root, {
    text: '',
    size: 12,
    color: 'white',
    background: 'rgba(33, 118, 255, 0.85)',
    padding: 5,
  });

  const tipY = new Tooltip(puddi, root, {
    text: '',
    size: 12,
    color: 'white',
    background: 'rgba(239, 71, 111, 0.85)',
    padding: 5,
  });

  const snapLabel = new Label(puddi, root, {
    text: 'Snap: OFF (click)',
    size: 13,
    color: '#2f2f2f',
    align: 'right',
    baseline: 'top',
  });

  const hud = new PuddiObject(puddi, root);
  hud.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.font = '13px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Drag basis handles. Click top-right "Snap" label to quantize handle motion.', 16, 68);
    ctx.fillText(`det(A) = ${state.determinant.toFixed(3)} (${state.determinant >= 0 ? 'preserves' : 'flips'} orientation)`, 16, 88);
    ctx.restore();
  });

  function ltpHitHandle(position: Vector2, object: PuddiObject): boolean {
    return position.clone().sub(object.getPosition()).length() <= LTP_HANDLE_RADIUS + 2;
  }

  function ltpApplySnap(obj: Circle): void {
    if (!state.snapToGrid) {
      return;
    }
    const p = obj.getPosition().clone();
    obj.setPosition(new THREE.Vector2(ltpRoundTo(p.x, 10), ltpRoundTo(p.y, 10)));
  }

  function ltpSync() {
    state.basisX = handleX.getPosition().clone();
    state.basisY = handleY.getPosition().clone();

    basisArrowX.setEnd(state.basisX.clone());
    basisArrowY.setEnd(state.basisY.clone());

    const sourceU = 1.2;
    const sourceV = 0.8;
    const transformed = state.basisX.clone().multiplyScalar(sourceU).add(state.basisY.clone().multiplyScalar(sourceV));
    sampleTransformed.setEnd(transformed);

    const detPixels = state.basisX.x * state.basisY.y - state.basisX.y * state.basisY.x;
    state.determinant = detPixels / (LTP_UNIT * LTP_UNIT);

    tipX.setText(`e1=(${(state.basisX.x / LTP_UNIT).toFixed(2)}, ${(-state.basisX.y / LTP_UNIT).toFixed(2)})`);
    tipY.setText(`e2=(${(state.basisY.x / LTP_UNIT).toFixed(2)}, ${(-state.basisY.y / LTP_UNIT).toFixed(2)})`);
    tipX.setPosition(state.basisX.clone().add(new THREE.Vector2(12, -14)));
    tipY.setPosition(state.basisY.clone().add(new THREE.Vector2(12, -14)));

    snapLabel.setText(`Snap: ${state.snapToGrid ? 'ON' : 'OFF'} (click)`);
  }

  const updater = new PuddiObject(puddi, root);
  updater.setUpdate(function () {
    ltpSync();
  });

  const dragX = makeDraggable(puddi, handleX, {
    hitTest: ltpHitHandle,
    onDragStart() {
      handleX.bringToFront();
      handleX.setColor('#37a0ff');
    },
    onDrag() {
      ltpApplySnap(handleX);
    },
    onDragEnd() {
      handleX.setColor('#2176ff');
      ltpApplySnap(handleX);
    },
  });

  const dragY = makeDraggable(puddi, handleY, {
    hitTest: ltpHitHandle,
    onDragStart() {
      handleY.bringToFront();
      handleY.setColor('#ff6e8c');
    },
    onDrag() {
      ltpApplySnap(handleY);
    },
    onDragEnd() {
      handleY.setColor('#ef476f');
      ltpApplySnap(handleY);
    },
  });

  type SelectHandle = ReturnType<typeof makeSelectable>;
  let snapToggle: SelectHandle | null = null;
  snapToggle = makeSelectable(puddi, snapLabel, {
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
      state.snapToGrid = !state.snapToGrid;
      ltpApplySnap(handleX);
      ltpApplySnap(handleY);
      snapToggle?.setSelected(false);
    },
    maxClickMove: 4,
  });

  function onResize(nextCanvas: HTMLCanvasElement): void {
    state.canvas = nextCanvas;
    grid.setSize(nextCanvas.width, nextCanvas.height);
    axis.setExtents(nextCanvas.width / 2 - 24, nextCanvas.height / 2 - 24);
    snapLabel.setPosition(new THREE.Vector2(nextCanvas.width / 2 - 16, -nextCanvas.height / 2 + 22));
  }

  onResize(canvas);
  ltpSync();

  return {
    onResize,
    dispose() {
      dragX.detach();
      dragY.detach();
      if (snapToggle) {
        snapToggle.detach();
      }
      puddi.setCentered(false);
      puddi.clearTransform();
    },
  };
}
