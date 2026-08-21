import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  // Theme state is global by nature — it lives in localStorage and on <html>. Without
  // this reset a test that toggles to dark leaks into the next test's assertions.
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

/**
 * jsdom implements neither of the browser APIs the motion layer depends on.
 *
 * `IntersectionObserver` backs every scroll reveal (`whileInView`, `useInView`). The
 * stub reports the target as immediately and fully visible, which is the right default
 * for a unit test: these tests assert what the page *says*, and content that only
 * exists after a scroll event would be untestable noise.
 *
 * `matchMedia` backs `useReducedMotion`. It answers "no preference", so components take
 * their animated path — the reduced-motion path is asserted explicitly, by tests that
 * override this.
 */
class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(private readonly callback: IntersectionObserverCallback) {}

  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, intersectionRatio: 1, target } as IntersectionObserverEntry],
      this,
    );
  }

  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
