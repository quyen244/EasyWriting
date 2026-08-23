# Supabase Auth + Next.js — làm lại lần sau cho nhanh

Rút từ lần dựng auth cho WriteWise (2026-08-23). Mọi mục dưới đây là thứ **đã thực sự cắn**,
không phải lý thuyết.

---

## Thứ tự làm

```bash
npm i @supabase/supabase-js @supabase/ssr
npx supabase init && npx supabase start          # cần Docker chạy sẵn
```

1. `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
2. `lib/supabase/client.ts` — `createBrowserClient`, xuất kèm cờ `isSupabaseConfigured`
3. `lib/supabase/server.ts` — `createServerClient` + `cookies()`, **tạo mới mỗi request**
4. `lib/supabase/middleware.ts` — `updateSession()` làm mới cookie
5. `middleware.ts` — chặn route (Next 16 khuyên đổi tên thành `proxy.ts`)
6. Migration: bảng `profiles` + trigger `on_auth_user_created`
7. Tắt **Confirm email** — cả `config.toml` (local) **và** dashboard (cloud)

---

## Bẫy — xếp theo thời gian mất

| # | Bẫy | Triệu chứng | Cách tránh |
|---|---|---|---|
| 1 | **`next dev` mồ côi** giữ env cũ | "Something went wrong", console báo `ERR_CONNECTION_REFUSED` tới backend *cũ* | Env được nạp lúc **khởi động server**. Giết `next dev` bằng PID; đóng shell không đủ. Nghi ngờ thì `netstat -ano \| grep :3000` |
| 2 | **Hai route guard đánh nhau** | Logout bị `ERR_ABORTED`, điều hướng sai đích | Khi chuyển sang middleware, **vô hiệu hoá guard client cũ**. Đừng để cả hai chạy |
| 3 | **`db push` không chạy `seed.sql`** | Bảng nội dung rỗng trên cloud dù migration đã lên | Seed chỉ chạy khi `db reset`/`start`. Lên cloud phải chạy tay qua `psql` — xem mục dưới |
| 7 | **Host `db.<ref>.supabase.co` chỉ có bản ghi AAAA** | `could not translate host name … to address` dù tên phân giải được | Máy không có IPv6 thì phải đi qua pooler. Username đổi thành `postgres.<ref>` |
| 4 | **Confirm email BẬT mặc định trên cloud** | Sign up không trả session | `config.toml` **chỉ áp dụng local**. Kiểm bằng `GET /auth/v1/settings` → `mailer_autoconfirm` |
| 5 | **Nuốt lỗi provider** | Console in `{}` | Overlay dev dùng `JSON.stringify`; `Error` không có own property enumerable → `{}`. **Nội suy vào chuỗi**: `` `code=${e.code} msg=${e.message}` `` |
| 6 | **Key `sb_publishable_…`** | `/rest/v1/` trả 401 "Secret API key required" | Đó là endpoint OpenAPI, cần secret key. Probe từng bảng: `/rest/v1/<table>?select=id&limit=1` |

---

## Bốn chi tiết phải viết đúng ngay từ đầu

**Middleware — dựng lại response bên trong `setAll`.** Supabase có thể xoay token khi trả lời
`getUser()`; cookie mới phải nằm trên response được **trả về**, không phải trên response tạo lúc đầu.

**Dùng `getUser()`, không `getSession()`.** `getSession()` tin cookie; `getUser()` hỏi lại auth
server. Ở route guard, đó là khác biệt giữa *kiểm tra* và *tin lời*.

**Redirect phải mang cookie theo.** Trả `NextResponse.redirect()` trần sẽ đánh rơi token vừa xoay
— và người dùng bị đăng xuất bởi chính cú điều hướng lẽ ra giúp họ.

```ts
const r = NextResponse.redirect(url);
for (const c of response.cookies.getAll()) r.cookies.set(c);
```

**Lọc `?redirect=`.** Không lọc thì `?redirect=https://evil.example` biến trang đăng nhập thành
cú click ra khỏi site, ngay sau khi vừa gõ mật khẩu. Chỉ nhận chuỗi bắt đầu bằng `/` và **không**
bắt đầu bằng `//`.

---

## Nạp seed lên cloud

`supabase db push` chỉ thi hành migrations. `seed.sql` là **dữ liệu**, chỉ tự chạy khi
`supabase start` / `db reset` — tức chỉ local. Trên cloud phải nạp tay:

```bash
export PGPASSWORD='<database password>'
export PGCLIENTENCODING=UTF8   # bắt buộc trên Windows, nếu không tiếng Việt thành mojibake
psql "postgresql://postgres.<ref>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require" \
     -v ON_ERROR_STOP=1 -f supabase/seed.sql
```

Ba chỗ dễ vấp:

- **Không dùng `db.<ref>.supabase.co`** nếu máy không có IPv6 — host đó chỉ có bản ghi
  AAAA. Pooler có IPv4, nhưng username phải là `postgres.<ref>` chứ không phải `postgres`.
- **Không biết region?** Thử vài host: sai region trả `FATAL: (ENOTFOUND) tenant/user … not
  found` — một thông báo rất rõ, thử vòng là ra.
- **Port 5432 (session), không phải 6543 (transaction)** nếu seed bọc trong `begin; … commit;`.

