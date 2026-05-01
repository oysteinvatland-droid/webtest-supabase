---
id: dashboard-monthly-trend
title: Dashboard monthly signup trend card
status: done
created: 2026-05-01
---

## Parent

`.scratch/dashboard-stats/issue.md`

## What to build

Extend `getDashboardStats` with a `byMonth` field: the last 6 complete calendar months (current month excluded), each with a contact count. Months with no contacts appear as zero. Add a stat card to `/dashboard` that renders each month as a CSS bar with a short month label (e.g. "Jan") and exact count.

## Acceptance criteria

- [x] `byMonth` always returns exactly 6 entries in ascending chronological order
- [x] Months with no contacts appear as `{ count: 0 }`, not omitted
- [x] The current calendar month is not included
- [x] Bar widths are proportional to the month with the highest count
- [x] Each bar displays the month abbreviation and exact count
- [x] A month with count 0 renders as a visible (zero-height or minimal) bar, not hidden
- [x] Card is not rendered if the club has zero contacts
- [x] Unit tests pass: correct 6-month window, boundary months, all-zero months, single contact

## Blocked by

- `.scratch/dashboard-total-count/issue.md`
