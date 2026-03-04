import { supabase, STORAGE_BUCKET } from "@/lib/supabase";
import { GameQuestion } from "@/types/game";

export function isBase64DataUrl(str: string): boolean {
  return str.startsWith("data:");
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

interface UploadProgress {
  done: number;
  total: number;
}

export async function uploadGameImages(
  gameId: string,
  questions: GameQuestion[],
  onProgress?: (progress: UploadProgress) => void
): Promise<GameQuestion[]> {
  // Find questions that need uploading (base64 selectedImage)
  const toUpload = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => q.selectedImage && isBase64DataUrl(q.selectedImage));

  if (toUpload.length === 0) return questions;

  const total = toUpload.length;
  let done = 0;
  const updated = [...questions];

  // Upload in batches of 5
  for (let batch = 0; batch < toUpload.length; batch += 5) {
    const chunk = toUpload.slice(batch, batch + 5);

    await Promise.all(
      chunk.map(async ({ q, i }) => {
        const blob = dataUrlToBlob(q.selectedImage);
        const questionId = q.id || `q${i}`;
        const path = `${gameId}/${questionId}.jpg`;

        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, blob, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (error) {
          throw new Error(`Failed to upload image for "${q.answer}": ${error.message}`);
        }

        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(path);

        updated[i] = {
          ...updated[i],
          selectedImage: urlData.publicUrl,
        };

        done++;
        onProgress?.({ done, total });
      })
    );
  }

  return updated;
}
