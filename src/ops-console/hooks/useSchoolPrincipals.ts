import { useCallback, useEffect, useMemo, useState } from 'react';
import { t } from 'i18next';
import FormCard, {
  FieldConfig,
  MessageConfig,
} from '../components/SchoolDetailsComponents/FormCard';
import { PrincipalInfo } from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';
import { AuthState } from '../../redux/slices/auth/authSlice';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { ServiceConfig } from '../../services/ServiceConfig';
import DeleteIcon from '../assets/icons/deleteicon.svg';
import logger from '../../utility/logger';
import { emailRegex, normalizePhone10 } from '../pages/NewUserPageOps';
import { buildSchoolPrincipalColumns } from '../components/SchoolDetailsComponents/SchoolPrincipalsColumns';

export interface DisplayPrincipal {
  id: string;
  name: string;
  gender: string;
  phoneNumber: string;
  emailDisplay: string;
  phoneEmailDisplay: string;
  interact: '';
  interactPayload: PrincipalInfo;
  principal_actions?: string;
}

export const SCHOOL_PRINCIPALS_ROWS_PER_PAGE = 20;

export const useSchoolPrincipals = ({
  data,
  schoolId,
}: {
  data: {
    principals?: PrincipalInfo[];
    totalPrincipalCount?: number;
  };
  schoolId: string;
}) => {
  const [principals, setPrincipals] = useState<PrincipalInfo[]>(
    data.principals || [],
  );
  const [totalCount, setTotalCount] = useState<number>(
    data.totalPrincipalCount || 0,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState<string>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [isAddPrincipalModalOpen, setIsAddPrincipalModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<MessageConfig | undefined>();
  const [openPopup, setOpenPopup] = useState(false);
  const [currentPrincipal, setCurrentPrincipal] = useState<PrincipalInfo>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetPrincipal, setDeleteTargetPrincipal] =
    useState<PrincipalInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [popup, setPopup] = useState({
    open: false,
    image: '',
    heading: '',
    text: '',
    autoCloseSeconds: 0,
  });
  const api = ServiceConfig.getI().apiHandler;
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);

  const fetchPrincipals = useCallback(
    async (currentPage: number, silent = false) => {
      if (!silent) {
        setIsLoading(true);
      }
      const api = ServiceConfig.getI().apiHandler;
      try {
        const response = await api.getPrincipalsForSchoolPaginated(
          schoolId,
          currentPage,
          SCHOOL_PRINCIPALS_ROWS_PER_PAGE,
        );
        setPrincipals(response.data);
        setTotalCount(response.total);
      } catch (error) {
        logger.error('Failed to fetch principals:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [schoolId],
  );

  useEffect(() => {
    const isInitial = page === 1;
    if (isInitial) {
      setPrincipals(data.principals || []);
      fetchPrincipals(page, true);
    } else {
      fetchPrincipals(page);
    }
  }, [page, fetchPrincipals, data.principals, data.totalPrincipalCount]);

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handleSort = useCallback(
    (key: string) => {
      const isAsc = orderBy === key && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(key);
    },
    [order, orderBy],
  );
  const getPrincipalInfo = useCallback(
    (id: string): PrincipalInfo | null => {
      if (!Array.isArray(principals)) return null;
      return principals.find((principal) => principal?.id === id) || null;
    },
    [principals],
  );
  const displayPrincipals = useMemo((): DisplayPrincipal[] => {
    const sorted = [...principals].sort((a, b) => {
      let aValue;
      let bValue;
      switch (orderBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'gender':
          aValue = a.gender || '';
          bValue = b.gender || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'phoneNumber':
          aValue = a.phone || '';
          bValue = b.phone || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'emailDisplay':
          aValue = a.email || '';
          bValue = b.email || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'phoneEmailDisplay': {
          const aPhone = (a.phone || '').trim();
          const bPhone = (b.phone || '').trim();
          const phoneCompare = aPhone.localeCompare(bPhone);
          if (phoneCompare !== 0) {
            return order === 'asc' ? phoneCompare : -phoneCompare;
          }

          const aEmail = (a.email || '').trim();
          const bEmail = (b.email || '').trim();
          return order === 'asc'
            ? aEmail.localeCompare(bEmail)
            : bEmail.localeCompare(aEmail);
        }
        default:
          return 0;
      }
    });
    return sorted.map((principal) => ({
      id: principal.id,
      name: principal.name || 'N/A',
      gender: principal.gender || 'N/A',
      phoneNumber: principal.phone || '-',
      emailDisplay: principal.email || '—',
      phoneEmailDisplay: `${principal.phone?.trim() || '-'} / ${principal.email?.trim() || '-'}`,
      interact: '',
      interactPayload: principal,
    }));
  }, [principals, order, orderBy]);

  const pageCount = Math.ceil(totalCount / SCHOOL_PRINCIPALS_ROWS_PER_PAGE);
  const isDataPresent = displayPrincipals.length > 0;
  const hasAnyPrincipals = (totalCount ?? 0) > 0;
  const isNoPrincipalsState = !isLoading && !hasAnyPrincipals;
  const hideHeaderActions = isNoPrincipalsState;

  const handleAddNewPrincipal = useCallback(() => {
    setErrorMessage(undefined);
    setIsAddPrincipalModalOpen(true);
  }, []);

  const handleCloseAddTeacherModal = () => {
    setIsAddPrincipalModalOpen(false);
    setErrorMessage(undefined);
  };

  const handlePrincipalSubmit = useCallback(
    async (values: Record<string, string>) => {
      try {
        const name = (values.name ?? '').toString().trim();
        const rawEmail = (values.email ?? '').toString().trim();
        const rawPhone = (values.phoneNumber ?? '').toString();

        if (!name) {
          setErrorMessage({
            text: 'Principal name is required.',
            type: 'error',
          });
          return;
        }

        const email = rawEmail.toLowerCase();
        const normalizedPhone = normalizePhone10(rawPhone);
        const hasEmail = !!email;
        const hasPhone = !!normalizedPhone;

        if (!hasEmail && !hasPhone) {
          setErrorMessage({
            text: 'Please provide either an email or a phone number.',
            type: 'error',
          });
          return;
        }

        let finalEmail = '';
        let finalPhone = '';

        if (hasEmail) {
          if (!emailRegex.test(email)) {
            setErrorMessage({
              text: 'Please enter a valid email address.',
              type: 'error',
            });
            return;
          }
          finalEmail = email;
        }

        if (hasPhone) {
          if (normalizedPhone.length !== 10) {
            setErrorMessage({
              text: 'Phone number must be 10 digits.',
              type: 'error',
            });
            return;
          }
          finalPhone = normalizedPhone;
        }

        setIsSubmitting(true);
        setErrorMessage(undefined);

        await api.getOrcreateschooluser({
          name,
          phoneNumber: finalPhone || undefined,
          email: finalEmail || undefined,
          schoolId,
          role: RoleType.PRINCIPAL,
        });

        setErrorMessage({
          text: 'Principal added successfully',
          type: 'success',
        });
        setTimeout(() => {
          setIsAddPrincipalModalOpen(false);
          setPage(1);
          fetchPrincipals(1);
        }, 2000);
      } catch (e: any) {
        const message = e instanceof Error ? e.message : String(e);
        setErrorMessage({ text: message, type: 'error' });
        logger.error('Failed to add principal:', e);
      } finally {
        setIsSubmitting(false);
      }
    },
    [schoolId, fetchPrincipals, api],
  );

  const teacherFormFields: FieldConfig[] = useMemo(
    () => [
      {
        name: 'name',
        label: 'Principal Name',
        kind: 'text',
        required: true,
        placeholder: 'Enter Principal name',
        column: 2,
      },
      {
        name: 'phoneNumber',
        label: 'Phone Number',
        kind: 'phone',
        required: true,
        placeholder: 'Enter phone number',
        column: 2,
      },
      {
        name: 'email',
        label: 'Email',
        kind: 'email',
        placeholder: 'Enter email address',
        column: 2,
      },
    ],
    [],
  );

  const onInteractPrincipal = useCallback(
    (principalId: string) => {
      setOpenPopup(true);
      const currPrincipal = getPrincipalInfo(principalId);
      if (currPrincipal) {
        setCurrentPrincipal(currPrincipal);
      }
    },
    [getPrincipalInfo],
  );

  const onDeletePrincipal = useCallback(
    (principalId: string) => {
      const fullPrincipal = getPrincipalInfo(principalId);
      if (!fullPrincipal) return;
      setDeleteTargetPrincipal(fullPrincipal);
      setIsDeleteModalOpen(true);
    },
    [getPrincipalInfo],
  );

  const columns = useMemo(
    () =>
      buildSchoolPrincipalColumns({
        isExternalUser,
        onDeletePrincipal,
        onInteractPrincipal,
      }),
    [isExternalUser, onDeletePrincipal, onInteractPrincipal],
  );

  const handleConfirmDelete = async () => {
    if (!deleteTargetPrincipal) return;

    try {
      setIsDeleting(true);
      const principalId = deleteTargetPrincipal.id;

      if (!principalId) {
        logger.error('Missing principalId');
        return;
      }
      const principalName = deleteTargetPrincipal.name;
      const res = await api.deleteUserFromSchool(
        schoolId,
        principalId,
        RoleType.PRINCIPAL,
      );
      if (res.success) {
        const message = t(
          "{{principalName}}'s profile has been deleted and is no longer available.",
          { principalName: principalName ?? '' },
        );
        setPopup({
          open: true,
          image: DeleteIcon,
          heading: 'Profile Deleted Successfully',
          text: message,
          autoCloseSeconds: 5,
        });
      }
      setIsDeleteModalOpen(false);
      setDeleteTargetPrincipal(null);
      fetchPrincipals(page);
    } catch (error) {
      logger.error('Delete principal failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  const deleteContactDisplay = deleteTargetPrincipal
    ? deleteTargetPrincipal.phone?.trim() ||
      deleteTargetPrincipal.email?.trim() ||
      'N/A'
    : 'N/A';

  return {
    columns,
    currentPrincipal,
    deleteContactDisplay,
    deleteTargetPrincipal,
    displayPrincipals,
    errorMessage,
    handleAddNewPrincipal,
    handleCloseAddTeacherModal,
    handleConfirmDelete,
    handlePageChange,
    handlePrincipalSubmit,
    handleSort,
    hideHeaderActions,
    isAddPrincipalModalOpen,
    isDataPresent,
    isDeleting,
    isDeleteModalOpen,
    isExternalUser,
    isLoading,
    isSubmitting,
    openPopup,
    order,
    orderBy,
    page,
    pageCount,
    popup,
    setIsDeleteModalOpen,
    setOpenPopup,
    setPopup,
    teacherFormFields,
    totalCount,
  };
};
