# TODO — WriteWise

Nơi track mọi việc từ frontend, backend đến hạ tầng. Một dòng một việc, chi tiết nằm ở tài liệu
được link tới chứ không viết lại ở đây.

**Trạng thái:** ✅ Xong · 🔨 Đang làm · 📋 Cần làm · 🚧 Bị chặn · ❄️ Hoãn

Tài liệu nền: [CLARIFICATION.md](./CLARIFICATION.md) ·
[docs/system-architecture.md](./docs/system-architecture.md) ·
[docs/data-model.md](./docs/data-model.md) · [docs/supabase-auth-playbook.md](./docs/supabase-auth-playbook.md) ·
[specs/README.md](./specs/README.md) · [.specify/memory/constitution.md](./.specify/memory/constitution.md)

---

## 🔨 Đang làm

**Phase B đã dựng xong và chạy thật trên Supabase local — còn đúng một việc: chấm
thành công một bài thật.** Hạn ngạch free-tier của OpenRouter đã hết trong ngày
(2 lần benchmark buổi sáng), nên đường "chấm xong" chưa chạy được đến cùng. Mọi mắt
xích khác đã kiểm chứng end-to-end: frontend chèn row → trigger → `pg_net` → Edge
Function → gate → 4 call **song song** → ghi `llm_calls` → row chuyển trạng thái.

**Quyết định lớn: bỏ `pipeline-v2.0` (1 call), production dùng `pipeline-v3.0`** — đúng
kiến trúc 4 call song song của v1, chỉ thêm `comment`/`improvement` song ngữ mà DB đã bắt
buộc. Lý do nằm ở số đo, không phải cảm tính: v2 chấm nhỉnh hơn một chút nhưng tốn token
hơn ~40% và chậm gấp đôi (p95 72.5s so với mục tiêu 60s), vì gộp thành 1 call thì không
còn gì để chạy song song nữa. Chi tiết:
[phase-a-findings.md](./specs/00-grading-feature/phase-a-findings.md).

Việc cần làm khi hạn ngạch reset: chạy `python -m src.evaluation.harness
--pipeline-config pipelines/v3.yaml` trong `eval/` để có benchmark thật cho v3, rồi
`RUN_LOCAL_SUPABASE=1 npx vitest run tests/integration` ở `frontend/` để xem một bài
được chấm trọn vẹn.

---

## Frontend

### Xong

- [x] ✅ 14 route: landing, FAQ, signin, signup, workspace, results/[id], practice ×3, mock-test ×2, account, profile
- [x] ✅ App shell — sidebar, drawer mobile, page header
- [x] ✅ Auth screens — split canvas, tab, validate từng field, giữ text khi lỗi
- [x] ✅ Grader — Task 1/2 editor, panel "How to use", result dashboard
- [x] ✅ Practice — 12 module, 36 exercise, exercise runner
- [x] ✅ Mock test — đồng hồ, 2 tab, giữ bài khi chuyển task, xác nhận nộp
- [x] ✅ Account — profile, history, progress, activity, 4 biểu đồ SVG
- [x] ✅ i18n EN/VI + dark mode
- [x] ✅ 240 unit test pass

### Xong đợt này — auth

