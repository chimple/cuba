// SchoolNotes.tsx
import React, { useEffect, useState, useCallback } from "react";
import "./SchoolNotes.css";
import NoteDetailsDrawer from "./NoteDetailsDrawer";
import { t } from "i18next";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { NOTES_UPDATED_EVENT } from "../../../common/constants";
import TableSortLabel from "@mui/material/TableSortLabel";
import { Pagination } from "@mui/material";

type ApiNote = {
  id: string;
  content?: string;
  classId?: string | null;
  className?: string | null;
  visitId?: string | null;
  createdAt?: string;
  createdBy?: { userId?: string; name?: string; role?: string | null } | null;
  media_links?: string;
};

type Note = {
  id: string;
  createdBy: string;
  role: string | null;
  className?: string | null;
  date: string;
  text: string;
  media_links?: string;
};

const NOTES_PER_PAGE = 10;

function parseDateForDisplay(isoOrString?: string) {
  if (!isoOrString) return "--";

  const d = new Date(isoOrString);
  if (isNaN(d.getTime())) return "--";

  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();

  return `${day} - ${month} - ${year}`;
}


function detectSchoolIdFromUrl(): string | null {
  try {
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1]?.split("?")[0] ?? null;
  } catch {
    return null;
  }
}

const SchoolNotes: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortMode, setSortMode] = useState<"default" | "nameAsc">("default");
  const [notes, setNotes] = useState<Note[]>([]);

  const schoolId = detectSchoolIdFromUrl();

  const mapApiNote = (r: ApiNote): Note => ({
    id: r.id,
    createdBy: r.createdBy?.name ?? "Unknown",
    role: r.createdBy?.role ?? null,
    className: r.className ?? null,
    date: parseDateForDisplay(r.createdAt),
    text: r.content ?? "",
    media_links: r.media_links,
  });

  const handleCreatedBySort = () => {
    setSortMode(prev => (prev === "default" ? "nameAsc" : "default"));
    setCurrentPage(1);
  };


  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!schoolId) throw new Error("No schoolId");

      const api = ServiceConfig.getI().apiHandler;
      if (!api?.getNotesBySchoolId) {
        throw new Error("Notes API not available");
      }
      const offset = (currentPage - 1) * NOTES_PER_PAGE;

      // Fetch ALL notes (big number like 10k to ensure full fetch)
      const res = await api.getNotesBySchoolId(
        schoolId,
        NOTES_PER_PAGE,
        offset,
        sortMode === "nameAsc" ? "createdBy" : "createdAt"
      );
      console.log("RAW API NOTES (current user role):", res.data);

      const mapped = res.data.map((r: ApiNote) => mapApiNote(r));

      console.log("[UI] Mapped notes:", {
        mappedLength: mapped.length,
        sampleMapped: mapped[0],
      });

      // Store full dataset
      setNotes(mapped);

      // Compute pages
      setTotalPages(Math.max(1, Math.ceil(res.totalCount / NOTES_PER_PAGE)));

    } catch (err) {
      console.error("Error loading notes:", err);
      setNotes([]);
      setError(t("Failed to load notes") as string);
    } finally {
      setLoading(false);
    }
  }, [schoolId, currentPage, sortMode]);


  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Listen for newly created notes
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const c = (ev as CustomEvent).detail;
        if (!c) return;

        const mapped = mapApiNote({
          id: c.id,
          content: c.content ?? c.comment ?? "",
          className: c.className ?? c.class_name ?? null,
          createdAt: c.createdAt ?? c.created_at ?? new Date().toISOString(),
          createdBy: c.createdBy ?? {
            name: c.createdByName ?? "Unknown",
            role: c.createdByRole ?? null,
          },
        });

        setCurrentPage(1);
        setNotes(prev => [mapped, ...prev]);
        setSelectedNote(mapped);
        setDrawerOpen(true);
      } catch (e) {
        console.error("NOTES_UPDATED_EVENT error:", e);
      }
    };

    window.addEventListener(NOTES_UPDATED_EVENT, handler as EventListener);
    return () =>
      window.removeEventListener(NOTES_UPDATED_EVENT, handler as EventListener);
  }, []);

  if (loading) {
    return (
      <div className="school-notes-loading">
        {t("Loading notes...")}
      </div>
    );
  }

  return (
    <div
      id="school-notes-panel"
      className="school-notes-panel"
    >
      {error && (
        <div
          id="school-notes-error"
          className="school-notes-error"
        >
          {error}
        </div>
      )}

      {/* SCROLLABLE TABLE AREA */}
      <div
        id="school-notes-table-container"
        className="school-notes-table-container"
      >
        <table
          id="school-notes-table"
          className="school-notes-table"
          role="table"
        >
          <thead>
            <tr>
              <th className="school-notes-th school-notes-sortable-th">
                <TableSortLabel
                  active
                  direction={sortMode === "nameAsc" ? "asc" : "desc"}
                  onClick={handleCreatedBySort}
                >
                  {t("Created By")}
                </TableSortLabel>
              </th>
              <th id="school-notes-th-class">{t("Class")}</th>
              <th id="school-notes-th-role">{t("Role")}</th>
              <th id="school-notes-th-date">{t("Date")}</th>
            </tr>
          </thead>

          <tbody>
            {notes.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "16px" }}>
                  {t("No notes found")}
                </td>
              </tr>
            ) : (
              notes.map((note) => (
                <tr
                  key={note.id}
                  className="school-notes-row"
                  onClick={() => {
                    setSelectedNote(note);
                    setDrawerOpen(true);
                  }}
                >
                  <td>{note.createdBy}</td>
                  <td>{note.className ?? "—"}</td>
                  <td>{note.role ?? "—"}</td>
                  <td>{note.date}</td>
                </tr>
              ))
            )}
          </tbody>


        </table>
      </div>

      {/* FIXED PAGINATION AREA */}
      {totalPages > 1 && (
        <div
          id="school-notes-pagination-container"
          className="school-notes-pagination-container"
        >
          <Pagination
            id="school-notes-pagination"
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            shape="rounded"
          />
        </div>
      )}

      <NoteDetailsDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedNote(null);
        }}
        note={
          selectedNote
            ? {
              id: selectedNote.id,
              createdBy: selectedNote.createdBy,
              role: selectedNote.role ?? "--",
              className: selectedNote.className ?? "--",
              date: selectedNote.date,
              text: selectedNote.text,
              media_links: selectedNote.media_links,
            }
            : null
        }
      />
    </div>
  );

};

export default SchoolNotes;
