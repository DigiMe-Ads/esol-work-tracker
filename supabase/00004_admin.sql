-- Admin tools: employee accounts and team progress. Every function checks the caller is an admin.
BEGIN;

CREATE FUNCTION work_tracker._require_admin() RETURNS uuid
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = work_tracker AS $$
DECLARE u users := _session_user();
BEGIN
  IF u.id IS NULL THEN RAISE EXCEPTION 'Your session has expired. Please sign in again.' USING ERRCODE = '28000'; END IF;
  IF u.role <> 'admin' THEN RAISE EXCEPTION 'Only an admin can do this.' USING ERRCODE = '42501'; END IF;
  RETURN u.id;
END $$;

CREATE FUNCTION work_tracker.list_users() RETURNS json
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = work_tracker AS $$
BEGIN
  PERFORM _require_admin();
  RETURN coalesce((SELECT json_agg(_user_json(u) ORDER BY u.is_active DESC, u.full_name) FROM users u), '[]');
END $$;

CREATE FUNCTION work_tracker.create_user(p_username text, p_full_name text, p_job_title text, p_role text, p_password text)
  RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = work_tracker, extensions AS $$
DECLARE v_name text := lower(trim(p_username)); u users;
BEGIN
  PERFORM _require_admin();
  IF v_name !~ '^[a-z0-9._-]{3,32}$' THEN
    RAISE EXCEPTION 'Username must be 3-32 characters: letters, numbers, dot, dash or underscore.';
  END IF;
  IF EXISTS (SELECT 1 FROM users WHERE username = v_name) THEN RAISE EXCEPTION 'That username is already taken.'; END IF;
  IF length(coalesce(p_password, '')) < 8 THEN RAISE EXCEPTION 'Password must be at least 8 characters.'; END IF;
  INSERT INTO users (username, full_name, job_title, role, password_hash)
  VALUES (v_name, trim(p_full_name), nullif(trim(p_job_title), ''), coalesce(p_role, 'employee'), crypt(p_password, gen_salt('bf', 10)))
  RETURNING * INTO u;
  RETURN _user_json(u);
END $$;

CREATE FUNCTION work_tracker.update_user(p_user uuid, p_full_name text, p_job_title text, p_role text, p_active boolean)
  RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = work_tracker AS $$
DECLARE v_me uuid := _require_admin(); u users;
BEGIN
  IF p_user = v_me AND (p_role <> 'admin' OR NOT p_active) THEN
    RAISE EXCEPTION 'You cannot remove your own admin access or deactivate yourself.';
  END IF;
  UPDATE users SET full_name = trim(p_full_name), job_title = nullif(trim(p_job_title), ''), role = p_role, is_active = p_active
   WHERE id = p_user RETURNING * INTO u;
  IF u.id IS NULL THEN RAISE EXCEPTION 'User not found.'; END IF;
  IF NOT p_active THEN DELETE FROM sessions WHERE user_id = p_user; END IF;  -- signs them out at once
  RETURN _user_json(u);
END $$;

CREATE FUNCTION work_tracker.reset_password(p_user uuid, p_password text) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = work_tracker, extensions AS $$
BEGIN
  PERFORM _require_admin();
  IF length(coalesce(p_password, '')) < 8 THEN RAISE EXCEPTION 'Password must be at least 8 characters.'; END IF;
  UPDATE users SET password_hash = crypt(p_password, gen_salt('bf', 10)), failed_logins = 0, locked_until = NULL
   WHERE id = p_user;
  DELETE FROM sessions WHERE user_id = p_user;
END $$;

-- Permanent delete. Their tasks stay (unassigned); deactivating is usually the better choice.
CREATE FUNCTION work_tracker.delete_user(p_user uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = work_tracker AS $$
BEGIN
  IF _require_admin() = p_user THEN RAISE EXCEPTION 'You cannot delete your own account.'; END IF;
  DELETE FROM users WHERE id = p_user;
END $$;

-- Per-person progress on top-level tasks (subtasks roll up into their parent).
CREATE FUNCTION work_tracker.team_progress() RETURNS json
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = work_tracker AS $$
BEGIN
  PERFORM _require_admin();
  RETURN coalesce((
    SELECT json_agg(row_to_json(x) ORDER BY x.full_name) FROM (
      SELECT u.id, u.full_name, u.job_title, u.is_active,
             count(t.id)                                              AS total,
             count(t.id) FILTER (WHERE t.status = 'todo')             AS todo,
             count(t.id) FILTER (WHERE t.status = 'in_progress')      AS in_progress,
             count(t.id) FILTER (WHERE t.status = 'review')           AS review,
             count(t.id) FILTER (WHERE t.status = 'blocked')          AS blocked,
             count(t.id) FILTER (WHERE t.status = 'done')             AS done,
             count(t.id) FILTER (WHERE t.status <> 'done' AND t.due_date < current_date) AS overdue,
             count(t.id) FILTER (WHERE t.completed_at > now() - interval '7 days')   AS done_this_week
        FROM users u LEFT JOIN tasks t ON t.assignee_id = u.id AND t.parent_id IS NULL
       WHERE u.role = 'employee'
       GROUP BY u.id) x), '[]');
END $$;

-- ---------------------------------------------------------------- function grants
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA work_tracker FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION
  work_tracker.my_id(), work_tracker.is_admin(), work_tracker.can_see_task(uuid),
  work_tracker.sign_in(text, text), work_tracker.sign_out(), work_tracker.me(),
  work_tracker.change_password(text, text), work_tracker.list_people(), work_tracker.list_users(),
  work_tracker.create_user(text, text, text, text, text), work_tracker.update_user(uuid, text, text, text, boolean),
  work_tracker.reset_password(uuid, text), work_tracker.delete_user(uuid), work_tracker.team_progress()
  TO anon, authenticated;

COMMIT;
