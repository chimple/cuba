import { t } from 'i18next';
import QrCode2Icon from '@mui/icons-material/QrCode2';

interface AssignmentActionsProps {
  message: string;
  onLibraryClick?: () => void;
  startScan?: () => void;
}

const AssignmentActions = ({
  message,
  onLibraryClick,
  startScan,
}: AssignmentActionsProps) => (
  <div className="TeacherAssignment-Add-moreAssignments">
    <p>{t(message)}</p>
    <div className="TeacherAssignment-add-moreAssignments-button">
      <div
        className="TeacherAssignment-manual-assignments-icon-btn"
        onClick={() => onLibraryClick?.()}
      >
        <img
          src="assets/icons/bookSelected.png"
          alt="Library"
          className="TeacherAssignment-addAssignment-icon1"
        />
        <span style={{ fontWeight: 500, color: '#444', fontSize: 16 }}>
          {t('Library')}
        </span>
      </div>
      <div
        className="TeacherAssignment-manual-assignments-icon-btn"
        onClick={startScan}
      >
        <QrCode2Icon
          sx={{ color: '#7C5DB0' }}
          className="TeacherAssignment-addAssignment-icon2"
        />
        <span style={{ fontWeight: 500, color: '#444', fontSize: 16 }}>
          {t('Scan QR')}
        </span>
      </div>
    </div>
  </div>
);

export default AssignmentActions;
