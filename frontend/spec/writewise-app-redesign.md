# Spec: WriteWise authenticated product — redesign and extension

**Status:** ready-for-agent
**Scope:** `frontend/` only. Mock data layer, no backend work.
**Supersedes for the authenticated area:** `specs/002-core-app-ux` (landing page contract stays as-is).

---

## Problem Statement

A learner who signs up for WriteWise today lands in a product that is thinner than the
landing page promised.

- The landing page's header advertises three product areas — Grader, Mock Test, Practice.
  Only Grader resolves; every Mock Test and Practice entry renders as a disabled
  "coming soon" row. The learner is sold a platform and given a single form.
- Sign in and sign up are a narrow column bolted between the marketing header and
  footer. They read as a page of the brochure, not as the door into a product, and the
  marketing nav invites the learner to wander back out mid-signup.
- The grader is a two-column page with no product chrome. Once inside it, there is no
  way to reach anything else except a "Profile" button and the logo. There is no sense
  of being *inside* an application.
- The grader's result answers exactly one question — "what band did I get?" — and
  answers three more only if the learner clicks each criterion open. It never tells them
  which criterion is their strongest or weakest, whether they met the word minimum, what
  to do next, or where to practise the thing they are worst at. The learner receives a
  verdict, not a lesson.
- Task 1 and Task 2 are a radio pair that changes one number (the word minimum) and
  nothing else. Task 1 is a *chart description* task: it has a visual stimulus the
  learner must be able to supply, a three-part structure (introduction / overview /
  body) that examiners score directly, and a different first criterion — Task
  Achievement, not Task Response. None of that is reflected anywhere in the UI.
- Nothing the learner does is remembered. There is no history, no band trend, no record
  that they have practised at all. A learner cannot answer "am I improving?", which is
  the only question that keeps someone coming back to a study product.
- The account page is two read-only fields and a sign-out button.

The result: WriteWise looks like a polished marketing site attached to a demo.

## Solution

Turn WriteWise into a coherent authenticated product that a learner lives inside between
sign-in and sign-out, built entirely on a mock data layer shaped like the real API.

1. **A focused authentication experience.** Sign in and sign up become a single
   split-canvas screen — brand and value proposition on one side, the form on the other,
   with tabs between the two modes. No marketing header, no footer. The logo is the one
   way back to the landing page. The visual language stays the landing page's own:
   cream paper, Playfair headings, one orange accent, hard offset shadows.

2. **An authenticated app shell.** A persistent left sidebar carries Home, Grade Writing,
   Practice (Writing / Speaking), Mock Test (Writing / Speaking), Support, and an account
   block with the learner's email and Log out. The current page is highlighted. The
   Practice and Mock Test groups expand. On tablet the sidebar condenses; on mobile it
   becomes a drawer. Every page rendered inside the shell may optionally supply a
   contextual right-hand panel.

3. **A grader that adapts to the task and teaches from the result.** The Task 1 / Task 2
   toggle reshapes the editor: Task 2 keeps prompt + single essay body; Task 1 gains a
   chart/image slot (upload with preview, or a typed description) and splits the essay
   into Introduction, Overview and Body. Grading produces a result dashboard — dominant
   overall band, four criterion cards with visual score representation, an insight block
   naming the strongest and weakest criterion and one key recommendation, per-criterion
   explanation plus an actionable improvement, writing statistics against the word
   minimum, secondary metadata, and four next-step actions including "Practice weak area"
   which deep-links into the matching practice module.

4. **Practice as a learning product.** Practice → Writing lists six modules per task,
   each with an explanation, difficulty, progress and a CTA that opens a working
   interactive exercise with mock prompts and a feedback state. Practice → Speaking and
   Mock Test → Speaking are deliberate, designed "coming soon" screens with feature
   highlights and a mock notify CTA — not empty pages.

5. **A real mock test.** Mock Test → Writing is a full timed IELTS Writing test: both
   tasks, a countdown, per-task word counts and completion state, answers preserved when
   switching tasks, and a submit that produces a two-task result.

6. **An account area that shows progress.** Profile, writing history (task type, date,
   band, status), a progress dashboard (overall average, per-task averages,
   criterion-level averages, recent improvement, strongest/weakest criterion), activity
   across grading/practice/mock tests, and progress visualisation — band trend over time,
   criteria comparison, writing volume, practice consistency. Every row navigates: view
   the stored result, retry the prompt, continue the practice module.

7. **A product the learner can set up for themselves.** The `[VI]` placeholder becomes a
   working English ↔ Vietnamese switch backed by a real message catalogue, and the
   light/dark toggle — today stranded on the grader page — moves into the app shell so
   dark mode is reachable from every screen. Both preferences persist, apply instantly,
   and never disturb work in progress.

All data comes from a mock layer that the UI consumes through async functions with
realistic latency, exactly as it would consume a real API.

---

## User Stories

### Authentication

1. As a returning learner, I want a sign-in screen with no marketing navigation, so that
   I can complete the one task I came to do without being pulled back to the brochure.
2. As a learner on the sign-in screen, I want to click the WriteWise logo, so that I can
   return to the landing page when I arrived by mistake.
3. As a learner on the sign-in screen, I want tabs between Log in and Sign up, so that I
   can switch modes without losing my place or reloading a different page.
4. As a learner, I want the panel beside the form to explain what an account gives me
   (saved results, history, progress), so that I know why I am being asked to register.
5. As a learner typing my email, I want the field to visibly respond to focus and hover,
   so that I can tell the form is live and which field I am in.
6. As a learner who mistypes an email, I want an inline validation message on that field,
   so that I can fix the specific problem instead of re-reading the whole form.
7. As a learner who submits an empty required field, I want the form to say which field
   is missing rather than failing silently, so that I am never stuck on a dead button.
