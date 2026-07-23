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
import { DATE_RANGE_OPTIONS } from '../pages/SchoolList.helpers';

type DropdownOption<T extends string> = {
  label: string;
  value: T;
};

type SchoolListDateRangeDropdownProps<T extends string> = {
  value: T;
  onChange: (nextValue: T) => void;
  options?: readonly DropdownOption<T>[];
};

// Small self-contained control so the SchoolList page stays easy to scan.
const SchoolListDateRangeDropdown = <T extends string>({
  value,
  onChange,
  options,
}: SchoolListDateRangeDropdownProps<T>) => {
  const resolvedOptions = (options ??
    DATE_RANGE_OPTIONS) as readonly DropdownOption<T>[];
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isCloseShine, setIsCloseShine] = useState(false);
  const closeShineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const closeShineRafRef = useRef<ReturnType<
    typeof requestAnimationFrame
  > | null>(null);
  const open = Boolean(anchorEl);

  const selectedLabel = useMemo(
    () => resolvedOptions.find((option) => option.value === value)?.label,
    [resolvedOptions, value],
  );

  const triggerCloseShine = useCallback(() => {
    setIsCloseShine(false);

    if (closeShineRafRef.current !== null) {
      cancelAnimationFrame(closeShineRafRef.current);
    }
    closeShineRafRef.current = requestAnimationFrame(() => {
      setIsCloseShine(true);
    });

    if (closeShineTimeoutRef.current !== null) {
      clearTimeout(closeShineTimeoutRef.current);
    }
    closeShineTimeoutRef.current = setTimeout(() => {
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
        clearTimeout(closeShineTimeoutRef.current);
      }
      if (closeShineRafRef.current !== null) {
        cancelAnimationFrame(closeShineRafRef.current);
      }
    };
  }, []);

  const handleSelect = (nextValue: T) => {
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
        {resolvedOptions.flatMap((option, index) => {
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

          if (index < resolvedOptions.length - 1) {
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
