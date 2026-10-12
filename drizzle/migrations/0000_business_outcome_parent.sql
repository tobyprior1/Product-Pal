CREATE UNIQUE INDEX IF NOT EXISTS nodes_one_business_outcome_per_tree ON public.nodes (tree_id) WHERE type = 'BusinessOutcome';
CREATE OR REPLACE FUNCTION public.attach_business_outcome(p_outcome_id uuid, p_title text) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_tree_id uuid; v_business_id uuid; v_parent_id uuid;
BEGIN
  IF auth.uid() IS NULL OR length(trim(p_title)) = 0 OR length(p_title) > 500 THEN RAISE EXCEPTION 'A signed-in user and business outcome title are required'; END IF;
  SELECT n.tree_id INTO v_tree_id FROM public.nodes n JOIN public.trees t ON t.id = n.tree_id WHERE n.id = p_outcome_id AND n.type = 'Outcome' AND t.user_id = auth.uid();
  IF v_tree_id IS NULL THEN RAISE EXCEPTION 'Product outcome not found'; END IF;
  PERFORM 1 FROM public.trees WHERE id = v_tree_id AND user_id = auth.uid() FOR UPDATE;
  SELECT parent_id INTO v_parent_id FROM public.nodes WHERE id = p_outcome_id;
  IF v_parent_id IS NOT NULL OR EXISTS (SELECT 1 FROM public.nodes WHERE tree_id = v_tree_id AND type = 'BusinessOutcome') THEN RAISE EXCEPTION 'This product outcome already has a business outcome'; END IF;
  INSERT INTO public.nodes(tree_id, parent_id, type, title, data, created_by, updated_by) VALUES(v_tree_id, NULL, 'BusinessOutcome', trim(p_title), '{}'::jsonb, auth.uid(), auth.uid()) RETURNING id INTO v_business_id;
  UPDATE public.nodes SET parent_id = v_business_id, updated_at = now() WHERE id = p_outcome_id;
  RETURN v_business_id;
END;
$$;
REVOKE ALL ON FUNCTION public.attach_business_outcome(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.attach_business_outcome(uuid, text) TO authenticated;
CREATE OR REPLACE FUNCTION public.remove_business_outcome(p_business_id uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_tree_id uuid;
BEGIN
  SELECT n.tree_id INTO v_tree_id FROM public.nodes n JOIN public.trees t ON t.id = n.tree_id WHERE n.id = p_business_id AND n.type = 'BusinessOutcome' AND t.user_id = auth.uid();
  IF v_tree_id IS NULL THEN RAISE EXCEPTION 'Business outcome not found'; END IF;
  PERFORM 1 FROM public.trees WHERE id = v_tree_id AND user_id = auth.uid() FOR UPDATE;
  UPDATE public.nodes SET parent_id = NULL, updated_at = now() WHERE parent_id = p_business_id AND tree_id = v_tree_id;
  DELETE FROM public.nodes WHERE id = p_business_id AND tree_id = v_tree_id;
END;
$$;
REVOKE ALL ON FUNCTION public.remove_business_outcome(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_business_outcome(uuid) TO authenticated;