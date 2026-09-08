export type ResultRemarks = {
  teacher: string;
  principal: string;
};

const PREFIX = "gradly:remarks:v1:";

export function encodeResultRemarks(value: ResultRemarks) {
  return `${PREFIX}${JSON.stringify(value)}`;
}

export function parseResultRemarks(raw: unknown): ResultRemarks {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) return { teacher: "", principal: "" };

  const candidate = text.startsWith(PREFIX) ? text.slice(PREFIX.length) : text;
  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === "object") {
      return {
        teacher: typeof parsed.teacher === "string" ? parsed.teacher : "",
        principal: typeof parsed.principal === "string" ? parsed.principal : "",
      };
    }
  } catch {}

  // Older Gradly results stored one plain-text remark. Treat it as the teacher remark.
  return { teacher: text, principal: "" };
}
