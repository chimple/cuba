import { useScoreCard } from '../../hooks/useScoreCard';
import './ScoreCard.css';

const ScoreCard = (props: Parameters<typeof useScoreCard>[0]) => {
  const viewProps = useScoreCard(props);

  const {
    Dialog,
    DialogContentText,
    ScoreCardProgressRows,
    ScoreCardStarIcons,
    ScoreCardTitle,
    dialogClassName,
    displayedProgressRows,
    handleClose,
    handleContinueClick,
    handleProgressRowsAnimationComplete,
    i18n,
    isLoadingRows,
    lessonName,
    message,
    noText,
    paperClassName,
    progressContinueStateClass,
    progressRowCountClass,
    score,
    shouldRenderDialog,
    t,
    useProgressLayout,
  } = viewProps;

  return (
    <div>
      <Dialog
        className={dialogClassName}
        open={shouldRenderDialog}
        onClose={(event, reason) => {
          if (reason === 'backdropClick') return;
          if (reason === 'escapeKeyDown') return;
          handleClose(event);
        }}
        slotProps={{
          backdrop: {
            className: useProgressLayout
              ? 'score-card-dialog__backdrop score-card-dialog__backdrop--progress'
              : 'score-card-dialog__backdrop',
          },
          paper: {
            className: paperClassName,
          },
        }}
      >
        <div
          id="ScoreCard-Content"
          className={
            useProgressLayout
              ? 'score-card-goal-progress-content-box'
              : 'ScoreCard-Content'
          }
        >
          <DialogContentText component="div" className="dialog-content-text">
            <div id="score-card-icons" className="score-card-icons">
              <img src="assets/loading.gif" className="image-icon" alt="" />
              <div id="star-images-component" className="star-images-component">
                <ScoreCardStarIcons score={score} />
              </div>
            </div>
            <div className="score-card-text-column">
              <ScoreCardTitle score={score} />
              <div id="score-card-content" className="score-card-content">
                <div
                  id="score-card-content-message"
                  className="score-card-content-message"
                >
                  {t(message)}
                </div>
                <div
                  id="score-card-content-lesson-name"
                  className="score-card-content-lesson-name"
                >
                  {t(lessonName)}
                </div>
              </div>
            </div>
          </DialogContentText>
        </div>
        {isLoadingRows ? null : (
          <>
            <ScoreCardProgressRows
              rows={displayedProgressRows}
              onRowsAnimationComplete={handleProgressRowsAnimationComplete}
            />
            <div
              id="ScoreCard-Continue-Button-div"
              className={
                useProgressLayout
                  ? 'score-card-progress-continue-wrapper'
                  : 'ScoreCard-Continue-Button-div'
              }
            >
              <button
                id="lesson_end_continue"
                className={`dialog-box-button-style-score-card ${progressRowCountClass} ${progressContinueStateClass} ${i18n.language === 'kn' ? 'scorecard-button-kn' : ''}`}
                onClick={handleContinueClick}
              >
                <span>{noText}</span>
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default ScoreCard;
