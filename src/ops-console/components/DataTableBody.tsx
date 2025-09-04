import React, { forwardRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Skeleton,
} from "@mui/material";
import "./DataTableBody.css";
import { useHistory } from "react-router";
import { PAGES } from "../../common/constants";

export interface Column<T> {
  key: keyof T;
  label: string;
  align?: "left" | "right" | "center" | "justify" | "inherit";
  render?: (row: T) => React.ReactNode;
  width?: string | number;
  [key: string]: any;
}

interface Props {
  columns: Record<string, any>[];
  rows: Record<string, any>[];
  orderBy: string | null;
  order: "asc" | "desc";
  onSort: (key: string) => void;
  detailPageRouteBase?: string;
  onRowClick?: (id: string | number, row: any) => void;
  loading?: boolean;
}

function TableSkeleton({
  columns,
  rows = 10,
}: {
  columns: Record<string, any>[];
  rows?: number;
}) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {columns.map((col) => (
            <TableCell
              key={col.key}
              align="left"
              sx={{
                py: 0.25,
                px: 1,
                height: 32,
                transform: "none",
              }}
            >
              <div style={{ width: "90%" }}>
                <Skeleton
                  variant="rectangular"
                  height={24}
                  width="100%"
                  sx={{ mx: 0, ml: 0, transform: "none" }}
                />
              </div>
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

const DataTableBody = forwardRef<HTMLDivElement, Props>(
  (
    {
      columns,
      rows,
      orderBy,
      order,
      onSort,
      detailPageRouteBase,
      onRowClick,
      loading,
    },
    ref
  ) => {
    const history = useHistory();
    const handleRowClick = (row: any) => {
      if (onRowClick) {
        const id = row.request_id || row.id;
        onRowClick(id, row);
        return;
      }

      const id = row.id;
      if (!id) {
        console.warn("Row missing 'id' property");
        return;
      }

      if (detailPageRouteBase === "programs") {
        history.push(
          `${PAGES.SIDEBAR_PAGE}${PAGES.PROGRAM_PAGE}${PAGES.PROGRAM_DETAIL_PAGE}/${row["id"]}`
        );
      } else if (detailPageRouteBase === "users") {

        history.push({
          pathname: `${PAGES.SIDEBAR_PAGE}${PAGES.USERS}${PAGES.USER_DETAILS}`,
          state: { userData: row },
        });
      } else {
        history.push(
          `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.SCHOOL_DETAILS}/${row["sch_id"]}`
        );
      }
    };

    return (
      <TableContainer ref={ref} className="data-tablebody-container">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  align={col.align || "left"}
                  className="data-tablebody-head-cell"
                  sx={{
                    width: col.width ?? "auto",
                    transform: "none",
                    height: "auto",
                    paddingTop: {
                      xs: "4px !important",
                      sm: "6px !important",
                      md: "8px !important",
                    },
                    paddingBottom: {
                      xs: "4px !important",
                      sm: "6px !important",
                      md: "8px !important",
                    },
                  }}
                >
                  {col.sortable === false ? (
                    col.label
                  ) : (
                    <TableSortLabel
                      active={orderBy === col.key}
                      direction={orderBy === col.key ? order : "asc"}
                      onClick={() => onSort(col.key)}
                      sx={{
                        "& .MuiTableSortLabel-icon": {
                          opacity: 1,
                        },
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          {/* Show skeleton or actual rows */}
          {loading ? (
            <TableSkeleton columns={columns} rows={10} />
          ) : (
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={idx}
                  hover
                  onClick={() => handleRowClick(row)}
                  sx={{
                    cursor: "pointer",
                    height: "48px",
                  }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      align={col.align || "left"}
                      className="data-tablebody-cell"
                      sx={{
                        width: col.width ?? "auto",
                        maxWidth: col.width,
                      }}
                    >
                      {typeof row[col.key] === "object" &&
                      row[col.key]?.render !== undefined
                        ? row[col.key].render
                        : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </TableContainer>
    );
  }
);

export default DataTableBody;