8. As a learner with wrong credentials, I want a single clear error above the form that
   does not clear my password, so that I can correct a typo in my email without retyping
   everything.
9. As a learner, I want the submit button to show a working state while signing in, so
   that I do not click it twice.
10. As a learner who signs in successfully, I want to land directly in the authenticated
    application, so that I can start working immediately.
11. As a new learner, I want the sign-up form to ask for the fields registration actually
    needs and to explain the password rule before I break it, so that I am not rejected
    after the fact.
12. As a new learner who signs up successfully, I want to land in the authenticated
    application already signed in, so that I do not have to log in a second time.
13. As a learner, I want sign-in and sign-up to look like the same screen in two modes,
    so that switching between them does not feel like leaving the product.
14. As a learner on a phone, I want the auth screen to stack the brand panel above the
    form, so that the form is reachable without horizontal scrolling.

### Application shell and navigation

15. As a signed-in learner, I want a persistent sidebar on desktop, so that every part of
    the product is one click away from wherever I am.
16. As a signed-in learner, I want the current page highlighted in the sidebar, so that I
    always know where I am.
17. As a signed-in learner, I want Practice to expand into Writing and Speaking, so that I
    can see what the area contains before committing to a page.
18. As a signed-in learner, I want Mock Test to expand into Writing and Speaking, so that
    the area's shape is visible from the navigation.
19. As a signed-in learner, I want an expanded navigation group to stay open when I
    navigate within it, so that the sidebar does not collapse my context under me.
20. As a signed-in learner, I want the sidebar to show my email and a Log out control, so
    that I can confirm which account I am in and leave it deliberately.
21. As a signed-in learner, I want clicking Home or the logo to take me to the landing
    page, so that I can reach the public site without logging out.
22. As a signed-in learner, I want Log out to end my session and return me to the
    authentication screen, so that the next person on this machine cannot see my work.
23. As a signed-in learner, I want Account in the sidebar to open my profile area, so that
    my history and progress are never more than one click away.
24. As a signed-in learner, I want Support to reach the existing FAQ, so that help is part
    of the product rather than a dead entry.
25. As a learner on a tablet, I want a condensed sidebar that still shows every
    destination, so that I lose screen width without losing navigation.
26. As a learner on a phone, I want the sidebar as a drawer opened from a header button,
    so that the content column keeps the full screen.
27. As a learner on a phone, I want the drawer to close when I pick a destination, so that
    I see the page I chose.
28. As a signed-in learner, I want every page in the shell to show its title in the same
    place, so that I can orient at a glance.
29. As a signed-in learner who is not signed in any more, I want to be sent back to sign
    in rather than shown an empty shell, so that I never see a broken product.

### Grader — shared

30. As a learner, I want a clear Task 1 / Task 2 toggle at the top of the grader, so that
    I can tell the product which exam task I am writing before I start.
31. As a learner, I want the editor itself to change when I switch task, so that I am
    given the right inputs rather than a generic box.
32. As a learner, I want a "How to use" panel beside the editor, so that I can grade my
    first essay without instructions from elsewhere.
33. As a learner, I want the panel to list the grading criteria for the task I selected,
    so that I know what I am about to be judged on.
34. As a learner, I want a call to action toward the full mock test in that panel, so that
    I can escalate from a single essay to a full test when I am ready.
35. As a learner, I want a live word count against the task's minimum, so that I know
    whether I am short before I submit.
36. As a learner, I want the word count to warn me visually when I am under the minimum,
    so that a shortfall is impossible to miss.
37. As a learner, I want a Reset control that clears the editor, so that I can start a new
    essay without reloading the page.
38. As a learner, I want Reset to ask for nothing when the editor is empty and to not
    silently destroy a long essay, so that I cannot lose work with one misclick.
39. As a learner clicking Grade Now, I want a visible scoring state, so that I know the
    product is working and roughly how long to wait.
40. As a learner, I want my essay text to survive a failed grading attempt, so that a
    server problem never costs me my writing.
41. As a learner, I want Grade Now disabled while the essay is empty, so that I am not
    invited to submit nothing.

### Grader — Task 2

42. As a Task 2 learner, I want an optional prompt field, so that the score can judge how
    well I answered the actual question.
43. As a Task 2 learner, I want a single generous essay area with comfortable line length,
    so that writing 250+ words does not feel like filling in a form field.
44. As a Task 2 learner, I want the minimum shown as 250 words, so that the target is
    explicit.

### Grader — Task 1

45. As a Task 1 learner, I want a prompt field for the question wording, so that the
    grader knows what the chart was asked about.
46. As a Task 1 learner, I want to upload the chart or image I am describing, so that the
    grader is looking at the same data I am.
47. As a Task 1 learner, I want to see a preview of the image I uploaded, so that I can
    confirm I attached the right file.
48. As a Task 1 learner, I want to remove or replace an uploaded image, so that a wrong
    attachment is not permanent.
49. As a Task 1 learner without an image file, I want to type a description of the chart
    instead, so that I can still be graded.
50. As a Task 1 learner, I want it made clear that image or description is enough — I do
    not need both, so that I am not blocked by a requirement that does not exist.
51. As a Task 1 learner, I want separate Introduction, Overview and Body areas, so that I
    practise the structure examiners actually score.
52. As a Task 1 learner, I want each of the three parts labelled with what belongs in it,
    so that I learn the structure while using it.
53. As a Task 1 learner, I want the word count to total all three parts against 150 words,
    so that the count means the same thing as the exam's does.
54. As a Task 1 learner, I want to see per-section word counts as well as the total, so
    that I can tell whether my overview is too thin.
55. As a Task 1 learner, I want to be graded on Task Achievement rather than Task
    Response, so that the feedback matches the real Task 1 rubric.

