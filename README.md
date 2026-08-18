# Reading Assignment Portal

A portal where teachers can assign books to read for their classes and track how students are progressing, and where students can see their assignments, log their reading and update their progression.

Flask + PostgreSQL on the backend, React on the frontend, JWT auth.

## Try it

**https://scholastic-web.onrender.com**

| Role | Email | Password |
|---|---|---|
| Teacher | `teacher@scholastic.test` | `password123` |
| Student | `amara.okafor@scholastic.test` | `password123` |

The login screen has **Teacher** and **Student** buttons that fill these in for you, and the form is prefilled with the teacher account on load, so signing in is one click.

---

## Running locally

### Prerequisites

- Python 3.12+ and [uv](https://docs.astral.sh/uv/)
- Node 18+
- PostgreSQL 14+ running locally

### 1. Database

```bash
createdb scholastic
```

### 2. Backend

```bash
cp .env.example .env        # then set DATABASE_URL and JWT_SECRET_KEY
cd backend
uv sync
uv run python seed.py       # creates the schema and demo data
uv run python app.py
```

The API runs on `http://127.0.0.1:5000`.

`.env` lives at the repo root, one level above `backend/`:

```
DATABASE_URL=postgresql://<your-user>@localhost:5432/scholastic
JWT_SECRET_KEY=<any random string>
FRONTEND_URL=http://localhost:3000
```

`seed.py` drops and recreates every table, so re-run it any time to get back to a clean demo state.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

The app runs on `http://localhost:3000`.

### Tests

```bash
cd backend
uv run pytest
```

Tests run against in-memory SQLite, so no database setup is needed.

### Demo accounts

Same credentials as above. The shortcut buttons are gated behind `REACT_APP_ENABLE_DEMO` and would not ship enabled. They post the seeded credentials through the normal `/auth/login` endpoint, so there is no bypass route.

The seed data deliberately covers every UI state: overdue, in progress, completed, not started, students with several logged sessions, and students with none.

---

---

## Deployment

Deployed to [Render](https://render.com) from `render.yaml` at the repo root, which defines three services: the Flask API as a web service, the React build as a static site, and a managed Postgres instance. Pushing to `main` redeploys automatically.

The database seeds itself on first boot via `backend/bootstrap.py` and never again. `seed.py` drops and recreates every table, so running it against a live database would wipe anything a visitor had done. Added for quick demo iteration.

## What I built

Teacher:

- Class list, where each class shows whether anyone is behind, everyone is on track, or nothing is assigned yet
- Class detail, with the class's assignments and their completion progress plus the roster
- Create a class and add students, or edit an existing roster
- Create an assignment (book, reading scope, due date) for a whole class
- Per-assignment progress table with summary stats, where clicking a student opens their reading sessions and notes

Student:

- All assignments across every class in one list, grouped into Overdue, Upcoming, and Completed
- Assignment detail with a link to the book, a form for logging reading, session history, and a button to mark it complete

Both:

- Registration and login, with role-based routing and API authorization
- Loading, empty, and error states on every screen, plus 404 and wrong-role redirects

---

## Architectural decisions

### Data model

I started with the data before thinking about the UI.

Interpreted handling minutes read as an interactive log where both the students and teachers can utilize it. So `ReadingLog` is its own table, one row per session, holding minutes, where the student stopped, and any notes they wanted to leave. The total is just a sum of the rows. That way a teacher sees the actual pattern of when someone read and what they thought about it, rather than a running counter that could mean anything.

The brief says teachers assign to "a student(s)", which I read as leaving the grouping open. I went with classes, since that's how it works in a school in the real world. Teachers have multiple classes and they need somewhere to manage those groups whether or not any assignments exist. Assigning to a class creates an `AssignmentStatus` for everyone enrolled, and adding a student later backfills theirs. `StudentEnrollment` table exists as a representation of students in their classes.

`AssignmentStatus` holds one student's progress for one assignment, and it owns that student's reading logs. `Assignment` points at a `Book` by foreign key.

For users I kept a base `User` table with email, password hash, and role, then separate `Student` and `Teacher` profile tables. Auth logic doesn't have to branch on role that way, and if either profile grows fields later it won't turn into one wide table trying to accommodate two separate very unique user types.

Everything uses UUID primary keys and timezone-aware timestamps.

### API

Roughly RESTful, organized by resource rather than by role. So `/books`, `/assignments`, `/classes`, with the role check inside each handler. Splitting it into `/teacher/...` and `/student/...` would have meant the same resource logic in two places.

One thing worth calling out is that a student's own id is never in a path. `GET /assignments` returns your assignments, resolved from the JWT.

### Layering

The usual blueprint, service, model split. Two decisions inside it are worth mentioning.

Services are split by resource (`assignments`, `classes`, `books`, `auth`) rather than by actor, so there's no `TeacherService`. Organizing around who's asking would have put the same rules in two places.

Errors are typed (`NotFoundError`, `ValidationError`, `ForbiddenError`) and mapped to status codes by handlers on the app, which means no blueprint has a try/except in it. Ownership and enrollment failures raise `NotFoundError` on purpose instead of a 403, since a 403 would confirm that something exists in a class the caller isn't allowed to see.

### Auth

JWT through `flask-jwt-extended`. It felt like the right middle ground here. It keeps user context as they move around the UI and carries the role claim for permission checks, without me building session storage or pulling in something heavier like a full OAuth flow.

### Frontend

Organized by feature, so `features/student/` and `features/teacher/` each own their own pages, components, hooks, and utils. With `components/` holding shared assets.

### UI

I really wanted to incorporate an easy to interpret and navigate UI since the target demo would potentially be students. I also wanted to empower the teachers student relationship through reading logs and teacher feedback. I researched education mock ups and ui via dribbble for inspiration from those in the education space. Really just trying to create an easy to use, easy to see, and non-frustration interaction.

For the palette I borrowed from Goodreads, since it's already user tested and suits a reading product: warm off-white, not much UI color, book covers doing the visual work. Accessibility I treated as a requirement rather than something to add at the end, so semantic HTML throughout, status always shown with an icon and a word instead of color alone, labeled form fields, and visible focus rings. Especially given students come in all bodies and needs.

---

## Tradeoffs and assumptions

**Books are a link, not a pdf reader.** I thought about a Kindle-style reader with page turning and position tracking, but it seemed way out of scope. So books are seeded from Project Gutenberg, a free book resource, and open in a new tab. 

**Book management is out of scope.** Books are preseeded and teachers pick from the list. There's a `POST /books` endpoint but no UI for it. Building one properly would mean duplicate detection and deciding whether a book belongs to a teacher or to the school, which felt out of scope for the time constraints.

**Teacher feedback is in the schema but has no UI.** `AssignmentStatus.teacher_feedback` exists and isn't used. Students can leave notes on a reading session and teachers can read them, but the reply direction got cut for time. I left the column in because I feel like it would be a great addition for later iterations.

**The list views do aggregate work that the normalized schema makes expensive.** The class list shows student count, active assignments, and how many students are behind, so three derived numbers for every class. It's more complicated SQL than a plain list would need, but a teacher can navigate from it and gain good insight.

**Removing a student from a class drops the enrollment but keeps their history.** Their statuses and reading logs stay where they are. Wiping out work a student actually did, as a side effect of a roster edit, seemed a bit wrong. Teacher views filter to whoever is currently enrolled.

**Anyone can self-register as a teacher.** In a real school product an administrator would provision teacher accounts. Also seemed out of scope.

---

## What I'd do next

**A fuller test suite.** What's there now covers the service layer. I'd want broader unit and integration coverage of the assignment lifecycle, reading log validation and totals, and the authorization boundaries where one teacher shouldn't be able to reach another's class. Then end-to-end tests running the frontend components against a live API.

**Caching.** Most of this content doesn't change between writes. The overview pages like `/classes` and `/assignments` are read-heavy and only go stale when someone adds an assignment or logs reading, so they're good candidates for a cache with targeted invalidation. If it ever needed to scale further I'd look at precomputing those summaries into a read-only denormalized structure instead of aggregating on every request. 

**More from the book model.** Bookmarking where a student left off, notes and comments inside the book itself, and real progress rather than self-reported minutes. This is the piece that would change the most about what a teacher can actually see.

**A student profile view for teachers.** One page showing a single student's progress and reading logs across every class the teacher shares with them. Right now you can only get at that per assignment.

**Finish the teacher-student interaction** Wire up `teacher_feedback` so a teacher can reply to a reading log. Past that, maybe peer discussion on the logs, since students responding to each other is what would make writing them worth doing.

**Better search.** The student and book pickers use `ILIKE` right now. At any real scale that becomes proper full-text search, either Postgres full-text or Elasticsearch, with filtering on things like grade, reading level, and subject.