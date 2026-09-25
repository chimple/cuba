import type { FC } from 'react';
import { Chip, Menu, MenuItem } from '@mui/material';
import type { WhatsappIntegrationStatus } from '../../../services/api/serviceapi/ServiceApi.whatsapp';
import { getWhatsappIntegrationStatusLabel } from './whatsappIntegrationStatusLabels';

const STATUS_OPTIONS: WhatsappIntegrationStatus[] = [
  'Yes',
  'No',
  'No School Linked',
  'No Class Linked',
];

type WhatsappIntegrationStatusFilterMenuProps = {
  anchorEl: HTMLElement | null;
  selectedStatus: WhatsappIntegrationStatus | null;
  onClose: () => void;
  onSelect: (status: WhatsappIntegrationStatus) => void;
};

const WhatsappIntegrationStatusFilterMenu: FC<
  WhatsappIntegrationStatusFilterMenuProps
> = ({ anchorEl, selectedStatus, onClose, onSelect }) => (
  <Menu
    open={Boolean(anchorEl)}
    anchorEl={anchorEl}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    transformOrigin={{ vertical: 'top', horizontal: 'center' }}
    PaperProps={{ className: 'whatsapp-integration-status-filter-menu' }}
  >
    {STATUS_OPTIONS.map((status) => (
      <MenuItem
        key={status}
        selected={selectedStatus === status}
        className="whatsapp-integration-status-filter-menu-item"
        onClick={() => onSelect(status)}
      >
        <Chip
          label={getWhatsappIntegrationStatusLabel(status)}
          size="small"
          className={`whatsapp-integration-status-filter-chip${
            status === 'Yes' ? ' is-connected' : ' is-not-connected'
          }${selectedStatus === status ? ' is-selected' : ''}`}
        />
      </MenuItem>
    ))}
  </Menu>
);

export default WhatsappIntegrationStatusFilterMenu;