- [x] ✅ Cài `@supabase/supabase-js` + `@supabase/ssr`
- [x] ✅ `lib/supabase/{client,server,middleware}.ts`
- [x] ✅ Thay ruột `lib/auth.ts` sang Supabase Auth, **giữ nguyên 5 hàm** — mock vẫn là fallback khi chưa cấu hình env
- [x] ✅ `middleware.ts` chặn 6 nhóm route + đẩy người đã đăng nhập khỏi `/signin`, `/signup`
- [x] ✅ `?redirect=` — đăng nhập xong quay lại đúng trang đã bị chặn, chặn open-redirect ra ngoài site
- [x] ✅ Thêm mã lỗi `EMAIL_NOT_CONFIRMED` + `UNKNOWN` kèm chuỗi EN/VI
- [x] ✅ 10/10 test AuthScreen pass, kể cả 2 test mới cho redirect
- [x] ✅ **Route guard kiểm bằng HTTP thật**: 6 route bảo vệ → 307 kèm `?redirect=`, 4 route công khai → 200
- [x] ✅ **Auth chạy thật trên cloud, kiểm bằng trình duyệt** — 13/13 mệnh đề: sign up → `/workspace`, sign in về đúng `?redirect`, F5 không nháy, `/signin` đẩy đi khi đã đăng nhập, log out về landing + Back không vào lại, sai mật khẩu báo đúng, mật khẩu gõ dở còn nguyên
- [x] ✅ Log out **thu hồi phiên thật**: refresh token cũ → `refresh_token_not_found`
- [x] ✅ Gỡ guard client cũ đang đua với middleware (`ProtectedRoute` giờ chỉ còn phục vụ mock mode)
- [x] ✅ Sign out về landing page, khớp CLARIFICATION §1.2 (trước đó đi `/signin`)
- [x] ✅ **Nối `lib/api/*` vào Supabase — phần nội dung tĩnh + luyện tập, giữ nguyên chữ ký hàm.**
      `listMockTests`/`getMockTest` đọc `mock_tests`+`mock_test_tasks` thật; `listModules`/`getModule`
      đọc `practice_modules`+`practice_exercises`, `completed_count` đọc từ `v_practice_progress`
      (view inner-join nên module chưa luyện mặc định 0); `checkAnswer` chèn row `practice_attempts`
      thật (đây là chỗ ghi, không phải `recordProgress` — hàm đó giờ no-op khi dùng Supabase vì
      tiến độ được suy ra từ chính bảng attempts); `getActivity` gộp hoạt động luyện tập thật với
      hoạt động chấm điểm (vẫn mock). Kiểm qua trình duyệt thật trên cloud: đề thi/module hiện đúng
      nội dung seed, module tiêu chí ngữ pháp (`GRAMMATICAL_RANGE_ACCURACY` → `GRAMMATICAL_RANGE` qua
      `normaliseCriterionCode`) render đúng nhãn, check 1 bài → insert thật (xác nhận bằng psql),
      "3 of 3 done" đúng theo dedupe distinct exercise_id dù bấm check 4 lần. `npm run typecheck` +
      `lint` sạch, vitest 242/249 (7 fail Hero có từ trước, không liên quan), 75/75 `api.mjs` vẫn qua.
      **Chấm điểm (`gradeEssay`/`gradeMockSubmission`/`getResult`/history/progress) vẫn giữ nguyên
      mock** — RLS cố ý cấm `authenticated` ghi `overall_band`/`status='scored'`, và pipeline chấm
      chưa tồn tại (hoãn, bàn riêng); nối phần đó phải đợi pipeline trước.
- [x] ✅ **Nối `gradeEssay`/`getResult` vào pipeline thật** (pipeline đã có, xem mục Backend).
      Client **không gọi endpoint chấm nào cả** — nó chèn row `writing_attempts` với
      `status='queued'` rồi theo dõi chính row đó (constitution Principle VIII), trigger trong DB
      mới là thứ gọi Edge Function. Hệ quả thực tế: đóng tab không huỷ việc chấm.
      Theo dõi bằng **poll 2s chứ không phải realtime** — có cân nhắc: realtime tiết kiệm được
      1-2s trên một lần chờ 15-30s, đổi lại là một WebSocket mà mọi kiểu hỏng của nó đều phải
      quay về poll để cứu; đã vậy thì poll là cơ chế chính luôn cho gọn. Test thật chạy được
      với stack local: `frontend/tests/integration/grading.local.test.ts` (tự skip nếu không
      có `RUN_LOCAL_SUPABASE=1`, nên `vitest run` bình thường không bị ảnh hưởng).
      **`gradeMockSubmission` vẫn mock** — một lượt thi mock cần chấm cả hai bài mới có nghĩa,
      và sổ sách `mock_test_attempts` + trigger `combined_band` là việc thứ hai phải làm cho
      đúng; làm chung một lượt thì cả hai đều khó kiểm chứng.
- [ ] 📋 Đổi mã tiêu chí `GRAMMATICAL_RANGE` → `GRAMMATICAL_RANGE_ACCURACY` cho khớp DB — chạm `types.ts`, i18n, `mockData`, test · [data-model.md](./docs/data-model.md)
- [ ] 📋 Upload ảnh Task 1 lên Storage + hiển thị lại bằng signed URL
- [ ] 📋 Subscribe Realtime cho kết quả chấm, kèm fallback polling
- [ ] 📋 Đồng bộ `locale` với `profiles` để đổi máy vẫn giữ ngôn ngữ
- [ ] ❄️ Nút xoá bài trong history (schema đã cho phép `DELETE`)

