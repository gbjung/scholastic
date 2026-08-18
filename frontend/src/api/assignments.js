import { apiFetch } from "./client";

export function fetchBooks() {
  return apiFetch("/books");
}

export function fetchStudentReadingLogs(studentId, classId) {
  const params = new URLSearchParams({
    student_id: studentId,
    class_id: classId,
  });
  return apiFetch(`/assignments/reading-logs?${params}`);
}

export function createAssignment({ classId, bookId, dueDate, name }) {
  return apiFetch("/assignments", {
    method: "POST",
    body: JSON.stringify({
      class_id: classId,
      book_id: bookId,
      due_date: dueDate,
      name,
    }),
  });
}
