import { FC, useMemo } from 'react';

interface InlineSvgProps {
  svg: string;
  className?: string;
  id?: string;
  ariaHidden?: boolean;
  focusable?: boolean;
}

const mergeSvgAttributes = ({
  svg,
  className,
  id,
  ariaHidden,
  focusable,
}: InlineSvgProps): string => {
  if (typeof DOMParser === 'undefined') {
    return svg;
  }

  const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const parserError = document.querySelector('parsererror');
  const root = document.documentElement;

  if (parserError || root.tagName.toLowerCase() !== 'svg') {
    return svg;
  }

  if (id) {
    root.setAttribute('id', id);
  }

  if (className) {
    const existingClassName = root.getAttribute('class');
    root.setAttribute(
      'class',
      [existingClassName, className].filter(Boolean).join(' '),
    );
  }

  if (ariaHidden !== undefined) {
    root.setAttribute('aria-hidden', String(ariaHidden));
  }

  if (focusable !== undefined) {
    root.setAttribute('focusable', String(focusable));
  }

  return root.outerHTML;
};

const InlineSvg: FC<InlineSvgProps> = ({
  svg,
  className,
  id,
  ariaHidden,
  focusable,
}) => {
  const markup = useMemo(() => {
    if (
      !className &&
      !id &&
      ariaHidden === undefined &&
      focusable === undefined
    ) {
      return svg;
    }

    return mergeSvgAttributes({
      svg,
      className,
      id,
      ariaHidden,
      focusable,
    });
  }, [ariaHidden, className, focusable, id, svg]);

  return <span dangerouslySetInnerHTML={{ __html: markup }} />;
};

export default InlineSvg;