---

## Backend / Supabase

### Xong

- [x] ✅ `supabase init`, `config.toml` vào repo
- [x] ✅ Migration 001 — `profiles`, trigger `on_auth_user_created`, RLS
- [x] ✅ Migration 002 — `mock_tests`, `mock_test_tasks`, `mock_test_attempts`
- [x] ✅ Migration 003 — `practice_modules`, `practice_exercises`, `practice_attempts`, view tiến độ
- [x] ✅ Migration 004 — `writing_attempts` + constraint + **column grants** + Realtime
- [x] ✅ Migration 005 — `llm_calls` (chỉ `service_role`)
- [x] ✅ Migration 006 — `get_progress_summary()`, `v_activity`
- [x] ✅ Migration 007 — bucket `chart-images` + policy
- [x] ✅ `seed.sql` sinh tự động từ fixtures frontend (`scripts/gen-seed.ts`)
- [x] ✅ Kiểm cú pháp toàn bộ SQL bằng grammar Postgres thật (`pglast`)

### Cần làm

- [x] ✅ **Cả 7 migration + seed đã thi hành thật** trên Postgres 17 local (`supabase start`)
- [x] ✅ Tắt `Confirm email` — `config.toml` (local) và dashboard (cloud, `mailer_autoconfirm: true`)
- [x] ✅ **[supabase/tests/rls.sql](./supabase/tests/rls.sql) — 30/30 mệnh đề pass** · constitution Principle III
- [x] ✅ Test grants: học viên **không** đặt được `overall_band = 9.0` hay `status = 'scored'`
- [x] ✅ Test trigger `combined_band`: (6.0 + 7.0×2)/3 → 6.5
- [x] ✅ Auth end-to-end trên local: sign up trả session ngay · trigger tạo `profiles` với `full_name` từ metadata · sign in · sai mật khẩu → `invalid_credentials` · logout 204 rồi token cũ → 403
- [x] ✅ Seed đọc được qua REST bằng token thật: 2 đề, 4 task, 12 module, 36 exercise, song ngữ nguyên vẹn
- [x] ✅ Migrations đã lên cloud `tmwozpzntzyupxrmgsro` — trigger `on_auth_user_created` chạy đúng, `anon` đã bị thu hồi quyền
- [x] ✅ **Seed đã lên cloud** — 2 đề · 4 task · 12 module · 36 exercise, tiếng Việt round-trip nguyên vẹn qua REST
- [x] ✅ **Bộ test API chạy thẳng vào cloud — 75/75** (`supabase/tests/api.mjs`): anon bị chặn ở cả 9 bảng và 2 view · học viên không tự đặt band, không ghi đè bài đã nộp, không nộp hộ người khác · trigger `submitted_at` → `submitted` · `combined_band` 6.5 · Storage chặn thư mục người khác, chặn file >5 MB và sai MIME · logout thu hồi refresh token
- [x] ✅ **Siết grant trên `v_activity` / `v_practice_progress`** (migration `0008`) — Supabase cấp mặc định ALL cho `anon`; nay chỉ còn `select` cho `authenticated`
- [x] ✅ **Quyết xong "tiêu chí yếu nhất"** (migration `0009`) — `TASK_ACHIEVEMENT`/`TASK_RESPONSE` gộp làm một khi xếp hạng, vì cả hai đo cùng một thứ (đáp ứng yêu cầu đề) chỉ khác tên theo task. Còn 4 mã, mẫu cộng dồn qua cả hai loại bài. Đã tái hiện đúng ca gây lỗi trên cloud (1 bài Task 1 + 3 bài Task 2): trước gộp → TASK_ACHIEVEMENT (n=1) thắng; sau gộp → TASK_ACHIEVEMENT (n=4, gộp cả 4 bài) thành mạnh nhất đúng thực tế, yếu nhất chuyển sang tiêu chí có bằng chứng thật. `writing_attempts.criteria` không đổi — mỗi bài vẫn giữ đúng mã theo task để khớp đề thi thật
- [x] ✅ **Phase A — `pipeline-v2.0` (1 call/bài thay vì 4) đã build + benchmark thật trong `eval/`**
      · `eval/prompts/v2/` (system+user gộp 4 tiêu chí, few-shot 2 ví dụ tự viết — KHÔNG lấy từ
      golden set để tránh rò rỉ đáp án vào chính bộ so sánh) · `eval/pipelines/v2.yaml` ·
      schema `CombinedEvaluationTask{1,2}` dùng **field có tên cố định** (`task_achievement`,
      `coherence_cohesion`,...) thay vì mảng + `code` — loại bỏ hẳn nhu cầu sắp lại thứ tự,
      khác với thiết kế ban đầu trong spec.md §11 · `run_assessment_v2()` tái dùng nguyên
      `aggregate.py`/`verify.py` · 20 test mới, 131/131 test cũ vẫn xanh · benchmark thật 10/10
      bài golden set (không phải `FakeLLMClient` — phát hiện toàn bộ report 10-bài cũ trong
      `eval/data/reports/` từ trước đều là fake, đã chạy lại thật cho cả v1 lẫn v2 để so công
      bằng). Kết quả: MAE 0.45 vs 0.5, within_0.5 90% vs 70% (v2 tốt hơn) — nhưng token/bài
      tăng ~40%, p95 latency 72.5s (vượt mục tiêu 60s), và rò rỉ tiếng Trung/Ả Rập vào
      `comment.vi` còn sót 6/80 field sau 1 lần sửa prompt. Chi tiết:
      [phase-a-findings.md](./specs/00-grading-feature/phase-a-findings.md)
