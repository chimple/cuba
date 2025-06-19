import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DataTableBody from "../components/DataTableBody";
import DataTablePagination from "../components/DataTablePagination";
import { SupabaseApi } from "../../services/api/SupabaseApi";
import { USER_ROLE } from "../../common/constants";
import { t } from "i18next";
import { ServiceConfig } from "../../services/ServiceConfig";
import { RoleLabels, RoleType } from "../../interface/modelInterfaces";

interface User {
  fullName: string;
  role: string;
}

interface UsersPageProps {
  initialUsers?: User[];
}

const columns = [
  { key: "fullName", label: "Full Name", width: "30%" },
  { key: "role", label: "Role", width: "70%" },
];

const ROWS_PER_PAGE = 7;

const UsersPage: React.FC<UsersPageProps> = ({ initialUsers }) => {
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState<User[]>(initialUsers ?? []);
  const [loading, setLoading] = useState(initialUsers ? false : true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  useEffect(() => {
    if (initialUsers) {
      setUsers(initialUsers);
      setLoading(false);
      return;
    }
    const fetchUsers = async () => {
      setLoading(true);
      const api = ServiceConfig.getI().apiHandler;
      const result = await api.getManagersAndCoordinators();
      if (result && result.length > 0) {
        setUsers(
          result.map((u: any) => ({
            fullName: u.name,
            role: RoleLabels[u.role as RoleType] || u.role,
          }))
        );
      } else {
        setUsers([]);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [initialUsers]);

  const sortedUsers = [...(users || [])]
    .filter((u) => !!u.fullName)
    .sort((a, b) =>
      order === "asc"
        ? a.fullName.localeCompare(b.fullName)
        : b.fullName.localeCompare(a.fullName)
    );

  const filteredUsers = sortedUsers.filter((user) =>
    user.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const pageCount = Math.ceil(filteredUsers.length / ROWS_PER_PAGE);

  const paginatedUsers = filteredUsers.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [filteredUsers, pageCount, page]);

  const handleSort = () => {
    setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div style={{ background: "white", height: "100%" }}>
      <Box
        width="100%"
        py={isMobile ? 2 : 4}
        sx={{
          px: isMobile ? "20px" : 4,
          background: "white",
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          {isMobile ? (
            <>
              <Box sx={{ width: 40 }} />
              <Typography fontSize="25px" fontWeight="bold" textAlign="center">
                {t("Users")}
              </Typography>
              <IconButton sx={{ color: "black", width: 40, height: 40 }}>
                <NotificationsIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Typography fontSize="29px" fontWeight="bold">
                {t("Users")}
              </Typography>
              <IconButton sx={{ color: "black" }}>
                <NotificationsIcon />
              </IconButton>
            </>
          )}
        </Box>
        {isMobile ? (
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <TextField
              placeholder="Search"
              size="small"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 0, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "grey.600" }} />
                  </InputAdornment>
                ),
              }}
            />
            {localStorage.getItem(USER_ROLE) !== "field_coordinator" && (
              <Button
                variant="outlined"
                sx={{
                  minWidth: 0,
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  color: "#1976d2",
                  borderColor: "#d0d0d0",
                  padding: 0,
                }}
              >
                <AddIcon sx={{ fontSize: 25 }} />
              </Button>
            )}
          </Box>
        ) : (
          <Box
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
            gap={2}
            mb={3}
          >
            {localStorage.getItem(USER_ROLE) !== "field_coordinator" && (
              <Button
                variant="outlined"
                startIcon={<AddIcon sx={{ color: "#1976d2", fontSize: 25 }} />}
                sx={{
                  borderRadius: "999px",
                  color: "#6e6e6e",
                  borderColor: "#d0d0d0",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                }}
              >
                {t("New User")}
              </Button>
            )}
            <TextField
              placeholder="Search"
              size="small"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "grey.600" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100vh"
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <DataTableBody
              columns={columns}
              rows={paginatedUsers}
              orderBy={"fullName"}
              order={order}
              onSort={handleSort}
            />
            <DataTablePagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </>
        )}
      </Box>
    </div>
  );
};

export default UsersPage;
