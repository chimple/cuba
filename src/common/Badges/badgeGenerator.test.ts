import { applyColor } from './badgeGenerator';

describe('applyColor', () => {
  it('recolors visible artwork while preserving colored mask content', () => {
    const svg = `
      <svg>
        <mask id="mask"><path fill="#F55376" /></mask>
        <clipPath id="clip"><rect fill="#81C127" /></clipPath>
        <path fill="#8D79D9" />
      </svg>
    `;

    const result = applyColor(svg, '#02C1C1');

    expect(result).toContain('<path fill="#F55376" />');
    expect(result).toContain('<rect fill="#81C127" />');
    expect(result).toContain('<path fill="#02C1C1" />');
  });

  it('preserves unpainted SVG areas', () => {
    expect(applyColor('<path fill="none" />', '#F55376')).toBe(
      '<path fill="none" />',
    );
  });
});
