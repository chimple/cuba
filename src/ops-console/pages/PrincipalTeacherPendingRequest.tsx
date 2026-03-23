import { useEffect, useState } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  IconButton,
} from '@mui/material';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { ServiceConfig } from '../../services/ServiceConfig';
import {
  PAGES,
  REQUEST_TABS,
  RequestTypes,
  STATUS,
  TableTypes,
} from '../../common/constants';
import './PrincipalTeacherPendingRequest.css';
import { Constants } from '../../services/database';
import OpsCustomDropdown from '../components/OpsCustomDropdown';
import { OpsUtil } from '../OpsUtility/OpsUtil';
import { t } from 'i18next';
import { BsFillBellFill } from 'react-icons/bs';
import RejectRequestPopup from '../components/SchoolRequestComponents/RejectRequestPopup';
import logger from '../../utility/logger';
import { RoleType } from '../../interface/modelInterfaces';

const PrincipalTeacherPendingRequest = () => {
  const [gradeOptions, setGradeOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;

  const [isEditing, setIsEditing] = useState(false);
  const [editableRequestType, setEditableRequestType] = useState<
    RequestTypes | ''
  >('');
  const [roleOptions, setRoleOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [requestData, setRequestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const resetEditState = () => {
    setIsEditing(false);
    setEditableRequestType('');
    setSelectedGradeId('');
  };

  const editClicked = async () => {
    const options = Object.values(RequestTypes)
      .filter((t) => t === RequestTypes.TEACHER || t === RequestTypes.PRINCIPAL)
      .map((type) => ({
        label: type.charAt(0).toUpperCase() + type.slice(1),
        value: type,
      }));
    setRoleOptions(options);
    const schoolId = requestData?.school?.id || requestData?.school_id;
    const requestType = requestData?.request_type ?? '';
    const classId = requestData?.class_id ?? '';

    setEditableRequestType(requestType);
    setSelectedGradeId(classId);

    if (schoolId) {
      try {
        const response = await api.getClassesBySchoolId(schoolId);
        const classes = Array.isArray(response) ? response : [response];
        const gradeOpts = classes.map((cls: any) => ({
          label: cls.name,
          value: cls.id,
        }));

        setGradeOptions(gradeOpts);
      } catch (err) {
        logger.error('Error fetching classes for school:', err);
      }
    }

    setIsEditing(true);
  };

  useEffect(() => {
    async function fetchRequest() {
      setLoading(true);
      try {
        const state = location.state as { request?: any } | undefined;
        if (state?.request && state.request.request_id === id) {
          setRequestData(state.request);
        } else {
          const [pendingRequests, approvedRequests, rejectedRequests] =
            await Promise.all([
              api.getOpsRequests(
                Constants.public.Enums.ops_request_status[0],
                1,
                1000,
              ),
              api.getOpsRequests(
                Constants.public.Enums.ops_request_status[2],
                1,
                1000,
              ),
              api.getOpsRequests(
                Constants.public.Enums.ops_request_status[1],
                1,
                1000,
              ),
            ]);

          const allRequests = [
            ...(pendingRequests?.data || []),
            ...(approvedRequests?.data || []),
            ...(rejectedRequests?.data || []),
          ];
          const req = allRequests.find(
            (r: TableTypes<'ops_requests'> | Record<string, unknown>) =>
              'request_id' in r && r.request_id === id,
          );

          if (req) {
            setRequestData(req);
          } else {
            setRequestData(null);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchRequest();
  }, [id, api, location.state]);

  const handleApproveClick = async () => {
    if (!requestData?.id && !requestData?.request_id) {
      return;
    }

    let requestRowId: string | undefined;
    let requestPrimaryId: string | undefined;
    let respondedBy = '';

    try {
      // Use edited values if in edit mode
      requestRowId = requestData?.id || requestData?.request_id;
      requestPrimaryId = requestData?.id;
      const role = (
        isEditing && editableRequestType
          ? editableRequestType
          : requestData.request_type
      )?.toLowerCase?.() as RequestTypes;
      const requestedByUser =
        requestData?.requestedBy ||
        (requestData?.requested_by ? { id: requestData.requested_by } : null);

      const schoolId =
        requestData?.school?.id || requestData?.school_id || undefined;

      const classId =
        role === RequestTypes.TEACHER || role === RequestTypes.STUDENT
          ? (isEditing ? selectedGradeId : requestData?.class_id) ||
            requestData?.class_id ||
            undefined
          : undefined;

      const auth = ServiceConfig.getI().authHandler;
      const user = await auth.getCurrentUser();
      if (!user?.id) {
        throw new Error('No logged-in user found. Cannot approve request.');
      }
      respondedBy = user?.id;

      if (!requestRowId) {
        throw new Error('Request row id is missing. Cannot approve request.');
      }
      if (!requestedByUser?.id) {
        throw new Error('Requested user is missing. Cannot approve request.');
      }
      if (
        (role === RequestTypes.TEACHER || role === RequestTypes.STUDENT) &&
        !classId
      ) {
        throw new Error('Class is required for teacher/student approval.');
      }

      if (schoolId) {
        if (role === RequestTypes.PRINCIPAL) {
          await api.addUserToSchool(
            schoolId,
            requestedByUser,
            RoleType.PRINCIPAL,
          );
        } else if (role === RequestTypes.TEACHER) {
          await api.addTeacherToClass(schoolId, classId, requestedByUser);
        }
      }

      const approvedRequest = await api.approveOpsRequest(
        requestRowId,
        respondedBy,
        role,
        schoolId,
        classId,
      );
      if (!approvedRequest) {
        throw new Error('Approve request update failed.');
      }

      history.push(
        `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}?tab=${REQUEST_TABS.APPROVED}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error ?? '');
      const isRoleConflictError =
        errorMessage.includes(
          'cannot be made Principal for the same school.',
        ) ||
        errorMessage.includes(
          'cannot be added as Teacher for the same school.',
        );

      if (isRoleConflictError && respondedBy && (requestPrimaryId || requestRowId)) {
        const rejectRequestId = requestPrimaryId || requestRowId;
        if (!rejectRequestId) {
          logger.error(
            'Request id missing while auto-rejecting a role conflict error.',
          );
          logger.error('Error approving request:', error);
          return;
        }
        const rejectedRequest = await api.respondToSchoolRequest(
          rejectRequestId,
          respondedBy,
          STATUS.REJECTED,
          String(t('Verification Failed')),
          errorMessage,
        );
        if (rejectedRequest) {
          history.push(
            `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}?tab=${REQUEST_TABS.REJECTED}`,
          );
          return;
        }
      }

      logger.error('Error approving request:', error);
    }
  };

  const handleRejectClick = async () => {
    const auth = ServiceConfig.getI().authHandler;
    const user = await auth.getCurrentUser();
    if (!user?.id) {
      logger.error('No logged-in user found. Cannot reject request.');
      return;
    }
    const userId = user?.id;
    setCurrentUserId(userId ?? '');
    setShowRejectPopup(true);
  };

  if (loading || !requestData)
    return (
      <div className="centered">
        <Typography>Loading...</Typography>
      </div>
    );

  const { school = {}, requestedBy = {}, request_type } = requestData;

  const fullRequestClassName =
    requestData.classInfo?.name || `${requestData.classInfo?.standard || ''}`;

  const { grade: parsedGrade, section: parsedSection } =
    OpsUtil.parseClassName(fullRequestClassName);
  const navBreadcrumbs = (
    <div className="principal-teacher-pending-breadcrumbs">
      {/* Pending link */}
      <span
        onClick={() => history.push(PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST)}
        className="principal-teacher-pending-link"
      >
        {t('Pending')}
      </span>

      <span> &gt; </span>

      {/* Request ID breadcrumb */}
      <span
        onClick={() => {
          if (isEditing) {
            resetEditState();
          }
        }}
        className={
          isEditing
            ? 'principal-teacher-pending-link'
            : 'principal-teacher-pending-active'
        }
      >
        {t('Request ID - ')} {id}
      </span>

      {/* Edit breadcrumb only in edit mode */}
      {isEditing && (
        <>
          <span> &gt; </span>
          <span className="principal-teacher-pending-active">{t('Edit')}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="principal-teacher-pending-details-layout">
      <div className="principal-teacher-pending-page-header">
        <div className="principal-teacher-pending-page-title">
          {t('Request ID - ')} {id}
        </div>
        <div className="principal-teacher-pending-page-icon">
          <IconButton sx={{ color: 'black' }}>
            <BsFillBellFill />
          </IconButton>
        </div>
      </div>
      {navBreadcrumbs}

      <Grid
        container
        spacing={3}
        className="principal-teacher-pending-main-content-row"
        alignItems="flex-start"
      >
        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <Paper
            className="principal-teacher-pending-details-card"
            elevation={0}
          >
            <Typography
              variant="subtitle1"
              className="principal-teacher-pending-section-title"
            >
              {t('Request From')}
            </Typography>
            <Divider />
            <div className="principal-teacher-pending-first-pending-row">
              <span className="principal-teacher-pending-first-pending-row-title">
                {t('Name')}
              </span>
              <span>{requestedBy.name || '-'}</span>
            </div>
            <div className="principal-teacher-pending-first-pending-row">
              <span className="principal-teacher-pending-first-pending-row-title">
                {t('Phone Number')}
              </span>{' '}
              <span>{requestedBy.phone || '-'}</span>
            </div>
            <div className="principal-teacher-pending-first-pending-row">
              <span className="principal-teacher-pending-first-pending-row-title">
                {t('Email ID')}
              </span>{' '}
              <span>{requestedBy.email || '-'}</span>
            </div>
          </Paper>

          <Paper
            className="principal-teacher-pending-details-card"
            elevation={0}
          >
            <Typography
              variant="subtitle1"
              className="principal-teacher-pending-section-title"
            >
              {t('Request Details')}
            </Typography>
            <Divider />
            {isEditing ? (
              <>
                <div className="principal-teacher-pending-first-pending-row">
                  <span>{t('Request Type')}</span>
                  <span>
                    <OpsCustomDropdown
                      value={editableRequestType}
                      placeholder={'Request Type'}
                      options={roleOptions}
                      onChange={(val) => {
                        setEditableRequestType(val as RequestTypes);
                        if (val === RequestTypes.PRINCIPAL) {
                          setSelectedGradeId('');
                        }
                      }}
                    />
                  </span>
                </div>

                {(editableRequestType === RequestTypes.TEACHER ||
                  editableRequestType === RequestTypes.STUDENT) && (
                  <div className="principal-teacher-pending-first-pending-row">
                    <span className="principal-teacher-pending-first-pending-row-title">
                      {t('Grade')}
                    </span>
                    <span>
                      <OpsCustomDropdown
                        placeholder={'Select Grade'}
                        value={selectedGradeId}
                        options={gradeOptions}
                        onChange={(val: string) => {
                          setSelectedGradeId(val);
                        }}
                      />
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="principal-teacher-pending-first-pending-row">
                  <span className="principal-teacher-pending-first-pending-row-title">
                    {t('Role')}
                  </span>
                  <span>{request_type || '-'}</span>
                </div>

                {(request_type === RequestTypes.TEACHER ||
                  request_type === RequestTypes.STUDENT) && (
                  <div className="principal-teacher-pending-first-pending-row">
                    <span className="principal-teacher-pending-first-pending-row-title">
                      {t('Grade')}
                    </span>
                    <span>
                      {parsedGrade > 0 ? parsedGrade : '-'}
                      {parsedSection ? parsedSection : ''}
                    </span>
                  </div>
                )}
              </>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <Paper
            className="principal-teacher-pending-details-card"
            elevation={0}
          >
            <Typography
              variant="subtitle1"
              className="principal-teacher-pending-section-title"
            >
              {t('School Details')}
            </Typography>
            <Divider />
            <div className="principal-teacher-pending-row">
              <span>{t('School Name')}</span> <span>{school.name || '-'}</span>
            </div>
            <div className="principal-teacher-pending-row">
              <span>{t('School ID (UDISE)')}</span>{' '}
              <span>{school.udise || '-'}</span>
            </div>
            <Divider style={{ margin: '1vw 0' }} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'principal-teacher-pending-space-between',
              }}
            >
              <div
                className="principal-teacher-pending-field-stack"
                style={{ flex: 1, marginRight: '1rem' }}
              >
                <div className="principal-teacher-pending-label">
                  {t('District')}
                </div>
                <div>{school.group2 || 'N/A'}</div>
              </div>
              <div
                className="principal-teacher-pending-field-stack"
                style={{ flex: 1 }}
              >
                <div className="principal-teacher-pending-label">
                  {t('State')}
                </div>
                <div>{school.group1 || 'N/A'}</div>
              </div>
            </div>
            <div className="principal-teacher-pending-field-stack">
              <div className="principal-teacher-pending-label">
                {t('Country')}
              </div>
              <div>{school.country || 'N/A'}</div>
            </div>
          </Paper>

          <div className="principal-teacher-pending-action-buttons-row">
            {isEditing ? (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  style={{
                    minWidth: 110,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                  }}
                  onClick={resetEditState}
                >
                  {t('Cancel')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  style={{
                    minWidth: 110,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                  }}
                  onClick={editClicked}
                >
                  {t('Edit')}
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  style={{
                    minWidth: 110,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                  }}
                  onClick={handleRejectClick}
                >
                  {t('Reject')}
                </Button>
              </>
            )}

            {/* ✅ Single Approve button shared by both cases */}
            <Button
              variant="contained"
              color="success"
              size="large"
              disabled={
                isEditing &&
                ((editableRequestType || requestData?.request_type) ===
                  RequestTypes.TEACHER ||
                  (editableRequestType || requestData?.request_type) ===
                    RequestTypes.STUDENT) &&
                !selectedGradeId
              }
              style={{
                minWidth: 110,
                fontWeight: 700,
                fontSize: '1.1rem',
                textTransform: 'none',
              }}
              onClick={handleApproveClick}
            >
              {t('Approve')}
            </Button>
          </div>
        </Grid>
      </Grid>

      {showRejectPopup && (
        <RejectRequestPopup
          requestData={{
            ...requestData,
            type: requestData.request_type,
            respondedBy: { id: currentUserId },
          }}
          onClose={() => setShowRejectPopup(false)}
        />
      )}
    </div>
  );
};

export default PrincipalTeacherPendingRequest;
