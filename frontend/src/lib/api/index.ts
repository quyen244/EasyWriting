/**
 * The data client — the single boundary between every authenticated screen and its data.
 *
 * Components import from here and nowhere deeper. That is the rule that keeps the later
 * swap to a real backend confined to `store.ts` and the modules beside it: nothing above
 * this line knows whether a fixture or a server answered.
 *
 * Fixtures under `@/mockData` are imported by this folder only. A component that imports
 * a fixture directly has bypassed the seam, and the swap will miss it.
 */

export * from "./types";
export * from "./insights";
export { criterionLabel, criterionLabels, normaliseCriterionCode } from "./labels";
export {
  essayTextFor,
  gradeEssay,
  gradeMockSubmission,
  getResult,
  joinTask1,
  type GradeOptions,
} from "./grading";
export {
  checkAnswer,
  getModule,
  listModules,
  recommendedModuleFor,
  recordProgress,
} from "./practice";
export { getMockTest, listMockTests, submitMockTest } from "./mockTest";
export { criterionAverageLabel, getActivity, getHistory, getProgress } from "./account";
export { LATENCY, USE_REAL_API, resetStore } from "./store";
