import React, { useCallback, useRef, useState } from 'react';
import {
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Add } from '@mui/icons-material';
import { t } from 'i18next';

type ProgramActionsMenuProps = {
  canCreateProgram: boolean;
  onNewProgram: () => void;
};

const ProgramActionsMenu: React.FC<ProgramActionsMenuProps> = ({
  canCreateProgram,
  onNewProgram,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isCloseShine, setIsCloseShine] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const isOpen = Boolean(anchorEl);

  const triggerCloseShine = useCallback(() => {
    setIsCloseShine(false);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setIsCloseShine(true));
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsCloseShine(false);
      timeoutRef.current = null;
    }, 700);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    triggerCloseShine();
  }, [triggerCloseShine]);

  const handleNewProgram = useCallback(() => {
    handleClose();
    onNewProgram();
  }, [handleClose, onNewProgram]);

  if (!canCreateProgram) {
    return null;
  }

  return (
    <>
      <Button
        variant="outlined"
        id="program-list-actions-button"
        className={`school-list-actions-button program-list-actions-button${
          isCloseShine ? ' school-list-actions-button-close-shine' : ''
        }`}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-controls={isOpen ? 'program-list-actions-menu' : undefined}
        aria-expanded={isOpen ? 'true' : undefined}
        aria-haspopup="menu"
        endIcon={
          <ArrowDropDownIcon
            className={`school-list-actions-chevron ${
              isOpen ? 'school-list-actions-chevron-open' : ''
            }`}
          />
        }
      >
        {t('Actions')}
      </Button>
      <Menu
        id="program-list-actions-menu"
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        MenuListProps={{ disablePadding: true }}
        PaperProps={{ className: 'school-list-actions-menu' }}
      >
        <MenuItem
          className="school-list-actions-menu-item"
          onClick={handleNewProgram}
        >
          <ListItemIcon className="school-list-actions-menu-item-icon">
            <Add className="school-list-upload-icon" />
          </ListItemIcon>
          <ListItemText
            primary={t('New Program')}
            primaryTypographyProps={{
              className: 'school-list-actions-menu-item-label',
            }}
          />
        </MenuItem>
        <Divider className="school-list-actions-menu-divider" />
      </Menu>
    </>
  );
};

export default ProgramActionsMenu;
