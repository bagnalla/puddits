import type Puddi from '../puddi/puddi.js';
import type PuddiObject from '../puddi/puddiobject.js';
import type { Vector2 } from 'three';

type DragOptions = {
  useDeepHitTest?: boolean;
  onDragStart?: (position: Vector2, object: PuddiObject) => void;
  onDrag?: (position: Vector2, object: PuddiObject) => void;
  onDragEnd?: (position: Vector2, object: PuddiObject) => void;
  hitTest?: (position: Vector2, object: PuddiObject) => boolean;
};

function getWorldPosition(puddi: Puddi, evt: PointerEvent): Vector2 {
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

export function makeDraggable(puddi: Puddi, obj: PuddiObject, options: DragOptions = {}) {
  const canvas = puddi.getCtx().canvas;
  const useDeep = options.useDeepHitTest ?? true;
  let dragging = false;
  let pointerId: number | null = null;
  let offset = new THREE.Vector2(0, 0);

  const isHit = (pos: Vector2) => {
    if (options.hitTest) {
      return options.hitTest(pos, obj);
    }
    if (useDeep && obj.hitTestDeep) {
      return Boolean(obj.hitTestDeep(pos.x, pos.y));
    }
    return obj.hitTest ? obj.hitTest(pos.x, pos.y) : false;
  };

  const onPointerDown = (evt: PointerEvent) => {
    const pos = getWorldPosition(puddi, evt);
    if (!isHit(pos)) {
      return;
    }
    dragging = true;
    pointerId = evt.pointerId;
    canvas.setPointerCapture(pointerId);
    offset = obj.getPosition().clone().sub(pos);
    if (options.onDragStart) {
      options.onDragStart(pos, obj);
    }
  };

  const onPointerMove = (evt: PointerEvent) => {
    if (!dragging || pointerId !== evt.pointerId) {
      return;
    }
    const pos = getWorldPosition(puddi, evt);
    obj.setPosition(pos.clone().add(offset));
    if (options.onDrag) {
      options.onDrag(pos, obj);
    }
  };

  const endDrag = (evt: PointerEvent) => {
    if (!dragging || pointerId !== evt.pointerId) {
      return;
    }
    const pos = getWorldPosition(puddi, evt);
    dragging = false;
    if (pointerId !== null) {
      canvas.releasePointerCapture(pointerId);
    }
    pointerId = null;
    if (options.onDragEnd) {
      options.onDragEnd(pos, obj);
    }
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  return {
    detach() {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', endDrag);
      canvas.removeEventListener('pointercancel', endDrag);
    },
  };
}
