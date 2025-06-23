import React, { useState, useMemo, useCallback, useEffect } from "react";
import DataTableBody, { Column } from "../DataTableBody";
import DataTablePagination from "../DataTablePagination";
import { Typography, Box } from "@mui/material";
import { t } from "i18next";
import "./SchoolCoordinators.css";

export interface Coordinator {
  id: string;
  name: string | null;
  gender: string | null;
  phoneNumber: string | null;
  email: string | null;
}

interface SchoolCoordinatorsProps {
  data: {
    coordinators: Coordinator[];
  };
  isMobile: boolean;
}

const ROWS_PER_PAGE = 7;

const SchoolCoordinators: React.FC<SchoolCoordinatorsProps> = ({ data, isMobile }) => {

  const [orderBy, setOrderBy] = useState<string | null>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  const handleSort = useCallback((key: string) => {
    const isAsc = orderBy === key && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(key);
  }, [order, orderBy]);

  const allCoordinators = useMemo(() => {
    const coordinatorsFromProps = data?.coordinators || [];
    return coordinatorsFromProps.map(coordinator => ({
      ...coordinator,
      id: coordinator.id,
      name: coordinator.name || "N/A",
      gender: coordinator.gender || "N/A",
      phoneNumber: coordinator.phoneNumber || "N/A",
      emailDisplay: coordinator.email || "N/A",
    }));
  }, [data?.coordinators]); 

  useEffect(() => {
    const newPageCount = Math.ceil(allCoordinators.length / ROWS_PER_PAGE);
    setPageCount(Math.max(1, newPageCount));
    if (page > newPageCount && newPageCount > 0) {
      setPage(newPageCount);
    } else if (page > 1 && newPageCount === 0) {
      setPage(1);
    }
  }, [allCoordinators, page]);

  const coordinatorsForCurrentPage = useMemo(() => {
    const startIndex = (page - 1) * ROWS_PER_PAGE;
    return allCoordinators.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [allCoordinators, page]);

  const columns: Column<Coordinator & { emailDisplay: string }>[] = [
    { key: "name", label: t("Coordinator Name"), renderCell: (coordinator) => <Typography variant="body2" className="coordinator-name-data">{coordinator.name}</Typography> },
    { key: "gender", label: t("Gender") },
    { key: "phoneNumber", label: t("Phone Number") },
    { key: "email", label: t("Email"), renderCell: (coordinator) => <Typography variant="body2" className="truncate-text">{coordinator.emailDisplay}</Typography> },
  ];

  const handlePageChange = (newPage: number) => {
    if (newPage !== page) setPage(newPage);
  };

  const isDataPresent = allCoordinators.length > 0;

  return (
    <div className="schoolCoordinators-pageContainer">
      {isDataPresent ? (
        <div className="schoolCoordinators-dataTableContainer">
          <DataTableBody
            columns={columns}
            rows={coordinatorsForCurrentPage}
            orderBy={orderBy}
            order={order}
            onSort={handleSort}
          />
          {allCoordinators.length > 0 && (
            <div className="schoolCoordinators-school-list-pagination">
              <DataTablePagination
                page={page}
                pageCount={pageCount}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      ) : (
        <Box className="schoolCoordinators-emptyStateContainer">
          <Typography variant="h6" className="schoolCoordinators-emptyStateTitle">
            {t("Coordinators")}
          </Typography>
          <Typography className="schoolCoordinators-emptyStateMessage">
            {t("No coordinators data found for the selected school")}
          </Typography>
        </Box>
      )}
    </div>
  );
};

export default SchoolCoordinators;