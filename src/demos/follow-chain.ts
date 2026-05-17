import PuddiObject from '../puddi/puddiobject.js';
import Triangle from '../triangle.js';
import Square from '../square.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

function bezierPoint(t: number, p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2): Vector2 {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return new THREE.Vector2(
    uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
  );
}

function createControlPoints(canvas: HTMLCanvasElement): [Vector2, Vector2, Vector2, Vector2] {
  const w = canvas.width;
  const h = canvas.height;
  const margin = Math.min(w, h) * 0.15;

  const p0 = new THREE.Vector2(margin, h * 0.75);
  const p1 = new THREE.Vector2(w * 0.25, margin);
  const p2 = new THREE.Vector2(w * 0.75, h - margin);
  const p3 = new THREE.Vector2(w - margin, h * 0.25);

  return [p0, p1, p2, p3];
}

export default function runFollowChainDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  const root = new PuddiObject(puddi, null);
  const state = {
    time: 0,
    points: createControlPoints(canvas),
  };

  const path = new PuddiObject(puddi, root);
  path.setDraw(function (ctx) {
    const [p0, p1, p2, p3] = state.points;
    if (!p0) {
      return;
    }
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  const leader = new Triangle(puddi, root);
  leader.setScale(18);
  leader.setColor('#ff5f7a');

  const followers: Square[] = [];
  const count = 14;
  for (let i = 0; i < count; i++) {
    const follower = new Square(puddi, root);
    const scale = Math.max(6, 16 - i * 0.6);
    follower.setScale(scale);
    follower.setVelocity(0.18 + i * 0.01);
    follower.setColor(`hsl(${210 - i * 8}, 80%, 55%)`);
    followers.push(follower);
  }

  root.setUpdate(function (msElapsed) {
    state.time += msElapsed / 1000;
    const t = (Math.sin(state.time * 0.6) + 1) / 2;
    const [p0, p1, p2, p3] = state.points;
    const pos = bezierPoint(t, p0, p1, p2, p3);
    leader.setPosition(pos);

    let prev: PuddiObject = leader;
    for (const follower of followers) {
      follower.setTargetPosition(prev.getPosition().clone());
      prev = follower;
    }
  });

  return {
    onResize(nextCanvas: HTMLCanvasElement) {
      state.points = createControlPoints(nextCanvas);
    },
  };
}
