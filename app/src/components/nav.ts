import { createContext, useContext } from 'react';
import type { Route } from '../routes';

export type Nav = { route: Route; navigate: (to: Route) => void };

export const NavContext = createContext<Nav>({ route: { view: 'home' }, navigate: () => {} });

export function useNav(): Nav {
  return useContext(NavContext);
}
