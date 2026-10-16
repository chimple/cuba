import { memo, useState } from 'react';
import InlineSvg from '../InlineSvg';
import { getGeneratedBadge } from '../../common/Badges/badgeGenerator';
import type { GeneratedBadge } from '../../common/Badges/badgeGenerator';
import './LessonCompletionBadge.css';

type LessonCompletionBadgeProps = {
  number: number;
  isLocked?: boolean;
  isShared?: boolean;
  generatedBadge?: GeneratedBadge;
};

const LessonCompletionBadge = memo(
  ({
    number,
    isLocked = false,
    isShared = false,
    generatedBadge,
  }: LessonCompletionBadgeProps) => {
    const [fallbackBadge] = useState(() => getGeneratedBadge(number));
    const badge = generatedBadge ?? fallbackBadge;

    // Keep the same generated artwork in cards and share previews.

    if (!badge) return null;

    return (
      <div
        className={`lesson-completion-badge${
          isLocked ? ' lesson-completion-badge--locked' : ''
        }${isShared ? ' lesson-completion-badge--shared' : ''}`}
        aria-label={
          isLocked ? `${number} lessons, locked` : `${number} lessons`
        }
      >
        <InlineSvg
          ariaHidden
          className="lesson-completion-badge-border"
          svg={badge.borderSvg}
        />
        <InlineSvg
          ariaHidden
          className="lesson-completion-badge-base"
          svg={badge.baseSvg}
        />
        <InlineSvg
          ariaHidden
          className={`lesson-completion-badge-decoration${
            badge.decorationClassName.includes('top-3')
              ? ' lesson-completion-badge-decoration--top-3'
              : ''
          }`}
          svg={badge.decorationSvg}
        />
        <div className="lesson-completion-badge-icons">
          {badge.iconSvgs.map((iconSvg, index) => (
            <InlineSvg
              ariaHidden
              className="lesson-completion-badge-icon"
              key={`${badge.badgeNumber}-${index}`}
              svg={iconSvg}
            />
          ))}
        </div>
        <span className="lesson-completion-badge-number">
          {badge.badgeNumber}
        </span>
      </div>
    );
  },
);

export default LessonCompletionBadge;
