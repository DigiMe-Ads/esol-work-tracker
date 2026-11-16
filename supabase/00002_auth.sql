-- Sign-in for the Work Tracker. Not Supabase Auth (the HR Suite's on_auth_user_created trigger would give every
-- auth user an HR profile). The app keeps an opaque token and sends it as the x-tracker-session header.
BEGIN;

CREATE FUNCTION work_tracker._request_token() RETURNS text
  LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT nullif(current_setting('request.headers', true), '')::json ->> 'x-tracker-session';
$$;

CREATE FUNCTION work_tracker._session_user() RETURNS work_tracker.users
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = work_tracker, extensions AS $$
  SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
   WHERE s.token_hash = digest(coalesce(_request_token(), ''), 'sha256')
     AND s.expires_at > now() AND u.is_active;
$$;

CREATE FUNCTION work_tracker.my_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = work_tracker AS $$
  SELECT (_session_user()).id;
$$;

CREATE FUNCTION work_tracker.is_admin() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = work_tracker AS $$
  SELECT coalesce((_session_user()).role = 'admin', false);
$$;

CREATE FUNCTION work_tracker._user_json(u work_tracker.users) RETURNS json
  LANGUAGE sql IMMUTABLE AS $$
  SELECT json_build_object('id', u.id, 'username', u.username, 'full_name', u.full_name,
                           'job_title', u.job_title, 'role', u.role, 'is_active', u.is_active,
                           'created_at', u.created_at);
$$;

CREATE FUNCTION work_tracker.sign_in(p_username text, p_password text) RETURNS json
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = work_tracker, extensions AS $$
DECLARE u users; v_token text;
BEGIN
  SELECT * INTO u FROM users WHERE username = lower(trim(p_username));
  IF u.id IS NOT NULL AND u.locked_until > now() THEN
    RETURN json_build_object('error', 'Too many failed attempts. Try again in a few minutes.');
  END IF;
  IF u.id IS NULL OR NOT u.is_active OR u.password_hash <> crypt(coalesce(p_password, ''), u.password_hash) THEN
    IF u.id IS NOT NULL THEN
      UPDATE users SET failed_logins = failed_logins + 1,
        locked_until = CASE WHEN failed_logins + 1 >= 8 THEN now() + interval '15 minutes' END
       WHERE id = u.id;
    END IF;
    RETURN json_build_object('error', 'Incorrect username or password.');  -- RETURN keeps the counter update
  END IF;
  UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = u.id;
  DELETE FROM sessions WHERE user_id = u.id AND expires_at < now();
  v_token := encode(gen_random_bytes(32), 'hex');
  INSERT INTO sessions (token_hash, user_id) VALUES (digest(v_token, 'sha256'), u.id);
  RETURN json_build_object('token', v_token, 'user', _user_json(u));
END $$;

CREATE FUNCTION work_tracker.sign_out() RETURNS void
  LANGUAGE sql SECURITY DEFINER SET search_path = work_tracker, extensions AS $$
  DELETE FROM sessions WHERE token_hash = digest(coalesce(_request_token(), ''), 'sha256');
$$;

CREATE FUNCTION work_tracker.me() RETURNS json
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = work_tracker AS $$
DECLARE u users := _session_user();
BEGIN
  RETURN CASE WHEN u.id IS NULL THEN NULL ELSE _user_json(u) END;
END $$;

CREATE FUNCTION work_tracker.change_password(p_old text, p_new text) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = work_tracker, extensions AS $$
DECLARE u users := _session_user();
BEGIN
  IF u.id IS NULL THEN RAISE EXCEPTION 'Your session has expired. Please sign in again.' USING ERRCODE = '28000'; END IF;
  IF u.password_hash <> crypt(coalesce(p_old, ''), u.password_hash) THEN RAISE EXCEPTION 'Current password is incorrect.'; END IF;
  IF length(coalesce(p_new, '')) < 8 THEN RAISE EXCEPTION 'New password must be at least 8 characters.'; END IF;
  UPDATE users SET password_hash = crypt(p_new, gen_salt('bf', 10)) WHERE id = u.id;
  DELETE FROM sessions WHERE user_id = u.id AND token_hash <> digest(_request_token(), 'sha256');
END $$;

-- Names for everyone signed in (to show assignees / authors); no usernames or roles leak to employees.
CREATE FUNCTION work_tracker.list_people() RETURNS json
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = work_tracker AS $$
BEGIN
  IF my_id() IS NULL THEN RAISE EXCEPTION 'Your session has expired. Please sign in again.' USING ERRCODE = '28000'; END IF;
  RETURN coalesce((SELECT json_agg(json_build_object('id', id, 'full_name', full_name, 'job_title', job_title,
                                                     'is_active', is_active) ORDER BY full_name) FROM users), '[]');
END $$;

COMMIT;
