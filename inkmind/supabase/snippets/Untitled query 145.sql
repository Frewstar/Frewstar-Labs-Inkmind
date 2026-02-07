-- Add a technical evaluation column to your designs table
ALTER TABLE public.designs 
ADD COLUMN evaluation_notes TEXT;

-- Update a seed design with a 'Ross' evaluation
UPDATE public.designs 
SET evaluation_notes = 'Ross’s Technical Note: I adjusted the overlapping ribbon gaps to 2mm. This ensures the "Innovation Star" points stay sharp and don’t bleed together as the tattoo ages.'
WHERE id = 'SOME-DESIGN-ID';