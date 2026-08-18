import { useCallback, useEffect, useState } from "react";
import { fetchClass } from "../../../api/classes";

export function useClassContext(classId) {
  const [classItem, setClassItem] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const detail = await fetchClass(classId);
        if (cancelled) return;
        setClassItem(detail);
        setStudentCount(detail.student_count ?? detail.students?.length ?? 0);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setLoadError(true);
          setClassItem(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [classId, reloadToken]);

  return { classItem, studentCount, loading, loadError, reload };
}
