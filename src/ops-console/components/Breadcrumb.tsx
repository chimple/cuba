import React from "react";
import { Typography, Link as MuiLink } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./Breadcrumb.css";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  crumbs: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ crumbs }) => {
  return (
    <div className="breadcrumb-root">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <React.Fragment key={index}>
            {crumb.onClick ? (
              <MuiLink
                component="button"
                onClick={crumb.onClick}
                className={`breadcrumb-link ${isLast ? "breadcrumb-link-bold" : ""}`}
                underline="none"
              >
                {crumb.label}
              </MuiLink>
            ) : (
              <Typography
                className={isLast ? "breadcrumb-text-bold" : "breadcrumb-text"}
                variant="body2"
              >
                {crumb.label}
              </Typography>
            )}

            {!isLast && (
              <ChevronRightIcon className="breadcrumb-separator" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Breadcrumb;