### Grader — result

56. As a graded learner, I want the overall band displayed large and first, so that I get
    my answer immediately.
57. As a graded learner, I want the band labelled "Estimated band", so that I do not
    mistake it for an official IELTS result.
58. As a graded learner, I want a provisional marker when the score is provisional, so
    that I know how much weight to give it.
59. As a graded learner, I want four criterion cards, so that I can see where the overall
    band came from.
60. As a graded learner, I want each criterion's band shown against the 9-band scale
    visually, so that I can compare criteria at a glance instead of doing arithmetic.
61. As a graded learner, I want my strongest criterion named explicitly, so that I know
    what is already working.
62. As a graded learner, I want my weakest criterion named explicitly, so that I know
    where the next hour of study should go.
63. As a graded learner, I want one key recommendation, so that I leave with a single
    concrete next action rather than four competing ones.
64. As a graded learner, I want each criterion's explanation in plain language, so that I
    understand why I received that band.
65. As a graded learner, I want an actionable improvement under each criterion, so that
    every band comes with something I can do about it.
66. As a graded learner, I want quotes from my own essay where they exist, so that the
    feedback is anchored in what I actually wrote.
67. As a graded learner, I want to expand and collapse criterion detail, so that I can
    read one criterion closely without losing the overview.
68. As a graded learner, I want to open more than one criterion at once, so that I can
    compare two pieces of feedback side by side.
69. As a graded learner, I want my word count shown against the minimum, so that I can see
    whether length was part of my problem.
70. As a graded learner, I want the shortfall or surplus stated as a number, so that I
    know how much to add next time.
71. As a graded learner, I want any length penalty shown and explained, so that an
    unexpectedly low band is not a mystery.
72. As a graded learner, I want the task type restated on the result, so that a stored
    result read later is unambiguous.
73. As a graded learner, I want pipeline version, model and scoring timestamp available
    but visually secondary, so that the detail exists without competing with my score.
74. As a graded learner, I want a "Try again" action, so that I can re-grade a revised
    essay in one click.
75. As a graded learner, I want an "Improve essay" action that returns me to the editor
    with my text intact, so that I can revise against the feedback.
76. As a graded learner, I want a "Practice weak area" action that opens the practice
    module for my weakest criterion, so that the feedback leads somewhere.
77. As a graded learner, I want a "Back to grader" action, so that I can start a fresh
    essay without hunting for the way out.
78. As a graded learner on a phone, I want the result to stack vertically and stay
    readable, so that I can review feedback on the device I wrote on.
79. As a Task 1 learner, I want the result to render Task Achievement in place of Task
    Response, so that the visualisation matches the rubric I was scored against.
80. As a learner, I want my result saved to my history automatically, so that I do not
    have to think about record-keeping.

### Practice — Writing

81. As a learner, I want a Practice → Writing page with a Task 1 / Task 2 toggle, so that
    I can drill the task I am weakest at.
82. As a Task 1 learner, I want modules for Paraphrase Introduction, Write Overview, Write
    Body, Compound Sentences, Complex Sentences and Develop Ideas, so that each part of
    the task has its own drill.
83. As a Task 2 learner, I want modules for Paraphrase the Question, Build an Essay
    Outline, Expand a Main Idea into Supporting Ideas, Compound Sentences, Complex
    Sentences and Develop Ideas, so that I can rehearse the skills Task 2 rewards.
84. As a learner browsing modules, I want a one-line explanation of each, so that I can
    choose without opening every one.
85. As a learner, I want each module's difficulty shown, so that I can start where I can
    succeed.
86. As a learner, I want my progress through each module shown, so that I can resume
    rather than restart.
87. As a learner, I want the practice page to look like a course, not a wall of identical
    cards, so that it feels worth my time.
88. As a learner, I want a start/continue CTA on each module, so that the next action is
    obvious.
89. As a learner opening a module, I want a working exercise with a real prompt, so that
    practice is something I do rather than something I read about.
90. As a learner in an exercise, I want to type an answer and submit it, so that I can be
    told how I did.
91. As a learner who submits an answer, I want feedback with a model answer to compare
    against, so that I learn what "better" looks like.
92. As a learner in an exercise, I want to move to the next item without leaving the page,
    so that a practice session has rhythm.
93. As a learner, I want my position in a module to advance as I complete items, so that
    the progress shown on the list means something.
94. As a learner, I want to leave an exercise and return to the module list at any point,
    so that I am never trapped in a drill.
95. As a learner arriving from a grader result, I want to land on the module matching my
    weakest criterion, so that the handoff from feedback to practice is instant.

### Practice / Mock Test — Speaking

96. As a learner opening Practice → Speaking, I want a designed "coming soon" screen, so
    that the product looks unfinished on purpose rather than broken.
97. As a learner, I want the speaking screen to explain what is coming and highlight the
    planned features, so that I understand what I will get.
98. As a learner, I want a "Notify me" control on the speaking screen, so that I can
    register interest.
99. As a learner who submits the notify form, I want a confirmation state, so that I know
    it registered.
100. As a learner, I want Mock Test → Speaking to use the same visual language as
     Practice → Speaking, so that the product feels consistent about what is unbuilt.

### Mock Test — Writing

101. As a learner, I want a full Writing mock test with both tasks, so that I can rehearse
     the real exam rather than one essay.
102. As a learner starting a mock test, I want a brief before the timer runs, so that I am
     not surprised by the clock.
103. As a learner in a mock test, I want a visible countdown, so that I can pace myself.
104. As a learner, I want the timer to warn me visually as time runs low, so that I can
     prioritise finishing.
105. As a learner, I want to switch between Task 1 and Task 2 freely, so that I can work
     the way I would in the exam.
106. As a learner switching tasks, I want my answer to the other task preserved exactly,
     so that navigation never costs me writing.
