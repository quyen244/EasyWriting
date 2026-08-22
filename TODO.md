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
| Chạy thử migrations trên Postgres thật | 2026-08-23 | 🚧 Chặn: Docker Desktop chưa bật |
| Tắt `Confirm email` trên project | 2026-08-23 | 🚧 Chặn: cần bạn bật tắt trong dashboard — publishable key không đổi được |

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

### Cần làm

- [ ] 🚧 **Chạy thử đăng ký/đăng nhập end-to-end** — chặn bởi hai việc trên (chưa có bảng `profiles` mới, chưa tắt confirm email)
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

- [ ] 🚧 **Chạy `supabase db reset` để kiểm chứng migrations thật sự thi hành được** — chặn bởi Docker Desktop
- [ ] 📋 `supabase db push` lên project nháp `tmwozpzntzyupxrmgsro` (dump 2 bảng cũ trước khi drop)
- [x] ✅ Ghi quyết định tắt `Confirm email` vào `config.toml` (áp dụng cho local)
- [ ] 🚧 Tắt `Confirm email` trên **project cloud** — đang bật (`mailer_autoconfirm: false`), cần dashboard hoặc `supabase config push`
- [ ] 📋 **Test RLS cho từng bảng** — đọc chéo user phải ra rỗng · constitution Principle III
- [ ] 📋 **Test grants** — `UPDATE writing_attempts SET overall_band = 9` bằng token học viên phải thất bại
- [ ] 📋 Test trigger `combined_band`: Task 1 ×1 + Task 2 ×2, làm tròn nửa bậc
- [ ] ❄️ Edge Function `grade-attempt` — hoãn, bàn riêng
- [ ] ❄️ Trigger `pg_net` dispatch + **cron dọn row kẹt ở `queued`** — hoãn, đi cùng Edge Function
- [ ] ❄️ Rate limit số lần chấm mỗi user · constitution Principle V

---

## System / hạ tầng

- [ ] 📋 Bật Docker Desktop để dùng được Supabase local
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
| **Migrations chưa từng thi hành** | 🔴 | Mới kiểm được cú pháp, chưa kiểm được ngữ nghĩa. FK, policy, function body plpgsql chưa chạy lần nào |
| **Task 1 chấm không nhìn ảnh** | 🟡 | Ảnh chỉ lưu để xem lại; điểm dựa trên mô tả học viên gõ. Học viên mô tả sai số liệu thì không phát hiện được — mà đó chính là nội dung của Task Achievement · [D-4](./CLARIFICATION.md) |
| **`eval/` gọi 4 lần model mỗi bài, `specs/001` nói 1 lần** | 🟡 | Chưa chốt. Chi phí gấp 4 và độ trễ khác hẳn nhau |
| **Prompt `v1` chỉ sinh một thứ tiếng** | 🟡 | Frontend cần song ngữ. Cần bộ `v2` và benchmark với `v1` trước khi dùng · constitution Principle IV |
| **Chưa có baseline Principle IV** | 🟡 | `docs/live-model-validation.md` §5.2: gate so sánh trước/sau "dựng xong nhưng chưa có số liệu nền". Cần chạy đủ 10 bài |
| **Chưa xác minh bằng browser** | 🟡 | Redesign mới chỉ được đảm bảo qua build + unit test, chưa mở mắt nhìn |
| **Auth chưa chạy thật lần nào** | 🔴 | Code xong, typecheck/lint/build/test sạch — nhưng chưa có lần đăng ký thật nào vì project còn bật confirm email và chưa có trigger `on_auth_user_created` |
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
