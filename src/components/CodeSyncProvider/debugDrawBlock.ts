const statePerPage = new Map<number, ImageData>();

function drawRectangle(page: number, rectParams: { width: number; height: number; top: number; left: number }) {
  const canvas = document.querySelector(`[data-page-number="${page}"] canvas`) as HTMLCanvasElement;

  if (!canvas) return;

  const context = canvas.getContext("2d");

  if (!context) return;

  if (!statePerPage.has(page)) {
    const savedState = context.getImageData(0, 0, canvas.width, canvas.height);
    statePerPage.set(page, savedState);
  }

  // Extract parameters from the input object
  const { height, width, top, left } = rectParams;

  // Convert normalized coordinates to pixel values
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  const x1 = left * canvasWidth;
  const y1 = top * canvasHeight;
  console.log(y1, canvasHeight);
  const rectWidth = width * canvasWidth;
  const rectHeight = height * canvasHeight;

  // Draw the rectangle outline
  context.beginPath();
  context.strokeStyle = "red";
  context.lineWidth = 6;

  context.moveTo(x1, y1);
  context.lineTo(x1 + rectWidth, y1);
  context.lineTo(x1 + rectWidth, y1 + rectHeight); // Fixed: should be + not -
  context.lineTo(x1, y1 + rectHeight);
  context.closePath();
  context.stroke();

  // Return an undo function
  return function undo() {
    const savedState = statePerPage.get(page);
    if (savedState) {
      context.putImageData(savedState, 0, 0);
    }
  };
}

export function debugDrawBlock(page: number, rectParams: { width: number; height: number; top: number; left: number }) {
  const removeCallback = drawRectangle(page, rectParams);

  if (!removeCallback) return;

  setTimeout(() => {
    removeCallback();
  }, 2500);
}
