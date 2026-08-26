export const config = { api: { bodyParser: false } };

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function parseMultipart(buffer, contentType) {
  const boundary = contentType.match(/boundary=(.+)$/)?.[1];
  if (!boundary) throw new Error("missing-boundary");
  const binary = buffer.toString("binary");
  const parts = binary.split(`--${boundary}`).slice(1, -1);
  const result = {};
  for (const part of parts) {
    const split = part.indexOf("\r\n\r\n");
    const header = part.slice(0, split);
    const name = header.match(/name="([^"]+)"/)?.[1];
    if (!name) continue;
    const value = part.slice(split + 4, -2);
    result[name] = header.includes("filename=") ? Buffer.from(value, "binary") : value;
  }
  return result;
}

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "method-not-allowed" });
  if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) return response.status(503).json({ error: "pronunciation-service-not-configured" });
  try {
    const form = parseMultipart(await readBody(request), request.headers["content-type"] || "");
    const locale = String(form.locale || "en-US");
    const referenceText = String(form.referenceText || "").slice(0, 1000);
    const params = Buffer.from(JSON.stringify({ ReferenceText: referenceText, GradingSystem: "HundredMark", Granularity: "Phoneme", Dimension: "Comprehensive", EnableMiscue: true, EnableProsodyAssessment: locale === "en-US", PhonemeAlphabet: locale === "en-US" ? "IPA" : "SAPI" })).toString("base64");
    const azure = await fetch(`https://${process.env.AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${encodeURIComponent(locale)}&format=detailed`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY, "Pronunciation-Assessment": params, "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000", Accept: "application/json" }, body: form.audio });
    const data = await azure.json();
    if (!azure.ok) return response.status(azure.status).json({ error: "azure-speech-error", detail: data });
    const best = data.NBest?.[0] || {};
    response.status(200).json({ provider: "azure", transcript: best.Display || data.DisplayText || "", pronunciation: best.PronScore || 0, accuracy: best.AccuracyScore || 0, fluency: best.FluencyScore || 0, completeness: best.CompletenessScore || 0, prosody: best.ProsodyScore, words: (best.Words || []).map((word) => ({ word: word.Word, score: word.AccuracyScore || 0, errorType: word.ErrorType, phonemes: (word.Phonemes || []).map((phoneme) => ({ phoneme: phoneme.Phoneme, score: phoneme.AccuracyScore || 0 })) })) });
  } catch (error) { response.status(400).json({ error: "invalid-pronunciation-request", detail: String(error) }); }
}
