import PuddiObject from '../puddi/puddiobject.js';
import Circle from '../circle.js';
import Square from '../square.js';
import type Puddi from '../puddi/puddi.js';

function mandalaHintY(canvas: HTMLCanvasElement): number {
  let y = 56;
  const controls = document.getElementById('demo-controls');
  if (controls) {
    const canvasRect = canvas.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    y = Math.max(controlsRect.bottom - canvasRect.top + 12, y);
  }
  return y;
}

function buildPetal(
  puddi: Puddi,
  parent: PuddiObject,
  length: number,
  width: number,
  color: string
) {
  const petal = new Square(puddi, parent);
  petal.setScaleX(length);
  petal.setScaleY(width);
  petal.setColor(color);
  petal.setPosition(new THREE.Vector2(length / 2, 0));

  const tip = new Circle(puddi, parent);
  tip.setScale(width * 0.65);
  tip.setColor(color);
  tip.setPosition(new THREE.Vector2(length, 0));

  return { petal, tip };
}

export default function runMandalaBloomDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  const root = new PuddiObject(puddi, null);
  root.setPosition(new THREE.Vector2(canvas.width / 2, canvas.height / 2));

  const hub = new Circle(puddi, root);
  hub.setScale(26);
  hub.setColor('#2b8cff');

  const ringCount = 2;
  const petalsPerRing = [12, 18];
  const ringRadius = [90, 140];
  const ringColors = ['#ff5f7a', '#f5b82e'];
  const petalGroups: Array<{ group: PuddiObject; arm: PuddiObject; sub: PuddiObject; phase: number }> = [];

  for (let r = 0; r < ringCount; r++) {
    for (let i = 0; i < petalsPerRing[r]; i++) {
      const group = new PuddiObject(puddi, root);
      const angle = (Math.PI * 2 * i) / petalsPerRing[r];
      group.setRotation(angle);
      group.setPosition(new THREE.Vector2(0, 0));

      const arm = new PuddiObject(puddi, group);
      arm.setPosition(new THREE.Vector2(ringRadius[r], 0));

      buildPetal(puddi, arm, 40 + r * 16, 12 - r * 2, ringColors[r]);

      const sub = new PuddiObject(puddi, arm);
      sub.setPosition(new THREE.Vector2(22 + r * 8, 0));
      sub.setRotation(Math.PI / 6);
      buildPetal(puddi, sub, 18, 6, '#56dba4');

      petalGroups.push({ group, arm, sub, phase: i * 0.3 + r });
    }
  }

  const hint = new PuddiObject(puddi, null);
  hint.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Mandala bloom: nested rotations and offsets', 16, mandalaHintY(canvas));
    ctx.restore();
  });

  const animator = new PuddiObject(puddi, null);
  let time = 0;
  animator.setUpdate(function (msElapsed) {
    time += msElapsed / 1000;
    root.setRotation(time * 0.2);
    for (const entry of petalGroups) {
      const pulse = (Math.sin(time * 2 + entry.phase) + 1) / 2;
      entry.arm.setRotation(pulse * 0.6 - 0.3);
      entry.sub.setRotation(-pulse * 0.8 + 0.4);
    }
  });

  return {
    onResize(nextCanvas: HTMLCanvasElement) {
      root.setPosition(new THREE.Vector2(nextCanvas.width / 2, nextCanvas.height / 2));
    },
  };
}
