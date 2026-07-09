import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { PAGES } from '../../common/constants';
import { Dialog, DialogContent } from '@mui/material';
import { t } from 'i18next';
import './ParentalLock.css';
import { FcLock } from 'react-icons/fc';
import { Util } from '../../utility/util';
import { schoolUtil } from '../../utility/schoolUtil';
import {
  updateLocalAttributes,
  useGbContext,
} from '../../growthbook/Growthbook';

const ParentalLock: React.FC<{
  showDialogBox: boolean;
  onHandleClose: () => void;
  onUnlock?: () => void;
}> = ({ showDialogBox, onHandleClose, onUnlock }) => {
  const { setGbUpdated } = useGbContext();
  enum FourSides {
    LEFT = 'LEFT',
    RIGHT = 'RIGHT',
    UP = 'UP',
    DOWN = 'DOWN',
  }
  const history = useHistory();
  const [userDirection, setUserDirection] = useState<FourSides>();
  const [title, setTitle] = React.useState('');

  useEffect(() => {
    const randomIndex = Math.floor(
      Math.random() * Object.keys(FourSides).length,
    );
    const directionKey = Object.keys(FourSides)[
      randomIndex
    ] as keyof typeof FourSides;
    const direction = FourSides[directionKey];
    setUserDirection(direction); //random sides

    const str = t(`Swipe x to Unlock`).replace(`x`, t(direction));
    setTitle(str);
  }, []);

  const checkSwipeDirection = async (swipeDirection: FourSides) => {
    if (swipeDirection.length > 0 && userDirection === swipeDirection) {
      onUnlock?.();
      await Util.setParentLanguagetoLocal();
      Util.setPathToBackButton(PAGES.PARENT, history);
      Util.setCurrentStudent(null);
      schoolUtil.setCurrentClass(undefined);
      // Parent unlock exits the active student context, so clear student targeting.
      updateLocalAttributes({
        student_id: null,
        school_ids: [],
      });
      setGbUpdated(true);
    }
  };

  const [touchStart, setTouchStart] = useState<{
    x: number | null;
    y: number | null;
  }>({ x: null, y: null });
  const [touchEnd, setTouchEnd] = useState<{
    x: number | null;
    y: number | null;
  }>({ x: null, y: null });

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!e.targetTouches || !e.targetTouches[0]?.clientX) return;
    setTouchEnd({ x: null, y: null }); // Reset touchEnd to null
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!e.targetTouches || !e.targetTouches[0]?.clientX) return;
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart.x || !touchStart.y || !touchEnd.x || !touchEnd.y) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe || isUpSwipe || isDownSwipe) {
      switch (true) {
        case isLeftSwipe:
          checkSwipeDirection(FourSides.LEFT);
          break;
        case isRightSwipe:
          checkSwipeDirection(FourSides.RIGHT);
          break;
        case isUpSwipe:
          checkSwipeDirection(FourSides.UP);
          break;
        case isDownSwipe:
          checkSwipeDirection(FourSides.DOWN);
          break;
      }
    }
  };
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setTouchEnd({ x: null, y: null });
    setTouchStart({ x: e.clientX, y: e.clientY });
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!touchStart.x || !touchStart.y) return;
    setTouchEnd({ x: e.clientX, y: e.clientY });
  };

  const onMouseUp = () => {
    if (!touchStart.x || !touchStart.y || !touchEnd.x || !touchEnd.y) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe || isUpSwipe || isDownSwipe) {
      switch (true) {
        case isLeftSwipe:
          checkSwipeDirection(FourSides.LEFT);
          break;
        case isRightSwipe:
          checkSwipeDirection(FourSides.RIGHT);
          break;
        case isUpSwipe:
          checkSwipeDirection(FourSides.UP);
          break;
        case isDownSwipe:
          checkSwipeDirection(FourSides.DOWN);
          break;
      }
    }
  };

  return (
    <Dialog
      PaperProps={{ className: 'parental-lock-paper' }}
      open={showDialogBox}
      onClose={onHandleClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseDown}
    >
      <div className="parental-lock-content">
        <div id="parent-lock-header">
          <div id="parent-screen">{t('Confirm you are a Parent')}</div>
        </div>

        <FcLock className="parental-lock-icon" aria-hidden="true" />

        <DialogContent className="parental-lock-dialog-content">
          <p className="parental-lock-instruction">{title}</p>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default ParentalLock;
