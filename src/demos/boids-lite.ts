import PuddiObject from '../puddi/puddiobject.js';
import type { Vector2 } from 'three';
import type Puddi from '../puddi/puddi.js';

const BOIDS_PALETTE = ['#2b8cff', '#ff5f7a', '#f5b82e', '#56dba4', '#915cff'];

class Boid extends PuddiObject {
  _velocityVec: Vector2;

  constructor(puddi: Puddi, position: Vector2, velocity: Vector2, color: string) {
    super(puddi, null);
    this._velocityVec = velocity;
    this._color = color;
    this.setScale(14);
    this.setPosition(position.clone());
  }

  update(): void {}

  getVelocityVec(): Vector2 {
    return this._velocityVec;
  }

  setVelocityVec(v: Vector2) {
    this._velocityVec = v;
  }

  _drawSelf(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(0.6, 0);
    ctx.lineTo(-0.4, 0.35);
    ctx.lineTo(-0.4, -0.35);
    ctx.closePath();
    ctx.fillStyle = this._color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 0.05;
    ctx.stroke();
  }
}

function limit(v: Vector2, max: number): Vector2 {
  const len = v.length();
  if (len > max && len > 0) {
    v.multiplyScalar(max / len);
  }
  return v;
}

function steer(velocity: Vector2, desired: Vector2, maxForce: number): Vector2 {
  const steerVec = desired.clone().sub(velocity);
  return limit(steerVec, maxForce);
}

function randomVelocity(min: number, max: number): Vector2 {
  const angle = Math.random() * Math.PI * 2;
  const speed = min + Math.random() * (max - min);
  return new THREE.Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
}

function spawnBoids(puddi: Puddi, canvas: HTMLCanvasElement, count: number): Boid[] {
  const boids: Boid[] = [];
  for (let i = 0; i < count; i++) {
    const position = new THREE.Vector2(
      Math.random() * canvas.width,
      Math.random() * canvas.height
    );
    const velocity = randomVelocity(40, 90);
    const color = BOIDS_PALETTE[i % BOIDS_PALETTE.length];
    const boid = new Boid(puddi, position, velocity, color);
    boids.push(boid);
  }
  return boids;
}

export default function runBoidsLiteDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  const animator = new PuddiObject(puddi, null);
  const boids = spawnBoids(puddi, canvas, 36);

  const viewRadius = 90;
  const separationRadius = 26;
  const maxSpeed = 110;
  const maxForce = 60;
  const alignWeight = 0.9;
  const cohesionWeight = 0.6;
  const separationWeight = 1.4;

  animator.setUpdate(function (msElapsed) {
    const dt = Math.min(msElapsed / 1000, 0.05);

    for (const boid of boids) {
      const pos = boid.getPosition();
      const vel = boid.getVelocityVec();

      const alignment = new THREE.Vector2(0, 0);
      const cohesion = new THREE.Vector2(0, 0);
      const separation = new THREE.Vector2(0, 0);
      let neighborCount = 0;
      let sepCount = 0;

      for (const other of boids) {
        if (other === boid) {
          continue;
        }

        const otherPos = other.getPosition();
        const diff = otherPos.clone().sub(pos);
        const dist = diff.length();

        if (dist < viewRadius) {
          alignment.add(other.getVelocityVec());
          cohesion.add(otherPos);
          neighborCount += 1;

          if (dist < separationRadius && dist > 0) {
            const away = pos.clone().sub(otherPos).multiplyScalar(1 / dist);
            separation.add(away);
            sepCount += 1;
          }
        }
      }

      let alignForce = new THREE.Vector2(0, 0);
      let cohesionForce = new THREE.Vector2(0, 0);
      let separationForce = new THREE.Vector2(0, 0);

      if (neighborCount > 0) {
        const avgVel = alignment.multiplyScalar(1 / neighborCount);
        if (avgVel.length() > 0) {
          avgVel.normalize().multiplyScalar(maxSpeed);
          alignForce = steer(vel, avgVel, maxForce);
        }

        const center = cohesion.multiplyScalar(1 / neighborCount);
        const toCenter = center.sub(pos.clone());
        if (toCenter.length() > 0) {
          toCenter.normalize().multiplyScalar(maxSpeed);
          cohesionForce = steer(vel, toCenter, maxForce);
        }
      }

      if (sepCount > 0) {
        const avgAway = separation.multiplyScalar(1 / sepCount);
        if (avgAway.length() > 0) {
          avgAway.normalize().multiplyScalar(maxSpeed);
          separationForce = steer(vel, avgAway, maxForce);
        }
      }

      const acceleration = new THREE.Vector2(0, 0);
      acceleration.add(alignForce.multiplyScalar(alignWeight));
      acceleration.add(cohesionForce.multiplyScalar(cohesionWeight));
      acceleration.add(separationForce.multiplyScalar(separationWeight));

      const nextVel = vel.clone().add(acceleration.multiplyScalar(dt));
      limit(nextVel, maxSpeed);

      const nextPos = pos.clone().add(nextVel.clone().multiplyScalar(dt));
      const margin = 20;
      if (nextPos.x < -margin) {
        nextPos.x = canvas.width + margin;
      } else if (nextPos.x > canvas.width + margin) {
        nextPos.x = -margin;
      }

      if (nextPos.y < -margin) {
        nextPos.y = canvas.height + margin;
      } else if (nextPos.y > canvas.height + margin) {
        nextPos.y = -margin;
      }

      boid.setPosition(nextPos);
      boid.setVelocityVec(nextVel);
      boid.setRotation(Math.atan2(nextVel.y, nextVel.x));
    }
  });

  return {
    onResize(nextCanvas: HTMLCanvasElement) {
      for (const boid of boids) {
        const pos = boid.getPosition();
        pos.x = Math.min(Math.max(0, pos.x), nextCanvas.width);
        pos.y = Math.min(Math.max(0, pos.y), nextCanvas.height);
      }
    },
  };
}