- [x] ✅ **`pipeline-v3.0` — v1 (4 call song song) + song ngữ, trong `eval/`**
      · `eval/prompts/v3/` (nguyên văn v1, thêm `comment`/`improvement` en+vi và luật
      cấm lẫn chữ nước ngoài vào field `vi` mà Phase A chứng minh là cần) ·
      `eval/pipelines/v3.yaml` (model/temperature/seed/length-penalty **y hệt v1**, chỉ
      khác prompt + `max_tokens` — để chênh lệch độ chính xác so với benchmark v1 quy
      được về đúng một biến) · `run_assessment_v3()` là **wrapper mỏng** gọi lại
      `run_assessment()` chứ không phải bản sao — bản sao sẽ lệch khỏi v1 ngay lần sửa
      đầu tiên · 19 test mới, 150/150 xanh
- [x] ✅ **Phase B — Edge Function `grade-attempt`** (`supabase/functions/grade-attempt/`)
      · `gate.ts`/`extract.ts`/`aggregate.ts`/`verify.ts`/`prompt.ts`/`openrouter.ts` port
      từ Python trong `eval/` · **4 call phát cùng lúc bằng `Promise.all`** · claim row
      bằng `update ... where status='queued'` nên trigger và cron không thể chấm trùng
      một bài · thêm **kiểm tra chữ Việt phía server** (bắt được rò rỉ 冠词/ไทย/العربية mà
      Phase A đo được) — prompt xin, schema ràng, **code mới là thứ chặn** · prompt/rubric/
      lexicon/JSON-schema **sinh tự động** từ `eval/` qua `eval/scripts/export_edge_assets.py`,
      có test Python fail nếu hai bên lệch nhau · 39 test `deno test` xanh
- [x] ✅ **Trigger `pg_net` dispatch + cron dọn row kẹt** (migration `0010`) — trigger
      `AFTER INSERT` bắn ngay, cron mỗi phút quét row kẹt ở `queued`/`scoring` quá 5 phút
      (bắt buộc phải có: `pg_net` là fire-and-forget, request rơi thì không để lại dấu
      vết nào) · tối đa 3 lần rồi `failed` · secret nằm trong Vault, không nằm trong git
- [x] ✅ **Vá lỗ hổng grant `service_role`** (migration `0010`) — project tắt
      `auto_expose_new_tables`, mà `0004`/`0005` chỉ cấp quyền cho `authenticated`, nên
      `service_role` **không có SELECT/UPDATE** trên `writing_attempts`. RLS chưa bao giờ
      là thứ cản đường (service_role bypass RLS) — thiếu là thiếu quyền bảng. Chỉ lộ ra
      khi thật sự có thứ chạy dưới `service_role`: Edge Function ăn "permission denied"
      ngay lần claim đầu tiên
