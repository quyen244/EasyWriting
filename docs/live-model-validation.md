# Live model validation — 001 IELTS Score Assessment

**Ngày**: 2026-08-20 · **Commit**: `4bb76c5` · **Model**: `nvidia/nemotron-3-super-120b-a12b:free`

Ghi lại lần đầu tiên pipeline chấm điểm gọi model thật (trước đó 100% test dùng `FakeLLMClient`).
Mục tiêu là **test hệ thống** — chứng minh đường đi end-to-end hoạt động — không phải đo độ chính xác.

---

## 1. Bug tìm được: reasoning tokens ăn hết output budget

Lần chạy đầu tiên **fail toàn bộ**: cả 4 criteria trả về `criterion_failed`, assessment trả 503.

```
-> FAILED: TASK_ACHIEVEMENT: output truncated at token limit:
   1 validation error for CriterionEvaluation — Invalid JSON: expected v
```

### Nguyên nhân

Model này là **reasoning model**, và theo OpenRouter, reasoning tokens **là output tokens** —
chúng bị tính tiền như output và **trừ vào `max_tokens`**.

Số đo thực tế:

| Thử nghiệm | reasoning tokens | completion tokens | finish_reason |
| --- | --- | --- | --- |
| Prompt tầm thường (`reply with {"ok": true}`) | 59 | 60 | `stop` |
| Criterion prompt thật, `max_tokens: 1536` | **1255** (82%) | 1536 | **`length`** |

Model tiêu 1255/1536 token để "nghĩ", còn lại 281 token không đủ để viết hết JSON verdict
→ JSON cụt → Pydantic validation fail → criterion degraded → cả assessment fail.

Retry-repair loop (`TRUNCATION_TEMPLATE`) không cứu được, vì lần retry nào cũng bị cùng một
trần token chặn lại.

### Tại sao 203 test offline không bắt được

`FakeLLMClient` trả JSON hợp lệ tức thì, không có khái niệm token budget. Đây là lớp bug chỉ
tồn tại ở ranh giới với provider thật — cùng loại với bug 500-thay-vì-400 tìm được hồi test
Docker. **Bài học lặp lại: mọi ranh giới ngoài hệ thống đều cần ít nhất một lần chạm thật.**

---

## 2. `exclude: true` KHÔNG phải cách tắt reasoning

Đây là điểm dễ nhầm nhất, đã đo cả 3 phương án trên cùng một prompt:

| Cấu hình | reasoning tokens | completion | JSON |
| --- | --- | --- | --- |
| `reasoning: {exclude: true}` | **792** | 1141 | valid |
| `reasoning: {effort: "minimal"}` | **758** | 1133 | valid |
| `reasoning: {enabled: false}` | **0** | 580 | valid |

Docs OpenRouter nói rõ:

> `exclude: true` — the model still generates reasoning internally but does not return it
> in the response. **Reasoning tokens are still consumed and billed.**
>
> `enabled: false` — fully disables reasoning generation.

Nghĩa là `exclude` chỉ **giấu** trace khỏi response, vẫn sinh token và vẫn mất tiền.
Chỉ `enabled: false` mới thật sự giải phóng budget.

Nguồn: <https://openrouter.ai/docs/use-cases/reasoning-tokens>

---

## 3. Cách sửa — chỉ chỉnh YAML, không đụng Python

Đúng theo Constitution IV (methodology sống trong YAML có version):

```yaml
# backend/pipelines/v1.yaml
model:
  max_tokens: 2048        # đo được: 1 criterion tốn ~580 token khi tắt reasoning
  reasoning:
    enabled: false
```

Phần code chỉ thêm `ReasoningConfig` để **chặn cấu hình sai ngay lúc load**, thay vì để nó
âm thầm không có tác dụng:

| Cấu hình sai | Vì sao chặn |
| --- | --- |
| `effort` + `max_tokens` cùng lúc | OpenRouter chỉ nhận một trong hai |
| `effort` khi `enabled: false` | Không có tác dụng, nhưng người viết tưởng là có |
| `reasoning.max_tokens >= model.max_tokens` | Chắc chắn truncate — chính là bug ở trên, viết thành rule |

8 unit test trong `backend/tests/unit/test_reasoning_config.py` khoá lại các hành vi này.

---

## 4. Kết quả sau khi sửa

```
Benchmarking 1 essays · model=nvidia/nemotron-3-super-120b-a12b:free · prompts=v1
[1/1] T1-001 (gold 5.0)  ->  5.0 in 5.998s
```

