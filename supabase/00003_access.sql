-- Who sees and changes what.
--  * Admin: every task and comment.
--  * Employee: tasks assigned to or created by them, and the subtasks under those tasks. They may create tasks
--    for themselves, add subtasks to tasks they can see, and update those; only an admin can reassign work.
BEGIN;

CREATE FUNCTION work_tracker.can_see_task(p_task uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = work_tracker AS $$
  SELECT is_admin() OR EXISTS (
    SELECT 1 FROM tasks t LEFT JOIN tasks p ON p.id = t.parent_id
     WHERE t.id = p_task AND my_id() IN (t.assignee_id, t.created_by, p.assignee_id, p.created_by));
$$;

-- Fill in creator / defaults and keep subtasks one level deep.
CREATE FUNCTION work_tracker._task_before_insert() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = work_tracker AS $$
DECLARE v_parent tasks;
BEGIN
  NEW.created_by := coalesce(my_id(), NEW.created_by);
  IF NEW.parent_id IS NOT NULL THEN
    SELECT * INTO v_parent FROM tasks WHERE id = NEW.parent_id;
    IF v_parent.parent_id IS NOT NULL THEN RAISE EXCEPTION 'Subtasks cannot have their own subtasks.'; END IF;
    NEW.assignee_id := coalesce(NEW.assignee_id, v_parent.assignee_id);
  END IF;
  IF NEW.status = 'done' THEN NEW.completed_at := now(); END IF;
  RETURN NEW;
END $$;

CREATE FUNCTION work_tracker._task_before_update() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = work_tracker AS $$
BEGIN
  NEW.parent_id := OLD.parent_id;
  NEW.created_by := OLD.created_by;
  NEW.created_at := OLD.created_at;
  IF NOT is_admin() AND NEW.assignee_id IS DISTINCT FROM OLD.assignee_id AND NEW.assignee_id IS DISTINCT FROM my_id() THEN
    RAISE EXCEPTION 'Only an admin can assign tasks to other people.' USING ERRCODE = '42501';
  END IF;
  NEW.completed_at := CASE WHEN NEW.status = 'done' THEN coalesce(OLD.completed_at, now()) END;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER task_before_insert BEFORE INSERT ON work_tracker.tasks
  FOR EACH ROW EXECUTE FUNCTION work_tracker._task_before_insert();
CREATE TRIGGER task_before_update BEFORE UPDATE ON work_tracker.tasks
  FOR EACH ROW EXECUTE FUNCTION work_tracker._task_before_update();

CREATE FUNCTION work_tracker._comment_before_insert() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = work_tracker AS $$
BEGIN
  NEW.author_id := my_id();
  RETURN NEW;
END $$;
CREATE TRIGGER comment_before_insert BEFORE INSERT ON work_tracker.comments
  FOR EACH ROW EXECUTE FUNCTION work_tracker._comment_before_insert();

-- ---------------------------------------------------------------- row level security
ALTER TABLE work_tracker.users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_tracker.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_tracker.tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_tracker.comments ENABLE ROW LEVEL SECURITY;

-- (SELECT ...) wrappers make the session lookups run once per statement, not once per row.
CREATE POLICY task_read ON work_tracker.tasks FOR SELECT TO anon, authenticated
  USING ((SELECT work_tracker.is_admin()) OR assignee_id = (SELECT work_tracker.my_id())
         OR created_by = (SELECT work_tracker.my_id())
         OR (parent_id IS NOT NULL AND work_tracker.can_see_task(parent_id)));
CREATE POLICY task_insert ON work_tracker.tasks FOR INSERT TO anon, authenticated
  WITH CHECK ((SELECT work_tracker.is_admin()) OR (
    (SELECT work_tracker.my_id()) IS NOT NULL
    AND (parent_id IS NULL OR work_tracker.can_see_task(parent_id))
    AND (assignee_id IS NULL OR assignee_id = (SELECT work_tracker.my_id())
         OR assignee_id = (SELECT p.assignee_id FROM work_tracker.tasks p WHERE p.id = parent_id))));
CREATE POLICY task_update ON work_tracker.tasks FOR UPDATE TO anon, authenticated
  USING (work_tracker.can_see_task(id)) WITH CHECK (work_tracker.can_see_task(id));
CREATE POLICY task_delete ON work_tracker.tasks FOR DELETE TO anon, authenticated
  USING ((SELECT work_tracker.is_admin()) OR created_by = (SELECT work_tracker.my_id()));

CREATE POLICY comment_read ON work_tracker.comments FOR SELECT TO anon, authenticated
  USING (work_tracker.can_see_task(task_id));
CREATE POLICY comment_insert ON work_tracker.comments FOR INSERT TO anon, authenticated
  WITH CHECK (author_id = (SELECT work_tracker.my_id()) AND work_tracker.can_see_task(task_id));
CREATE POLICY comment_delete ON work_tracker.comments FOR DELETE TO anon, authenticated
  USING ((SELECT work_tracker.is_admin()) OR author_id = (SELECT work_tracker.my_id()));

-- ---------------------------------------------------------------- grants
GRANT USAGE ON SCHEMA work_tracker TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON work_tracker.tasks, work_tracker.comments TO anon, authenticated;
REVOKE ALL ON work_tracker.users, work_tracker.sessions FROM PUBLIC, anon, authenticated;

COMMIT;
