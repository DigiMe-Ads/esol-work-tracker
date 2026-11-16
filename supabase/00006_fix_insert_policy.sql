-- The insert policy looked up the parent task with a plain query, which re-entered the tasks policies and
-- failed with "infinite recursion detected". The lookup now runs in a SECURITY DEFINER function.
BEGIN;

CREATE FUNCTION work_tracker.parent_assignee(p_parent uuid) RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = work_tracker AS $$
  SELECT assignee_id FROM tasks WHERE id = p_parent;
$$;
REVOKE EXECUTE ON FUNCTION work_tracker.parent_assignee(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION work_tracker.parent_assignee(uuid) TO anon, authenticated;

DROP POLICY task_insert ON work_tracker.tasks;
CREATE POLICY task_insert ON work_tracker.tasks FOR INSERT TO anon, authenticated
  WITH CHECK ((SELECT work_tracker.is_admin()) OR (
    (SELECT work_tracker.my_id()) IS NOT NULL
    AND (parent_id IS NULL OR work_tracker.can_see_task(parent_id))
    AND (assignee_id IS NULL OR assignee_id = (SELECT work_tracker.my_id())
         OR (parent_id IS NOT NULL AND assignee_id = work_tracker.parent_assignee(parent_id)))));

COMMIT;
