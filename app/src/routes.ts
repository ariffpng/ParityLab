/**
 * Hash routes: #/home, #/simulator, #/compare, #/quiz, #/learn and #/learn/<topic>.
 * Hash routing keeps deep links and the Back button working on any static host
 * and from a file opened offline. v1 links (#/welcome, #/methodology) still work.
 */
import { isTopicId, type TopicId } from './content/topics';

export type View = 'home' | 'simulator' | 'compare' | 'quiz' | 'learn';

export type Route = { view: View; topic?: TopicId };

const VIEWS: View[] = ['home', 'simulator', 'compare', 'quiz', 'learn'];
const ALIASES: Record<string, View> = { welcome: 'home', methodology: 'learn' };

export function parseHash(hash: string): Route {
  const [name = '', sub = ''] = hash.replace(/^#\/?/, '').split('?')[0].split('/');
  const view = (VIEWS as string[]).includes(name) ? (name as View) : (ALIASES[name] ?? 'home');
  if (view === 'learn' && isTopicId(sub)) return { view, topic: sub };
  return { view };
}

export function toHash(route: Route): string {
  return route.topic ? `#/${route.view}/${route.topic}` : `#/${route.view}`;
}

export function sameRoute(a: Route, b: Route): boolean {
  return a.view === b.view && a.topic === b.topic;
}

export const learnRoute = (topic: TopicId): Route => ({ view: 'learn', topic });
