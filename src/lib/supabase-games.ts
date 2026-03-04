import { supabase, STORAGE_BUCKET } from "@/lib/supabase";
import { Game, GameMeta, GameQuestion } from "@/types/game";

// --- Fetch ---

export async function fetchPublishedGames(): Promise<GameMeta[]> {
  const { data, error } = await supabase
    .from("published_games")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch games: ${error.message}`);

  return (data || []).map((row) => ({
    id: row.id,
    title: row.title,
    questionCount: row.question_count ?? 0,
    createdAt: new Date(row.created_at).getTime(),
    playCount: 0,
    categories: row.category ? [row.category] : undefined,
  }));
}

export async function fetchGameById(id: string): Promise<Game | null> {
  const { data: gameRow, error: gameError } = await supabase
    .from("published_games")
    .select("*")
    .eq("id", id)
    .single();

  if (gameError || !gameRow) return null;

  const { data: questionRows, error: qError } = await supabase
    .from("published_questions")
    .select("*")
    .eq("game_id", id)
    .order("position", { ascending: true });

  if (qError) throw new Error(`Failed to fetch questions: ${qError.message}`);

  const questions: GameQuestion[] = (questionRows || []).map((qr) => ({
    id: qr.id,
    answer: qr.correct_answers?.[0] || "",
    approved: true,
    imageOptions: [],
    selectedImage: qr.image_url,
  }));

  return {
    id: gameRow.id,
    title: gameRow.title,
    questions,
    createdAt: new Date(gameRow.created_at).getTime(),
    playCount: 0,
    categories: gameRow.category ? [gameRow.category] : undefined,
  };
}

// --- Publish ---

export async function publishGame(
  gameId: string,
  title: string,
  category: string | null,
  questions: { imageUrl: string; answer: string }[]
): Promise<string> {
  const { error: gameError } = await supabase
    .from("published_games")
    .insert({
      id: gameId,
      title,
      category: category || null,
      question_count: questions.length,
    });

  if (gameError) throw new Error(`Failed to save game: ${gameError.message}`);

  const questionRows = questions.map((q, i) => ({
    game_id: gameId,
    position: i,
    image_url: q.imageUrl,
    correct_answers: [q.answer],
  }));

  const { error: qError } = await supabase
    .from("published_questions")
    .insert(questionRows);

  if (qError) throw new Error(`Failed to save questions: ${qError.message}`);

  return gameId;
}

// --- Delete ---

export async function deletePublishedGame(id: string): Promise<void> {
  // Delete images from Storage
  const { data: files } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(id);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${id}/${f.name}`);
    await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  }

  // Delete game row (CASCADE deletes questions)
  const { error } = await supabase
    .from("published_games")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete game: ${error.message}`);
}