| Chỉ số | Giá trị | Ý nghĩa |
| --- | --- | --- |
| gold → pred | 5.0 → **5.0** | khớp chính xác (xem cảnh báo ở mục 5) |
| `quote_fidelity` | **1.0** (15/15) | mọi dẫn chứng đều verify được nguyên văn trong bài |
| `empty_evidence_rate` | 0.0 | không criterion nào chấm mà không dẫn chứng |
| `failure_rate` | 0.0 | không criterion nào degraded |
| `llm_calls` | 4 | 4 criteria chạy song song qua `asyncio.gather` |
| wall clock | 6.0s | song song, không phải 4×tuần tự |
| tokens/bài | 6967 (4821 prompt + 2146 completion) | cơ sở để ước tính chi phí |

**`quote_fidelity 1.0` là kết quả đáng giá nhất ở đây** — quan trọng hơn con số band. Nó chứng
minh model không bịa dẫn chứng, tức là cơ chế chống hallucination (FR: evidence anchoring)
hoạt động với model thật chứ không chỉ với fake.

Trạng thái repo: **203 test pass** (195 cũ + 8 mới), fake harness vẫn chạy, không regression.

---

## 5. ⚠️ Điều cần lưu ý

### 5.1 MAE 0.0 với n=1 KHÔNG phải bằng chứng độ chính xác

Trúng 1 bài hoàn toàn có thể là may. Con số này chỉ nói "hệ thống chạy đúng", không nói
"hệ thống chấm đúng". Đừng trích nó ra như một chỉ số chất lượng ở bất kỳ đâu.

### 5.2 Chưa có baseline thật cho Principle IV

Gate so sánh trước/sau khi đổi prompt hoặc model vẫn **"armed but unexercised"** — cơ chế
dựng xong nhưng chưa có số liệu nền để so. Cần chạy đủ 10 bài mới có baseline dùng được
(~40 API call, ~70k token).

### 5.3 Tắt reasoning là để sửa truncation, CHƯA chứng minh là tốt hơn cho chất lượng chấm

Đây là caveat quan trọng nhất và dễ bị bỏ qua. Tôi tắt reasoning vì nó làm **hỏng** output,
không phải vì đã đo được rằng tắt thì chấm **chính xác hơn**. Rất có thể reasoning giúp model
chấm sát rubric hơn.

Phép so sánh đúng phải là: `max_tokens: 4096` + `reasoning: {enabled: true}` — tức là cho
reasoning đủ chỗ để nghĩ **và** đủ chỗ còn lại để viết JSON — rồi benchmark đối đầu với v1.
Đừng kết luận "tắt reasoning là đúng" cho tới khi chạy phép so sánh đó.

### 5.4 Model free tier

`:free` có rate limit và độ ổn định không đảm bảo. `seed: 42` được gửi đi nhưng provider
không cam kết reproducibility — kết quả benchmark có thể lệch nhẹ giữa các lần chạy.

### 5.5 Hook auto-commit chưa tự chạy

`.claude/settings.json` chỉ được đọc lúc khởi động session. Cần **restart Claude Code** thì
Stop hook mới active. Hiện tại commit đang được tạo bằng cách gọi tay
`python .claude/hooks/auto_commit.py`.

---

## 6. Cần làm tiếp theo

| # | Việc | Ghi chú |
| --- | --- | --- |
| 1 | Chạy baseline đủ 10 bài | `python -m src.evaluation.harness` — lưu lại `metrics.json` làm mốc |
| 2 | Tạo `pipelines/v2.yaml`: `max_tokens: 4096` + `reasoning.enabled: true`, benchmark đối đầu v1 | Trả lời dứt điểm mục 5.3 |
| 3 | Restart Claude Code | Kích hoạt Stop hook |
| 4 | Đưa `OPENROUTER_API_KEY` vào GitHub Secrets nếu muốn CI chạy benchmark thật | Hiện CI chỉ chạy `--fake`, không tốn tiền — cân nhắc giữ nguyên |
| 5 | Cập nhật `specs/001-ielts-score-assessment/tasks.md` khi có baseline thật | T044 hiện ghi rõ là chưa gọi model thật |

---

## Phụ lục: lệnh dùng lại

```bash
cd backend

# Test hệ thống nhanh, 1 bài, model thật
python -m src.evaluation.harness --limit 1

# Baseline đầy đủ
python -m src.evaluation.harness

# Không tốn tiền — dùng trong CI
python -m src.evaluation.harness --fake --limit 2

# So sánh methodology khác
python -m src.evaluation.harness --pipeline-config pipelines/v2.yaml
```

Report ghi ra `backend/data/reports/<timestamp>/` gồm `report.md`, `metrics.json`,
`raw_results.json`. Thư mục này nằm trong `.gitignore`.
