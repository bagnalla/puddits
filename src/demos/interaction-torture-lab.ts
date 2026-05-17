import PuddiObject from '../puddi/puddiobject.js';
import Tooltip from '../edu/tooltip.js';
import { makeDraggable } from '../edu/draggable.js';
import { makeSelectable } from '../edu/selectable.js';
import type Puddi from '../puddi/puddi.js';
import type { Vector2 } from 'three';

function itlGetWorldPosition(puddi: Puddi, evt: PointerEvent): Vector2 {
  const canvas = puddi.getCtx().canvas;
  const rect = canvas.getBoundingClientRect();
  const x = evt.clientX - rect.left;
  const y = evt.clientY - rect.top;
  const scale = puddi.getScale();
  const translate = puddi.getTranslate();
  const centered = puddi.getCentered ? puddi.getCentered() : false;
  const translateX = centered ? canvas.width / 2 + translate.x * scale : translate.x;
  const translateY = centered ? canvas.height / 2 + translate.y * scale : translate.y;
  return new THREE.Vector2((x - translateX) / scale, (y - translateY) / scale);
}

function itlRandomColor() {
  const colors = ['#2176ff', '#ef476f', '#06d6a0', '#ffd166', '#8338ec', '#ff7f50'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default function runInteractionTortureLabDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  puddi.setCentered(true);
  puddi.clearTransform();

  class StressNode extends PuddiObject {
    nodeId: number;
    radius: number;
    fill: string;
    selected: boolean;
    dragging: boolean;
    velocity: Vector2;

    constructor(runtime: Puddi, parent: PuddiObject, id: number, radius: number, color: string) {
      super(runtime, parent);
      this.nodeId = id;
      this.radius = radius;
      this.fill = color;
      this.selected = false;
      this.dragging = false;
      this.velocity = new THREE.Vector2((Math.random() - 0.5) * 90, (Math.random() - 0.5) * 90);
    }

    setSelected(selected: boolean): void {
      this.selected = selected;
    }

    _drawSelf(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = this.fill;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = this.selected ? '#111111' : 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = this.selected ? 3 : 1;
      ctx.stroke();

      if (this.dragging) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    containsPoint(x: number, y: number): boolean {
      return x * x + y * y <= this.radius * this.radius;
    }
  }

  type NodeEntry = {
    node: StressNode;
    drag: ReturnType<typeof makeDraggable>;
    select: ReturnType<typeof makeSelectable>;
  };

  const state: {
    canvas: HTMLCanvasElement;
    nodes: NodeEntry[];
    nextId: number;
    pointerWorld: Vector2 | null;
  } = {
    canvas,
    nodes: [],
    nextId: 1,
    pointerWorld: null,
  };

  const root = new PuddiObject(puddi, null);

  const hoverTip = new Tooltip(puddi, root, {
    text: '',
    size: 12,
    color: 'white',
    background: 'rgba(0, 0, 0, 0.82)',
    padding: 6,
  });
  hoverTip.setVisible(false);

  const hud = new PuddiObject(puddi, root);
  hud.setDraw(function (ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.font = '13px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Torture Lab: drag/select many nodes. Keys: A add, X remove, C centered toggle.', 16, 68);
    ctx.fillText('Arrows pan, +/- zoom, R reset transform. This intentionally stresses listeners.', 16, 88);
    ctx.fillText(`Objects: ${state.nodes.length}  centered=${puddi.getCentered() ? 'on' : 'off'}  scale=${puddi.getScale().toFixed(2)}`, 16, 108);
    ctx.restore();
  });

  function itlBoundsFor(radius: number) {
    if (puddi.getCentered()) {
      return {
        minX: -state.canvas.width / 2 + radius,
        maxX: state.canvas.width / 2 - radius,
        minY: -state.canvas.height / 2 + radius,
        maxY: state.canvas.height / 2 - radius,
      };
    }

    return {
      minX: radius,
      maxX: state.canvas.width - radius,
      minY: radius,
      maxY: state.canvas.height - radius,
    };
  }

  function itlSpawnNode(position?: Vector2): void {
    const radius = 8 + Math.random() * 12;
    const node = new StressNode(puddi, root, state.nextId, radius, itlRandomColor());
    state.nextId += 1;

    const bounds = itlBoundsFor(radius);
    const startPos = position || new THREE.Vector2(
      bounds.minX + Math.random() * (bounds.maxX - bounds.minX),
      bounds.minY + Math.random() * (bounds.maxY - bounds.minY)
    );
    node.setPosition(startPos);

    const drag = makeDraggable(puddi, node, {
      hitTest(pos, object) {
        const local = object.worldToLocal(pos.x, pos.y);
        if (!local) {
          return false;
        }
        return object.containsPoint(local.x, local.y);
      },
      onDragStart() {
        node.dragging = true;
        node.bringToFront();
      },
      onDrag() {
        const b = itlBoundsFor(radius);
        const p = node.getPosition();
        node.setPosition(
          new THREE.Vector2(
            Math.max(b.minX, Math.min(b.maxX, p.x)),
            Math.max(b.minY, Math.min(b.maxY, p.y))
          )
        );
      },
      onDragEnd() {
        node.dragging = false;
      },
    });

    const select = makeSelectable(puddi, node, {
      hitTest(pos, object) {
        const local = object.worldToLocal(pos.x, pos.y);
        if (!local) {
          return false;
        }
        return object.containsPoint(local.x, local.y);
      },
      onChange(selected) {
        node.setSelected(selected);
      },
    });

    state.nodes.push({ node, drag, select });
  }

  function itlRemoveSome(count: number): void {
    let removed = 0;

    for (let i = state.nodes.length - 1; i >= 0; i -= 1) {
      if (removed >= count) {
        break;
      }

      const entry = state.nodes[i];
      if (!entry.node.selected) {
        continue;
      }

      entry.drag.detach();
      entry.select.detach();
      entry.node.delete();
      state.nodes.splice(i, 1);
      removed += 1;
    }

    for (let i = state.nodes.length - 1; removed < count && i >= 0; i -= 1) {
      const entry = state.nodes[i];
      entry.drag.detach();
      entry.select.detach();
      entry.node.delete();
      state.nodes.splice(i, 1);
      removed += 1;
    }
  }

  const updater = new PuddiObject(puddi, root);
  updater.setUpdate(function (msElapsed) {
    const dt = Math.min(0.05, msElapsed / 1000);

    for (const entry of state.nodes) {
      const node = entry.node;
      if (node.dragging) {
        continue;
      }

      const p = node.getPosition().clone();
      p.add(node.velocity.clone().multiplyScalar(dt));

      const bounds = itlBoundsFor(node.radius);
      if (p.x < bounds.minX) {
        p.x = bounds.minX;
        node.velocity.x *= -1;
      } else if (p.x > bounds.maxX) {
        p.x = bounds.maxX;
        node.velocity.x *= -1;
      }

      if (p.y < bounds.minY) {
        p.y = bounds.minY;
        node.velocity.y *= -1;
      } else if (p.y > bounds.maxY) {
        p.y = bounds.maxY;
        node.velocity.y *= -1;
      }

      node.setPosition(p);
    }

    if (!state.pointerWorld) {
      hoverTip.setVisible(false);
      return;
    }

    const hit = puddi.hitTestDeep(state.pointerWorld.x, state.pointerWorld.y);
    if (!hit || !(hit instanceof StressNode)) {
      hoverTip.setVisible(false);
      return;
    }

    hoverTip.setText(`node #${hit.nodeId} r=${hit.radius.toFixed(1)}`);
    hoverTip.setPosition(state.pointerWorld.clone().add(new THREE.Vector2(12, -14)));
    hoverTip.setVisible(true);
  });

  function onPointerMove(evt: PointerEvent): void {
    state.pointerWorld = itlGetWorldPosition(puddi, evt);
  }

  function onPointerLeave(): void {
    state.pointerWorld = null;
  }

  function onKeyDown(evt: KeyboardEvent): void {
    const key = evt.key;

    if (key === 'a' || key === 'A') {
      for (let i = 0; i < 10; i += 1) {
        itlSpawnNode();
      }
      return;
    }

    if (key === 'x' || key === 'X') {
      itlRemoveSome(10);
      return;
    }

    if (key === 'c' || key === 'C') {
      puddi.setCentered(!puddi.getCentered());
      puddi.refresh();
      return;
    }

    if (key === 'r' || key === 'R') {
      puddi.clearTransform();
      return;
    }

    if (key === '+' || key === '=') {
      evt.preventDefault();
      puddi.scaleTranslated(1.12);
      return;
    }

    if (key === '-') {
      evt.preventDefault();
      puddi.scaleTranslated(1 / 1.12);
      return;
    }

    if (key === 'ArrowUp') {
      evt.preventDefault();
      puddi.translateScaled(new THREE.Vector2(0, 18));
      return;
    }

    if (key === 'ArrowDown') {
      evt.preventDefault();
      puddi.translateScaled(new THREE.Vector2(0, -18));
      return;
    }

    if (key === 'ArrowLeft') {
      evt.preventDefault();
      puddi.translateScaled(new THREE.Vector2(18, 0));
      return;
    }

    if (key === 'ArrowRight') {
      evt.preventDefault();
      puddi.translateScaled(new THREE.Vector2(-18, 0));
    }
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  document.addEventListener('keydown', onKeyDown);

  function onResize(nextCanvas: HTMLCanvasElement): void {
    state.canvas = nextCanvas;
  }

  for (let i = 0; i < 50; i += 1) {
    itlSpawnNode();
  }

  onResize(canvas);

  return {
    onResize,
    dispose() {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('keydown', onKeyDown);

      for (const entry of state.nodes) {
        entry.drag.detach();
        entry.select.detach();
      }
      state.nodes.length = 0;

      puddi.setCentered(false);
      puddi.clearTransform();
    },
  };
}
