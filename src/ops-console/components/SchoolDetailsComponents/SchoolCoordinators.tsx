import React, { useState, useMemo, useCallback, useEffect } from "react";
import DataTableBody, { Column } from "../DataTableBody";
import DataTablePagination from "../DataTablePagination";
import { Typography, Box, CircularProgress } from "@mui/material";
import { t } from "i18next";
import "./SchoolCoordinators.css";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { CoordinatorInfo } from "../../../common/constants";

interface DisplayCoordinator {
  id: string;
  name: string;
  gender: string;
  phoneNumber: string;
  emailDisplay: string;
}

interface SchoolCoordinatorsProps {
  data: {
    coordinators?: CoordinatorInfo[];
    totalCoordinatorCount?: number;
  };
  isMobile: boolean;
  schoolId: string;
}

const ROWS_PER_PAGE = 20;

const SchoolCoordinators: React.FC<SchoolCoordinatorsProps> = ({
  data,
  schoolId,
}) => {
  const [coordinators, setCoordinators] = useState<CoordinatorInfo[]>(
    data.coordinators || []
  );
  const [totalCount, setTotalCount] = useState<number>(
    data.totalCoordinatorCount || 0
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState<string | null>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const fetchCoordinators = useCallback(
    async (currentPage: number) => {
      setIsLoading(true);
      const api = ServiceConfig.getI().apiHandler;
      try {
        const response = await api.getCoordinatorsForSchoolPaginated(
          schoolId,
          currentPage,
          ROWS_PER_PAGE
        );
        setCoordinators(response.data);
        setTotalCount(response.total);
      } catch (error) {
        console.error("Failed to fetch coordinators:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [schoolId]
  );

  useEffect(() => {
    if (page === 1) {
      setCoordinators(data.coordinators || []);
      setTotalCount(data.totalCoordinatorCount || 0);
      return;
    }
    fetchCoordinators(page);
  }, [page, fetchCoordinators, data.coordinators, data.totalCoordinatorCount]);

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handleSort = useCallback(
    (key: string) => {
      const isAsc = orderBy === key && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(key);
    },
    [order, orderBy]
  );

  // Data mapping for display
  const displayCoordinators = useMemo((): DisplayCoordinator[] => {
    let sorted = [...coordinators].sort((a, b) => {
      let aValue, bValue;
      switch (orderBy) {
        case "name":
          aValue = a.name || "";
          bValue = b.name || "";
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case "gender":
          aValue = a.gender || "";
          bValue = b.gender || "";
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case "phoneNumber":
          aValue = a.phone || "";
          bValue = b.phone || "";
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case "emailDisplay":
          aValue = a.email || "";
          bValue = b.email || "";
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        default:
          return 0;
      }
    });
    return sorted.map((c) => ({
      id: c.id,
      name: c.name || "N/A",
      gender: c.gender || "N/A",
      phoneNumber: c.phone || "N/A",
      emailDisplay: c.email || "N/A",
    }));
  }, [coordinators, order, orderBy]);

  const pageCount = Math.ceil(totalCount / ROWS_PER_PAGE);
  const isDataPresent = displayCoordinators.length > 0;

  const columns: Column<DisplayCoordinator>[] = [
    {
      key: "name",
      label: t("Coordinator Name"),
      renderCell: (c) => (
        <Typography variant="body2" className="coordinator-name-data">
          {c.name}
        </Typography>
      ),
    },
    { key: "gender", label: t("Gender") },
    { key: "phoneNumber", label: t("Phone Number") },
    {
      key: "emailDisplay",
      label: t("Email"),
      renderCell: (c) => (
        <Typography variant="body2" className="truncate-text">
          {c.emailDisplay}
        </Typography>
      ),
    },
  ];

  return (
    <div className="school-coordinators-page-container">
      {isLoading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      ) : isDataPresent ? (
        <>
          <div className="school-coordinators-data-cable-container">
            {" "}
            <DataTableBody
              columns={columns}
              rows={displayCoordinators}
              orderBy={orderBy}
              order={order}
              onSort={handleSort}
              onRowClick={() => {}}
            />
          </div>
          {pageCount > 1 && (
            <div className="school-coordinators-footer">
              {" "}
              <DataTablePagination
                page={page}
                pageCount={pageCount}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <Box className="school-coordinators-empty-state-container">
          <Typography
            variant="h6"
            className="school-coordinators-empty-state-title"
          >
            {t("Coordinators")}
          </Typography>
          <Typography className="school-coordinators-empty-state-message">
            {t("No coordinators data found for the selected school")}
          </Typography>
        </Box>
      )}
    </div>
  );
};

export default SchoolCoordinators;
