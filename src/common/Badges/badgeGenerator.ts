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

  return [shuffledIcons[0], shuffledIcons[1], shuffledIcons[2]];
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
