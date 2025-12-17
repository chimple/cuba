// SchoolNotes.tsx
import React, { useEffect, useState, useCallback } from "react";
import "./SchoolNotes.css";
import NoteDetailsDrawer from "./NoteDetailsDrawer"; // your drawer component (already present)
import { t } from "i18next";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { NOTES_UPDATED_EVENT } from "../../../common/constants";

/**
 * Dynamic SchoolNotes:
 * - autodetects schoolId from URL if not provided by parent
 * - fetches notes from apiHandler.getNotesBySchoolId(schoolId)
 * - listens to `window` event 'NOTES_UPDATED_EVENT' to prepend newly created notes
 * - opens NoteDetailsDrawer on row click
 *
 * This keeps your Tabs and Page structure unchanged.
 */

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
  date: string; // display value
  text: string;
};

function parseDateForDisplay(isoOrString?: string) {
  if (!isoOrString) return "--";
  const d = new Date(isoOrString);
  if (!isNaN(d.getTime())) {
    // prefer dd/mm/yyyy
    return d.toLocaleDateString("en-GB");
  }
  return isoOrString;
}

function detectSchoolIdFromUrl(): string | null {
  try {
    const path = window.location.pathname || "";
    // assume last segment is id: /.../school-details/<id>
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    const last = parts[parts.length - 1];
    // strip query params if present
    return last.split("?")[0] || null;
  } catch {
    return null;
  }
}

const SchoolNotes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const schoolId = detectSchoolIdFromUrl();

  const mapApiNote = (r: ApiNote): Note => {
    const createdByName = r.createdBy?.name ?? "Unknown";
    const createdByRole = r.createdBy?.role ?? null;
    const className = r.className ?? null;
    const date = r.createdAt ? parseDateForDisplay(r.createdAt) : "--";
    const text = r.content ?? "";
    return {
      id: r.id,
      createdBy: createdByName,
      role: createdByRole,
      className,
      date,
      text,
    };
  };

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!schoolId) {
        throw new Error("No schoolId detected in URL");
      }
      const api = ServiceConfig.getI().apiHandler;
      if (!api || !api.getNotesBySchoolId) throw new Error("Notes API not available");
      const res = await api.getNotesBySchoolId(schoolId, 100, 0);
      if (!res || !Array.isArray(res)) {
        // fallback to hardcoded data
        setNotes([]);
      } else {
        const mapped = res.map((r: any) => mapApiNote(r));
        setNotes(mapped);
      }
    } catch (err) {
      console.error("Error loading notes:", err);
      // show fallback so UI isn't empty
      setNotes([]);
      setError(t("Failed to load notes") as string);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // listen to global event when a note is created elsewhere (SchoolDetailsPage handler will dispatch)
  useEffect(() => {
    const handler = (ev: Event) => {
  try {
    const c = (ev as CustomEvent).detail as any;
    if (!c) return;

    let candidate: ApiNote | null = null;

    if (c && typeof c === "object") {
      candidate = {
        id: c.id,
        content: c.content ?? c.comment ?? "",
        classId: c.classId ?? c.class_id ?? null,
        className: c.className ?? c.class_name ?? null,
        visitId: c.visitId ?? c.visit_id ?? null,
        createdAt: c.createdAt ?? c.created_at ?? new Date().toISOString(),
        createdBy: c.createdBy ?? c.created_by ?? { name: c.createdByName ?? null, role: c.createdByRole ?? null },
      };
    }

    if (candidate) {
      const mapped = mapApiNote(candidate);
      setNotes((prev) => [mapped, ...prev]);
      setSelectedNote(mapped);
      setDrawerOpen(true);
    }
  } catch (err) {
    console.error("NOTES_UPDATED_EVENT handler error:", err);
  }
};


    window.addEventListener(NOTES_UPDATED_EVENT, handler as EventListener);
    return () => window.removeEventListener(NOTES_UPDATED_EVENT, handler as EventListener);
  }, []);

  const openNote = (note: Note) => {
    setSelectedNote(note);
    setDrawerOpen(true);
  };

  const closeNote = () => {
    setDrawerOpen(false);
    setSelectedNote(null);
  };

  if (loading) {
    return (
      <div className="school-notes-loading">{t("Loading notes...")}</div>
    );
  }

  return (
    <div className="school-notes-container">
      <table className="school-notes-table" role="table" aria-label={t("School notes table") as string}>
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
              className="school-notes-row"
              onClick={() => openNote(note)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openNote(note);
              }}
              aria-label={`${note.createdBy} ${note.role ?? ""} ${note.className ?? "—"} ${note.date}`}
            >
              <td>{note.createdBy}</td>
              <td>{note.role ?? "—"}</td>
              <td>{note.className ?? "—"}</td>
              <td>{note.date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <NoteDetailsDrawer note={selectedNote ? {
        id: selectedNote.id,
        createdBy: selectedNote.createdBy,
        role: selectedNote.role ?? "--",
        className: selectedNote.className ?? "--",
        date: selectedNote.date,
        text: selectedNote.text
      } : null} open={drawerOpen} onClose={closeNote} />
    </div>
  );
};

export default SchoolNotes;