107. As a learner, I want each task's word count against its minimum, so that I can budget
     words across both tasks.
108. As a learner, I want each task marked complete once it meets its minimum, so that I
     can see what is left.
109. As a learner, I want overall test progress visible, so that I know how far through I
     am.
110. As a learner, I want the Task 1 stimulus shown beside the answer area, so that I can
     refer to the chart while writing.
111. As a learner, I want a Submit test control with a confirmation step, so that I cannot
     end the exam by accident.
112. As a learner who submits, I want a result covering both tasks with a combined
     estimate, so that I learn what a whole test would score.
113. As a learner whose time expires, I want the test to submit what I have written, so
     that running out of time does not erase my work.
114. As a learner in a mock test, I want the interface plain and focused, so that nothing
     competes with the writing.
115. As a learner, I want my completed mock test recorded in my history, so that it counts
     toward my progress.

### Account

116. As a learner, I want an account area with my email, username and basic details, so
     that I can confirm who I am signed in as.
117. As a learner, I want my writing history listed with task type, date, band and status,
     so that I can see everything I have submitted.
118. As a learner, I want to open any past result in full, so that old feedback stays
     useful.
119. As a learner, I want to retry a past prompt from its history row, so that I can
     rewrite an essay I did badly on.
120. As a learner, I want to filter or scan history by task type, so that I can review one
     task at a time.
121. As a learner, I want my overall average band, so that I have a single number for
     where I stand.
122. As a learner, I want separate Task 1 and Task 2 averages, so that I know which task is
     dragging me down.
123. As a learner, I want criterion-level averages, so that I can see the weakness that
     runs across all my essays rather than one bad essay.
124. As a learner, I want my recent improvement shown as a direction and amount, so that I
     can tell whether I am getting better.
125. As a learner, I want my strongest and weakest criteria named at account level, so
     that my study plan is obvious.
126. As a learner, I want a band trend over time, so that I can see progress as a shape
     rather than a list.
127. As a learner, I want a criteria comparison visualisation, so that the gaps between my
     four criteria are visible at once.
128. As a learner, I want my writing volume over time, so that I can see whether I am
     actually practising.
129. As a learner, I want practice consistency shown, so that I am rewarded for showing up
     regularly.
130. As a learner, I want recent activity across grading, practice and mock tests in one
     stream, so that I can see everything I have done lately.
131. As a learner, I want a "Continue practice" action from activity, so that I can resume
     an unfinished module in one click.
132. As a learner with no history yet, I want an empty state that points me at the grader,
     so that a new account is not a wall of zeroes.
133. As a learner, I want to sign out from the account area as well as the sidebar, so
     that the control is where I expect it.

### Cross-cutting

134. As a learner, I want the authenticated product to look like the landing page's
     product, so that signing up does not feel like switching to a different company's
     software.
135. As a learner who prefers reduced motion, I want animation suppressed throughout, so
     that the product remains usable.
136. As a keyboard user, I want every control — task toggles, sidebar groups, criterion
     panels, drawer — operable and focus-visible, so that I can use the product without a
     mouse.
137. As a screen-reader user, I want band scores exposed as values rather than bar widths,
     so that the result is readable to me.
138. As a learner on a slow connection, I want loading states on every data-backed view,
     so that I can tell the difference between slow and broken.
139. As a learner, I want failures to state what happened and offer a retry, so that an
     error is never a dead end.
140. As a developer, I want every screen fed by the mock data layer rather than literals
     in components, so that swapping in the real API is a change in one place.

### Language (English / Vietnamese)

141. As a Vietnamese learner, I want to switch the interface between English and
     Vietnamese, so that I can study IELTS without also having to decode the product's
     own navigation.
142. As a learner, I want the language control in the same place on the marketing site and
     inside the authenticated product, so that I do not have to hunt for it after signing
     in.
143. As a learner, I want the language control to show which language is currently active,
     so that the switch is a state I can read rather than a button I have to try.
144. As a learner who switches language, I want the change to apply immediately without a
     reload and without losing what I have typed, so that I can switch mid-essay safely.
145. As a returning learner, I want my language choice remembered, so that I do not reset
     it on every visit.
146. As a Vietnamese learner, I want navigation, page titles, buttons, form labels,
     validation messages, empty states and error messages translated, so that no part of
     the interface drops back into English mid-task.
147. As a Vietnamese learner, I want IELTS criterion names shown in Vietnamese with the
     official English term alongside, so that I learn the terminology I will meet in the
     real exam rather than a translation of it.
148. As a Vietnamese learner, I want my essay text, the exam prompts and the model answers
     to stay in English, so that the thing I am practising is not quietly changed
     underneath me.
149. As a Vietnamese learner, I want dates, band numbers and word counts formatted for my
     locale, so that the data reads naturally.
150. As a Vietnamese learner, I want the layout to survive longer Vietnamese strings
     without truncation or overflow, so that translated labels stay readable.
151. As a screen-reader user, I want the page's language attribute to follow my choice, so
     that my reader pronounces the interface correctly.
152. As a developer, I want every user-facing string to come from a message catalogue
     rather than being written inline, so that adding a third language is not a rewrite.

### Appearance (dark mode)

153. As a learner working at night, I want a dark theme across the whole product, so that
     writing a 250-word essay does not mean staring at a white page.
154. As a learner, I want the theme control available in the app shell and on the
     marketing site, so that I can change it wherever I happen to be.
155. As a returning learner, I want my theme choice remembered and applied before the page
     paints, so that I never get a white flash on a dark-theme visit.
156. As a learner, I want every authenticated screen — result dashboard, charts, practice,
     mock test runner — to be fully legible in dark mode, so that the theme is a real
     option and not a half-finished one.
