import type { ReactNode } from 'react';

/** Navy page header (the structural 30%): the screen title plus an optional lead-in. */
export function PageBand({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="on-dark bg-ink text-on-panel">
      <div className="page py-8 lg:py-12">
        <h1 tabIndex={-1} className="view-heading text-2xl font-bold">
          {title}
        </h1>
        {children}
      </div>
    </section>
  );
}
