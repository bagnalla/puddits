import Puddi from './puddi/puddi.js';
import { getDemo, resolveDemoKey, listDemos, getDemoEntries } from './demos/index.js';

type DemoInstance = {
  onResize?: (canvas: HTMLCanvasElement) => void;
  dispose?: () => void;
};

let puddi: Puddi | null = null;
let demo: DemoInstance | null = null;
let demoKey: string | null = null;

function getCanvas(): HTMLCanvasElement {
  const canvas = document.getElementById('canvas');
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Missing #canvas element');
  }
  return canvas;
}

function getDemoSelect(): HTMLSelectElement | null {
  const select = document.getElementById('demo-select');
  if (!select || !(select instanceof HTMLSelectElement)) {
    return null;
  }
  return select;
}

// Initialization.
function init(): void {
  const canvas = getCanvas();
  puddi = new Puddi(canvas);

  loadDemo(resolveDemoKey());
  puddi.run();
}

function loadDemo(nextKey: string | null): void {
  if (!puddi) {
    return;
  }

  const demoEntry = getDemo(nextKey);
  if (demo && demo.dispose) {
    demo.dispose();
  }

  puddi.clearObjects();
  demoKey = demoEntry.key;
  demo = demoEntry.run(puddi, getCanvas());
  console.log('Demo:', demoEntry.title + ' (' + demoEntry.key + ')');
  console.log('Available demos: ' + listDemos().join(', '));

  initDemoSelector(demoEntry.key);
}

function initDemoSelector(activeKey: string): void {
  const select = getDemoSelect();
  if (!select) {
    return;
  }

  const entries = getDemoEntries();
  if (select.options.length === 0) {
    for (const entry of entries) {
      const option = document.createElement('option');
      option.value = entry.key;
      option.textContent = entry.title;
      select.appendChild(option);
    }
  }

  select.value = activeKey;

  if (!select.dataset.bound) {
    select.dataset.bound = 'true';
    select.addEventListener('change', (event) => {
      const target = event.target as HTMLSelectElement | null;
      const nextKey = target ? target.value : null;
      if (!nextKey || nextKey === demoKey) {
        return;
      }

      const url = new URL(window.location.href);
      url.searchParams.set('demo', nextKey);
      window.history.replaceState({}, '', url.toString());
      loadDemo(nextKey);
    });
  }
}

function rescale(): void {
  const screenWidth =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth;
  const screenHeight =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
  console.log('width: ' + screenWidth + ', height: ' + screenHeight);

  const canvas = getCanvas();
  canvas.width = screenWidth;
  canvas.height = screenHeight;
  canvas.style.width = `${screenWidth}px`;
  canvas.style.height = `${screenHeight}px`;

  if (demo && demo.onResize) {
    demo.onResize(canvas);
  }
}

window.addEventListener('resize', function () {
  rescale();
  if (puddi) {
    puddi.refresh();
  }
});

document.addEventListener('DOMContentLoaded', function () {
  rescale();
  init();
  if (puddi) {
    puddi.refresh();
  }
});
