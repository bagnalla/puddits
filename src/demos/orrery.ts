import PuddiObject from '../puddi/puddiobject.js';
import Circle from '../circle.js';
import type Puddi from '../puddi/puddi.js';

function hintY(canvas: HTMLCanvasElement): number {
  let y = 56;
  const controls = document.getElementById('demo-controls');
  if (controls) {
    const canvasRect = canvas.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    y = Math.max(controlsRect.bottom - canvasRect.top + 12, y);
  }
  return y;
}

function buildOrbitingBody(
  puddi: Puddi,
  parent: PuddiObject,
  radius: number,
  color: string,
  orbitRadius: number,
  orbitSpeed: number
) {
  const orbit = new PuddiObject(puddi, parent);
  orbit.setUpdate(function (msElapsed) {
    orbit.rotate((msElapsed / 1000) * orbitSpeed);
  });

  const anchor = new PuddiObject(puddi, orbit);
  anchor.setPosition(new THREE.Vector2(orbitRadius, 0));

  const body = new Circle(puddi, anchor);
  body.setScale(radius);
  body.setColor(color);

  return { orbit, anchor, body };
}

export default function runOrreryDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  const root = new PuddiObject(puddi, null);
  root.setPosition(new THREE.Vector2(canvas.width / 2, canvas.height / 2));

  const star = new Circle(puddi, root);
  star.setScale(40);
  star.setColor('#f5b82e');

  const speedScale = 1.2;
  const planetA = buildOrbitingBody(puddi, root, 18, '#2b8cff', 140, 0.6 * speedScale);
  const planetB = buildOrbitingBody(puddi, root, 14, '#ff5f7a', 220, -0.4 * speedScale);
  const planetC = buildOrbitingBody(puddi, root, 12, '#56dba4', 300, 0.3 * speedScale);

  buildOrbitingBody(puddi, planetA.anchor, 6, '#915cff', 40, 1.8 * speedScale);
  buildOrbitingBody(puddi, planetB.anchor, 5, '#f5b82e', 34, -2.2 * speedScale);
  buildOrbitingBody(puddi, planetC.anchor, 5, '#2b8cff', 30, 2.6 * speedScale);

  const hint = new PuddiObject(puddi, null);
  hint.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Nested orbits: moons orbit planets, planets orbit the star', 16, hintY(canvas));
    ctx.restore();
  });

  return {
    onResize(nextCanvas: HTMLCanvasElement) {
      root.setPosition(new THREE.Vector2(nextCanvas.width / 2, nextCanvas.height / 2));
    },
  };
}
