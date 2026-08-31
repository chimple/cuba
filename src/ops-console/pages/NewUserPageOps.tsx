import React, { useState } from 'react';
import {
  Box,
  SelectChangeEvent,
  Typography,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import { BsFillBellFill } from 'react-icons/bs';
import { BiSolidRightArrow } from 'react-icons/bi';
import { useHistory } from 'react-router-dom';
import './NewUserPageOps.css';
import { PAGES } from '../../common/constants';
import { t } from 'i18next';
import { ServiceConfig } from '../../services/ServiceConfig';
import 'react-international-phone/style.css';
import { RoleType } from '../../interface/modelInterfaces';
import { useAppSelector } from '../../redux/hooks';
import type { RootState } from '../../redux/store';
import type { AuthState } from '../../redux/slices/auth/authSlice';
import { NewUserDialogs } from './NewUserDialogs';
import { NewUserForm } from './NewUserForm';

export type UserSchoolClassParams = {
  name?: string;
  phoneNumber?: string;
  email?: string;
  schoolId?: string;
  role?: RoleType.TEACHER | RoleType.PRINCIPAL;
  classId?: string | string[];
};

export type UserSchoolClassResult = {
  user: any;
  schoolUser: any | null;
  classUsers: any[];
  isNewUser: boolean;
};

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const allRoles = [
  { label: 'Operational Director', value: 'operational_director' },
  { label: 'Program Manager', value: 'program_manager' },
  { label: 'Field Coordinator', value: 'field_coordinator' },
  { label: 'External User', value: 'external_user' },
];

export const normalizePhone10 = (raw: string): string => {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length > 10) digits = digits.slice(1);
  if (digits.length > 10) digits = digits.slice(-10);
  return digits;
};

const hasValidContactMethod = (params: {
  email: string;
  phone: string;
  phoneDialCode: string;
}) => {
  const { email, phone, phoneDialCode } = params;
  const hasEmail = !!email.trim();
  const normalizedPhone10 = normalizePhone10(phone);
  const phoneDigits = (phone || '').replace(/\D/g, '');
  const hasPhoneInput = phoneDigits.length > phoneDialCode.length;
  const hasPhone = hasPhoneInput && !!normalizedPhone10;

  return { hasEmail, hasPhone, hasPhoneInput, normalizedPhone10 };
};

