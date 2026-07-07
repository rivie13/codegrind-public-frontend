export const getCanvasPointFromEvent = (canvas, event, gridCols, gridRows, cellSize) => {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const style = window.getComputedStyle(canvas);
  const borderLeft = parseFloat(style.borderLeftWidth) || 0;
  const borderTop = parseFloat(style.borderTopWidth) || 0;
  const borderRight = parseFloat(style.borderRightWidth) || 0;
  const borderBottom = parseFloat(style.borderBottomWidth) || 0;

  const logicalWidth = gridCols * cellSize;
  const logicalHeight = gridRows * cellSize;

  const contentWidth = Math.max(1, rect.width - borderLeft - borderRight);
  const contentHeight = Math.max(1, rect.height - borderTop - borderBottom);
  const scaleX = logicalWidth / contentWidth;
  const scaleY = logicalHeight / contentHeight;

  const rawX = event.clientX - rect.left - borderLeft;
  const rawY = event.clientY - rect.top - borderTop;

  const x = Math.max(0, Math.min(logicalWidth, rawX * scaleX));
  const y = Math.max(0, Math.min(logicalHeight, rawY * scaleY));
  return { x, y };
};