157. As a learner toggling the theme mid-task, I want nothing in flight to be disturbed —
     no lost essay, no cancelled grading, no reset timer — so that appearance is never a
     risky click.
158. As a learner whose system prefers dark, I want that respected the first time I visit,
     so that I do not have to fix the product's default.

---

## Implementation Decisions

### Framework and conventions (unchanged)

- Next.js App Router, React 19, TypeScript, Tailwind 3 with the existing token layer.
  No new runtime dependencies: `motion` covers animation, and every chart in the account
  area is hand-built SVG rather than a charting library. This keeps the "no unnecessary
  dependencies" rule and the existing brand-specific visual language.
- All colour comes from the semantic tokens in `globals.css` / `tailwind.config.ts`
  (`surface*`, `on-surface*`, `primary`, `secondary`, `tertiary`, `accent-*`). No literal
  hex values in components — a component must not be legible in only one theme.
- Typography uses the existing scale: Playfair (`font-display`) for headings, Inter
  (`font-body`) for UI and prose, Caveat (`font-accent`) for decorative marker labels
  only, never for load-bearing text.
- Motion uses the existing `Reveal` / `RevealGroup` wrappers and `lib/motion` variants, so
  the `[data-reveal]` noscript fallback and the reduced-motion contract keep working.
- Auth state stays in the existing `useAuth` context; route protection stays the existing
  client-side guard, for the reason recorded in that component (the tokens are invisible
  to middleware). The shell is rendered *inside* the guard, never outside it, so protected
  chrome never reaches the DOM for an unauthenticated visitor.

### Seams (the point of leverage for testing)

Three seams, all of them existing module boundaries. No new seam is introduced.

1. **The data client** — today's assessments client module. It becomes the single
   async boundary between every authenticated screen and its data: grading, practice
   modules and exercises, mock tests, history, progress and activity. Every function is
   `async`, returns the wire shape, and throws typed errors. **Mock mode lives inside
   this module**, selected when no API base URL is configured: the module resolves from
   in-memory fixtures after a short simulated latency instead of calling `fetch`. Nothing
   above this line knows whether the data came from a fixture or a server, which is what
   makes the later Supabase swap a change to one module.
2. **The auth client** — today's auth module, unchanged in shape. It gains the same
   mock-mode switch so sign-in, sign-up, refresh and sign-out resolve locally against a
   fixture account. `useAuth` and the guard are untouched.
3. **The navigation model** — today's navigation module. It gains the authenticated
   sidebar tree using the same `NavLink` / `available` shape, and the existing route-audit
   test is extended to walk it. This is what stops a sidebar entry pointing at a route the
   app does not serve.

Consequence to accept deliberately: the current Playwright suites stub the backend at the
`fetch`/route layer. With mock mode inside the client module there is no request to
intercept, so those suites run against mock mode directly and their backend stub becomes
opt-in for the real-API path. This is a net simplification — the e2e tests stop encoding
the HTTP contract twice — but it is a change to existing tests, not a purely additive one.

### Routes

Added, all rendered inside the authenticated shell unless noted:

- Grader (existing route, redesigned) — Grade Writing.
- Stored result detail, addressed by result id — renders the same result dashboard the
  grader renders inline, so there is one result component and not two.
- Practice → Writing (module list) and Practice → Writing → module, addressed by module id.
- Practice → Speaking — coming-soon screen.
- Mock Test → Writing (test runner) and its result view.
- Mock Test → Speaking — coming-soon screen.
- Account — profile, history, progress and activity as sections/tabs of one route.

Kept: landing, FAQ, sign-in, sign-up. Support in the sidebar points at the existing FAQ
route rather than inventing a new page. The existing profile route redirects to Account
so no bookmark breaks. Every static destination is registered in the app-routes list the
navigation audit walks; dynamic detail routes are reached by navigation, not by nav links.

Auth pages render neither the marketing header nor the footer — they are their own
layout, not a page inside the marketing layout.

### Grading contract (mock wire shape)

The brief's JSON is adopted as the wire shape, because it is the shape the real service
will return. It is a superset of what the current client models, so the existing typed
model is widened rather than replaced:

```ts
type TaskType = "TASK_1" | "TASK_2";

type CriterionCode =
  | "TASK_ACHIEVEMENT"      // TASK_1 only
  | "TASK_RESPONSE"         // TASK_2 only
  | "COHERENCE_COHESION"
  | "LEXICAL_RESOURCE"
  | "GRAMMATICAL_RANGE";

interface GradingCriterion {
  code: CriterionCode;
  label: string;
  band: number;             // 0–9, half-band steps
  comment: string;          // why this band
  improvement: string;      // what to do about it
  evidence_quotes?: string[];
}

interface GradingResult {
  id: string;
  task_type: TaskType;
  status: "scored";
  overall_band: number;
  criteria: GradingCriterion[];   // always exactly 4, first one task-dependent
  word_count: number;
  min_words: number;              // 150 for TASK_1, 250 for TASK_2
  length_penalty: number;
  provisional: boolean;
  pipeline_version: string;
  model_id: string;
  created_at: string;
  scored_at: string;
}
```

Decisions this encodes:

- The first criterion is task-dependent and the UI never hardcodes four labels. Task 1
  yields `TASK_ACHIEVEMENT`; Task 2 yields `TASK_RESPONSE`. The result dashboard renders
  whatever the payload contains, in payload order.
- `GRAMMATICAL_RANGE` is the wire code. The existing client uses
  `GRAMMATICAL_RANGE_ACCURACY` for the same criterion; the data client normalises the two
  at its boundary so the existing label map and result component keep working and only
  one spelling ever reaches the UI.
- `label` travels on the wire but the UI still owns a canonical label map, so a missing or
  odd server label cannot produce an unlabelled score.
