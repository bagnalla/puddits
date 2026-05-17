import PuddiObject from '../puddi/puddiobject.js';
import Circle from '../circle.js';
import Grid from '../edu/grid.js';
import Axis2D from '../edu/axis2d.js';
import VectorArrow from '../edu/vector-arrow.js';
import Tooltip from '../edu/tooltip.js';
import { makeDraggable } from '../edu/draggable.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

const VD_HANDLE_RADIUS = 12;
const VD_MAX_RADIUS = 280;

function vdClampMagnitude(v: Vector2, maxLen: number): Vector2 {
  const len = v.length();
  if (len <= maxLen || len <= 0.0001) {
    return v;
  }
  return v.multiplyScalar(maxLen / len);
}

export default function runVectorDecompositionDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  puddi.setCentered(true);
  puddi.clearTransform();

  const state = {
    canvas,
    vector: new THREE.Vector2(140, -90),
    projectionLength: 0,
    mathY: 0,
  };

  const root = new PuddiObject(puddi, null);

  const grid = new Grid(puddi, root, {
    spacing: 20,
    majorSpacing: 100,
    lineWidth: 1,
    majorLineWidth: 1.4,
    color: 'rgba(0, 0, 0, 0.08)',
    majorColor: 'rgba(0, 0, 0, 0.16)',
    centered: true,
  });

  const axis = new Axis2D(puddi, root, {
    tickSpacing: 20,
    tickSize: 4,
    lineWidth: 1.4,
    labelEvery: 5,
    showTicks: true,
    showLabels: true,
    font: '11px sans-serif',
    labelColor: 'rgba(0, 0, 0, 0.55)',
  });
  axis.setColor('rgba(0, 0, 0, 0.65)');

  const mainArrow = new VectorArrow(puddi, root, new THREE.Vector2(0, 0), state.vector.clone());
  mainArrow.setColor('#1f77b4');
  mainArrow.setLineWidth(3);

  const xArrow = new VectorArrow(puddi, root, new THREE.Vector2(0, 0), new THREE.Vector2(state.vector.x, 0));
  xArrow.setColor('#f39c12');
  xArrow.setLineWidth(2.2);

  const yArrow = new VectorArrow(
    puddi,
    root,
    new THREE.Vector2(state.vector.x, 0),
    state.vector.clone()
  );
  yArrow.setColor('#2ecc71');
  yArrow.setLineWidth(2.2);

  const basisDirection = new THREE.Vector2(1, -1).normalize();
  const basisArrow = new VectorArrow(
    puddi,
    root,
    new THREE.Vector2(0, 0),
    basisDirection.clone().multiplyScalar(170)
  );
  basisArrow.setColor('rgba(120, 120, 120, 0.7)');
  basisArrow.setLineWidth(1.5);

  const projArrow = new VectorArrow(puddi, root, new THREE.Vector2(0, 0), new THREE.Vector2(0, 0));
  projArrow.setColor('#8e44ad');
  projArrow.setLineWidth(2.5);

  const handle = new Circle(puddi, root);
  handle.setScale(VD_HANDLE_RADIUS);
  handle.setPosition(state.vector.clone());
  handle.setColor('#ff5f7a');

  const tip = new Tooltip(puddi, root, {
    text: '',
    size: 12,
    color: 'white',
    align: 'left',
    baseline: 'alphabetic',
    background: 'rgba(0, 0, 0, 0.78)',
    padding: 6,
  });

  const hud = new PuddiObject(puddi, root);
  hud.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.font = '13px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Drag the pink point to decompose vector components and projection.', 16, 68);
    ctx.fillText(
      `v = (${state.vector.x.toFixed(1)}, ${state.mathY.toFixed(1)})  |v| = ${state.vector.length().toFixed(2)}`,
      16,
      88
    );
    ctx.fillText(`proj(v, u) where u = (1, 1)/sqrt(2): ${state.projectionLength.toFixed(2)}`, 16, 108);
    ctx.restore();
  });

  function vdSync() {
    state.vector = vdClampMagnitude(handle.getPosition().clone(), VD_MAX_RADIUS);
    handle.setPosition(state.vector.clone());

    const projLen = state.vector.dot(basisDirection);
    const proj = basisDirection.clone().multiplyScalar(projLen);
    state.projectionLength = projLen;
    state.mathY = -state.vector.y;

    mainArrow.setEnd(state.vector.clone());
    xArrow.setEnd(new THREE.Vector2(state.vector.x, 0));
    yArrow.setStart(new THREE.Vector2(state.vector.x, 0));
    yArrow.setEnd(state.vector.clone());
    projArrow.setEnd(proj);

    tip.setText(`x=${state.vector.x.toFixed(1)} y=${state.mathY.toFixed(1)}`);
    tip.setPosition(state.vector.clone().add(new THREE.Vector2(14, -16)));
  }

  const updater = new PuddiObject(puddi, root);
  updater.setUpdate(function () {
    vdSync();
  });

  const dragControl = makeDraggable(puddi, handle, {
    hitTest(position, object) {
      return position.clone().sub(object.getPosition()).length() <= VD_HANDLE_RADIUS + 2;
    },
    onDragStart() {
      handle.setColor('#ff8662');
      handle.bringToFront();
    },
    onDrag() {
      handle.setPosition(vdClampMagnitude(handle.getPosition().clone(), VD_MAX_RADIUS));
    },
    onDragEnd() {
      handle.setColor('#ff5f7a');
    },
  });

  function onResize(nextCanvas: HTMLCanvasElement): void {
    state.canvas = nextCanvas;
    grid.setSize(nextCanvas.width, nextCanvas.height);
    axis.setExtents(nextCanvas.width / 2 - 24, nextCanvas.height / 2 - 24);
  }

  onResize(canvas);
  vdSync();

  return {
    onResize,
    dispose() {
      dragControl.detach();
      puddi.setCentered(false);
      puddi.clearTransform();
    },
  };
}
