export function subtractBorder(rect: DOMRect, element: HTMLElement): DOMRect {
  const borderWidth = {
    left: Number.parseInt(getComputedStyle(element).getPropertyValue("border-left-width")),
    top: Number.parseInt(getComputedStyle(element).getPropertyValue("border-top-width")),
    right: Number.parseInt(getComputedStyle(element).getPropertyValue("border-right-width")),
    bottom: Number.parseInt(getComputedStyle(element).getPropertyValue("border-bottom-width")),
  };

  return new DOMRect(
    rect.x + borderWidth.left,
    rect.y + borderWidth.top,
    rect.width - borderWidth.left - borderWidth.right,
    rect.height - borderWidth.top - borderWidth.bottom,
  );
}
