CREATE POLICY "Service role manages studio visits"
ON public.studio_visits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);