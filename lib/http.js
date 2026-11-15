export function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function readJson(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 1_000_000) throw new Error("Request is too large.");
  if (!request.body) throw new Error("Send a valid JSON request.");
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1_000_000) {
        await reader.cancel();
        throw new Error("Request is too large.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    if (error.message === "Request is too large.") throw error;
    throw new Error("Send a valid JSON request.");
  }
}

export function requiredText(value, label, max = 200) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new Error(`${label} is required and must be at most ${max} characters.`);
  }
  return value.trim();
}

export function safeJsonResponse(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
