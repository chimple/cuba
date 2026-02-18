import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import SearchAndFilter from "../SearchAndFilter";
import DataTablePagination from "../DataTablePagination";
import { ServiceConfig } from "../../../services/ServiceConfig";
import "./CardListModal.css";
import { t } from "i18next";

interface StudentItem {
  user?: {
    id: string;
    name?: string | null;
    student_id?: string | null;
    gender?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  phone?: string | null;
  parent?: { phone?: string | null } | null;
}

interface CardListModalProps {
  open: boolean;
  schoolId: string;
  primaryStudentId?: string;
  onClose: () => void;
  onSubmit: (student: StudentItem) => void;
}

const ROWS_PER_PAGE = 20;

const CardListModal: React.FC<CardListModalProps> = ({
  open,
  schoolId,
  primaryStudentId,
  onClose,
  onSubmit,
}) => {
  const api = ServiceConfig.getI().apiHandler;

  /* ---------------- STATE ---------------- */
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] =
    useState<string>();

  /* ---------------- DEBOUNCE ---------------- */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  /* ---------------- FETCH ---------------- */
  const fetchStudents = useCallback(
    async (
      currentPage: number,
      searchText: string,
      silent = false
    ) => {
      if (!open) return;

      if (!silent) setIsLoading(true);

      try {
        let response;

        if (searchText && searchText.trim() !== "") {
          response =
            await api.searchStudentsInSchool(
              schoolId,
              searchText,
              currentPage,
              ROWS_PER_PAGE
            );
        } else {
          response =
            await api.getStudentInfoBySchoolId(
              schoolId,
              currentPage,
              ROWS_PER_PAGE
            );
        }

        setStudents(response.data || []);
        setTotalCount(response.total || 0);
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [api, schoolId, open]
  );

  /* Initial load */
  useEffect(() => {
    if (!open) return;
    fetchStudents(1, "", true);
  }, [open, fetchStudents]);

  /* Pagination + search */
  useEffect(() => {
    if (!open) return;
    fetchStudents(page, debouncedSearch);
  }, [page, debouncedSearch, fetchStudents, open]);

  /* Fix → when clearing search reload list */
  useEffect(() => {
    if (!open) return;

    if (debouncedSearch === "") {
      fetchStudents(1, "", true);
    }
  }, [debouncedSearch, fetchStudents, open]);

  /* Reset when modal opens */
  useEffect(() => {
    if (open) {
      setSearch("");
      setDebouncedSearch("");
      setSelectedId(undefined);
      setPage(1);
    }
  }, [open]);

  /* -------- NORMALIZE -------- */
  const normalizedStudents = useMemo(() => {
    return students.map((s: any) => {
      const user = s.user ?? s;
      const rawPhone =
        s.parent?.phone ??
        s.phone ??
        user?.phone ??
        "";

      const phoneDigits =
        String(rawPhone).replace(/\D/g, "");

      return {
        ...s,
        user: {
          id: user?.id,
          name: user?.name ?? "",
          student_id: user?.student_id ?? "",
          gender: user?.gender ?? "",
          email: user?.email ?? "",
          phone: phoneDigits,
        },
        parent: {
          phone: phoneDigits,
        },
      };
    });
  }, [students]);

  /* -------- EXCLUDE PRIMARY -------- */
  const filteredStudents = useMemo(() => {
    return normalizedStudents.filter(
      (s) => s.user?.id !== primaryStudentId
    );
  }, [normalizedStudents, primaryStudentId]);

  /* -------- SMART SEARCH (FIXED) -------- */
  const searchedStudents = useMemo(() => {
    const text =
      debouncedSearch.toLowerCase().trim();

    if (!text) return filteredStudents;

    const isNumberSearch =
      /^[0-9]+$/.test(text);

    return filteredStudents.filter((s) => {
      const id = String(
        s.user?.student_id ?? ""
      ).toLowerCase();

      const name = String(
        s.user?.name ?? ""
      ).toLowerCase();

      const gender = String(
        s.user?.gender ?? ""
      ).toLowerCase();

      const email = String(
        s.user?.email ?? ""
      ).toLowerCase();

      const phoneDigits = String(
        s.parent?.phone ?? ""
      ).replace(/\D/g, "");

      if (isNumberSearch) {
        return (
          phoneDigits.includes(text) ||
          id.includes(text)
        );
      }

      return (
        id.includes(text) ||
        name.includes(text) ||
        gender.includes(text) ||
        email.includes(text)
      );
    });
  }, [filteredStudents, debouncedSearch]);

  const selectedStudent = searchedStudents.find(
    (s) => s.user?.id === selectedId
  );

  const pageCount = Math.ceil(
    totalCount / ROWS_PER_PAGE
  );

  if (!open) return null;

  /* ================= UI ================= */

  return (
    <div
      id="cardlist-modal-backdrop"
      className="cardlist-modal-backdrop"
    >
      <div
        id="cardlist-modal"
        className="cardlist-modal"
      >
        {/* HEADER */}
        <div
          id="cardlist-header"
          className="cardlist-header"
        >
          <div id="cardlist-header-text">
            <h2 className="cardlist-title">
              {t("Merge Student")}
            </h2>
            <p className="cardlist-subtitle">
             {t("Select which student profile to merge into")}
            </p>
          </div>

          <button
            id="cardlist-close-button"
            className="cardlist-close-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* SEARCH */}
        <div
          id="cardlist-search"
          className="cardlist-search"
        >
          <SearchAndFilter
            searchTerm={search}
            onSearchChange={(e) =>
              setSearch(e.target.value)
            }
            isFilter={false}
            forceOpenSearch={true}
            variantType="standard"
          />
        </div>

        {/* WARNING */}
        <div
          id="cardlist-warning"
          className="cardlist-warning"
        >
          ⚠️
          {t(
            "This will combine both student records permanently. This action cannot be undone."
          )}
        </div>

        {/* LIST */}
        <div
          id="cardlist-container"
          className="cardlist-container"
        >
          {isLoading ? (
            <div className="cardlist-loading">
              {t("Loading...")}
            </div>
          ) : searchedStudents.length === 0 ? (
            <div className="cardlist-empty">
              {t("No students found")}
            </div>
          ) : (
            searchedStudents.map((s) => {
              const isSelected =
                selectedId === s.user?.id;

              return (
                <label
                  key={s.user?.id}
                  className={`cardlist-card ${
                    isSelected
                      ? "cardlist-card-selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    checked={isSelected}
                    onChange={() =>
                      setSelectedId(
                        s.user?.id!
                      )
                    }
                  />

                  <div className="cardlist-row">
                    <span className="col-id">
                      {s.user?.student_id}
                    </span>

                    <span className="col-name">
                      {s.user?.name}
                    </span>

                    <span className="col-gender">
                      {s.user?.gender}
                    </span>

                    <span className="col-phone">
                      {s.parent?.phone ||
                        "N/A"}
                    </span>
                  </div>
                </label>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div
          id="cardlist-footer"
          className="cardlist-footer"
        >
          {pageCount > 1 && (
            <div
              id="cardlist-pagination"
              className="cardlist-pagination"
            >
              <DataTablePagination
                page={page}
                pageCount={pageCount}
                onPageChange={(p) =>
                  setPage(p)
                }
              />
            </div>
          )}

          <div id="cardlist-footer-actions">
            <button
              id="cardlist-cancel-btn"
              className="cardlist-btn cardlist-btn-text"
              onClick={onClose}
            >
              {t("Cancel")}
            </button>

            <button
              id="cardlist-merge-btn"
              className="cardlist-btn cardlist-btn-primary"
              disabled={!selectedStudent}
              onClick={() =>
                selectedStudent &&
                onSubmit(selectedStudent)
              }
            >
              {t("Merge")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardListModal;
