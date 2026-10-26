import React, { useEffect, useRef } from 'react';
import { t } from 'i18next';
import { ParsedSvg } from '../common/SvgHelpers';

const InlineSvg = React.forwardRef<
  SVGSVGElement,
  { svg: ParsedSvg; className?: string; onReady?: () => void }
>(({ svg, className, onReady }, ref) => {
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
    el.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    onReady?.();
  }, [svg, className, onReady]);

  return <svg ref={localRef} dangerouslySetInnerHTML={{ __html: svg.inner }} />;
});

InlineSvg.displayName = 'InlineSvg';

export const StaticBookScene = React.memo(
  ({
    isLoading,
    sceneSvg,
    bookSvgRef,
  }: {
    isLoading: boolean;
    sceneSvg: ParsedSvg | null;
    bookSvgRef: React.RefObject<SVGSVGElement | null>;
  }) => {
    if (isLoading) {
      return (
        <div
          className="StickerBookPreviewModal-loading"
          data-testid="StickerBookPreviewModal-loading"
        >
          {t('Loading...')}
        </div>
      );
    }

    return (
      <div
        className="StickerBookPreviewModal-book"
        data-testid="StickerBookPreviewModal-book"
      >
        {sceneSvg && (
          <InlineSvg
            svg={sceneSvg}
            ref={bookSvgRef}
            className="StickerBookPreviewModal-book-svg"
          />
        )}
      </div>
    );
  },
);

StaticBookScene.displayName = 'StaticBookScene';
