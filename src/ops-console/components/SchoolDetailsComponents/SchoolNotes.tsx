// SchoolNotes.tsx
import React, { useEffect, useState, useCallback } from "react";
import "./SchoolNotes.css";
import NoteDetailsDrawer from "./NoteDetailsDrawer";
import { t } from "i18next";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { NOTES_UPDATED_EVENT } from "../../../common/constants";
import { Pagination } from "@mui/material";

type ApiNote = {
  id: string;
  content?: string;
  classId?: string | null;
  className?: string | null;
  visitId?: string | null;
  createdAt?: string;
  createdBy?: { userId?: string; name?: string; role?: string | null } | null;
};

type Note = {
  id: string;
  createdBy: string;
  role: string | null;
  className?: string | null;
  date: string;
  text: string;
};

const NOTES_PER_PAGE = 10;

function parseDateForDisplay(isoOrString?: string) {
  if (!isoOrString) return "--";
  const d = new Date(isoOrString);
  return !isNaN(d.getTime())
    ? d.toLocaleDateString("en-GB")
    : isoOrString;
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
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const schoolId = detectSchoolIdFromUrl();

  const mapApiNote = (r: ApiNote): Note => ({
    id: r.id,
    createdBy: r.createdBy?.name ?? "Unknown",
    role: r.createdBy?.role ?? null,
    className: r.className ?? null,
    date: parseDateForDisplay(r.createdAt),
    text: r.content ?? "",
  });

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

      const res = await api.getNotesBySchoolId(
        schoolId,
        NOTES_PER_PAGE,
        offset
      );

      const mapped = res.data.map((r: ApiNote) => mapApiNote(r));

      setNotes(mapped);
      setTotalPages(Math.max(1, Math.ceil(res.totalCount / NOTES_PER_PAGE)));
    } catch (err) {
      console.error("Error loading notes:", err);
      setNotes([]);
      setError(t("Failed to load notes") as string);
    } finally {
      setLoading(false);
    }
  }, [schoolId, currentPage]);

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
        setNotes((prev) => [mapped, ...prev.slice(0, NOTES_PER_PAGE - 1)]);
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
            <th>{t("Created By")}</th>
            <th>{t("Role")}</th>
            <th>{t("Class")}</th>
            <th>{t("Date")}</th>
          </tr>
        </thead>

        <tbody>
          {notes.map((note) => (
            <tr
              key={note.id}
              id={`school-notes-row-${note.id}`}
              className="school-notes-row"
              tabIndex={0}
              onClick={() => {
                setSelectedNote(note);
                setDrawerOpen(true);
              }}
            >
              <td>{note.createdBy}</td>
              <td>{note.role ?? "—"}</td>
              <td>{note.className ?? "—"}</td>
              <td>{note.date}</td>
            </tr>
          ))}
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
            }
          : null
      }
    />
  </div>
);

};

export default SchoolNotes;
