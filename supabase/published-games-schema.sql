CREATE TABLE published_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  question_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE published_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES published_games(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  correct_answers TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE published_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on published_games" ON published_games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on published_questions" ON published_questions FOR ALL USING (true) WITH CHECK (true);
