-- Allow anyone to see studios
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.studios FOR SELECT USING (true);

-- Allow anyone to see designs
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.designs FOR SELECT USING (true);