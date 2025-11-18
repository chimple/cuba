import React from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button as MuiButton,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useHistory } from "react-router-dom";

export type ActionItem = {
  name: string;
  path?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
};

type Props = {
  items: ActionItem[];
  renderTrigger?: (
    open: (e: React.MouseEvent<HTMLElement>) => void,
    isOpen: boolean
  ) => React.ReactNode;
  menuMinWidth?: number;
};

const ActionMenu: React.FC<Props> = ({
  items,
  renderTrigger,
  menuMinWidth = 220,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const history = useHistory();

  const handleOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleItem = (it: ActionItem) => () => {
    handleClose();
    if (it.onClick) return it.onClick();
    if (it.path) history.push(it.path);
  };

  return (
    <>
      {renderTrigger ? (
        renderTrigger(handleOpen, open)
      ) : (
        <IconButton aria-label="actions" onClick={handleOpen} size="small">
          <MoreVertIcon />
        </IconButton>
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          elevation: 3,
          sx: { mt: 1, borderRadius: 2, minWidth: menuMinWidth },
        }}
      >
        {items.map((it, idx) => (
          <MenuItem
            key={`${it.name}-${idx}`}
            onClick={handleItem(it)}
            disabled={it.disabled}
          >
            <ListItemIcon>{it.icon}</ListItemIcon>
            <ListItemText primary={it.name} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ActionMenu;
