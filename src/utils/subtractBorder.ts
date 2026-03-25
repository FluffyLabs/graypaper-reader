export function subtractBorder(rect: DOMRect, element: HTMLElement): DOMRect {
  const borderWidth = {
    left: Number.parseInt(getComputedStyle(element).getPropertyValue("border-left-width"), 10),
    top: Number.parseInt(getComputedStyle(element).getPropertyValue("border-top-width"), 10),
    right: Number.parseInt(getComputedStyle(element).getPropertyValue("border-right-width"), 10),
    bottom: Number.parseInt(getComputedStyle(element).getPropertyValue("border-bottom-width"), 10),
  };

  return new DOMRect(
    rect.x + borderWidth.left,
    rect.y + borderWidth.top,
    rect.width - borderWidth.left - borderWidth.right,
    rect.height - borderWidth.top - borderWidth.bottom,
  );
}
