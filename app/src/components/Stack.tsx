import type { ReactNode } from 'react';

type Props = {
  /** Every state the box can show; the box is always as large as the largest one. */
  items: ReactNode[];
  /** Index of the state shown; the others are invisible and hidden from assistive technology. */
  show: number;
  className?: string;
  inline?: boolean;
};

/**
 * Layout-stability helper: lays all states on top of each other in one grid cell,
 * so switching state never changes the box's size or moves its neighbours.
 */
export function Stack({ items, show, className = '', inline = false }: Props) {
  const Tag = inline ? 'span' : 'div';
  return (
    <Tag className={`${inline ? 'inline-grid' : 'grid'} ${className}`}>
      {items.map((item, k) => (
        <Tag
          key={k}
          className="col-start-1 row-start-1 min-w-0"
          style={k === show ? undefined : { visibility: 'hidden' }}
          aria-hidden={k === show ? undefined : true}
        >
          {item}
        </Tag>
      ))}
    </Tag>
  );
}
