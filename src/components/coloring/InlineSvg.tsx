import React, { useEffect, useRef } from 'react';
import { ParsedSvg, sanitizeSvg } from '../common/SvgHelpers';

const InlineSvg = React.forwardRef<
  SVGSVGElement,
  { svg: ParsedSvg; className?: string }
>(({ svg, className }, ref) => {
  const localRef = useRef<SVGSVGElement | null>(null);

  React.useImperativeHandle(ref, () => localRef.current as SVGSVGElement, []);

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    if (className) el.setAttribute('class', className);
    Object.entries(svg.attrs).forEach(([name, value]) => {
      el.setAttribute(name, value);
    });
    el.setAttribute('width', '100%');
    el.setAttribute('height', '100%');
    el.setAttribute('preserveAspectRatio', 'none');
  }, [svg, className]);

  const safeSvg = sanitizeSvg(svg.inner);

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    el.innerHTML = safeSvg;
  }, [safeSvg]);

  return <svg ref={localRef} />;
});

InlineSvg.displayName = 'InlineSvg';

export default InlineSvg;
