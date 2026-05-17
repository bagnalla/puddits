import PuddiObject from '../puddi/puddiobject.js';
import Square from '../square.js';
import Triangle from '../triangle.js';
import type Puddi from '../puddi/puddi.js';

export default function runOrbitingDemo(puddi: Puddi, canvas: HTMLCanvasElement) {

  // Everything orbits around the center
  
  const center = new PuddiObject(puddi, null);
  center.setPosition(new THREE.Vector2(canvas.width / 2.0, canvas.height / 2.0));
  center.setUpdate(function (msElapsed) {
    this.rotate((msElapsed / 1000) * 0.2);
  });

  // Square planet with square moon

  const orbitA = new PuddiObject(puddi, center);
  orbitA.setPosition(new THREE.Vector2(140, 0));
  orbitA.setUpdate(function (msElapsed) {
    this.rotate((msElapsed / 1000) * 1.2);
  });

  const planetA = new Square(puddi, orbitA);
  planetA.setScale(20);
  planetA.setColor('#2b8cff');

  const moonOrbit = new PuddiObject(puddi, orbitA);
  moonOrbit.setUpdate(function (msElapsed) {
    this.rotate((msElapsed / 1000) * 3.0);
  });

  const moon = new Square(puddi, moonOrbit);
  moon.setPosition(new THREE.Vector2(40, 0));
  moon.setScale(8);
  moon.setColor('#f5b82e');

  // Triangle planet
  
  const planetB = new Triangle(puddi, center);
  planetB.setPosition(new THREE.Vector2(-200, 0));
  planetB.setUpdate(function (msElapsed) {
    this.rotate((msElapsed / 1000) * 0.6);
  });
  planetB.setScale(35);
  planetB.setColor('#ff5f7a');

  return {
    onResize(nextCanvas: HTMLCanvasElement) {
      center.setPosition(
        new THREE.Vector2(nextCanvas.width / 2.0, nextCanvas.height / 2.0)
      );
    },
  };
}
