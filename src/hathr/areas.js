/** @typedef {'hpi' | 'meds-dx' | 'therapy'} HathrAreaId */

/** @typedef {HathrAreaId} AreaId */

/**
 * @typedef {Object} HathrArea
 * @property {HathrAreaId} id
 * @property {string} label
 * @property {string} description
 * @property {string} shortcut
 * @property {(input: Record<string, string>) => string} buildPrompt
 */

/** @type {readonly HathrArea[]} */
export const HATHR_AREAS = [
  {
    id: "hpi",
    label: "HPI",
    description: "History of Present Illness summary for a medical provider",
    shortcut: "F1",
    buildPrompt(input) {
      const content = (input.content ?? "").trim();
      if (!content) {
        throw new Error("HPI area requires clinical source content.");
      }

      return [
        "You are assisting a medical provider.",
        "Summarize the following clinical information as a concise, provider-ready HPI (History of Present Illness).",
        "Use complete sentences, chronological flow, and clinically relevant detail only.",
        "Do not invent findings not present in the source.",
        "",
        "--- SOURCE ---",
        content,
        "--- END SOURCE ---",
      ].join("\n");
    },
  },
  {
    id: "meds-dx",
    label: "Medications & Diagnoses",
    description:
      "List medications with complete directions for the selected date, including diagnoses",
    shortcut: "F2",
    buildPrompt(input) {
      const content = (input.content ?? "").trim();
      const date = (input.date ?? "").trim();

      if (!content) {
        throw new Error("Medications area requires source medication/diagnosis data.");
      }
      if (!date) {
        throw new Error("Medications area requires a selected date (YYYY-MM-DD).");
      }

      return [
        `For the clinical date ${date}, produce a structured medication and diagnosis summary.`,
        "Requirements:",
        "- List every medication active or ordered on that date.",
        "- For each medication include full directions: drug name, dose, route, frequency, duration, and any special instructions.",
        "- Include relevant diagnoses (ICD/description when available in the source).",
        "- If a medication lacks a field in the source, note 'not documented' rather than guessing.",
        "",
        "--- SOURCE ---",
        content,
        "--- END SOURCE ---",
      ].join("\n");
    },
  },
  {
    id: "therapy",
    label: "Therapy Summary",
    description: "Summarize therapy sessions for the dates provided in the source",
    shortcut: "F3",
    buildPrompt(input) {
      const content = (input.content ?? "").trim();
      const dates = (input.dates ?? "").trim();

      if (!content) {
        throw new Error("Therapy area requires session notes or source content.");
      }
      if (!dates) {
        throw new Error(
          "Therapy area requires one or more dates (comma-separated, e.g. 2026-01-05, 2026-01-12)."
        );
      }

      return [
        `Summarize therapy for these session dates: ${dates}.`,
        "For each date covered in the source, include:",
        "- Session focus and interventions",
        "- Client response / progress",
        "- Risk or safety items if documented",
        "- Plan for next session",
        "Stay within documented facts only.",
        "",
        "--- SOURCE ---",
        content,
        "--- END SOURCE ---",
      ].join("\n");
    },
  },
];

/**
 * @param {HathrAreaId} id
 * @returns {HathrArea | undefined}
 */
export function getArea(id) {
  return HATHR_AREAS.find((area) => area.id === id);
}

/**
 * @param {HathrAreaId} id
 * @param {Record<string, string>} input
 */
export function buildAreaPrompt(id, input) {
  const area = getArea(id);
  if (!area) {
    throw new Error(`Unknown area: ${id}`);
  }
  return area.buildPrompt(input);
}
