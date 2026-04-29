import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { Button, Divider, ListItemText, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { t } from 'i18next';
import {
  DATE_RANGE_OPTIONS,
  type DateRangeValue,
} from '../pages/SchoolList.helpers';

type SchoolListDateRangeDropdownProps = {
  value: DateRangeValue;
  onChange: (nextValue: DateRangeValue) => void;
};

// Small self-contained control so the SchoolList page stays easy to scan.
const SchoolListDateRangeDropdown: React.FC<
  SchoolListDateRangeDropdownProps
> = ({ value, onChange }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isCloseShine, setIsCloseShine] = useState(false);
  const closeShineTimeoutRef = useRef<number | null>(null);
  const closeShineRafRef = useRef<number | null>(null);
  const open = Boolean(anchorEl);

  const selectedLabel = useMemo(
    () => DATE_RANGE_OPTIONS.find((option) => option.value === value)?.label,
    [value],
  );

  const triggerCloseShine = useCallback(() => {
    setIsCloseShine(false);

    if (closeShineRafRef.current !== null) {
      window.cancelAnimationFrame(closeShineRafRef.current);
    }
    closeShineRafRef.current = window.requestAnimationFrame(() => {
      setIsCloseShine(true);
    });

    if (closeShineTimeoutRef.current !== null) {
      window.clearTimeout(closeShineTimeoutRef.current);
    }
    closeShineTimeoutRef.current = window.setTimeout(() => {
      setIsCloseShine(false);
      closeShineTimeoutRef.current = null;
    }, 700);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl((currentAnchor) => {
      if (currentAnchor) {
        triggerCloseShine();
      }
      return null;
    });
  }, [triggerCloseShine]);

  useEffect(() => {
    return () => {
      if (closeShineTimeoutRef.current !== null) {
        window.clearTimeout(closeShineTimeoutRef.current);
      }
      if (closeShineRafRef.current !== null) {
        window.cancelAnimationFrame(closeShineRafRef.current);
      }
    };
  }, []);

  const handleSelect = (nextValue: DateRangeValue) => {
    handleClose();
    onChange(nextValue);
  };

  return (
    <>
      <Button
        variant="outlined"
        id="school-list-date-range-button"
        className={`school-list-actions-button school-list-date-range-button${
          isCloseShine ? ' school-list-actions-button-close-shine' : ''
        }`}
        onClick={(event) => {
          if (open) {
            handleClose();
            return;
          }
          setAnchorEl(event.currentTarget);
        }}
        aria-controls={open ? 'school-list-date-range-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="menu"
        endIcon={
          <ArrowDropDownIcon
            className={`school-list-actions-chevron ${
              open ? 'school-list-actions-chevron-open' : ''
            }`}
          />
        }
      >
        {selectedLabel ?? t('Last 7 Days')}
      </Button>
      <Menu
        id="school-list-date-range-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ className: 'school-list-actions-menu' }}
        slotProps={{ list: { disablePadding: true } }}
      >
        {DATE_RANGE_OPTIONS.flatMap((option, index) => {
          const nodes = [
            <MenuItem
              key={option.value}
              className="school-list-actions-menu-item"
              onClick={() => handleSelect(option.value)}
            >
              <ListItemText
                primary={option.label}
                primaryTypographyProps={{
                  className: 'school-list-actions-menu-item-label',
                }}
              />
            </MenuItem>,
          ];

          if (index < DATE_RANGE_OPTIONS.length - 1) {
            nodes.push(
              <Divider
                key={`${option.value}-divider`}
                className="school-list-actions-menu-divider"
              />,
            );
          }

          return nodes;
        })}
      </Menu>
    </>
  );
};

export default SchoolListDateRangeDropdown;
