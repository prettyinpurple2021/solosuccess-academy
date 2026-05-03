---
name: Admin Announcements
description: Sitewide banner system — admins broadcast scheduled, severity-coded announcements; students dismiss per-user
type: feature
---
**Tables:** `announcements` (title, body, severity[info/success/warning], cta_label, cta_url, starts_at, ends_at, is_active) + `announcement_dismissals` (user_id, announcement_id PK).

**Active rule:** `is_active=true AND starts_at<=now() AND (ends_at IS NULL OR ends_at>now())` — enforced in RLS SELECT policy AND in the `useActiveAnnouncements` query for safety.

**UI:**
- Banner: `src/components/layout/AnnouncementBanner.tsx` mounted in `AppLayout` above main content. Shows ONE banner at a time (newest), color-coded by severity. Dismissal is server-side via `announcement_dismissals` insert (ignores 23505 unique-violation).
- Admin CRUD: `src/pages/AdminAnnouncements.tsx` at `/admin/announcements`. Sidebar link uses `Megaphone` icon (warning color).

**Hooks:** `src/hooks/useAnnouncements.ts` — `useActiveAnnouncements`, `useDismissAnnouncement`, `useAdminAnnouncements`, `useUpsertAnnouncement`, `useDeleteAnnouncement`. Active query polls every 5min.

**CTA URLs:** `useAnnouncements`'s banner detects external URLs (`^https?://`) vs internal paths and renders `<a target=_blank>` or `<Link>` accordingly.