- Strongest / weakest criterion and the key recommendation are **derived in the UI** from
  `criteria`, not sent by the server: highest band wins strongest, lowest wins weakest,
  ties break toward the criterion listed first (task criterion outranks the rest, which is
  the one a learner should fix first). The recommendation is the weakest criterion's
  `improvement`. No new field, no invented advice.
- Word shortage/surplus is derived as `word_count - min_words` and never stored.
- `provisional` renders as a marker beside the band, and `length_penalty > 0` renders as
  an explained line in the statistics block rather than a silent deduction.

### Grader input model

- Task type is the one piece of state that reshapes the editor. Switching task **preserves
  what has been typed for each task separately** rather than clearing it — a learner who
  toggles to check the other task's requirements must not lose an essay.
- Task 2 input: optional prompt, single essay body.
- Task 1 input: prompt, a stimulus that is *either* an uploaded image *or* a typed
  description (either satisfies the requirement; neither blocks grading), and three
  separate parts — introduction, overview, body.
- The Task 1 image is held client-side only, previewed from an object URL, and revoked on
  replace/reset. Nothing is uploaded anywhere in this scope; the mock grading call
  receives only a flag that a stimulus was supplied.
- Word count for Task 1 is the sum of the three parts, using the existing word counter, so
  the number means the same thing everywhere in the product. Per-part counts are shown
  alongside.
- Reset clears the current task's inputs and any result, and confirms first when there is
  substantial text to lose.
- The client word count is a hint only. Submission is blocked on genuinely empty input,
  never on being under the minimum — the server's count is authoritative and its rejection
  carries the real minimum. This preserves existing behaviour deliberately.
- On a grading failure the learner's text is untouched, by construction: the text lives in
  the page's state and no error path writes to it.

### Result presentation

One result component renders every result — inline after grading, on the stored-result
route, and inside the mock test result. It takes a `GradingResult` and nothing else, so
there is no second implementation to drift.

Composition, top to bottom: overall band block (dominant, with estimated/provisional
status) → insight block (strongest, needs improvement, key recommendation) → criterion
cards with visual score representation → expandable per-criterion detail (comment,
improvement, evidence quotes) → writing statistics (word count, minimum, delta, length
penalty, task type) → metadata (pipeline version, model, scored at) as visually secondary
→ actions (Try again, Improve essay, Practice weak area, Back to grader).

Score visualisation keeps the existing accessible pattern: an element carrying the band as
a real value with min/max and a spoken value text, with the visual bar or arc as its
decorative child. A band drawn only as a width is invisible to a screen reader, and the
result's whole purpose is the number.

"Practice weak area" maps the weakest criterion code to a practice module for the same
task and navigates there. The mapping lives in the practice data module beside the
modules themselves, not in the result component.

### Practice model

- Modules are data: id, task type, title, one-line explanation, difficulty, item count,
  and the criterion codes the module trains (which is what makes the result → practice
  handoff possible).
- Progress is per module — items completed out of total — and is held in the mock layer so
  it survives navigation within a session. Persistence beyond the session is out of scope.
- An exercise item is a prompt, an optional source text, a model answer, and the hints or
  criteria the feedback is written against. Submitting an answer produces a feedback state
  built from the item's model answer and a mock evaluation; it never claims a band.
- The exercise view runs items in sequence with explicit next/finish, advances module
  progress as items complete, and can be left at any time without losing the module's
  recorded progress.

### Mock test model

- A test fixture is two tasks: a Task 1 with a stimulus (chart description text plus an
  optional image) and a Task 2 prompt, each with its own minimum.
- Runner state: which task is active, an answer per task, a start timestamp, a duration,
  and a submitted flag. Answers are held per task so switching cannot lose text — the same
  guarantee the grader makes.
- The timer counts down from the test duration, warns visually in its final stretch, and
  on expiry submits whatever exists rather than discarding it.
- Submit asks for confirmation, then produces a per-task `GradingResult` plus a combined
  estimate, and records the attempt in history.
- The runner is visually plain by intent: no reveal animations, no decorative surfaces, no
  contextual panel competing with the answer column.

### Account model

- Profile reads from the authenticated account.
- History entries carry id, task type, prompt excerpt, date, overall band, status, and the
  source (grader or mock test) — enough to render a row and open the stored result.
- Progress is **derived from history in the data client**, not stored as its own fixture:
  overall average, per-task averages, per-criterion averages, recent improvement (latest
  band versus the mean of the preceding window), strongest and weakest criterion. Deriving
  it means the numbers can never contradict the list they are shown beside.
- Activity is a merged, date-sorted stream of grading, practice and mock-test events.
- Visualisations are hand-built SVG: band trend as a line over time, criteria comparison as
  a small-multiple bar or radial set, writing volume as words per period, practice
  consistency as a day grid. Each carries an accessible text summary, because a chart that
  only exists as pixels is a chart most of the audience cannot read.
- Empty state: a new account with no history shows a designed prompt toward the grader
  rather than zeroed charts.

### Mock data layer

- Fixtures live in their own modules under a mock-data directory — account, grader results
  for each task, practice modules and items, mock tests, history, progress inputs — and
  are imported *only* by the data client, never by a component.
- Fixtures are realistic and plural: multiple graded attempts across both tasks spanning
  several weeks, with bands that move enough to make a trend legible and criterion scores
  that make one criterion clearly weakest.
- Grading is deterministic given its input rather than random, so the same essay produces
  the same band twice and the demo does not contradict itself.
- Every mock call resolves after a short delay so loading states are real, and the delay is
  configurable so tests do not pay for it.

### Language: English / Vietnamese

The existing locale control is a disabled `[VI]` button — honest, but a placeholder. It
becomes a working switch, and this feature ships the first real translation.

