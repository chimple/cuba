import { useCallback, useState } from 'react';
import type { MouseEvent } from 'react';
import { IconButton } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTranslation } from 'react-i18next';
import type { Column } from '../../components/DataTableBody';
import type {
  WhatsappIntegrationStatus,
  WhatsappIntegrationStatusRow,
} from '../../../services/api/serviceapi/ServiceApi.whatsapp';

export type WhatsappStatusFilterColumn = 'openwa_status' | 'maytapi_status';

export const useWhatsappIntegrationStatusFilters = (
  onFilterChange: () => void,
) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [column, setColumn] = useState<WhatsappStatusFilterColumn | null>(null);
  const [openwaStatus, setOpenwaStatus] =
    useState<WhatsappIntegrationStatus | null>(null);
  const [maytapiStatus, setMaytapiStatus] =
    useState<WhatsappIntegrationStatus | null>(null);

  const handleOpen = useCallback(
    (
      event: MouseEvent<HTMLElement>,
      nextColumn: WhatsappStatusFilterColumn,
    ) => {
      setAnchorEl(event.currentTarget);
      setColumn(nextColumn);
    },
    [],
  );
  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setColumn(null);
  }, []);
  const handleSelect = useCallback(
    (status: WhatsappIntegrationStatus) => {
      if (column === 'openwa_status') {
        setOpenwaStatus((current) => (current === status ? null : status));
      }
      if (column === 'maytapi_status') {
        setMaytapiStatus((current) => (current === status ? null : status));
      }
      onFilterChange();
      handleClose();
    },
    [column, handleClose, onFilterChange],
  );
  const handleDeleteFilter = useCallback(
    (filterKey: string) => {
      if (filterKey === 'openwa_status') {
        setOpenwaStatus(null);
      } else if (filterKey === 'maytapi_status') {
        setMaytapiStatus(null);
      } else {
        return;
      }
      onFilterChange();
    },
    [onFilterChange],
  );
  const renderHeaderActions = useCallback(
    (tableColumn: Column<WhatsappIntegrationStatusRow>) => {
      const filterColumn = String(
        tableColumn.key,
      ) as WhatsappStatusFilterColumn;
      if (!['openwa_status', 'maytapi_status'].includes(filterColumn)) {
        return null;
      }
      const selected =
        filterColumn === 'openwa_status' ? openwaStatus : maytapiStatus;

      return (
        <IconButton
          component="button"
          size="small"
          aria-label={String(
            t(
              `Filter ${filterColumn === 'openwa_status' ? 'OpenWA' : 'Maytapi'}`,
            ),
          )}
          className={`whatsapp-integration-status-filter-button${
            selected ? ' is-active' : ''
          }`}
          onClick={(event: MouseEvent<HTMLButtonElement>) =>
            handleOpen(event, filterColumn)
          }
        >
          <FilterListIcon fontSize="small" />
        </IconButton>
      );
    },
    [handleOpen, maytapiStatus, openwaStatus, t],
  );

  return {
    anchorEl,
    column,
    handleDeleteFilter,
    handleClose,
    handleSelect,
    maytapiStatus,
    openwaStatus,
    renderHeaderActions,
  };
};
