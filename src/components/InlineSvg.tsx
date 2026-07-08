import { FC, useMemo } from 'react';

interface InlineSvgProps {
  svg: string;
  className?: string;
  id?: string;
  ariaHidden?: boolean;
  focusable?: boolean;
}

const escapeAttribute = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const InlineSvg: FC<InlineSvgProps> = ({
  svg,
  className,
  id,
  ariaHidden,
  focusable,
}) => {
  const markup = useMemo(() => {
    const attributes: string[] = [];

    if (id) {
      attributes.push(`id="${escapeAttribute(id)}"`);
    }

    if (className) {
      attributes.push(`class="${escapeAttribute(className)}"`);
    }

    if (ariaHidden !== undefined) {
      attributes.push(`aria-hidden="${ariaHidden}"`);
    }

    if (focusable !== undefined) {
      attributes.push(`focusable="${focusable}"`);
    }

    if (attributes.length === 0) {
      return svg;
    }

    return svg.replace('<svg', `<svg ${attributes.join(' ')}`);
  }, [ariaHidden, className, focusable, id, svg]);

  return <span dangerouslySetInnerHTML={{ __html: markup }} />;
};

export default InlineSvg;
