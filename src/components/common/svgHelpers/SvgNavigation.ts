export function ensureNavImage(
  svg: SVGSVGElement,
  id: string,
  href: string,
  x: number,
  y: number,
  width: number,
  height: number,
  enabled: boolean,
  onClick: () => void,
) {
  let img = svg.querySelector(`#${id}`) as SVGImageElement | null;
  if (!img) {
    img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttribute('id', id);
    svg.appendChild(img);
  }
  img.setAttribute('href', href);
  img.setAttribute('x', String(x));
  img.setAttribute('y', String(y));
  img.setAttribute('width', String(width));
  img.setAttribute('height', String(height));
  const label = id.includes('left')
    ? 'Previous page'
    : id.includes('right')
      ? 'Next page'
      : 'Navigate';
  img.setAttribute('role', 'button');
  img.setAttribute('aria-label', label);
  img.setAttribute('tabindex', enabled ? '0' : '-1');
  img.style.cursor = enabled ? 'pointer' : 'default';
  img.style.opacity = enabled ? '1' : '0.5';
  img.style.pointerEvents = enabled ? 'all' : 'none';
  img.style.outline = 'none';
  img.style.userSelect = 'none';
  (img.style as any).webkitTapHighlightColor = 'transparent';
  img.onclick = enabled ? onClick : null;
}
