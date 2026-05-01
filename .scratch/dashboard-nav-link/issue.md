---
id: dashboard-nav-link
title: Add Dashboard link to main navigation
status: done
created: 2026-05-01
---

## Parent

`.scratch/dashboard-stats/issue.md`

## What to build

Extend the `Nav` component so `/dashboard` is reachable from the main navigation. Add `'dashboard'` to the `currentPage` union type and insert a "Dashboard" link as the first item in the nav link group (before "Form"). The active state (gold underline) applies when `currentPage === 'dashboard'`.

## Acceptance criteria

- [x] "Dashboard" appears as the first link in the nav on all pages
- [x] The link is active (gold underline) when on `/dashboard`
- [x] TypeScript compiles without error (`currentPage` type updated)
- [x] Existing nav links and active states are unaffected

## Blocked by

- `.scratch/dashboard-total-count/issue.md`
