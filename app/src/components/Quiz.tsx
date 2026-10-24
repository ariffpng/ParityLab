/** Quiz progress kept in the App for the session only (nothing is stored or sent). */
export type QuizState = { index: number; answers: Record<string, string> };
