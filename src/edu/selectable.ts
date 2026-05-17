import type Puddi from '../puddi/puddi.js';
import type PuddiObject from '../puddi/puddiobject.js';
import type { Vector2 } from 'three';

type SelectOptions = {
  onChange?: (selected: boolean, object: PuddiObject) => void;
  hitTest?: (position: Vector2, object: PuddiObject) => boolean;
  useDeepHitTest?: boolean;
  maxClickMove?: number;
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

export function makeSelectable(puddi: Puddi, obj: PuddiObject, options: SelectOptions = {}) {
  const canvas = puddi.getCtx().canvas;
  const useDeep = options.useDeepHitTest ?? true;
  const maxMove = options.maxClickMove ?? 6;
  let selected = false;
  let pointerId: number | null = null;
  let downPos: Vector2 | null = null;

  const isHit = (pos: Vector2) => {
    if (options.hitTest) {
      return options.hitTest(pos, obj);
    }
    if (useDeep && obj.hitTestDeep) {
      return Boolean(obj.hitTestDeep(pos.x, pos.y));
    }
    return obj.hitTest ? obj.hitTest(pos.x, pos.y) : false;
  };

  const setSelected = (next: boolean) => {
    if (selected === next) {
      return;
    }
    selected = next;
    if (options.onChange) {
      options.onChange(selected, obj);
    }
  };

  const onPointerDown = (evt: PointerEvent) => {
    const pos = getWorldPosition(puddi, evt);
    if (!isHit(pos)) {
      return;
    }
    pointerId = evt.pointerId;
    downPos = pos;
  };

  const onPointerUp = (evt: PointerEvent) => {
    if (pointerId !== evt.pointerId || !downPos) {
      return;
    }
    const pos = getWorldPosition(puddi, evt);
    const delta = pos.clone().sub(downPos);
    if (delta.length() <= maxMove) {
      setSelected(!selected);
    }
    pointerId = null;
    downPos = null;
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);

  return {
    isSelected() {
      return selected;
    },
    setSelected,
    detach() {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
    },
  };
}
