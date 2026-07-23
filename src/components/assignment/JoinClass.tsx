import { useJoinClass } from '../../hooks/useJoinClass';
import './JoinClass.css';

const JoinClass = (props: Parameters<typeof useJoinClass>[0]) => {
  const viewProps = useJoinClass(props);

  const {
    InputWithIcons,
    Loading,
    codeResult,
    containerRef,
    currentStudentName,
    error,
    fullName,
    hasExistingStudentName,
    inviteCode,
    isFormValid,
    joiningClass,
    loading,
    onJoin,
    setFullName,
    setInviteCode,
    t,
  } = viewProps;

  return (
    <div className="join-class-parent-container">
      {joiningClass && <Loading isLoading={true} msg="Joining class..." />}
      <div
        className={`assignment-join-class-container-scroll`}
        ref={containerRef}
      >
        <h2>{t('Join a Class by entering the details below')}</h2>
        <div className="join-class-container">
          <InputWithIcons
            label={t('Full Name')}
            placeholder={t('Enter the child’s full name') ?? ''}
            value={fullName}
            setValue={setFullName}
            icon="assets/icons/BusinessCard.svg"
            readOnly={hasExistingStudentName && fullName === currentStudentName}
            statusIcon={
              fullName.length == 0 ? null : fullName &&
                (fullName.trim().length >= 3 ||
                  fullName === currentStudentName) ? (
                <img src="assets/icons/CheckIcon.svg" alt="Status icon" />
              ) : (
                <img src="assets/icons/Vector.svg" alt="Status icon" />
              )
            }
            required={true}
            labelOffsetClass="with-icon-label-offset-small"
          />

          <InputWithIcons
            label={t('Class Code')}
            placeholder={t('Enter the code to join a class') ?? ''}
            value={inviteCode}
            setValue={(val) => {
              // Only allow digits to be entered.
              if (/^\d*$/.test(val)) {
                setInviteCode(val);
              }
            }}
            icon="assets/icons/OpenBook.svg"
            type="text"
            maxLength={6}
            statusIcon={
              inviteCode?.length === 6 ? (
                codeResult && !error ? (
                  <img src="assets/icons/CheckIcon.svg" alt="Status icon" />
                ) : error && error !== '' ? (
                  <img src="assets/icons/Vector.svg" alt="Status icon" />
                ) : null
              ) : null
            }
            required={true}
            labelOffsetClass="with-icon-label-offset-small"
          />
        </div>

        <div className="join-class-message">
          {codeResult && !error && error == '' && inviteCode?.length === 6
            ? `${t('School')}: ${codeResult.inviteData['school_name']}, ${t('Class')}: ${
                codeResult.inviteData['class_name']
              }`
            : error && inviteCode?.length === 6
              ? error
              : null}
        </div>
        <button
          className="join-class-confirm-button"
          onClick={onJoin}
          disabled={loading || joiningClass || !isFormValid}
        >
          <span className="join-class-confirm-text">{t('Confirm')}</span>
        </button>
      </div>
    </div>
  );
};

export default JoinClass;
