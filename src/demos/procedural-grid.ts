import PuddiObject from '../puddi/puddiobject.js';
import Square from '../square.js';
import type Puddi from '../puddi/puddi.js';

function buildGrid(puddi: Puddi, canvas: HTMLCanvasElement) {
  const cells: Array<{ obj: Square; phase: number }> = [];
  const cols = Math.max(6, Math.floor(canvas.width / 80));
  const rows = Math.max(4, Math.floor(canvas.height / 80));
  const cellSize = Math.min(canvas.width / (cols + 1), canvas.height / (rows + 1));
  const startX = (canvas.width - cols * cellSize) / 2 + cellSize / 2;
  const startY = (canvas.height - rows * cellSize) / 2 + cellSize / 2;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = new Square(puddi, null);
      cell.setScale(cellSize * 0.4);
      cell.setPosition(new THREE.Vector2(startX + x * cellSize, startY + y * cellSize));
      cell.setColor(`hsl(${180 + x * 8 - y * 4}, 70%, 55%)`);
      cells.push({
        obj: cell,
        phase: (x + y) * 0.35,
      });
    }
  }

  return { cells, cols, rows, cellSize };
}

export default function runProceduralGridDemo(puddi: Puddi, canvas: HTMLCanvasElement) {
  const animator = new PuddiObject(puddi, null);
  let grid = buildGrid(puddi, canvas);
  let time = 0;

  animator.setUpdate(function (msElapsed) {
    time += msElapsed / 1000;
    for (const cell of grid.cells) {
      const pulse = (Math.sin(time * 2 + cell.phase) + 1) / 2;
      const scale = 0.2 + pulse * 0.8;
      cell.obj.setScale(grid.cellSize * 0.35 * scale);
      cell.obj.rotate(0.01 + pulse * 0.02);
    }
  });

  return {
    onResize(nextCanvas: HTMLCanvasElement) {
      puddi.clearObjects();
      time = 0;
      grid = buildGrid(puddi, nextCanvas);
      puddi.addObject(animator);
      animator.setUpdate(function (msElapsed) {
        time += msElapsed / 1000;
        for (const cell of grid.cells) {
          const pulse = (Math.sin(time * 2 + cell.phase) + 1) / 2;
          const scale = 0.2 + pulse * 0.8;
          cell.obj.setScale(grid.cellSize * 0.35 * scale);
          cell.obj.rotate(0.01 + pulse * 0.02);
        }
      });
    },
  };
}
