import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

// jsdom does not implement these browser APIs (its scrollTo only logs "not implemented").
Element.prototype.scrollIntoView = function scrollIntoView() {};
window.scrollTo = (() => {}) as typeof window.scrollTo;
