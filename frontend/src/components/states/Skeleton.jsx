import "./states.css";

function SkeletonBlock({ className = "", style }) {
  return <div className={`skeleton-block ${className}`.trim()} style={style} />;
}

function SkeletonChrome({ children, label = "Loading" }) {
  return (
    <div aria-busy="true">
      <span className="visually-hidden">{label}</span>
      {children}
    </div>
  );
}

export function AssignmentListSkeleton() {
  return (
    <SkeletonChrome label="Loading assignments">
      <div className="skeleton-screen">
        <div className="skeleton-screen__header">
          <SkeletonBlock className="skeleton-screen__title" />
          <SkeletonBlock className="skeleton-screen__sub" />
        </div>
        {[0, 1].map((key) => (
          <div key={key} className="skeleton-card">
            <div className="skeleton-row">
              <SkeletonBlock className="skeleton-cover" />
              <div className="skeleton-stack">
                <SkeletonBlock className="skeleton-line skeleton-line--md" />
                <SkeletonBlock className="skeleton-line skeleton-line--sm" />
              </div>
              <SkeletonBlock className="skeleton-pill" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonChrome>
  );
}

export function ClassListSkeleton() {
  return (
    <SkeletonChrome label="Loading classes">
      <div className="skeleton-screen">
        <div className="skeleton-screen__header">
          <SkeletonBlock className="skeleton-screen__title" />
          <SkeletonBlock className="skeleton-screen__sub" />
        </div>
        {[0, 1, 2].map((key) => (
          <div key={key} className="skeleton-card">
            <div className="skeleton-stack">
              <SkeletonBlock className="skeleton-line skeleton-line--md" />
              <SkeletonBlock className="skeleton-line skeleton-line--sm" />
              <SkeletonBlock className="skeleton-pill" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonChrome>
  );
}

export function RosterSkeleton() {
  return (
    <SkeletonChrome label="Loading roster">
      <div className="skeleton-card" style={{ padding: 0, overflow: "hidden" }}>
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className="skeleton-row"
            style={{ padding: "0.8rem 1rem", borderBottom: "0.5px solid var(--border)" }}
          >
            <SkeletonBlock className="skeleton-avatar" />
            <SkeletonBlock className="skeleton-line skeleton-line--md" />
          </div>
        ))}
      </div>
    </SkeletonChrome>
  );
}

export function ProgressTableSkeleton() {
  return (
    <SkeletonChrome label="Loading progress">
      <div className="skeleton-screen" style={{ paddingTop: 0 }}>
        <div className="skeleton-screen__header">
          <SkeletonBlock className="skeleton-screen__title" />
          <SkeletonBlock className="skeleton-screen__sub" />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.65rem",
            marginBottom: "1.25rem",
          }}
        >
          {[0, 1, 2, 3].map((key) => (
            <SkeletonBlock
              key={key}
              style={{ height: "4.25rem", borderRadius: "12px" }}
            />
          ))}
        </div>
        <div className="skeleton-table">
          {[0, 1, 2].map((key) => (
            <div key={key} className="skeleton-table__row">
              <SkeletonBlock className="skeleton-line" />
              <SkeletonBlock className="skeleton-pill" />
              <SkeletonBlock className="skeleton-line skeleton-line--sm" />
              <SkeletonBlock className="skeleton-line skeleton-line--sm" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonChrome>
  );
}

export function SessionListSkeleton() {
  return (
    <SkeletonChrome label="Loading reading sessions">
      <div>
        {[0, 1, 2].map((key) => (
          <div key={key} className="skeleton-session">
            <SkeletonBlock className="skeleton-line skeleton-line--md" />
            <SkeletonBlock
              className="skeleton-line skeleton-line--sm"
              style={{ marginTop: "0.45rem" }}
            />
          </div>
        ))}
      </div>
    </SkeletonChrome>
  );
}

export function AuthLoadingSkeleton() {
  return (
    <SkeletonChrome label="Loading">
      <div className="skeleton-screen">
        <div className="skeleton-screen__header">
          <SkeletonBlock className="skeleton-screen__title" />
          <SkeletonBlock className="skeleton-screen__sub" />
        </div>
        <div className="skeleton-card">
          <div className="skeleton-stack">
            <SkeletonBlock className="skeleton-line" />
            <SkeletonBlock className="skeleton-line skeleton-line--md" />
            <SkeletonBlock className="skeleton-line skeleton-line--sm" />
          </div>
        </div>
      </div>
    </SkeletonChrome>
  );
}

export function DetailPageSkeleton() {
  return (
    <SkeletonChrome label="Loading">
      <div className="skeleton-screen">
        <SkeletonBlock className="skeleton-line skeleton-line--sm" style={{ width: "8rem", marginBottom: "1rem" }} />
        <div className="skeleton-screen__header">
          <SkeletonBlock className="skeleton-screen__title" />
          <SkeletonBlock className="skeleton-screen__sub" />
        </div>
        <div className="skeleton-card">
          <div className="skeleton-row">
            <SkeletonBlock className="skeleton-cover--lg skeleton-cover" />
            <div className="skeleton-stack">
              <SkeletonBlock className="skeleton-line" />
              <SkeletonBlock className="skeleton-line skeleton-line--md" />
              <SkeletonBlock className="skeleton-line skeleton-line--sm" />
            </div>
          </div>
        </div>
      </div>
    </SkeletonChrome>
  );
}
