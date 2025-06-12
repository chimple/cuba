import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import "./DataTableBody.css";
import { useHistory } from "react-router";
import { PAGES } from "../../common/constants";
export interface Column<T> {
  key: keyof T;
  label: string;
  align?: "left" | "right" | "center" | "justify" | "inherit";
  render?: (row: T) => React.ReactNode;
  [key: string]: any;
}

interface Props {
  columns: Record<string, any>[];
  rows: Record<string, any>[];
  orderBy: string | null;
  order: "asc" | "desc";
  onSort: (key: string) => void;
  detailPageRouteBase?: string; // optional base route for navigation
  onRowClick?: (id: string | number, row: any) => void; // optional custom click handler
}

const DataTableBody: React.FC<Props> = ({
  columns,
  rows,
  orderBy,
  order,
  onSort,
  detailPageRouteBase,
  onRowClick,
}) => {
  const history = useHistory();
  const handleRowClick = (row: any) => {
    const id = row.id;
    if (!id) {
      console.warn("Row missing 'id' property");
      return;
    }

    if (onRowClick) {
      onRowClick(id, row);
      return;
    }

    if (detailPageRouteBase === "programs") {
      history.push(
        `${PAGES.SIDEBAR_PAGE}${PAGES.PROGRAM_PAGE}${PAGES.PROGRAM_DETAIL_PAGE}/${row["id"]}`
      );
    } else {
      history.push(
        `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.SCHOOL_DETAILS}/${row["sch_id"]}`
      );
    }
  };

  return (
    <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
      <Table size="small">
        <TableHead className="data-tablebody-head">
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                align={col.align || "left"}
                sx={{
                  transform: "none",
                  backgroundColor: "#DDE1E6 !important",
                  height: "48px",
                  fontSize: "14px",
                }}
              >
                <TableSortLabel
                  active={orderBy === col.key}
                  direction={orderBy === col.key ? order : "asc"}
                  onClick={() => onSort(col.key)}
                >
                  {col.label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
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
      </Table>
    </TableContainer>
  );
};

export default DataTableBody;