- **Brand strings are never translated.** "WriteWise" is the product name in both
  locales — never localised, never transliterated, never abbreviated. The same applies to
  "IELTS" and to the official criterion names, which travel as English terms.
- **A message catalogue, not inline strings.** Every user-facing string in the new and
  redesigned screens resolves through a keyed catalogue with one file per locale (`en`,
  `vi`). A component may not contain a display string. This is the seam that makes a third
  locale additive; it is also what makes "did we miss a string?" a test rather than a
  manual sweep.
- **Client-side locale, not locale routing.** The locale is a preference held in a small
  context, persisted to `localStorage` under a `writewise.*` key, applied without a reload
  and without remounting the page — so switching mid-essay cannot lose typed text. URLs do
  not change. Locale-prefixed routes are a bigger change than this scope justifies and
  would fragment every route the navigation audit walks; if SEO later demands them, the
  catalogue is already in place and the routing is the only thing that moves.
- The switcher lives beside the theme toggle: in the marketing header where it already is,
  and in the app shell's account block. It shows the active locale rather than only the
  one it would switch to, and it is a real, focusable control.
- `<html lang>` follows the active locale so assistive technology pronounces the interface
  correctly. Dates, numbers and band values are formatted through the platform's own
  locale-aware formatters rather than hand-built strings.
- **What stays English regardless of locale:** the learner's own essay text, exam prompts
  and stimuli, practice model answers, and criterion codes. Criterion *labels* render as
  the Vietnamese gloss with the English term alongside, because the learner will meet the
  English term in the real exam.
- **Mock feedback exists in both locales.** Fixture comments and improvements are keyed
  the same way UI strings are, so a Vietnamese learner does not hit an English wall the
  moment they receive a score. Fixture translations are written, not machine-produced.
- Vietnamese strings run longer than English. Layouts are built to wrap rather than
  truncate, and the responsive pass checks both locales at the narrow breakpoints — a
  label that fits in English and clips in Vietnamese is a defect.

### Appearance: dark mode

Dark mode already exists structurally and must simply be finished and made reachable.

- The token layer already defines a full dark palette, Tailwind is already in class-based
  dark mode, an inline script already applies the stored theme before first paint, and the
  toggle already reads `<html>`'s class as the source of truth through an external store
  rather than mirroring it into state. None of that is rebuilt.
- The toggle moves out of the grader page — where it is currently stranded — into the app
  shell's account block, so it is available on every authenticated screen, and stays in the
  marketing header. It remains outside the content tree so toggling cannot disturb an
  in-flight grading, a running mock-test timer, or a typed essay.
- Every new surface resolves colour through semantic tokens only. This is the rule that
  makes dark mode free: a literal hex is a component that is legible in exactly one theme.
- The account area's hand-built SVG charts must take their strokes, fills and grid lines
  from tokens too, including the series colours. Charts are the most common place a dark
  theme breaks, because chart colour is usually written as literals.
- First-visit default follows the system preference when nothing is stored; an explicit
  choice always wins over the system and persists.
- Contrast is checked in both themes for the new screens — in particular the result
  dashboard's score meters, the mock test's timer warning state, and any state colour
  carrying meaning (complete, below minimum, penalty).

### Responsive behaviour

- Desktop: persistent sidebar, content column, optional contextual right panel.
- Laptop: the contextual panel drops below the content before the sidebar gives up width.
- Tablet: condensed sidebar (icons plus short labels), no right panel.
- Mobile: sidebar becomes a drawer with a focus trap and an overlay, closing on selection
  and on Escape; result cards, criterion grids and statistics stack vertically; the mock
  test stimulus moves above the answer area; touch targets stay at least 44px.
- No horizontal page scroll at any width. Any element that cannot shrink — a wide table, a
  chart — scrolls inside its own container.

---

## Testing Decisions

**What makes a good test here.** A test drives the product the way a learner does — find
the control by its accessible role and name, interact, assert on what the learner can now
see — and never reaches for an internal state value, a component's props, or a CSS class.
"Clicking Grade Now eventually shows an overall band and four criterion cards" is a test.
"The status state equals `result`" is not: it fails when the state machine is renamed and
passes when the screen is blank. Tests mock at a seam, not inside a component; the data
client's mock mode means most tests need no mocking at all.

**Prior art in this repo, to follow rather than reinvent:**

- The navigation content test is the model for data-module tests: it walks the exported
  nav data and asserts every available entry resolves to a route the app serves. Extend
  this same test to the authenticated sidebar tree rather than writing a parallel one.
- The result component's existing unit test is the model for result rendering: render with
  a fixture, assert on the rendered band and the criterion cards, expand a criterion and
  assert its explanation and quotes appear.
- The grader page's existing unit test is the model for page-level state: drive the form,
  assert the progress state appears, then the result — the essay text still present after
  a failure.
- The Playwright workspace suites are the model for journeys, including their habit of
  scoping queries to a named region to avoid matching the framework's own live region.

**Modules under test:**

1. *Data client (unit).* Criterion-code normalisation; the task-dependent first criterion;
   derived strongest/weakest/recommendation including the tie-break; word delta and length
   penalty; progress derivation from a known history fixture. This is where the arithmetic
   the whole product displays gets pinned down, and it needs no DOM.
2. *Navigation model (unit).* Every available sidebar entry points at a served route; the
   Speaking entries stay marked unavailable; the existing marketing-nav assertions keep
   passing.
3. *Result dashboard (unit).* Renders Task 2 and Task 1 fixtures — asserting Task 1 shows
   Task Achievement and never Task Response; strongest and weakest are named; the word
   shortfall is stated; the provisional marker appears only when the payload says so;
   bands are exposed as accessible values, not bar widths.
