# TODO — WriteWise

Nơi track mọi việc từ frontend, backend đến hạ tầng. Một dòng một việc, chi tiết nằm ở tài liệu
được link tới chứ không viết lại ở đây.

**Trạng thái:** ✅ Xong · 🔨 Đang làm · 📋 Cần làm · 🚧 Bị chặn · ❄️ Hoãn

Tài liệu nền: [CLARIFICATION.md](./CLARIFICATION.md) ·
[docs/system-architecture.md](./docs/system-architecture.md) ·
[docs/data-model.md](./docs/data-model.md) ·
[specs/README.md](./specs/README.md) · [.specify/memory/constitution.md](./.specify/memory/constitution.md)

---

## 🔨 Đang làm

| Việc | Từ | Ghi chú |
|---|---|---|
| Đẩy migrations lên project cloud | 2026-08-23 | 🚧 Chặn: `supabase link` cần mật khẩu database, tôi không có |
| Quyết định về "tiêu chí yếu nhất" | 2026-08-23 | Xếp hạng đang so TASK_ACHIEVEMENT (n=1) với TASK_RESPONSE (n=2) — hai tiêu chí loại trừ nhau |

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

### Cần làm

- [ ] 📋 Đổi mã tiêu chí `GRAMMATICAL_RANGE` → `GRAMMATICAL_RANGE_ACCURACY` cho khớp DB — chạm `types.ts`, i18n, `mockData`, test · [data-model.md](./docs/data-model.md)
- [ ] 📋 Nối `lib/api/*` vào Supabase, bỏ store in-memory (giữ nguyên chữ ký hàm)
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
- [ ] 🚧 `supabase db push` lên project cloud `tmwozpzntzyupxrmgsro` — cần mật khẩu database để `supabase link`
- [ ] ❄️ Edge Function `grade-attempt` — hoãn, bàn riêng
- [ ] ❄️ Trigger `pg_net` dispatch + **cron dọn row kẹt ở `queued`** — hoãn, đi cùng Edge Function
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
| **Xếp hạng tiêu chí yếu nhất so lệch mẫu** | 🟡 | `get_progress_summary()` xếp cả 5 tiêu chí chung một bảng. Nhưng `TASK_ACHIEVEMENT` chỉ đến từ Task 1 và `TASK_RESPONSE` chỉ đến từ Task 2 — hai thứ loại trừ nhau, lấy từ hai đề khác nhau. Đo được: TASK_ACHIEVEMENT 6.00 (**n=1**) thắng GRAMMATICAL_RANGE_ACCURACY 6.50 (n=3), nên học viên bị bảo điểm yếu nhất là chỗ họ có ít bằng chứng nhất — rồi handoff practice đẩy họ tới đó. Cần quyết: đặt ngưỡng mẫu tối thiểu, hay chỉ xếp hạng 3 tiêu chí dùng chung. Hành vi hiện tại đã bị test khoá lại để nó là cố ý chứ không phải tình cờ |
| **`middleware.ts` bị Next 16 đánh dấu deprecated** | 🟡 | Vẫn chạy đúng, nhưng Next khuyến nghị đổi sang `proxy.ts`. Có codemod sẵn: `npx @next/codemod@canary middleware-to-proxy .` |
| **Task 1 chấm không nhìn ảnh** | 🟡 | Ảnh chỉ lưu để xem lại; điểm dựa trên mô tả học viên gõ. Học viên mô tả sai số liệu thì không phát hiện được — mà đó chính là nội dung của Task Achievement · [D-4](./CLARIFICATION.md) |
| **`eval/` gọi 4 lần model mỗi bài, `specs/001` nói 1 lần** | 🟡 | Chưa chốt. Chi phí gấp 4 và độ trễ khác hẳn nhau |
| **Prompt `v1` chỉ sinh một thứ tiếng** | 🟡 | Frontend cần song ngữ. Cần bộ `v2` và benchmark với `v1` trước khi dùng · constitution Principle IV |
| **Chưa có baseline Principle IV** | 🟡 | `docs/live-model-validation.md` §5.2: gate so sánh trước/sau "dựng xong nhưng chưa có số liệu nền". Cần chạy đủ 10 bài |
| **Chưa xác minh bằng browser** | 🟡 | Redesign mới chỉ được đảm bảo qua build + unit test, chưa mở mắt nhìn |
| **Auth mới chỉ chạy thật trên local** | 🟡 | Toàn bộ luồng đã kiểm trên stack local. Project cloud đã tắt confirm email nhưng **chưa có schema mới** — chưa có trigger `on_auth_user_created`, nên đăng ký ở đó tạo `auth.users` mà không có `profiles` |
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
