-- Let the Data API serve work_tracker alongside the schemas already exposed for the other ESOL apps.
-- Keep every existing entry. Dashboard equivalent: Project Settings -> Data API -> Exposed schemas.
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, student_portal, work_tracker';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