- [x] ✅ **Chạy thật trên Supabase local** — insert → trigger → function → gate →
      `rejected/NOT_ENGLISH` (0 call model, đúng thiết kế) · bài thật → 4 call song song →
      4 row `llm_calls` (`rate_limited`, hết quota) → `failed/RATE_LIMITED`. Script dựng
      lại môi trường: `supabase/scripts/setup-local-grading.sh`
- [ ] 🚧 **Chấm trọn vẹn một bài thật** — chờ hạn ngạch OpenRouter reset
- [ ] ❄️ Rate limit số lần chấm mỗi user · constitution Principle V

---

## System / hạ tầng

- [x] ✅ Supabase local chạy được (`npx supabase start`)
- [x] ✅ `frontend/.env.local` + `.env.example` — `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] ❄️ Tách project Supabase dev / prod (hiện chỉ có một, đang coi là nháp)
- [ ] ❄️ Deploy frontend lên Vercel + cấu hình redirect URL cho Auth
- [ ] ❄️ CI chạy typecheck + lint + test mỗi push
- [ ] ❄️ Lịch xoá `llm_calls.raw_response` (chứa bài của học viên)

---

## Nợ kỹ thuật đã biết

Ghi ra để nó không biến mất khỏi tầm nhìn.

| Nợ | Mức | Chi tiết |
|---|---|---|
| **6 spec Playwright e2e đã chết** | 🔴 | Chúng chặn request HTTP bằng `stubBackend` — kiến trúc đó không còn, không còn request nào để chặn. `discover-and-signup.spec.ts` còn assert header marketing trên trang signup, thứ đã bỏ theo thiết kế. Chưa cập nhật, chưa chạy |
| **7 unit test Hero fail** | 🟡 | Có từ trước đợt redesign. Commit `8c00bdb` đổi landing page sang tiếng Việt nhưng không sửa test, test vẫn assert tiếng Anh. Đã xác minh bằng cách stash toàn bộ thay đổi và chạy lại |
| **`middleware.ts` bị Next 16 đánh dấu deprecated** | 🟡 | Vẫn chạy đúng, nhưng Next khuyến nghị đổi sang `proxy.ts`. Có codemod sẵn: `npx @next/codemod@canary middleware-to-proxy .` |
| **Task 1 chấm không nhìn ảnh** | 🟡 | Ảnh chỉ lưu để xem lại; điểm dựa trên mô tả học viên gõ. Học viên mô tả sai số liệu thì không phát hiện được — mà đó chính là nội dung của Task Achievement · [D-4](./CLARIFICATION.md) |
| **`eval/` gọi 4 lần model mỗi bài, `specs/001` nói 1 lần** | 🟡 | Chưa chốt. Chi phí gấp 4 và độ trễ khác hẳn nhau |
| **Prompt `v1` chỉ sinh một thứ tiếng** | 🟡 | Frontend cần song ngữ. Cần bộ `v2` và benchmark với `v1` trước khi dùng · constitution Principle IV |
| **Chưa có baseline Principle IV** | 🟡 | `docs/live-model-validation.md` §5.2: gate so sánh trước/sau "dựng xong nhưng chưa có số liệu nền". Cần chạy đủ 10 bài |
| **Chưa xác minh bằng browser** | 🟡 | Redesign mới chỉ được đảm bảo qua build + unit test, chưa mở mắt nhìn |
| **`useAuth` vẫn tự hẹn giờ refresh** | 🟢 | Supabase client đã tự làm việc đó. Lớp hẹn giờ cũ giờ là thừa chứ không sai — dọn khi nào chạm lại file |

---

## Sau này

- ❄️ Speaking — practice + mock test. Cột `skill` trong `writing_attempts` đã chừa sẵn
- ❄️ Đăng nhập Google (OAuth) · [A-7](./CLARIFICATION.md)
- ❄️ Quên mật khẩu / đổi mật khẩu — cần bật lại email · [A-8](./CLARIFICATION.md)
- ❄️ Tự xoá tài khoản — schema đã cascade sẵn, chỉ thiếu UI · [A-9](./CLARIFICATION.md)
- ❄️ Compute Tier 2 (worker Python/GPU) — chỉ khi chứng minh Tier 1 không đủ · constitution
- ❄️ Materialized view cho progress — chỉ khi đo được là chậm thật, không phải phòng xa

---

*Cập nhật cùng lúc với mỗi commit lớn.*
