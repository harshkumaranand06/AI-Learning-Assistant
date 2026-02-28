export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ai-learning-assistant-1-6xxx.onrender.com";

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

export async function generateFlashcards(documentId: string, difficulty: string = "medium", isAdaptive: boolean = false) {
  const res = await fetch(`${API_BASE_URL}/api/generate/flashcards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId, difficulty, is_adaptive: isAdaptive })
  });
  if (!res.ok) {
    const errText = await res.text();
    try {
      const errJson = JSON.parse(errText);
      throw new Error(errJson.detail || errText);
    } catch (e) {
      throw new Error(errText);
    }
  }
  return res.json();
}

export async function generateQuiz(documentId: string, difficulty: string = "medium", isAdaptive: boolean = false) {
  const res = await fetch(`${API_BASE_URL}/api/generate/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId, difficulty, is_adaptive: isAdaptive })
  });
  if (!res.ok) {
    const errText = await res.text();
    try {
      const errJson = JSON.parse(errText);
      throw new Error(errJson.detail || errText);
    } catch (e) {
      throw new Error(errText);
    }
  }
  return res.json();
}
export async function generateAll(documentId: string, difficulty: string = "medium") {
  const res = await fetch(`${API_BASE_URL}/api/generate/all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId, difficulty })
  });
  if (!res.ok) {
    const errText = await res.text();
    try {
      const errJson = JSON.parse(errText);
      throw new Error(errJson.detail || errText);
    } catch (e) {
      throw new Error(errText);
    }
  }
  return res.json();
}

export async function getUserCredits() {
  const res = await fetch(`${API_BASE_URL}/api/user/credits`, {
    method: 'GET',
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function generateMindMap(documentId: string) {
  const res = await fetch(`${API_BASE_URL}/api/generate/mindmap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function explainTopic(documentId: string, topic: string) {
  const res = await fetch(`${API_BASE_URL}/api/generate/explain-topic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId, topic })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function improveNotes(rawNotes: string) {
  const res = await fetch(`${API_BASE_URL}/api/generate/improve-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_notes: rawNotes })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getLibraryDocuments() {
  const res = await fetch(`${API_BASE_URL}/api/library/`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function submitQuizAttempt(data: any) {
  const res = await fetch(`${API_BASE_URL}/api/quiz/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getAnalytics() {
  const res = await fetch(`${API_BASE_URL}/api/quiz/analytics`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

