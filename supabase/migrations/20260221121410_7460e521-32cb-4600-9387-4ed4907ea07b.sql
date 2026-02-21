
-- Create flashcard_decks table
CREATE TABLE public.flashcard_decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id),
  parent_deck_id UUID REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flashcards table
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  card_type TEXT NOT NULL DEFAULT 'qr', -- 'qr', 'cloze', 'occlusion'
  front TEXT NOT NULL DEFAULT '',
  back TEXT NOT NULL DEFAULT '',
  explanation TEXT,
  cloze_text TEXT, -- for cloze type: "The {{c1::mitochondria}} produces ATP"
  image_url TEXT, -- for occlusion type
  occlusion_data JSONB, -- rectangles data for image occlusion
  difficulty INTEGER DEFAULT 0, -- 0=new, 1=learning, 2=review, 3=relearning
  ease_factor NUMERIC DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  next_review TIMESTAMP WITH TIME ZONE DEFAULT now(),
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flashcard_reviews table for history
CREATE TABLE public.flashcard_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating TEXT NOT NULL, -- 'again', 'hard', 'good', 'easy'
  reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for flashcard_decks
CREATE POLICY "Users can read own decks" ON public.flashcard_decks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own decks" ON public.flashcard_decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own decks" ON public.flashcard_decks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own decks" ON public.flashcard_decks FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for flashcards
CREATE POLICY "Users can read own flashcards" ON public.flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flashcards" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcards" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcards" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for flashcard_reviews
CREATE POLICY "Users can read own reviews" ON public.flashcard_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reviews" ON public.flashcard_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_flashcard_decks_updated_at BEFORE UPDATE ON public.flashcard_decks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON public.flashcards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