Cách bền nhất là để seed **sinh ra từ chính fixtures của frontend** và toàn bộ là `upsert`.
Chạy lại bao nhiêu lần cũng được, và nội dung trên cloud không thể trôi khỏi mock mode.

---

## Tạo `profiles` bằng trigger, không phải client insert

Client insert hụt một nhịp là có `auth.users` không kèm profile — và không chạy khi tạo user từ
dashboard.

```sql
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email,
          coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
                   split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
```

`security definer` vì role lúc đăng ký là `supabase_auth_admin`, không có quyền trên `public`.
`set search_path` để hàm quyền cao không bị chuyển hướng.

---

## Cột không được để người dùng ghi

RLS quyết định *đọc row nào*, **grant** quyết định *ghi cột nào*. Bảng có điểm số cần cả hai:

```sql
revoke all on public.attempts from anon, authenticated;
grant select, delete on public.attempts to authenticated;
grant insert (user_id, essay_text, word_count) on public.attempts to authenticated;
-- không grant UPDATE: chấm lại = row mới
```

Thiếu bước này thì một lệnh REST là tự cho mình điểm tối đa.

---

## Test RLS bằng SQL thuần

```sql
select set_config('request.jwt.claims',
  '{"sub":"<uuid>","role":"authenticated"}', true);
set local role authenticated;
-- ... assert ...
reset role;
```

- `check` là **từ khoá SQL** — đặt tên hàm helper khác.
- `SET LOCAL` **bên trong thân hàm** không scope như bạn tưởng; để nó ở ngoài, trong script.
- Bắt lỗi bị-từ-chối phải bắt đúng `insufficient_privilege` / `check_violation`. Bắt trống sẽ
  biến lỗi cú pháp thành "test pass".
- Bọc tất cả trong `begin; … rollback;` để chạy lại bao nhiêu lần cũng được.

---

## Checklist nghiệm thu

Chạy bằng trình duyệt thật, không phải unit test:

- [ ] Sign up email mới → vào thẳng app, sidebar hiện đúng email
- [ ] `profiles` có **đúng 1** row, `full_name` lấy từ metadata
- [ ] Email trùng → lỗi dưới ô email, **mật khẩu đã gõ còn nguyên**
- [ ] Gõ `/account` khi chưa đăng nhập → `/signin?redirect=%2Faccount`; đăng nhập xong về đúng `/account`
- [ ] F5 trang đã đăng nhập → **không nháy** loading/signin
- [ ] Đã đăng nhập mà vào `/signin` → đẩy vào app
- [ ] Sai mật khẩu → báo sai mật khẩu, **không** phải "lỗi máy chủ"
- [ ] Log out → về landing, nút Back **không** vào lại được
- [ ] Sau logout, redeem refresh token cũ → `refresh_token_not_found` *(phiên bị thu hồi thật, không chỉ xoá cookie)*
- [ ] `npm run build` không chứa `service_role` hay key của model provider

> Mục áp chót là mục hay bị bỏ. `POST /auth/v1/logout` thường hiện `ERR_ABORTED` vì điều hướng
> cắt ngang — **vô hại**, request vẫn tới nơi. Muốn chắc thì bắt refresh token trước khi logout
> rồi thử đổi lại sau.

---

## Kiểm cả API, không chỉ auth

Checklist trên chứng minh đăng nhập chạy. Nó **không** chứng minh cái token đó bị giới hạn
đúng mức. Viết một script gọi thẳng REST bằng publishable key và hỏi những câu khó chịu —
`supabase/tests/api.mjs` trong repo này là một bản mẫu, 75 mệnh đề:

- anon đọc được bảng nào không? (kể cả **view** — Supabase cấp mặc định ALL cho `anon` trên
  mọi thứ tạo trong `public`, và migration dễ quên revoke phần view)
- học viên tự đặt điểm được không, trên `insert` lẫn `update`?
- nộp bài dưới `user_id` người khác thì sao?
- upload vào thư mục của người khác? file 6 MB? file PDF đội lốt ảnh?

Một điểm phải chú ý khi viết: **"bị từ chối" phải là từ chối thật**. Nếu chỉ kiểm
`status >= 400` thì gõ sai tên cột cũng ra 400 và test xanh trong khi chẳng chứng minh gì.
Bắt đúng `42501` / vi phạm RLS.

Và nửa hệ thống mà token học viên không chạm tới được — pipeline ghi điểm — chỉ kiểm được
qua một kết nối đặc quyền đóng vai pipeline. Không có nó thì `v_activity`, `combined_band`
và các ràng buộc "row đã chấm phải đủ trường" không bao giờ được chạy thử.

---

## Lấy sự thật nhanh nhất

Đừng đoán từ thông báo lỗi trên UI. Lái Playwright vào chính app đang chạy và bắt console +
network — nó chỉ thẳng ra `ERR_CONNECTION_REFUSED` tới sai host trong vòng một phút, thay vì mấy
vòng hỏi đáp.

```js
page.on("console", m => console.log(m.text()));
page.on("requestfailed", r => console.log(r.url(), r.failure()?.errorText));
page.on("response", r => /\/(auth|rest)\/v1\//.test(r.url()) && console.log(r.status(), r.url()));
```
