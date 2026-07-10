import React, { MouseEventHandler, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { CONTINUE, PAGES } from "../../common/constants";
import { Dialog, DialogContent } from "@mui/material";
import { IoCloseCircle } from "react-icons/io5";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import { changeLanguage, t } from "i18next";
import "./ParentalLock.css";
import { FcLock } from "react-icons/fc";
import { Util } from "../../utility/util";

const ParentalLock: React.FC<{
  showDialogBox: boolean;
  handleClose: (event: CustomEvent<OverlayEventDetail<any>>) => void;
  onHandleClose: React.MouseEventHandler<HTMLDivElement | HTMLImageElement>;
}> = ({
  showDialogBox,
  handleClose,
  onHandleClose,
}) => {
    enum FourSides {
      LEFT = "LEFT",
      RIGHT = "RIGHT",
      UP = "UP",
      DOWN = "DOWN",
    }
    const history = useHistory();
    const [userDirection, setUserDirection] = useState<FourSides>();
    const [title, setTitle] = React.useState("");

    useEffect(() => {
      const randomIndex = Math.floor(Math.random() * Object.keys(FourSides).length);
      const direction = FourSides[Object.keys(FourSides)[randomIndex]];
      setUserDirection(direction) //random sides

      const str = t(`Swipe x to Unlock`)
        .replace(`x`, t(direction));
      setTitle(str);
    }, []);

    const checkSwipeDirection = async (swipeDirection: FourSides) => {
      if (swipeDirection.length > 0 && userDirection === swipeDirection) {
        await Util.setParentLanguagetoLocal();
        Util.setPathToBackButton(PAGES.PARENT, history);
      }
    };


    const [touchStart, setTouchStart] = useState({ x: null, y: null });
    const [touchEnd, setTouchEnd] = useState({ x: null, y: null });

    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
      if (!e.targetTouches || !e.targetTouches[0]?.clientX) return;
      setTouchEnd({ x: null, y: null }); // Reset touchEnd to null
      setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    };

    const onTouchMove = (e) => {
      if (!e.targetTouches || !e.targetTouches[0]?.clientX) return;
      setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
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
    const onMouseDown = (e) => {
      setTouchEnd({ x: null, y: null });
      setTouchStart({ x: e.clientX, y: e.clientY });
    };

    const onMouseMove = (e) => {
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
      <div>
        <Dialog
          sx={{
            "& .MuiPaper-root": { borderRadius: "4vh !important", background: '#FFFDEE', width: "390px", height: "225px" },
          }}
          open={showDialogBox}
          onClose={handleClose}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchMove={onTouchMove}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          onMouseEnter={onMouseDown}
        >
          <div style={{
            color: 'black',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div id="parent-lock-header">
              <div id="parental-lock-close-icon" onClick={onHandleClose}>
                <img
                  src="pathwayAssets/menuCross.svg"
                  alt="Close"
                />
              </div>
              <div id="parent-screen">
                {t("Parents Section")}
              </div>
            </div>

            <FcLock
              style={{
                height: '53px',
                width: '60px',
              }}></FcLock>

            <DialogContent
              style={{
                width: '35vw',
                color: 'black',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                padding: '4vh 0 0 0'
              }}
            >

              <p style={{
                userSelect: "none",
                fontWeight: '600',
                fontSize: '20px',
              }}>{title}</p>
            </DialogContent>
          </div>

        </Dialog>
      </div>
    );
  };

export default ParentalLock;
