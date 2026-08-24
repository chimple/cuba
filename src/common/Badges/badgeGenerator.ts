import {
  BADGE_NUMBERS,
  BADGE_RULES,
  BADGE_TEXT_COLOR,
  MIDDLE_DECORATION_TOP,
  type BadgeRule,
} from './badgeConstants';
import baseSvg from '../../assets/images/badges/Badge Base.svg?raw';
import borderSvg from '../../assets/images/badges/Surrounding border v2.svg?raw';
import avocadoSvg from '../../assets/images/badges/centericons/Avocado.svg?raw';
import balloonSvg from '../../assets/images/badges/centericons/Balloon.svg?raw';
import baseballSvg from '../../assets/images/badges/centericons/Baseball.svg?raw';
import catSvg from '../../assets/images/badges/centericons/Cat.svg?raw';
import farmSvg from '../../assets/images/badges/centericons/Farm.svg?raw';
import mountainsSvg from '../../assets/images/badges/centericons/Mountains.svg?raw';
import pinwheelSvg from '../../assets/images/badges/centericons/Pinwheel.svg?raw';
import shootingStarSvg from '../../assets/images/badges/centericons/ShootingStar.svg?raw';
import spinnerBallSvg from '../../assets/images/badges/centericons/SpinnerBall.svg?raw';
import tractorSvg from '../../assets/images/badges/centericons/Tractor.svg?raw';
import vanSvg from '../../assets/images/badges/centericons/Van.svg?raw';
import volleyballSvg from '../../assets/images/badges/centericons/Volleyball.svg?raw';
import decoration1500Svg from '../../assets/images/badges/middledecorations/md 1500 2.svg?raw';
import decoration1550Svg from '../../assets/images/badges/middledecorations/md 1550 1.svg?raw';
import decoration1600Svg from '../../assets/images/badges/middledecorations/md 1600 1.svg?raw';
import decoration1700Svg from '../../assets/images/badges/middledecorations/md 1700 3.svg?raw';
import decoration1750Svg from '../../assets/images/badges/middledecorations/md 1750 1.svg?raw';
import decoration1800Svg from '../../assets/images/badges/middledecorations/md 1800 1.svg?raw';

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

const decorationSvgs = [
  decoration1500Svg,
  decoration1550Svg,
  decoration1600Svg,
  decoration1700Svg,
  decoration1750Svg,
  decoration1800Svg,
];

const centerIconSvgs = [
  avocadoSvg,
  balloonSvg,
  baseballSvg,
  catSvg,
  farmSvg,
  mountainsSvg,
  pinwheelSvg,
  shootingStarSvg,
  spinnerBallSvg,
  tractorSvg,
  vanSvg,
  volleyballSvg,
] as const;

const BADGE_INCREMENT = 50;
const DECORATION_ORDERS = [
  [0, 3, 1, 5, 2, 4],
  [4, 1, 5, 0, 3, 2],
  [2, 5, 3, 1, 4, 0],
  [1, 4, 0, 2, 5, 3],
  [5, 2, 4, 3, 0, 1],
  [3, 0, 2, 4, 1, 5],
] as const;
const ICON_COMBINATION_COUNT =
  centerIconSvgs.length *
  (centerIconSvgs.length - 1) *
  (centerIconSvgs.length - 2);

const getBadgeStep = (badgeNumber: number): number =>
  Math.max(0, Math.floor(badgeNumber / BADGE_INCREMENT) - 1);

const getDecorationIndex = (badgeStep: number): number => {
  const decorationOrder =
    DECORATION_ORDERS[
      Math.floor(badgeStep / decorationSvgs.length) % DECORATION_ORDERS.length
    ];

  // Each group contains all six shapes in a different order to avoid a visible loop.
  return decorationOrder[badgeStep % decorationSvgs.length];
};

const getIconSvgs = (badgeStep: number): readonly [string, string, string] => {
  const iconVariant =
    (badgeStep * (ICON_COMBINATION_COUNT - 1)) % ICON_COMBINATION_COUNT;
  const firstIndex = Math.floor(
    iconVariant / ((centerIconSvgs.length - 1) * (centerIconSvgs.length - 2)),
  );
  const remainingIndexes = centerIconSvgs
    .map((_, index) => index)
    .filter((index) => index !== firstIndex);
  const secondIndex =
    remainingIndexes[
      Math.floor(iconVariant / (centerIconSvgs.length - 2)) %
        (centerIconSvgs.length - 1)
    ];
  const thirdIndex = remainingIndexes.filter((index) => index !== secondIndex)[
    iconVariant % (centerIconSvgs.length - 2)
  ];

  return [
    centerIconSvgs[firstIndex],
    centerIconSvgs[secondIndex],
    centerIconSvgs[thirdIndex],
  ];
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
  const badgeStep = getBadgeStep(badgeNumber);
  const iconSvgs = getIconSvgs(badgeStep);
  return {
    badgeNumber,
    baseSvg: applyColor(baseSvg, baseColor),
    borderSvg: applyColor(borderSvg, borderColor),
    decorationSvg: applyColor(
      decorationSvgs[getDecorationIndex(badgeStep)],
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
const generatedBadgeCache = new Map<number, GeneratedBadge>();

export const badgeNumbers = BADGE_NUMBERS;

export const getGeneratedBadge = (
  badgeNumber: number,
): GeneratedBadge | undefined => {
  const cachedBadge = generatedBadgeCache.get(badgeNumber);

  if (cachedBadge) {
    return cachedBadge;
  }

  const badgeRule = BADGE_RULES.get(badgeNumber);

  if (!badgeRule) {
    return undefined;
  }

  const generatedBadge = createBadge(badgeRule, badgeNumber);
  generatedBadgeCache.set(badgeNumber, generatedBadge);

  return generatedBadge;
};
