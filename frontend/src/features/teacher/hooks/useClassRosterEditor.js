import { useCallback, useEffect, useState } from "react";
import { fetchClass, fetchClassStudents } from "../../../api/classes";

export function useClassRosterEditor(classId, enabled) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [initialIds, setInitialIds] = useState(() => new Set());
  const [historyIds, setHistoryIds] = useState(() => new Set());
  const [loading, setLoading] = useState(enabled);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !classId) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const [detail, roster] = await Promise.all([
          fetchClass(classId),
          fetchClassStudents(classId, { includeActivity: true }),
        ]);
        if (cancelled) return;

        setName(detail.name || "");
        setSubject(detail.subject || "");
        setSelectedStudents(roster);
        setSelectedIds(new Set(roster.map((s) => s.id)));
        setInitialIds(new Set(roster.map((s) => s.id)));
        setHistoryIds(
          new Set(roster.filter((s) => s.has_reading_history).map((s) => s.id))
        );
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, classId, reloadToken]);

  function toggleStudent(student) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(student.id)) next.delete(student.id);
      else next.add(student.id);
      return next;
    });
    setSelectedStudents((prev) => {
      if (prev.some((s) => s.id === student.id)) return prev;
      return [...prev, student];
    });
  }

  function removeStudent(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return {
    name,
    setName,
    subject,
    setSubject,
    selectedIds,
    selectedStudents,
    initialIds,
    historyIds,
    loading,
    loadError,
    reload,
    toggleStudent,
    removeStudent,
  };
}
