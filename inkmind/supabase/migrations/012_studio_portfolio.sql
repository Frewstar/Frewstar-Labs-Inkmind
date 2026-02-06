-- Table to store high-end studio portfolio pieces for AI reference (Artist Twin)
CREATE TABLE public.studio_portfolio (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  title text,
  style_tags text[] DEFAULT '{}',
  technical_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_portfolio_studio_id ON public.studio_portfolio(studio_id);

-- Enable RLS
ALTER TABLE public.studio_portfolio ENABLE ROW LEVEL SECURITY;

-- Allow public to read (for the assistant), but only authenticated studio admins to insert
CREATE POLICY "Public can view portfolio" ON public.studio_portfolio FOR SELECT USING (true);

COMMENT ON TABLE public.studio_portfolio IS 'Style reference entries for portfolio grounding (Ross / Artist Twin)';
