# Runbook

## Deployment
1. Build images:
   ```bash
   docker build -t your-registry/sjk-backend:latest -f backend/Dockerfile .
   docker build -t your-registry/sjk-frontend-client:latest -f frontend/Dockerfile .
   docker build -t your-registry/sjk-admin:latest -f admin/Dockerfile .
   ```
2. Apply Kubernetes Manifests:
   ```bash
   kubectl apply -f k8s/
   ```

## Promoting an Admin User
Run the included script from the backend directory to elevate a user:
```bash
node promote_admin.js user@example.com
```

## Data Backup
Use the Supabase CLI to create backups of the database:
```bash
supabase db dump -f backup.sql
```

## Rollback Plan
If the new RBAC deployment fails:
1. Revert the Kubernetes deployment image tags to the previous version.
2. The database migrations for `admin_users` and `audit_logs` are non-destructive to existing data, so a database rollback is generally not required unless the schema interferes with older backend versions. If so, drop the tables and remove the middleware from the backend code.