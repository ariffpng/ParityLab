import type { MouseEvent, ReactNode } from 'react';
import { toHash, type Route } from '../routes';
import { useNav } from './nav';

type Props = {
  to: Route;
  className?: string;
  children: ReactNode;
  'aria-current'?: 'page' | undefined;
  'aria-label'?: string;
  title?: string;
  onClick?: () => void;
};

/** An ordinary link to a hash route; plain clicks navigate in-app (one history entry). */
export function RouteLink({ to, className, children, onClick, ...rest }: Props) {
  const { navigate } = useNav();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onClick?.();
    navigate(to);
  };
  return (
    <a href={toHash(to)} className={className} onClick={handle} {...rest}>
      {children}
    </a>
  );
}

/** The small "Learn more →" link every main card carries. */
export function LearnMoreLink({
  to,
  about,
  label = 'Learn more',
  className = '',
}: {
  to: Route;
  /** Topic name for screen readers, so every "Learn more" link has a distinct name. */
  about?: string;
  label?: string;
  className?: string;
}) {
  return (
    <RouteLink to={to} className={`link-more ${className}`}>
      {label}
      {about && <span className="sr-only"> about {about}</span>} <span aria-hidden="true">→</span>
    </RouteLink>
  );
}
