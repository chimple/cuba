import {
  BADGE_NUMBERS,
  BADGE_RULES,
  BADGE_TEXT_COLOR,
  MIDDLE_DECORATION_TOP,
  type BadgeRule,
} from './badgeConstants';
import baseSvg from '../../assets/images/badges/Badge Base.svg?raw';
import borderSvg from '../../assets/images/badges/Surrounding border v2.svg?raw';
import { centerIconSvgs, decorationSvgs } from './badgeAssets';

type BadgeColor = string;

export interface GeneratedBadge {
  badgeNumber: number;
  baseSvg: string;
  borderSvg: string;
  decorationSvg: string;
  decorationClassName: string;
  iconSvgs: readonly [string, string, string];
  textColor: BadgeColor;
}

const applyColor = (svg: string, color: BadgeColor): string =>
  svg.replace(/fill="(?!none)[^"]+"/gi, `fill="${color}"`);

const getRandomIndex = (length: number): number =>
  Math.floor(Math.random() * length);

const getIconSvgs = (): readonly [string, string, string] => {
  const shuffledIcons = [...centerIconSvgs];

  // Shuffle first so three random choices cannot repeat or wait for a retry.
  for (let index = shuffledIcons.length - 1; index > 0; index -= 1) {
    const targetIndex = getRandomIndex(index + 1);
    [shuffledIcons[index], shuffledIcons[targetIndex]] = [
      shuffledIcons[targetIndex],
      shuffledIcons[index],
    ];
  }

  return [shuffledIcons[0], shuffledIcons[1], shuffledIcons[2]] as const;
};

const createBadge = (
  [
    baseColor,
    borderColor,
    decorationColor,
    firstIconColor,
    secondIconColor,
    thirdIconColor,
  ]: BadgeRule,
  badgeNumber: number,
): GeneratedBadge => {
  const iconSvgs = getIconSvgs();
  return {
    badgeNumber,
    baseSvg: applyColor(baseSvg, baseColor),
    borderSvg: applyColor(borderSvg, borderColor),
    decorationSvg: applyColor(
      decorationSvgs[getRandomIndex(decorationSvgs.length)],
      decorationColor,
    ),
    decorationClassName:
      MIDDLE_DECORATION_TOP === 3
        ? 'badges-decoration badges-decoration-top-3'
        : 'badges-decoration',
    iconSvgs: [
      applyColor(iconSvgs[0], firstIconColor),
      applyColor(iconSvgs[1], secondIconColor),
      applyColor(iconSvgs[2], thirdIconColor),
    ],
    textColor: BADGE_TEXT_COLOR,
  };
};
export const badgeNumbers = BADGE_NUMBERS;

export const getGeneratedBadge = (
  badgeNumber: number,
): GeneratedBadge | undefined => {
  // Keep the badge visible for test or legacy progress values that are not
  // one of the configured 50-lesson milestones; the displayed number remains
  // the actual milestone while the first palette supplies the artwork.
  const badgeRule =
    BADGE_RULES.get(badgeNumber) ?? BADGE_RULES.get(BADGE_NUMBERS[0]);

  if (!badgeRule) {
    return undefined;
  }

  const generatedBadge = createBadge(badgeRule, badgeNumber);
  return generatedBadge;
};
