import PuddiObject from '../puddi/puddiobject.js';
import Circle from '../circle.js';
import Grid from '../edu/grid.js';
import Axis2D from '../edu/axis2d.js';
import VectorArrow from '../edu/vector-arrow.js';
import Tooltip from '../edu/tooltip.js';
import Label from '../edu/label.js';
import { makeDraggable } from '../edu/draggable.js';
import { makeSelectable } from '../edu/selectable.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

const DPP_HANDLE_RADIUS = 11;

function dppAngleDelta(fromAngle: number, toAngle: number): number {
  let delta = toAngle - fromAngle;
  while (delta > Math.PI) {
    delta -= Math.PI * 2;
  }
  while (delta < -Math.PI) {
    delta += Math.PI * 2;
  }
  return delta;
}

export default function runDotProductProjectionDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  puddi.setCentered(true);
  puddi.clearTransform();

  const state = {
    canvas,
    a: new THREE.Vector2(150, -60),
    b: new THREE.Vector2(95, -150),
    dot: 0,
    angleDeg: 0,
    projectionLength: 0,
    showRejection: true,
  };

  const root = new PuddiObject(puddi, null);

  const grid = new Grid(puddi, root, {
    spacing: 20,
    majorSpacing: 100,
    centered: true,
    color: 'rgba(0, 0, 0, 0.08)',
    majorColor: 'rgba(0, 0, 0, 0.17)',
  });

  const axis = new Axis2D(puddi, root, {
    tickSpacing: 20,
    labelEvery: 5,
    showLabels: true,
    font: '11px sans-serif',
  });
  axis.setColor('rgba(0, 0, 0, 0.6)');

  const aArrow = new VectorArrow(puddi, root, new THREE.Vector2(0, 0), state.a.clone());
  aArrow.setColor('#2176ff');
  aArrow.setLineWidth(3);

  const bArrow = new VectorArrow(puddi, root, new THREE.Vector2(0, 0), state.b.clone());
  bArrow.setColor('#ef476f');
  bArrow.setLineWidth(3);

  const projArrow = new VectorArrow(puddi, root, new THREE.Vector2(0, 0), new THREE.Vector2(0, 0));
  projArrow.setColor('#6d33ad');
  projArrow.setLineWidth(2.5);

  const rejectionArrow = new VectorArrow(puddi, root, new THREE.Vector2(0, 0), new THREE.Vector2(0, 0));
  rejectionArrow.setColor('#ff9f1c');
  rejectionArrow.setLineWidth(2.2);

  const angleArc = new PuddiObject(puddi, root);
  angleArc.setDraw(function (ctx) {
    const aLen = state.a.length();
    const bLen = state.b.length();
    if (aLen < 1 || bLen < 1) {
      return;
    }
    const a1 = Math.atan2(state.a.y, state.a.x);
    const a2 = Math.atan2(state.b.y, state.b.x);
    const delta = dppAngleDelta(a1, a2);
    const radius = 46;

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius, a1, a1 + delta, delta < 0);
    ctx.stroke();
  });

  const handleA = new Circle(puddi, root);
  handleA.setScale(DPP_HANDLE_RADIUS);
  handleA.setPosition(state.a.clone());
  handleA.setColor('#2176ff');

  const handleB = new Circle(puddi, root);
  handleB.setScale(DPP_HANDLE_RADIUS);
  handleB.setPosition(state.b.clone());
  handleB.setColor('#ef476f');

  const tipA = new Tooltip(puddi, root, {
    text: '',
    size: 12,
    color: 'white',
    background: 'rgba(33, 118, 255, 0.85)',
    padding: 5,
  });

  const tipB = new Tooltip(puddi, root, {
    text: '',
    size: 12,
    color: 'white',
    background: 'rgba(239, 71, 111, 0.85)',
    padding: 5,
  });

  const toggleLabel = new Label(puddi, root, {
    text: 'Rejection: ON (click)',
    size: 13,
    color: '#333333',
    align: 'right',
    baseline: 'top',
  });

  const hud = new PuddiObject(puddi, root);
  hud.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.font = '13px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Drag either vector endpoint. Click top-right label to toggle rejection.', 16, 68);
    ctx.fillText(`a·b = ${state.dot.toFixed(2)}   angle = ${state.angleDeg.toFixed(2)}°`, 16, 88);
    ctx.fillText(`|proj_a_on_b| = ${Math.abs(state.projectionLength).toFixed(2)}`, 16, 108);
    ctx.restore();
  });

  function dppHitHandle(position: Vector2, object: PuddiObject): boolean {
    return position.clone().sub(object.getPosition()).length() <= DPP_HANDLE_RADIUS + 2;
  }

  function dppSync() {
    state.a = handleA.getPosition().clone();
    state.b = handleB.getPosition().clone();

    const aLen = state.a.length();
    const bLen = state.b.length();
    const dot = state.a.dot(state.b);
    state.dot = dot;

    let projection = new THREE.Vector2(0, 0);
    let projectionLength = 0;

    if (bLen > 0.0001) {
      projectionLength = dot / bLen;
      projection = state.b.clone().normalize().multiplyScalar(projectionLength);
    }

    const rejection = state.a.clone().sub(projection);
    state.projectionLength = projectionLength;

    let angleDeg = 0;
    if (aLen > 0.0001 && bLen > 0.0001) {
      const c = Math.max(-1, Math.min(1, dot / (aLen * bLen)));
      angleDeg = Math.acos(c) * (180 / Math.PI);
    }
    state.angleDeg = angleDeg;

    aArrow.setEnd(state.a.clone());
    bArrow.setEnd(state.b.clone());
    projArrow.setEnd(projection);

    rejectionArrow.setStart(projection);
    rejectionArrow.setEnd(projection.clone().add(rejection));
    rejectionArrow.setVisible(state.showRejection && rejection.length() > 0.0001);
    toggleLabel.setText(`Rejection: ${state.showRejection ? 'ON' : 'OFF'} (click)`);

    tipA.setText(`a=(${state.a.x.toFixed(1)}, ${(-state.a.y).toFixed(1)})`);
    tipA.setPosition(state.a.clone().add(new THREE.Vector2(12, -14)));
    tipB.setText(`b=(${state.b.x.toFixed(1)}, ${(-state.b.y).toFixed(1)})`);
    tipB.setPosition(state.b.clone().add(new THREE.Vector2(12, -14)));
  }

  const updater = new PuddiObject(puddi, root);
  updater.setUpdate(function () {
    dppSync();
  });

  const dragA = makeDraggable(puddi, handleA, {
    hitTest: dppHitHandle,
    onDragStart() {
      handleA.bringToFront();
      handleA.setColor('#2ea0ff');
    },
    onDragEnd() {
      handleA.setColor('#2176ff');
    },
  });

  const dragB = makeDraggable(puddi, handleB, {
    hitTest: dppHitHandle,
    onDragStart() {
      handleB.bringToFront();
      handleB.setColor('#ff6b8a');
    },
    onDragEnd() {
      handleB.setColor('#ef476f');
    },
  });

  const selectableA = makeSelectable(puddi, handleA, {
    hitTest: dppHitHandle,
    onChange(selected) {
      handleA.setScale(selected ? DPP_HANDLE_RADIUS * 1.25 : DPP_HANDLE_RADIUS);
    },
  });

  const selectableB = makeSelectable(puddi, handleB, {
    hitTest: dppHitHandle,
    onChange(selected) {
      handleB.setScale(selected ? DPP_HANDLE_RADIUS * 1.25 : DPP_HANDLE_RADIUS);
    },
  });

  type SelectHandle = ReturnType<typeof makeSelectable>;
  let toggleSelectable: SelectHandle | null = null;
  toggleSelectable = makeSelectable(puddi, toggleLabel, {
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
      state.showRejection = !state.showRejection;
      toggleSelectable?.setSelected(false);
    },
    maxClickMove: 5,
  });

  function onResize(nextCanvas: HTMLCanvasElement): void {
    state.canvas = nextCanvas;
    grid.setSize(nextCanvas.width, nextCanvas.height);
    axis.setExtents(nextCanvas.width / 2 - 24, nextCanvas.height / 2 - 24);
    toggleLabel.setPosition(new THREE.Vector2(nextCanvas.width / 2 - 16, -nextCanvas.height / 2 + 22));
  }

  onResize(canvas);
  dppSync();

  return {
    onResize,
    dispose() {
      dragA.detach();
      dragB.detach();
      selectableA.detach();
      selectableB.detach();
      if (toggleSelectable) {
        toggleSelectable.detach();
      }
      puddi.setCentered(false);
      puddi.clearTransform();
    },
  };
}
