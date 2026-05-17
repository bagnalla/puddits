import PuddiObject from '../puddi/puddiobject.js';
import Circle from '../circle.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

function getPointer(canvas: HTMLCanvasElement, evt: MouseEvent): Vector2 {
  const rect = canvas.getBoundingClientRect();
  return new THREE.Vector2(evt.clientX - rect.left, evt.clientY - rect.top);
}

export default function runSpringChainDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  const state = {
    anchor: new THREE.Vector2(canvas.width / 2, canvas.height * 0.2),
    dragging: false,
    pointer: new THREE.Vector2(canvas.width / 2, canvas.height * 0.4),
  };

  const count = 14;
  const restLength = Math.min(canvas.width, canvas.height) * 0.05;
  const nodes: Circle[] = [];
  const velocities: Vector2[] = [];

  for (let i = 0; i < count; i++) {
    const node = new Circle(puddi, null);
    const scale = 10 + Math.max(0, 4 - i * 0.25);
    node.setScale(scale);
    node.setColor(i === 0 ? '#ff5f7a' : '#2b8cff');
    node.setPosition(
      new THREE.Vector2(state.anchor.x, state.anchor.y + restLength * i)
    );
    nodes.push(node);
    velocities.push(new THREE.Vector2(0, 0));
  }

  const rope = new PuddiObject(puddi, null);
  rope.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.beginPath();
    ctx.moveTo(state.anchor.x, state.anchor.y);
    for (const node of nodes) {
      const pos = node.getPosition();
      ctx.lineTo(pos.x, pos.y);
    }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });

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
    ctx.fillText('Drag the head to tug the chain', 16, y);
    ctx.restore();
  });

  const animator = new PuddiObject(puddi, null);
  animator.setUpdate(function (msElapsed) {
    const dt = Math.min(msElapsed / 1000, 0.05);

    const headPos = nodes[0].getPosition();
    if (state.dragging) {
      headPos.x = state.pointer.x;
      headPos.y = state.pointer.y;
      velocities[0].x = 0;
      velocities[0].y = 0;
      nodes[0].setPosition(headPos);
    } else {
      const toAnchor = state.anchor.clone().sub(headPos);
      velocities[0].add(toAnchor.multiplyScalar(8 * dt));
      velocities[0].multiplyScalar(0.9);
      nodes[0].setPosition(headPos.clone().add(velocities[0].clone().multiplyScalar(dt)));
    }

    for (let i = 1; i < nodes.length; i++) {
      const pos = nodes[i].getPosition();
      const prev = nodes[i - 1].getPosition();
      const delta = prev.clone().sub(pos);
      const dist = delta.length();
      if (dist > 0) {
        const stretch = dist - restLength;
        const force = delta.multiplyScalar((stretch / dist) * 6);
        velocities[i].add(force.multiplyScalar(dt));
      }

      velocities[i].y += 40 * dt;
      velocities[i].multiplyScalar(0.92);
      nodes[i].setPosition(pos.clone().add(velocities[i].clone().multiplyScalar(dt)));
    }
  });

  function onMouseDown(evt: MouseEvent): void {
    state.dragging = true;
    state.pointer = getPointer(canvas, evt);
  }

  function onMouseMove(evt: MouseEvent): void {
    if (!state.dragging) {
      return;
    }
    state.pointer = getPointer(canvas, evt);
  }

  function onMouseUp(): void {
    state.dragging = false;
  }

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  return {
    onResize(nextCanvas: HTMLCanvasElement) {
      state.anchor = new THREE.Vector2(nextCanvas.width / 2, nextCanvas.height * 0.2);
      state.pointer = new THREE.Vector2(nextCanvas.width / 2, nextCanvas.height * 0.4);
    },
    dispose() {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    },
  };
}
