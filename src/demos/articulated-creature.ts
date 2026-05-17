import PuddiObject from '../puddi/puddiobject.js';
import Circle from '../circle.js';
import Square from '../square.js';
import type Puddi from '../puddi/puddi.js';

function creatureHintY(canvas: HTMLCanvasElement): number {
  let y = 56;
  const controls = document.getElementById('demo-controls');
  if (controls) {
    const canvasRect = canvas.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    y = Math.max(controlsRect.bottom - canvasRect.top + 12, y);
  }
  return y;
}

function buildLeg(
  puddi: Puddi,
  parent: PuddiObject,
  upperLength: number,
  lowerLength: number,
  thickness: number,
  color: string
) {
  const hip = new PuddiObject(puddi, parent);

  const upper = new Square(puddi, hip);
  upper.setScaleX(upperLength);
  upper.setScaleY(thickness);
  upper.setColor(color);
  upper.setPosition(new THREE.Vector2(upperLength / 2, 0));

  const knee = new PuddiObject(puddi, hip);
  knee.setPosition(new THREE.Vector2(upperLength, 0));

  const lower = new Square(puddi, knee);
  lower.setScaleX(lowerLength);
  lower.setScaleY(thickness * 0.9);
  lower.setColor(color);
  lower.setPosition(new THREE.Vector2(lowerLength / 2, 0));

  const foot = new Circle(puddi, knee);
  foot.setScale(thickness * 0.8);
  foot.setColor('#444444');
  foot.setPosition(new THREE.Vector2(lowerLength, 0));

  return { hip, knee, upper, lower };
}

export default function runArticulatedCreatureDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  const root = new PuddiObject(puddi, null);
  root.setPosition(new THREE.Vector2(canvas.width / 2, canvas.height * 0.6));

  const body = new Square(puddi, root);
  body.setScaleX(120);
  body.setScaleY(40);
  body.setColor('#7bb5ff');

  const head = new Circle(puddi, root);
  head.setScale(24);
  head.setColor('#ff5f7a');
  head.setPosition(new THREE.Vector2(70, -24));

  const legOffsets = [-40, -10, 20, 50];
  type Leg = ReturnType<typeof buildLeg>;
  const legs: Leg[] = [];
  const legColors = ['#56dba4', '#f5b82e'];
  for (let i = 0; i < legOffsets.length; i++) {
    const leg = buildLeg(puddi, root, 40, 34, 12, legColors[i % legColors.length]);
    leg.hip.setPosition(new THREE.Vector2(legOffsets[i], 18));
    legs.push(leg);
  }

  const hint = new PuddiObject(puddi, null);
  hint.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Articulated creature: legs inherit parent motion', 16, creatureHintY(canvas));
    ctx.restore();
  });

  const animator = new PuddiObject(puddi, null);
  let time = 0;
  animator.setUpdate(function (msElapsed) {
    time += msElapsed / 1000;
    const bob = Math.sin(time * 2) * 6;
    root.setPosition(new THREE.Vector2(canvas.width / 2, canvas.height * 0.6 + bob));
    root.setRotation(Math.sin(time * 1.2) * 0.05);

    for (let i = 0; i < legs.length; i++) {
      const phase = i % 2 === 0 ? 0 : Math.PI;
      const swing = Math.sin(time * 3 + phase) * 0.6;
      const kneeBend = Math.cos(time * 3 + phase) * 0.4;
      legs[i].hip.setRotation(swing);
      legs[i].knee.setRotation(-kneeBend);
    }
  });

  return {
    onResize(nextCanvas: HTMLCanvasElement) {
      root.setPosition(new THREE.Vector2(nextCanvas.width / 2, nextCanvas.height * 0.6));
    },
  };
}
