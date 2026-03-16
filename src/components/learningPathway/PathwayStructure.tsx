import React from 'react';
import ReactDOM from 'react-dom';
import './PathwayStructure.css';

import PathwayModal from './PathwayModal';
import ChimpleRiveMascot from './ChimpleRiveMascot';
import RewardBox from './RewardBox';
import DailyRewardModal from './DailyRewardModal';
import RewardRive from './RewardRive';
import StickerBookPreviewModal, {
  StickerBookCompletionData,
  StickerBookPreviewData,
} from './StickerBookPreviewModal';

import { useHistory } from 'react-router';
import { usePathwayData } from '../../hooks/usePathwayData';
import { usePathwaySVG } from '../../hooks/usePathwaySVG';
import { Util } from '../../utility/util';
import {
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  EVENTS,
  STICKER_BOOK_COMPLETION_READY_EVENT,
} from '../../common/constants';

const PathwayStructure: React.FC = () => {
  const history = useHistory();
  const [stickerPreviewData, setStickerPreviewData] =
    React.useState<StickerBookPreviewData | null>(null);
  const [isStickerPreviewOpen, setIsStickerPreviewOpen] =
    React.useState<boolean>(false);
  const [stickerCompletionData, setStickerCompletionData] =
    React.useState<StickerBookCompletionData | null>(null);
  const [isStickerCompletionOpen, setIsStickerCompletionOpen] =
    React.useState<boolean>(false);
  const lastStickerCompletionOpenKeyRef = React.useRef<string | null>(null);

  const {
    // refs
    containerRef,

    // modal
    modalOpen,
    modalText,
    setModalOpen,
    setModalText,
    shouldAnimate,

    // rive containers
    riveContainer,
    rewardRiveContainer,

    // mascot
    mascotProps,
    mascotKey,

    // reward rive box animation
    rewardRiveState,

    // reward logic
    hasTodayReward,
    isRewardFeatureOn,
    rewardModalOpen,
    isCampaignFinished,
    handleRewardBoxOpen,
    handleRewardModalClose,
    handleRewardModalPlay,

    // NEW — functions for SVG to use instead of window globals
    getCachedLesson,
    updateMascotToNormalState,
    invokeMascotCelebration,
    setRewardRiveState,
    setRiveContainer,
    setRewardRiveContainer,
    setHasTodayReward,
    setCurrentCourse,
    setCurrentChapter,
    setIsRewardPathLoaded,
    isRewardPathLoaded,
    checkAndUpdateReward,
  } = usePathwayData();

  const openStickerCompletion = React.useCallback(
    (data: StickerBookCompletionData) => {
      const completionKey = [
        data.source,
        data.stickerBookId,
        data.collectedStickerIds.length,
        data.totalStickerCount,
      ].join(':');

      if (lastStickerCompletionOpenKeyRef.current === completionKey) {
        return;
      }

      lastStickerCompletionOpenKeyRef.current = completionKey;
      setStickerCompletionData(data);
      setIsStickerCompletionOpen(true);
      Util.logEvent(EVENTS.STICKER_BOOK_COMPLETION_POPUP_OPENED, {
        user_id: Util.getCurrentStudent()?.id ?? 'unknown',
        source: data.source,
        sticker_book_id: data.stickerBookId,
        sticker_book_title: data.stickerBookTitle,
        collected_count: data.collectedStickerIds.length,
        total_stickers: data.totalStickerCount,
      });
    },
    [],
  );

  // Mounts SVG with everything needed
  usePathwaySVG({
    containerRef,
    setModalOpen,
    setModalText,

    history,
    getCachedLesson,
    updateMascotToNormalState,
    invokeMascotCelebration,
    setRewardRiveState,
    setRiveContainer,
    setRewardRiveContainer,
    setHasTodayReward,
    setCurrentCourse,
    setCurrentChapter,
    setIsRewardPathLoaded,
    isRewardPathLoaded,
    checkAndUpdateReward,
    onStickerPreviewReady: (data) => {
      setStickerPreviewData(data);
      setIsStickerPreviewOpen(true);
      Util.logEvent(EVENTS.STICKER_PREVIEW_POPUP_SHOWN, {
        user_id: Util.getCurrentStudent()?.id ?? 'unknown',
        sticker_book_id: data.stickerBookId,
        sticker_id: data.nextStickerId,
        source: data.source,
      });
    },
    onStickerCompletionReady: (data) => {
      openStickerCompletion(data);
    },
  });

  const closeStickerPreview = React.useCallback(
    (reason: 'close_button' | 'backdrop' | 'acknowledge_button') => {
      if (!stickerPreviewData) return;
      Util.logEvent(EVENTS.STICKER_PREVIEW_POPUP_CLOSED, {
        user_id: Util.getCurrentStudent()?.id ?? 'unknown',
        sticker_book_id: stickerPreviewData.stickerBookId,
        sticker_id: stickerPreviewData.nextStickerId,
        source: stickerPreviewData.source,
        close_reason: reason,
      });
      setIsStickerPreviewOpen(false);
    },
    [stickerPreviewData],
  );

  const closeStickerCompletion = React.useCallback(
    (reason: 'backdrop' | 'close_button') => {
      if (stickerCompletionData && reason === 'close_button') {
        Util.logEvent(EVENTS.STICKER_BOOK_COMPLETION_POPUP_CLOSE_CLICKED, {
          user_id: Util.getCurrentStudent()?.id ?? 'unknown',
          source: stickerCompletionData.source,
          sticker_book_id: stickerCompletionData.stickerBookId,
          sticker_book_title: stickerCompletionData.stickerBookTitle,
          collected_count: stickerCompletionData.collectedStickerIds.length,
          total_stickers: stickerCompletionData.totalStickerCount,
        });
      }
      setIsStickerCompletionOpen(false);
    },
    [stickerCompletionData],
  );

  React.useEffect(() => {
    const handleStickerCompletionReady = (event: Event) => {
      const customEvent = event as CustomEvent<StickerBookCompletionData>;
      const data = customEvent.detail;
      if (!data?.stickerBookId) return;

      sessionStorage.removeItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY);
      openStickerCompletion(data);
    };

    window.addEventListener(
      STICKER_BOOK_COMPLETION_READY_EVENT,
      handleStickerCompletionReady as EventListener,
    );

    return () => {
      window.removeEventListener(
        STICKER_BOOK_COMPLETION_READY_EVENT,
        handleStickerCompletionReady as EventListener,
      );
    };
  }, [openStickerCompletion]);

  return (
    <>
      {/* Modal */}
      {modalOpen && (
        <PathwayModal
          text={modalText}
          onClose={() => setModalOpen(false)}
          onConfirm={() => setModalOpen(false)}
          animate={shouldAnimate}
        />
      )}

      {/* SVG Root Container */}
      <div className="PathwayStructure-div" ref={containerRef} />

      {/* Chimple Mascot */}
      {riveContainer &&
        ReactDOM.createPortal(
          <ChimpleRiveMascot
            key={mascotKey}
            stateMachine={mascotProps.stateMachine}
            inputName={mascotProps.inputName}
            stateValue={mascotProps.stateValue}
            animationName={mascotProps.animationName}
          />,
          riveContainer,
        )}

      {/* Reward Box Rive */}
      {rewardRiveContainer &&
        ReactDOM.createPortal(
          <RewardRive rewardRiveState={rewardRiveState} />,
          rewardRiveContainer,
        )}

      {/* Daily reward icon */}
      {hasTodayReward && isRewardFeatureOn && (
        <RewardBox onRewardClick={handleRewardBoxOpen} />
      )}

      {/* Daily Reward modal */}
      {rewardModalOpen && isRewardFeatureOn && (
        <DailyRewardModal
          text={'Play one lesson and collect your daily reward!'}
          onClose={handleRewardModalClose}
          onPlay={handleRewardModalPlay}
        />
      )}

      {isStickerPreviewOpen && stickerPreviewData && (
        <StickerBookPreviewModal
          data={stickerPreviewData}
          onClose={closeStickerPreview}
        />
      )}

      {isStickerCompletionOpen && stickerCompletionData && (
        <StickerBookPreviewModal
          data={stickerCompletionData}
          mode="completion"
          onClose={
            closeStickerCompletion as (
              reason: 'close_button' | 'backdrop' | 'acknowledge_button',
            ) => void
          }
        />
      )}
    </>
  );
};

export default PathwayStructure;
