# Architecture Refactoring: Admin & Client Separation

## Overview
To improve security and maintainability, the system has been refactored to completely separate the Admin operations from the Client application.

### 1. Database & RBAC
- Added `admin_users` table with a `role` column to manage permissions independently from the standard `profiles` table.
- Added `audit_logs` table to trace all actions performed by admin users.
- RLS policies ensure that regular users cannot access the `admin_users` or `audit_logs` tables.

### 2. Backend Security
- Added `requireAdmin` middleware. It verifies the incoming JWT and queries the `admin_users` table to ensure the user has elevated privileges.
- If an unauthorized user accesses `/api/admin/*`, the server immediately responds with `403 Forbidden`.
- Implemented `logAudit` utility to capture changes made to configurations (e.g., AI Config, Game Rules).

### 3. Frontend SPAs
- **Client (`/frontend`)**: Removed all traces of the Admin Dashboard. Regular users have no access to the UI or routes associated with admin features.
- **Admin (`/admin`)**: A dedicated SPA built purely for administrative tasks. The application includes a stricter Content-Security-Policy and runs on a separate port (`5175`).

### 4. CI/CD & Infrastructure
- Created isolated `Dockerfile`s for the Backend, Client, and Admin.
- Added Kubernetes deployment manifests (`k8s/`) to manage the applications as independent microservices.
- Admin portal enforces security headers via Nginx (`Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`).