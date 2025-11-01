-- Remove pg_net from public schema (it's not needed for our cron job)
DROP EXTENSION IF EXISTS pg_net CASCADE;