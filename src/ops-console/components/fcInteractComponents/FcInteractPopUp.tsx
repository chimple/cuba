import React, { useState, useMemo, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import './FcInteractPopUp.css';
import {
  ContactTarget,
  EnumType,
  PrincipalInfo,
  StudentInfo,
  TableTypes,
  TeacherInfo,
} from '../../../common/constants';
import { t } from 'i18next';
import { ServiceConfig } from '../../../services/ServiceConfig';
import { useMediaActions } from '../../common/mediaactions';
import logger from '../../../utility/logger';
import { getStudentContactEntries } from '../../utils/studentContactNumbers';
import FcInteractCameraModal from './FcInteractCameraModal';
import FcInteractContactCard from './FcInteractContactCard';
import FcInteractFooter from './FcInteractFooter';
import FcInteractQuestionsPanel from './FcInteractQuestionsPanel';
import type { FcQuestion } from './fcInteractOptions';
import { prepareFcUserFormMedia } from '../../../services/offline/fctouchpoints/fcTouchPointOfflineMedia';
type FcInteractPopUpProps = {
  schoolId: string;
  studentData?: StudentInfo;
  teacherData?: TeacherInfo;
  principalData?: PrincipalInfo;
  status?: EnumType<'fc_support_level'>;
  onClose: () => void;
  initialUserType: EnumType<'fc_engagement_target'>;
};

const FcInteractPopUp: React.FC<FcInteractPopUpProps> = ({
  studentData,
  schoolId,
  teacherData,
  principalData,
  status,
  onClose,
  initialUserType,
}) => {
  const [mode, setMode] = useState<EnumType<'fc_contact_method'>>('in_person');
  const [callOutcome, setCallOutcome] = useState<
    EnumType<'fc_call_result'> | ''
  >('');
  const [spokeWith, setSpokeWith] = useState<EnumType<'fc_engagement_target'>>(
    initialUserType === ContactTarget.STUDENT
      ? ContactTarget.STUDENT
      : initialUserType,
  );
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [otherComments, setOtherComments] = useState('');
  const [techIssueMarked, setTechIssueMarked] = useState<boolean | null>(null);
  const [techIssueDetails, setTechIssueDetails] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const media = useMediaActions({ t: (key) => t(key).toString(), schoolId });
  const translate = (key: string) => t(key).toString();
  const hasProcessingMedia = media.mediaUploads.some(
    (m) => m.status !== 'done',
  );
  const api = ServiceConfig.getI().apiHandler;
  const authHandler = ServiceConfig.getI().authHandler;
  const [localQuestions, setLocalQuestions] = useState<FcQuestion[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);
  let userData: TableTypes<'user'> | null = null;
  let parentData: TableTypes<'user'> | null = null;
  let className = '';
  let classId: string | null = null;
  if (studentData) {
    const { user, parent, classWithidname } = studentData;
    userData = user;
    parentData = parent ? parent : null;
    classId = classWithidname?.id ?? null;
    className = classWithidname?.class_name ?? '';
  } else if (teacherData) {
    const { user, classWithidname } = teacherData;
    userData = user;
    classId = classWithidname.id;
    className = classWithidname.name;
  } else if (principalData) {
    userData = principalData;
  }

  const contactEntries = studentData
    ? getStudentContactEntries(studentData)
    : getStudentContactEntries({ user: userData, parent: parentData });
  const formatPhoneDisplay = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 ? `+91 ${phone}` : phone;
  };
  const getContactDisplayValue = (type: 'phone' | 'email', value: string) =>
    type === 'phone' ? formatPhoneDisplay(value) : value;
  const handleContactClick = (type: 'phone' | 'email', value: string) => {
    window.location.href =
      type === 'phone' ? `tel:${value}` : `mailto:${value}`;
  };
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (mounted) {
        setIsQuestionsLoading(true);
        setLocalQuestions([]);
        setResponses({});
      }
      try {
        const questions = await api.getFilteredFcQuestions(
          status ?? null,
          spokeWith ?? initialUserType,
        );

        const formattedQuestions =
          questions?.map((q) => ({
            id: q.id,
            question: q.question_text,
          })) ?? [];

        if (mounted) {
          setLocalQuestions(formattedQuestions);
        }
      } catch (err) {
        logger.error('Question fetch error', err);
      } finally {
        if (mounted) setIsQuestionsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [status, spokeWith, api]);

  const handleResponseChange = (id: string, value: string) => {
    setResponses((p) => ({ ...p, [id]: value }));
  };

  const handleClosePopup = () => {
    media.cancelCamera();
    onClose();
  };

  const mandatoryQuestions = localQuestions;
  const otherQuestions: FcQuestion[] = useMemo(() => [], []);
  const showMandatory =
    mode === 'in_person' || (mode === 'call' && callOutcome === 'call_picked');

  const isFormValid = useMemo(() => {
    if (mode === 'call' && callOutcome === '') return false;
    if (initialUserType === ContactTarget.STUDENT && !spokeWith) return false;

    if (showMandatory) {
      if (isQuestionsLoading) return false;
      for (const q of mandatoryQuestions) {
        if (!responses[q.id] || responses[q.id].trim() === '') return false;
      }
    }
    if (techIssueMarked === null) return false;

    if (techIssueMarked === true && techIssueDetails.trim() === '') {
      return false;
    }

    return true;
  }, [
    mode,
    callOutcome,
    mandatoryQuestions,
    responses,
    spokeWith,
    isQuestionsLoading,
    techIssueMarked,
    techIssueDetails,
    showMandatory,
    initialUserType,
  ]);

  const handleSave = async () => {
    if (!isFormValid || isSaving) return;
    if (media.mediaUploads.length > 0 && hasProcessingMedia) return;
    setIsSaving(true);

    try {
      const mappedResponses = Object.fromEntries(
        Object.entries(responses)
          .filter(([_, v]) => v.trim() !== '')
          .map(([id, val]) => {
            const q = localQuestions.find((x) => x.id === id);
            return [q?.question ?? id, val.trim()];
          }),
      );

      const currentUser = await authHandler.getCurrentUser();
      const visitId = await api.getTodayVisitId(currentUser?.id!, schoolId);
      const isOffline =
        typeof navigator !== 'undefined' && navigator.onLine === false;
      const { mediaLinks, offlineMediaFiles } = await prepareFcUserFormMedia({
        isOffline,
        mediaUploads: media.mediaUploads,
        userId: currentUser!.id,
        schoolId,
        uploadAllMedia: media.uploadAllMedia,
        uploadFn: (file) => api.uploadSchoolVisitMediaFile({ schoolId, file }),
      });

      const payload = {
        visitId: visitId ?? null,
        userId: currentUser!.id,
        schoolId,
        classId: classId,
        contactUserId: userData?.id,
        contactTarget: spokeWith ?? initialUserType,
        contactMethod: mode,
        callStatus: mode === 'call' && callOutcome !== '' ? callOutcome : null,
        supportLevel: status ?? null,
        questionResponse: mappedResponses,
        comment: otherComments.trim() || null,
        techIssueComment:
          techIssueMarked === true ? techIssueDetails.trim() : null,
        techIssuesReported: techIssueMarked === true,
        mediaLinks,
        offlineMediaFiles,
        activityType: mode === 'call' ? 'call' : 'in_person',
      };
      await api.saveFcUserForm(payload);
      onClose();
    } catch (err) {
      logger.error('Failed to save FC interaction:', err);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="fc-interact-popup-overlay" id="fc-popup-overlay">
      <div
        className="fc-interact-popup-modal fc-interact-popup-interact-popup"
        role="dialog"
        aria-modal
        id="fc-popup-modal"
      >
        <button
          className="fc-interact-popup-close"
          onClick={handleClosePopup}
          aria-label="Close"
          id="fc-close-btn"
        >
          <IoClose size={22} />
        </button>

        <div className="fc-interact-popup-grid" id="fc-popup-grid">
          <FcInteractContactCard
            callOutcome={callOutcome}
            className={className}
            contactEntries={contactEntries}
            getContactDisplayValue={getContactDisplayValue}
            handleContactClick={handleContactClick}
            initialUserType={initialUserType}
            mode={mode}
            setCallOutcome={setCallOutcome}
            setMode={setMode}
            setSpokeWith={setSpokeWith}
            spokeWith={spokeWith}
            status={status}
            userData={userData}
          />

          <FcInteractQuestionsPanel
            handleResponseChange={handleResponseChange}
            isSaving={isSaving}
            mandatoryQuestions={mandatoryQuestions}
            media={media}
            otherComments={otherComments}
            otherQuestions={otherQuestions}
            responses={responses}
            setOtherComments={setOtherComments}
            setTechIssueDetails={setTechIssueDetails}
            setTechIssueMarked={setTechIssueMarked}
            showMandatory={showMandatory}
            techIssueDetails={techIssueDetails}
            techIssueMarked={techIssueMarked}
            translate={translate}
          />
        </div>

        <FcInteractCameraModal media={media} />

        <FcInteractFooter
          hasProcessingMedia={hasProcessingMedia}
          isFormValid={isFormValid}
          isSaving={isSaving}
          mediaUploadCount={media.mediaUploads.length}
          onCancel={handleClosePopup}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default FcInteractPopUp;
