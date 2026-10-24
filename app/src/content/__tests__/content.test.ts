import { describe, expect, it } from 'vitest';
import { LESSON_REVEAL, LESSON_STEPS } from '../lesson';
import { TOPICS, TOPIC_GROUPS, neighbours, readingMinutes } from '../topics';
import { QUIZ } from '../quiz';

const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

describe('guided lesson copy (v2)', () => {
  it('keeps five steps, the prediction step last, and at most 25 words of copy per step', () => {
    expect(LESSON_STEPS).toHaveLength(5);
    expect(LESSON_STEPS[4].prediction).toBe(true);
    for (const step of LESSON_STEPS) expect(words(step.body)).toBeLessThanOrEqual(25);
    expect(words(LESSON_REVEAL.explanation)).toBeLessThanOrEqual(25);
  });

  it('uses engine numbers in the copy', () => {
    expect(LESSON_STEPS[1].body).toContain('4.0375%');
    expect(LESSON_STEPS[2].body).toContain('4.4000 → 4.3786');
    expect(LESSON_REVEAL.explanation).toContain('4.2952 MYR/USD (−2.3810%)');
  });
});

describe('Learn More topics', () => {
  it('has 12 topics, four per row, with at most three key assumptions each', () => {
    expect(TOPICS).toHaveLength(12);
    for (const g of TOPIC_GROUPS) expect(TOPICS.filter((t) => t.group === g.id)).toHaveLength(4);
    for (const t of TOPICS) {
      expect(t.intro.length).toBeGreaterThanOrEqual(1);
      expect(t.intro.length).toBeLessThanOrEqual(2);
      expect(t.assumptions.length).toBeLessThanOrEqual(3);
      expect(readingMinutes(t)).toBeGreaterThanOrEqual(1);
    }
  });

  it('links topics in hub order for Previous / Next', () => {
    expect(neighbours('reading-rates').prev).toBeNull();
    expect(neighbours('ppp').prev?.id).toBe('glossary');
    expect(neighbours('ppp').next?.id).toBe('covered-irp');
    expect(neighbours('about').next).toBeNull();
  });

  it('every quiz question links to an existing topic and gives one-sentence feedback', () => {
    const ids = TOPICS.map((t) => t.id);
    for (const q of QUIZ) {
      expect(ids).toContain(q.topic);
      expect(q.feedback.split(/[.!?](\s|$)/).filter((s) => s.trim().length > 1).length).toBe(1);
    }
  });
});
