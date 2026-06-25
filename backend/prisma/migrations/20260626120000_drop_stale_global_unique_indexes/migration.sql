-- The init migration created single-column UNIQUE INDEXes (…_key). The
-- multi-tenant migration tried to remove them with `DROP CONSTRAINT IF EXISTS`,
-- but in PostgreSQL that does NOT drop a unique *index* — so the old GLOBAL
-- uniqueness lingered, causing cross-lab P2002 collisions (e.g. two labs both
-- creating JOB-2026-00001). Drop them properly; the per-lab composite indexes
-- (…_labId_…_key) created in the multi-tenant migration remain in force.

DROP INDEX IF EXISTS "Job_jobNumber_key";
DROP INDEX IF EXISTS "Customer_code_key";
DROP INDEX IF EXISTS "MasterInstrument_idNumber_key";
DROP INDEX IF EXISTS "NCR_reference_key";
