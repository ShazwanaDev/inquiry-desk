# Decisions

## Assumptions

- Staff accounts are created by the business, so there is **no registration**. Three accounts are seeded (2 staff, 1 manager).
- The person who records an inquiry is the person handling it (its **owner**). Re-assigning an inquiry is out of scope.
- "A way to contact them" is one field that accepts **an email or a phone number**.
- Inquiries are never deleted in this version; "record no longer exists" is still handled (404) for safety.

## Key design choices

**1. Access rule: staff see their own inquiries, managers see all (enforced in SQL).**
Every inquiry query goes through one place (`findInquiry` / the list query) with
`WHERE (role = 'manager' OR owner_id = currentUser)`. A staff member opening another person's
inquiry, by direct link or by calling the API, gets **404 Not Found** rather than 403, so the API
doesn't confirm that the record exists. The React route guard and hidden data are only for
convenience; the server is the source of truth.

**2. Status lifecycle as a small rule table.**
`new → in_progress → resolved`, and `resolved → in_progress` to **reopen** (a customer often comes back).
Skipping straight from New to Resolved, or going back to New, is rejected with
**422** and a readable message ("Cannot change status from In Progress to New"). The UI only shows
buttons for allowed moves, but the server checks every change (`server/src/inquiryRules.js`, unit-tested).

**3. Stale data (two tabs): optimistic concurrency with a `version` column.**
Each inquiry has a `version` that increases on every change. The client sends the version it is
showing, and the update runs `... WHERE id = $1 AND version = $2`. If another tab saved first, nothing
is updated and the API returns **409** with the latest inquiry. The UI then shows the latest
status with the warning "This inquiry was updated elsewhere… Your change was not saved." There's no silent
overwrite, and no real-time infrastructure is needed.

**Input policy.** Fields are trimmed and required; contact must look like an email or phone number.
Validation runs in the form for fast feedback **and** independently in the API (zod), which returns
per-field errors (400). Duplicates: the database has a partial unique index on
`lower(contact), lower(subject)` **for unresolved inquiries only**, so the same open request can't be
recorded twice (409), but a new one is allowed once the old one is resolved. The Save button is also
disabled while a request is in flight to prevent double submits.

## Trade-off I accepted

**JWT in `sessionStorage` sent as a Bearer header** (instead of an httpOnly cookie). It keeps the
API simple to call and test (curl, supertest) and needs no CSRF handling, and the token is cleared when the tab
closes. The cost: any script running on the page (XSS) could read the token. React escapes output and
there is no third-party script, but in production I'd move to httpOnly, SameSite cookies.
*(Smaller trade-offs: the list is capped at 200 rows instead of being paginated, and search runs on
submit rather than on every keystroke.)*

## What I would improve next

1. Pagination and sorting for the inquiry list.
2. Notes/activity history per inquiry ("what happened last"), which is the most useful next field for staff.
3. Re-assigning inquiries between staff (manager only).
4. Rate limiting on `/api/auth/login`, and httpOnly cookies for the token.
5. A versioned migration tool instead of a drop-and-recreate setup script.

## Testing and gaps

- **Backend** (`server/test`, `node:test` + supertest): status-transition rules; 401 without a token;
  404 when staff open another person's inquiry; 400 with per-field errors for invalid input.
- **Frontend** (`client/src/pages/NewInquiryPage.test.jsx`, Vitest + Testing Library): empty submit
  shows field errors, focuses the first invalid field and does not call the API; a 409 duplicate from
  the server is shown and the form can be submitted again.
- **Gaps:** no automated test yet for the stale-version (409) flow or the detail page; API tests use
  the seeded development database rather than an isolated test database; no end-to-end browser tests.
  These flows were tested manually.

## Use of AI

I used an AI assistant (Claude) as a tutor and pair programmer: to explain concepts step by step,
propose a structure, and review my code and errors. I typed the code and ran every test myself.

- **Accepted:** the `version` column for the two-tabs problem. I chose it because it's simple, works at
  the database level, and makes the conflict visible to the user instead of overwriting silently.
- **Changed:** my first list/detail pages set `loading` inside `useEffect`, which ESLint's React hooks rules
  flagged. We changed it to derive "loading" from a request key, which I now understand avoids extra
  renders and ignores out-of-date responses.
- **Rejected:** running PostgreSQL in Docker. I used the normal installer and pgAdmin so I could see
  the tables while learning, and setup stays simple for reviewers. I also chose React + Vite over
  Next.js to keep the frontend and the Express API clearly separate.
