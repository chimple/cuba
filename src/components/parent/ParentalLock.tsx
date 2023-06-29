import React, { MouseEventHandler, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { PAGES } from "../../common/constants";
import { Dialog, DialogContent } from "@mui/material";
import { IoCloseCircle } from "react-icons/io5";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import { changeLanguage, t } from "i18next";
import "./ParentalLock.css";
import { FcLock } from "react-icons/fc";

const ParentalLock: React.FC<{
  showDialogBox: boolean;
  handleClose: (event: CustomEvent<OverlayEventDetail<any>>) => void;
  onHandleClose: MouseEventHandler<SVGElement>;
}> = ({
  showDialogBox,
  handleClose,
  onHandleClose,
}) => {
    const history = useHistory();
    const [swipeDirection, setSwipeDirection] = useState('');
    const [userDirection, setUserDirection] = useState('');
    const [title, setTitle] = React.useState("");

    useEffect(() => {
      const sides = ["LEFT", "RIGHT", "UP", "DOWN"];
      const randomIndex = Math.floor(Math.random() * sides.length);
      const direction = sides[randomIndex];

      setSwipeDirection(direction);

      let str = t(`Swipe x to Unlock`)
        .replace(`x`, t(direction));
      setTitle(str);
    }, []);

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
        if (isLeftSwipe) {
          console.log('Swipe: left');
          setUserDirection('LEFT');
        }
        if (isRightSwipe) {
          console.log('Swipe: right');
          setUserDirection('RIGHT');
        }
        if (isUpSwipe) {
          console.log('Swipe: up');
          setUserDirection('UP');
        }
        if (isDownSwipe) {
          console.log('Swipe: down');
          setUserDirection('DOWN');
        }
      }
    };
    if (swipeDirection.length > 0 && userDirection === swipeDirection) {
      history.push(PAGES.PARENT);

    } else
      if (swipeDirection.length == 0 && userDirection != swipeDirection) {

        console.log('not matched');
      }
    return (
      <div>
        <Dialog
          sx={{
            "& .MuiPaper-root": { borderRadius: "4vh !important" },
          }}
          open={showDialogBox}
          onClose={handleClose}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchMove={onTouchMove}
          onMouseMove={onTouchMove}
          onMouseEnter={onTouchStart}>
          <div style={{
            background: 'white',
            color: 'black',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div id="parent-lock-header">
              <div id="parental-lock-close-icon">
                <IoCloseCircle
                  size={"10vh"}
                  onClick={onHandleClose}
                ></IoCloseCircle>
              </div>
              <p style={{
                fontWeight: 'bold',
                fontSize: 'var(--text-size)',
                paddingLeft: "4vw",
              }}>{t("Parents Screen")}</p>
            </div>

            <FcLock
              style={{
                height: '11vh',
                width: '8vw',
              }}></FcLock>

            <DialogContent
              style={{
                width: '25vw',
                height: '15vh',
                background: 'white',
                color: 'black',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                paddingBottom: "0"
              }}
            >

              <p style={{
                userSelect: "none",
                fontWeight: 'bold',
                fontSize: 'var(--text-size)',
              }}>{title}</p>
            </DialogContent>
          </div>

        </Dialog>
      </div>
    );
  };

export default ParentalLock;