4. *Grader page (unit).* Task toggle reshapes the editor; text typed for one task survives
   a round trip through the other; word count sums the three Task 1 parts; an uploaded
   image previews and can be removed; a typed description alone is sufficient to submit;
   Reset clears; a failed grading leaves the essay intact.
5. *Auth screen (unit).* Tab switching; per-field validation messages; a failed sign-in
   shows one error and keeps the password; a successful submit navigates into the app.
6. *Shell (unit).* Active destination is marked current; groups expand and stay open across
   navigation within them; the mobile drawer opens, traps focus, and closes on selection
   and Escape; log out clears the session and returns to auth.
7. *Practice (unit).* The list renders the six modules for the selected task and switches
   with the toggle; opening a module renders its first item; submitting an answer shows
   feedback with the model answer; completing an item advances progress.
8. *Mock test (unit).* Switching tasks preserves both answers; word counts and completion
   state track each task's minimum; the timer counts down and expiry submits rather than
   discards; submit requires confirmation and yields a result for both tasks.
9. *Account (unit).* Averages and strongest/weakest match the fixture history; the trend
   renders a point per attempt with a text summary; a history row opens the stored result;
   the empty state appears for an account with no history.
10. *Locale (unit).* The `en` and `vi` catalogues expose exactly the same key set — a
    missing or orphaned key fails the build, which is the only reliable way to catch an
    untranslated string. Switching locale re-renders a screen in the other language
    without clearing typed input; the preference persists and is read back; `<html lang>`
    follows; brand, IELTS and criterion codes are unchanged by the switch.
11. *Theme (unit).* The toggle flips the root class and persists the choice; system
    preference is the first-visit default and an explicit choice overrides it; toggling
    during an in-flight grading or a running mock test disturbs neither.
12. *Journeys (e2e).* Sign up → land in the app → grade a Task 2 essay → see the result →
    follow "Practice weak area" into the matching module. Sign in → Task 1 with an image
    upload → result shows Task Achievement. Mock test → switch tasks → answers preserved →
    submit → result recorded → visible in account history. Log out → returns to auth and
    the protected routes are no longer reachable. Plus a responsive pass at mobile width
    asserting the drawer works and the page does not scroll horizontally. One journey runs
    in Vietnamese with dark mode on, so the two are exercised as a real learner's setup
    rather than as isolated toggles.

Accessibility assertions ride along inside these tests rather than forming a separate
suite: accessible names on interactive controls, bands exposed as values, focus visible,
and the existing reduced-motion contract respected.

---

## Out of Scope

- Any backend, database, Supabase wiring, Edge Function, or real LLM call. Every screen is
  fed by fixtures behind the data client.
- Real authentication, password reset, email verification, sessions across reloads, or any
  credential storage. Mock auth only.
- Persistence of any kind beyond the current browser session — practice progress, mock
  test attempts and grading history reset on reload.
- Real image upload, storage, or any analysis of an uploaded chart. The Task 1 image is a
  local preview and a boolean to the mock grader.
- Speaking as a working feature. Both Speaking screens are designed placeholders.
- Payment, subscription, plan gating, or anything behind the landing page's pricing cards.
- Locales beyond English and Vietnamese; locale-prefixed URLs, server-side locale
  negotiation, or translated marketing/SEO metadata. Translating the learner's essay text,
  exam prompts, or practice model answers — those stay English by design.
- A third theme, per-screen theme overrides, or user-chosen accent colours. Light and dark
  only.
- Redesign of the landing page, FAQ, or marketing header/footer. They are the visual
  reference for this work and must keep working unchanged.
- General Training Task 1, which remains explicitly unsupported.
- Sentence-level rewriting or corrections of the learner's essay. Feedback stays at
  criterion level with quotes from the learner's own text — synthesising corrections no
  rubric grounds is the failure the evidence-anchoring rule exists to prevent.
- Admin, teacher, or multi-user views.

---

## Further Notes

- **The constitution's transitional provision matters here.** Explanations are required to
  be rubric-grounded and evidence-anchored. Mock feedback must therefore read like
  criterion-grounded examiner commentary tied to the fixture essays, not generic filler.
  Fixture copy is product content, not lorem ipsum, and should be written as carefully as
  the UI around it.
- **Design-taste routing, per the brief.** Redesign of existing screens — sign-in,
  sign-up, the grader, and the profile page becoming Account — goes through the
  redesign-existing-projects path, which audits what is there before changing it. Screens
  that do not exist yet — the app shell, the result dashboard, practice list and exercise,
  both Speaking screens, the mock test runner, and the account progress visualisations —
  go through the design-taste-frontend path. Both must land inside the existing token and
  type system; neither may introduce a second visual language.
- **The landing page is the reference, not a constraint to escape.** Cream paper, one
  orange accent, Playfair display headings, hard offset shadows, and restrained motion.
  The authenticated product should read as the quieter, denser sibling of that page — the
  brutal offset shadows and rotated stickers belong to the marketing surface and should be
  used sparingly, if at all, in the working screens.
- **The mock test is the one screen that should not be decorated.** Every other screen
  earns its polish; the exam runner earns its plainness. Treat any animation there as a
  defect.
- **The existing e2e suites will need updating**, not because they are wrong but because
  moving mock mode inside the data client removes the requests they intercept, and the auth
  pages lose the marketing header some of them assert. Budget for that explicitly rather
  than discovering it at the end.
- **Sequencing that keeps the app runnable throughout:** data client and fixtures first (it
  is what everything else consumes) **together with the message catalogue** (retrofitting
  strings into a catalogue after the screens exist costs several times what writing them
  through it does), then the shell and navigation model — which is where the locale and
  theme controls land — then the grader
  and result dashboard (the product's core loop), then practice, then the mock test, then
  the account area, then the auth redesign, then the responsive and accessibility pass.
  Each step leaves the app navigable.
