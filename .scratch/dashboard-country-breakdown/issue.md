---
id: dashboard-country-breakdown
title: Dashboard country breakdown card
status: done
created: 2026-05-01
---

## Parent

`.scratch/dashboard-stats/issue.md`

## What to build

Extend `getDashboardStats` with a `byCountry` field: the top 5 countries by contact count, descending. Add a stat card to `/dashboard` that renders each country as a CSS progress bar scaled relative to the country with the most contacts. Country codes are mapped to full names using the existing `countryMap`; unknown codes fall back to the raw value.

## Acceptance criteria

- [ ] `byCountry` returns at most 5 entries, sorted descending by count
- [ ] Bar widths are proportional to the top country (top country = 100% width)
- [ ] Each row displays the country name and exact contact count
- [ ] Countries not in `countryMap` display their raw database value
- [ ] Card is not rendered if the club has zero contacts
- [ ] Unit tests pass: correct top-5 ranking, ties handled consistently, empty input returns empty array

## Blocked by

- `.scratch/dashboard-total-count/issue.md`
