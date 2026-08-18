import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  createClass,
  updateClassStudents,
} from "../../../api/classes";
import {
  DetailPageSkeleton,
  ErrorState,
} from "../../../components/states";
import { useClassRosterEditor } from "../hooks/useClassRosterEditor";
import { formatRemovalWarningNames, studentName } from "../utils";
import StudentPicker from "./StudentPicker";
import "./ClassRosterForm.css";

function ClassRosterForm({ mode, classId }) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";
  const editor = useClassRosterEditor(classId, isEdit);
  const {
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
  } = editor;

  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [formError, setFormError] = useState(false);

  const removalWarnings = useMemo(() => {
    if (!isEdit) return [];
    return [...initialIds]
      .filter((id) => !selectedIds.has(id) && historyIds.has(id))
      .map((id) => {
        const student = selectedStudents.find((s) => s.id === id);
        return student ? studentName(student) : null;
      })
      .filter(Boolean);
  }, [isEdit, initialIds, selectedIds, historyIds, selectedStudents]);

  async function submitForm() {
    if (!name.trim()) {
      setNameError("Class name is required.");
      return;
    }
    setNameError("");
    setFormError(false);
    setSubmitting(true);

    try {
      if (isEdit) {
        const add = [...selectedIds].filter((id) => !initialIds.has(id));
        const remove = [...initialIds].filter((id) => !selectedIds.has(id));
        if (add.length || remove.length) {
          await updateClassStudents(classId, { add, remove });
        }
        navigate(`/classes/${classId}`, { replace: true });
      } else {
        const created = await createClass({
          name: name.trim(),
          subject: subject.trim(),
        });
        const add = [...selectedIds];
        if (add.length) {
          await updateClassStudents(created.id, { add, remove: [] });
        }
        navigate(`/classes/${created.id}`, { replace: true });
      }
    } catch (err) {
      console.error(err);
      setFormError(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await submitForm();
  }

  const backTo = isEdit ? `/classes/${classId}` : "/classes";
  const backLabel = isEdit ? "Back to class" : "Your classes";

  if (loading) {
    return (
      <main className="roster-page">
        <div className="roster-page__inner">
          <DetailPageSkeleton />
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="roster-page">
        <div className="roster-page__inner">
          <ErrorState title="Couldn't load this class" onRetry={reload} />
        </div>
      </main>
    );
  }

  const submitLabel = submitting
    ? isEdit
      ? "Saving…"
      : "Creating…"
    : isEdit
      ? "Save changes"
      : "Create class";

  return (
    <main className="roster-page">
      <div className="roster-page__inner">
        <Link className="roster-page__back" to={backTo}>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          {backLabel}
        </Link>

        <h1>{isEdit ? "Manage roster" : "New class"}</h1>

        <form className="roster-form" onSubmit={handleSubmit} noValidate>
          <section className="roster-card roster-card--fields">
            <div className="roster-fields">
              <div className="roster-field">
                <label htmlFor="class-name">Class name</label>
                <input
                  id="class-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  autoComplete="off"
                  readOnly={isEdit}
                  className={nameError ? "input-invalid" : undefined}
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? "class-name-error" : undefined}
                />
                {nameError && (
                  <p id="class-name-error" className="field-error" role="alert">
                    {nameError}
                  </p>
                )}
              </div>
              <div className="roster-field">
                <label htmlFor="class-subject">
                  Subject{" "}
                  <span className="roster-field__optional">optional</span>
                </label>
                <input
                  id="class-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  autoComplete="off"
                  readOnly={isEdit}
                />
              </div>
            </div>
          </section>

          <StudentPicker
            selectedIds={selectedIds}
            selectedStudents={selectedStudents}
            onToggle={toggleStudent}
            onRemove={removeStudent}
          />

          {removalWarnings.length > 0 && (
            <div className="roster-warning" role="alert">
              <p>
                Removing {formatRemovalWarningNames(removalWarnings)} will take
                them off this class roster. Their reading history for past
                assignments stays on record.
              </p>
            </div>
          )}

          {formError && (
            <ErrorState
              title={isEdit ? "Couldn't save this class" : "Couldn't create this class"}
              onRetry={submitForm}
            />
          )}

          <div className="roster-actions">
            <button
              type="submit"
              className="roster-actions__submit"
              disabled={submitting}
            >
              {submitLabel}
            </button>
            <button
              type="button"
              className="roster-actions__cancel"
              onClick={() => navigate(backTo)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default ClassRosterForm;
