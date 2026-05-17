import runOrbitingDemo from './orbiting.js';
import runMouseDrawingDemo from './mouse-drawing.js';
import runFollowChainDemo from './follow-chain.js';
import runPendulumTrailDemo from './pendulum-trail.js';
import runProceduralGridDemo from './procedural-grid.js';
import runParticleBurstDemo from './particle-burst.js';
import runLissajousDemo from './lissajous.js';
import runBoidsLiteDemo from './boids-lite.js';
import runSpringChainDemo from './spring-chain.js';
import runWavesRefractionDemo from './waves-refraction.js';
import runCursorMagnetDemo from './cursor-magnet.js';
import runGravitySandboxDemo from './gravity-sandbox.js';
import runOrreryDemo from './orrery.js';
import runMandalaBloomDemo from './mandala-bloom.js';
import runArticulatedCreatureDemo from './articulated-creature.js';
import runVectorDecompositionDemo from './vector-decomposition.js';
import runDotProductProjectionDemo from './dot-product-projection.js';
import runLinearTransformPlaygroundDemo from './linear-transform-playground.js';
import runFunctionPlotterDemo from './function-plotter.js';
import runBezierCasteljauDemo from './bezier-casteljau.js';
import runPathfindingGridDemo from './pathfinding-grid.js';
import runSortingVisualizerDemo from './sorting-visualizer.js';
import runInteractionTortureLabDemo from './interaction-torture-lab.js';

type DemoRun = (puddi: any, canvas: HTMLCanvasElement) => {
  onResize?: (canvas: HTMLCanvasElement) => void;
  dispose?: () => void;
};

type DemoEntry = {
  key: string;
  title: string;
  run: DemoRun;
};

const demos: Record<string, DemoEntry> = {
  orbiting: {
    key: 'orbiting',
    title: 'Orbiting System',
    run: runOrbitingDemo,
  },
  mouseDrawing: {
    key: 'mouseDrawing',
    title: 'Mouse-Driven Drawing',
    run: runMouseDrawingDemo,
  },
  followChain: {
    key: 'followChain',
    title: 'Bezier Follow Chain',
    run: runFollowChainDemo,
  },
  pendulumTrail: {
    key: 'pendulumTrail',
    title: 'Pendulum With Trail',
    run: runPendulumTrailDemo,
  },
  proceduralGrid: {
    key: 'proceduralGrid',
    title: 'Procedural Grid',
    run: runProceduralGridDemo,
  },
  particleBurst: {
    key: 'particleBurst',
    title: 'Particle Burst',
    run: runParticleBurstDemo,
  },
  lissajous: {
    key: 'lissajous',
    title: 'Lissajous Trail',
    run: runLissajousDemo,
  },
  boidsLite: {
    key: 'boidsLite',
    title: 'Boids Lite',
    run: runBoidsLiteDemo,
  },
  springChain: {
    key: 'springChain',
    title: 'Spring Chain',
    run: runSpringChainDemo,
  },
  wavesRefraction: {
    key: 'wavesRefraction',
    title: 'Ripple Grid',
    run: runWavesRefractionDemo,
  },
  cursorMagnet: {
    key: 'cursorMagnet',
    title: 'Cursor Magnet Field',
    run: runCursorMagnetDemo,
  },
  gravitySandbox: {
    key: 'gravitySandbox',
    title: 'Gravity Sandbox',
    run: runGravitySandboxDemo,
  },
  orrery: {
    key: 'orrery',
    title: 'Nested Orbits',
    run: runOrreryDemo,
  },
  mandalaBloom: {
    key: 'mandalaBloom',
    title: 'Mandala Bloom',
    run: runMandalaBloomDemo,
  },
  articulatedCreature: {
    key: 'articulatedCreature',
    title: 'Articulated Creature',
    run: runArticulatedCreatureDemo,
  },
  vectorDecomposition: {
    key: 'vectorDecomposition',
    title: 'Vector Decomposition',
    run: runVectorDecompositionDemo,
  },
  dotProductProjection: {
    key: 'dotProductProjection',
    title: 'Dot Product + Projection',
    run: runDotProductProjectionDemo,
  },
  linearTransformPlayground: {
    key: 'linearTransformPlayground',
    title: 'Linear Transform Playground',
    run: runLinearTransformPlaygroundDemo,
  },
  functionPlotter: {
    key: 'functionPlotter',
    title: 'Function Plotter',
    run: runFunctionPlotterDemo,
  },
  bezierCasteljau: {
    key: 'bezierCasteljau',
    title: 'Bezier + De Casteljau',
    run: runBezierCasteljauDemo,
  },
  pathfindingGrid: {
    key: 'pathfindingGrid',
    title: 'Pathfinding Grid',
    run: runPathfindingGridDemo,
  },
  sortingVisualizer: {
    key: 'sortingVisualizer',
    title: 'Sorting Visualizer',
    run: runSortingVisualizerDemo,
  },
  interactionTortureLab: {
    key: 'interactionTortureLab',
    title: 'Interaction Torture Lab',
    run: runInteractionTortureLabDemo,
  },
};

const defaultDemoKey = 'orbiting';

function listDemos(): string[] {
  return Object.keys(demos);
}

function resolveDemoKey(location = window.location): string | null {
  const params = new URLSearchParams(location.search);
  if (params.has('demo')) {
    return params.get('demo');
  }

  if (location.hash && location.hash.startsWith('#demo=')) {
    return decodeURIComponent(location.hash.slice(6));
  }

  return defaultDemoKey;
}

function getDemo(key: string | null): DemoEntry {
  if (key && demos[key]) {
    return demos[key];
  }

  return demos[defaultDemoKey];
}

function getDemoEntries(): DemoEntry[] {
  return Object.values(demos);
}

export { listDemos, resolveDemoKey, getDemo, getDemoEntries };
