export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ai-learning-assistant-47cl.onrender.com";

export async function uploadYouTube(url: string) {
  const target = `${API_BASE_URL}/api/upload/youtube`;
  console.log("FETCHING FROM: ", target);
  const res = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadPDF(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const target = `${API_BASE_URL}/api/upload/pdf`;
  console.log("FETCHING FROM: ", target);
  const res = await fetch(target, {
    method: 'POST',
    body: formData,
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function generateFlashcards(documentId: string) {
  const res = await fetch(`${API_BASE_URL}/api/generate/flashcards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function generateQuiz(documentId: string) {
  const res = await fetch(`${API_BASE_URL}/api/generate/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function generateAll(documentId: string) {
  const res = await fetch(`${API_BASE_URL}/api/generate/all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