const NewUserPage: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
  });
  const [phoneDialCode, setPhoneDialCode] = useState('91');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const { roles: currentUserRoles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = currentUserRoles || [];
  const canCreateNewUser = userRoles.some((role) =>
    [
      RoleType.SUPER_ADMIN,
      RoleType.OPERATIONAL_DIRECTOR,
      RoleType.PROGRAM_MANAGER,
    ].includes(role as RoleType),
  );
  const isProgramManager = userRoles.includes(RoleType.PROGRAM_MANAGER);
  const roles = isProgramManager
    ? allRoles.filter((role) =>
        [RoleType.PROGRAM_MANAGER, RoleType.FIELD_COORDINATOR].includes(
          role.value as RoleType,
        ),
      )
    : allRoles;

  const [successDialog, setSuccessDialog] = useState({
    open: false,
    message: '',
  });
  const [validationDialog, setValidationDialog] = useState({
    open: false,
    message: '',
  });
  const [errorDialog, setErrorDialog] = useState({ open: false, message: '' });
  const contactMethodState = hasValidContactMethod({
    email: form.email,
    phone: form.phone,
    phoneDialCode,
  });
  const contactMethodProvided =
    contactMethodState.hasEmail || contactMethodState.hasPhone;

  const handleInputChange =
    (field: 'name' | 'email') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handlePhoneChange = (
    value: string,
    meta?: { country?: { dialCode?: string } },
  ) => {
    setPhoneDialCode((current) => meta?.country?.dialCode || current);
    setForm((prev) => ({ ...prev, phone: value }));
  };

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    setForm((prev) => ({ ...prev, role: event.target.value as string }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, phone, role } = form;

    if (!name.trim() || !role.trim()) {
      return;
    }

    const { hasEmail, hasPhone, hasPhoneInput, normalizedPhone10 } =
      hasValidContactMethod({
        email: form.email,
        phone: form.phone,
        phoneDialCode,
      });
    const chosenEmail = hasEmail ? email.trim().toLowerCase() : '';

    if (!hasEmail && !hasPhone) {
      return;
    }

    if (hasEmail) {
      if (!emailRegex.test(chosenEmail)) {
        setValidationDialog({
          open: true,
          message: 'Please enter a valid email address.',
        });
        return;
      }
    }

    if (hasPhoneInput) {
      if (normalizedPhone10.length !== 10) {
        setValidationDialog({
          open: true,
          message: 'Phone number must be 10 digits.',
        });
        return;
      }
    }
    const payload = {
      name: name.trim(),
      role: role.trim(),
      email: chosenEmail || undefined,
      phone: hasPhone ? normalizedPhone10 : undefined,
    };

    const { success, message } = await api.createOrAddUserOps(payload);

    const errorMsgMap: Record<string, string> = {
      'auth-create-failed':
        'Failed to create authentication credentials. Please try again.',
      'insert-user-failed':
        'User creation failed. Please check the details and try again.',
      'insert-role-failed':
        'Unable to assign role to the user. Contact support.',
      'unexpected-error':
        'An unexpected error occurred. Please try again later.',
      'unknown-error': 'Something went wrong. Please try again.',
    };

    const successMsgMap: Record<string, string> = {
      'success-created': 'User successfully created.',
      'success-added-to-special_users': 'Role successfully added to user.',
      'success-user-already-exists': 'User already exists with this role.',
    };

    const knownErrors = Object.keys(errorMsgMap);
    const isKnownError = !success || (message && knownErrors.includes(message));

    if (isKnownError) {
      const safeError = (message as string) ?? 'unknown-error';
      setErrorDialog({
        open: true,
        message: errorMsgMap[safeError] || 'Failed to add user.',
      });
      return;
    }

    const displayMsg =
      successMsgMap[message as keyof typeof successMsgMap] ||
      (message as string) ||
      '';
    setSuccessDialog({ open: true, message: displayMsg });
  };

  const handleCancel = () => history.goBack();

  if (!canCreateNewUser) {
    return null;
  }

  return (
    <Box className="ops-new-user-page-container">
      <Box className="ops-new-user-header">
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          className="ops-new-user-header_title"
        >
          {t('New User')}
        </Typography>
        <Box className="ops-new-user-header_icon-container">
          <IconButton className="ops-new-user-header_icon">
            <BsFillBellFill size={isMobile ? 18 : 22} />
          </IconButton>
        </Box>
      </Box>

      <Box className="ops-new-user-content">
        <Breadcrumbs
          className="ops-new-user-breadcrumbs"
          separator={<BiSolidRightArrow size={11} />}
        >
          <Link
            underline="hover"
            color="inherit"
            onClick={() => history.goBack()}
          >
            {t('Users')}
          </Link>
          <Typography color="text.primary" fontWeight="bold">
            {t('New User')}
          </Typography>
        </Breadcrumbs>

        <NewUserForm
          form={form}
          handleCancel={handleCancel}
          handleInputChange={handleInputChange}
          handlePhoneChange={handlePhoneChange}
          handleRoleChange={handleRoleChange}
          handleSubmit={handleSubmit}
          isMobile={isMobile}
          isSaveDisabled={!contactMethodProvided}
          roles={roles}
        />
      </Box>

      <NewUserDialogs
        errorDialog={errorDialog}
        handleSuccessOk={() => {
          setSuccessDialog({ open: false, message: '' });
          history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.USERS}`);
        }}
        setErrorDialog={setErrorDialog}
        setSuccessDialog={setSuccessDialog}
        setValidationDialog={setValidationDialog}
        successDialog={successDialog}
        validationDialog={validationDialog}
      />
    </Box>
  );
};

export default NewUserPage;
