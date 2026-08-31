import { t } from 'i18next';

import { EVENTS } from '../../common/constants';
import { Util } from '../../utility/util';

export function buildHomeworkPathwayRewardNode(params: any): SVGGElement | null {
  const {
    createSVGImage, currentIndex, endPath, fragment, giftSVG, giftSVG2, giftSVG3,
    handleStickerPreviewReady, isOffline, isStickerBookPreviewOn, pathEndIndex,
    placeElement, resolvedStickerImageSrc, rewardBoxVariant, rewardText, setModalOpen,
    setModalText, stickerPreviewPayload,
  } = params;

  if (endPath) {
    const endPoint = endPath.getPointAtLength(endPath.getTotalLength());
    const rewardWrapper = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g',
    ) as SVGGElement;
    rewardWrapper.setAttribute('style', 'cursor: pointer;');

    const rewardGroup = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g',
    ) as SVGGElement;
    rewardGroup.style.setProperty('transform-box', 'fill-box');
    rewardGroup.style.transformOrigin = 'center';
    rewardWrapper.appendChild(rewardGroup);

    const normalizedVariant = String(rewardBoxVariant ?? '')
      .trim()
      .toLowerCase();
    const gbWantsMystery =
      normalizedVariant === 'mystery_3d' ||
      normalizedVariant === 'mystery' ||
      normalizedVariant === 'mysterybox' ||
      normalizedVariant === 'mystery_box';
    const hasNextSticker = Boolean(stickerPreviewPayload?.nextStickerId);
    const nextStickerImageSrc = stickerPreviewPayload?.nextStickerImage;
    const hasRenderableSticker = Boolean(nextStickerImageSrc);
    const rewardMode: 'sticker' | 'mystery_box' =
      !hasNextSticker || !hasRenderableSticker || gbWantsMystery
        ? 'mystery_box'
        : 'sticker';

    rewardWrapper.setAttribute('data-reward-mode', rewardMode);

    const width =
      window.innerWidth >= 1024 ? 68 : window.innerWidth >= 768 ? 62 : 57;
    const height = Math.round(width * 0.767);

    const playRewardClickAnimation = (
      mode: 'sticker' | 'mystery_box',
    ): Promise<void> => {
      if (mode === 'mystery_box') {
        return Promise.resolve();
      }

      const willOpenPreview =
        mode === 'sticker' &&
        isStickerBookPreviewOn &&
        stickerPreviewPayload;

      if (willOpenPreview) {
        rewardGroup.classList.remove(
    'PathwayStructure-end-reward-box--sticker-close-anim',
        );
        void rewardGroup.getBoundingClientRect();
        rewardGroup.classList.add(
    'PathwayStructure-end-reward-box--sticker-open',
        );
        return new Promise((resolve) => setTimeout(resolve, 750));
      }

      rewardGroup.classList.remove(
        'PathwayStructure-end-reward-box--sticker-clicked',
        'PathwayStructure-end-reward-box--clicked',
      );
      void rewardGroup.getBoundingClientRect();
      rewardGroup.classList.add(
        'PathwayStructure-end-reward-box--sticker-clicked',
      );

      return new Promise((resolve) => {
        let resolved = false;
        const finish = () => {
    if (resolved) return;
    resolved = true;
    rewardGroup.classList.remove(
      'PathwayStructure-end-reward-box--sticker-clicked',
    );
    resolve();
        };

        const onEnd = (event: AnimationEvent) => {
    if (event.target === rewardGroup) finish();
        };

        rewardGroup.addEventListener('animationend', onEnd, {
    once: true,
        });
        window.setTimeout(finish, 1100);
      });
    };

    if (rewardMode === 'sticker') {
      rewardGroup.classList.add(
        'PathwayStructure-end-reward-box',
        'PathwayStructure-end-reward-box--sticker',
      );

      const bg = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect',
      );
      bg.setAttribute('width', String(width));
      bg.setAttribute('height', String(height));
      bg.setAttribute('rx', String(Math.round(height * 0.24)));
      bg.setAttribute('ry', String(Math.round(height * 0.24)));
      bg.setAttribute('fill', '#FFFDEE');
      bg.setAttribute('stroke', '#F55376');
      bg.setAttribute('stroke-width', '3');
      rewardGroup.appendChild(bg);

      if (resolvedStickerImageSrc) {
        const horizontalPadding = Math.round(width * 0.12);
        const verticalPadding = Math.round(height * 0.12);
        const stickerImage = createSVGImage(
    resolvedStickerImageSrc,
    width - horizontalPadding * 2,
    height - verticalPadding * 2,
    horizontalPadding,
    verticalPadding,
        );
        stickerImage.setAttribute(
    'class',
    'PathwayStructure-end-reward-sticker-image',
        );
        rewardGroup.appendChild(stickerImage);
      }

      placeElement(
        rewardWrapper,
        endPoint.x + 6 - width / 2,
        endPoint.y - height / 2,
      );

      if (currentIndex < pathEndIndex + 1) {
        rewardWrapper.addEventListener('click', async () => {
    await playRewardClickAnimation(rewardMode);

    void Util.logEvent(EVENTS.PATHWAY_STICKER_BOX_TAPPED, {
      user_id: Util.getCurrentStudent()?.id ?? 'unknown',
      source: 'homework_pathway',
      sticker_book_id:
        stickerPreviewPayload?.stickerBookId ?? 'unknown',
      sticker_id: stickerPreviewPayload?.nextStickerId ?? 'unknown',
      gb_variant: normalizedVariant || 'sticker',
    });

    if (isStickerBookPreviewOn && stickerPreviewPayload) {
      handleStickerPreviewReady(
        stickerPreviewPayload,
        'sticker_click',
      );
    } else {
      setModalText(rewardText);
      setModalOpen(true);
    }
        });
      }
    } else {
      rewardGroup.classList.add(
        'PathwayStructure-end-reward-box',
        'PathwayStructure-end-reward-box--mystery',
      );
      const mysteryBoxClone = giftSVG.cloneNode(true) as SVGElement;
      mysteryBoxClone.setAttribute('width', String(width));
      mysteryBoxClone.setAttribute('height', String(height));
      mysteryBoxClone.style.width = `${width}px`;
      mysteryBoxClone.style.height = `${height}px`;
      rewardGroup.appendChild(mysteryBoxClone);

      placeElement(
        rewardWrapper,
        endPoint.x - width / 2,
        endPoint.y - height / 2,
      );

      if (currentIndex < pathEndIndex + 1) {
        rewardWrapper.addEventListener('click', async () => {
    await playRewardClickAnimation(rewardMode);

    const reason = isOffline
      ? 'offline'
      : hasNextSticker
        ? 'experiment'
        : 'stickers_exhausted';
    const mysteryBoxModalText =
      reason === 'stickers_exhausted'
        ? rewardText
        : t('Complete these lessons to earn 10 stars');

    void Util.logEvent(EVENTS.PATHWAY_MYSTERY_BOX_TAPPED, {
      user_id: Util.getCurrentStudent()?.id ?? 'unknown',
      source: 'homework_pathway',
      reason,
      sticker_book_id:
        stickerPreviewPayload?.stickerBookId ?? 'unknown',
      sticker_id: stickerPreviewPayload?.nextStickerId ?? 'none',
      gb_variant: normalizedVariant || 'mystery_box',
    });

    const replaceGiftContent = (newContent: SVGElement) => {
      while (rewardGroup.firstChild) {
        rewardGroup.removeChild(rewardGroup.firstChild);
      }
      const clone = newContent.cloneNode(true) as SVGElement;
      clone.setAttribute('width', String(width));
      clone.setAttribute('height', String(height));
      clone.style.width = `${width}px`;
      clone.style.height = `${height}px`;
      rewardGroup.appendChild(clone);
    };

    const animationSequence = [
      { content: giftSVG2, delay: 300 },
      { content: giftSVG3, delay: 500 },
      { content: giftSVG2, delay: 700 },
      { content: giftSVG3, delay: 900 },
      {
        callback: () => {
          setModalText(mysteryBoxModalText);
          setModalOpen(true);
          replaceGiftContent(giftSVG);
        },
        delay: 1100,
      },
    ];

    animationSequence.forEach(({ content, callback, delay }) => {
      setTimeout(() => {
        if (content) replaceGiftContent(content);
        if (callback) callback();
      }, delay);
    });
        });
      }
    }

    fragment.appendChild(rewardWrapper);
    return rewardWrapper;
  }



  return null;
}
