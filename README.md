# puddi

Puddi is a minimal, object-oriented layer over the HTML5 canvas. It provides a tiny runtime loop plus a simple scene graph via `PuddiObject`.

## Design
There’s a single update/draw loop and a lightweight, hierarchical object tree. Each `PuddiObject` owns its transform (position, rotation, scale) and can have children. Child transforms are relative to their parent. By default, objects attach themselves when constructed: if you pass a parent, the object calls `parent.addChild(this)`; otherwise it attaches to the runtime root.

## Quickstart
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the bundle:
   ```bash
   npm run build
   ```
3. Open `index.html` directly in a browser.

Optional minified build:
```bash
npm run build:min
```

Type-check only:
```bash
npx tsc -p tsconfig.json --noEmit
```

## API Overview

### Puddi
Create a runtime bound to a canvas element and run the update/draw loop.

```js
import Puddi from './build/esm/puddi/puddi.js';

const canvas = document.getElementById('canvas');
const puddi = new Puddi(canvas);
puddi.run();
```

Methods:
- `constructor(canvas)`
- `run()` start the animation loop (idempotent).
- `stop()` stop the animation loop.
- `resume()` restart the animation loop.
- `dispose()` stop and clear all objects.
- `addObject(obj)` / `removeObject(obj)` manage root objects.
- `hitTest(x, y)` return the topmost root object whose `hitTest` succeeds.
- `hitTestDeep(x, y)` return the topmost object in the scene graph whose `hitTest` succeeds.
- `setTimeScale(scale)` / `getTimeScale()` adjust animation speed.
- `refresh()` reapply canvas transforms after scale/translate changes.
- `translate(v)` / `translateScaled(v)` move the global transform.
- `scale(s)` / `scaleTranslated(s)` scale the global transform.
- `getScale()` / `getTranslate()` access current transform state.
- `clearTransform()` reset scale/translate to identity.
- `setCentered(bool)` choose how the global transform is anchored. When `false`
  (the default), world coordinate `(0, 0)` maps to the canvas top-left plus
  the current translation. When `true`, world coordinate `(0, 0)` maps to the
  canvas center, and translation is applied in scaled world units from that
  center. Call `refresh()` (or any transform method that calls it) after
  changing this flag to apply it immediately.

### PuddiObject
Base class for renderable objects. Subclasses override `_drawSelf` and optionally `_updateSelf`.

```js
import PuddiObject from './build/esm/puddi/puddiobject.js';

class Dot extends PuddiObject {
  _drawSelf(ctx) {
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

Key methods:
- `constructor(puddi, parent)` attach to `parent` if non-null; otherwise attach to root.
- `draw(ctx)` / `update(dt)` called by the runtime.
- `setPosition(v)` / `translate(v)` / `rotate(r)` / `scale(s)`
- `setScaleX(s)` / `setScaleY(s)` / `setScale(s)`
- `setTargetPosition(v)` / `setVelocity(v)` for simple motion.
- `addChild(obj)` / `removeChild(obj)` / `clearChildren()`
- `setDraw(fn)` / `setUpdate(fn)` for simple inline behavior.
- `setVisible(bool)` / `isVisible()` toggle drawing.
- `containsPoint(x, y)` check a point in local coordinates (override in subclasses).
- `hitTest(x, y)` check a point in world coordinates using transforms.
- `hitTestDeep(x, y)` check children first (topmost hit), then self.
- `bringToFront()` / `sendToBack()` reorder within the parent or root list.

### Math Types
Puddi uses `three` for math primitives, directly referencing `THREE.Vector2` and `THREE.Matrix3` in both the runtime and demos.

### Education Helpers
Optional helpers live under `build/esm/edu/` and provide common teaching primitives: `Label`, `Tooltip`, `Grid`, `Axis2D`, `VectorArrow`, plus interaction helpers `makeDraggable` and `makeSelectable`.

## Project Layout
- `index.html` demo entry point.
- `src/` TypeScript sources for the core runtime, demos, and helpers (source of truth).
- `build/esm/` generated ES modules emitted from TypeScript.
- `dist/bundle.js` generated bundle for `index.html`.

## Notes
- The demo uses jQuery/jQuery UI from CDNs; no web server is required to preview.
- The build bundles `three.module.js` into `dist/vendor/three.min.js` for local use.
- For changes, edit files under `src/` and treat `build/esm/` and `dist/` as generated output.
- TypeScript is configured with strict checking (`strict: true`, `noImplicitAny: true`).
