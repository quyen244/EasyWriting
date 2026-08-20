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
