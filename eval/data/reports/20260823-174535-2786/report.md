# Benchmark Report — 20260823-174535-2786

- Model: `nvidia/nemotron-3-super-120b-a12b:free` · temperature `0.3`
- Pipeline: `pipeline-v2.0` · Prompts: `v2`
- Essays: 10/10 completed · wall clock 370.7s

## Scoring quality (overall band vs gold)

| Metric | Value |
| --- | --- |
| `n` | 10 |
| `mae` | 0.45 |
| `rmse` | 0.612 |
| `bias` | 0.25 |
| `within_0.5` | 0.9 |
| `within_1.0` | 0.9 |
| `spearman_rho` | 0.808 |
| `pred_std` | 1.226 |
| `gold_std` | 1.338 |
| `std_ratio` | 0.916 |

**SC-002 (>=90% within 0.5 band): 90% — PASS**

## By task type

| Task | n | MAE | bias | within_0.5 | rho |
| --- | --- | --- | --- | --- | --- |
| task_1 | 5 | 0.3 | -0.1 | 1.0 | 0.949 |
| task_2 | 5 | 0.6 | 0.6 | 0.8 | 0.894 |

## Per criterion

| Criterion | n | MAE | bias | within_0.5 | std_ratio |
| --- | --- | --- | --- | --- | --- |
| TASK_ACHIEVEMENT | 5 | 0.6 | -0.6 | 0.6 | 0.776 |
| TASK_RESPONSE | 5 | 0.5 | 0.5 | 0.8 | 1.115 |
| COHERENCE_COHESION | 10 | 0.55 | -0.15 | 0.6 | 0.538 |
| LEXICAL_RESOURCE | 10 | 0.6 | 0.2 | 0.7 | 0.76 |
| GRAMMATICAL_RANGE_ACCURACY | 10 | 0.4 | 0.3 | 0.8 | 0.956 |

## System quality

| Metric | Value |
| --- | --- |
| `quote_fidelity` | 0.9877 |
| `quotes_returned` | 81 |
| `empty_evidence_rate` | 0.0 |
| `failure_rate` | 0.0 |
| `llm_calls` | 10 |
| `call_mode` | single_call |
| `p50_latency_s` | 32.7 |
| `p95_latency_s` | 72.5 |
| `prompt_tokens_total` | 74153 |
| `completion_tokens_total` | 24431 |
| `tokens_per_essay` | 9858 |

## Per item

| Essay | Task | Gold | Pred | Error | Latency | Quote fidelity |
| --- | --- | --- | --- | --- | --- | --- |
| T1-001 | TASK_1 | 5.0 | 5.0 | +0.0 | 30.189s | 1.0 |
| T1-002 | TASK_1 | 7.0 | 7.0 | +0.0 | 72.518s | 1.0 |
| T1-003 | TASK_1 | 7.5 | 7.0 | -0.5 | 37.639s | 1.0 |
| T1-004 | TASK_1 | 8.0 | 7.5 | -0.5 | 27.339s | 1.0 |
| T1-005 | TASK_1 | 4.5 | 5.0 | +0.5 | 32.728s | 1.0 |
| T2-001 | TASK_2 | 5.5 | 6.0 | +0.5 | 38.891s | 1.0 |
| T2-002 | TASK_2 | 6.5 | 8.0 | +1.5 | 24.123s | 1.0 |
| T2-003 | TASK_2 | 7.5 | 8.0 | +0.5 | 45.516s | 0.875 |
| T2-004 | TASK_2 | 8.0 | 8.0 | +0.0 | 41.985s | 1.0 |
| T2-005 | TASK_2 | 4.5 | 5.0 | +0.5 | 19.798s | 1.0 |

## Sample bilingual output (for human review, not scored)

### T1-001 (TASK_1, predicted overall 5.0)

**TASK_ACHIEVEMENT** — band 5.0 (raw 5.0, confidence 0.8)
- comment.en: You mentioned all four energy sources and gave some figures, but your overview just says things changed without really summing up the main trends. That kind of mechanical recount is what keeps task achievement at band 5 instead of moving up to band 6.
- comment.vi: Bạn đã nêu đủ bốn nguồn năng lượng và đưa một vài con số, nhưng câu overview chỉ nói những thứ thay đổi mà không thực sự tóm tắt xu hướng chính. Loại cách kể lại máy móc như vậy chính là gì giữ task achievement ở band 5 thay vì lên band 6.
- improvement.en: Replace the vague final sentence with a clear overview that states two main trends: one source declined sharply while another rose sharply to overtake it, and the other two sources showed opposite patterns or stability.
- improvement.vi: Thay vì câu cuối mơ hồ, hãy viết một câu overview rõ ràng nêu hai xu hướng chính: một nguồn giảm mạnh trong khi nguồn khác tăng mạnh để vượt qua nó, và hai nguồn còn lại cho thấy xu hướng đối lập hoặc ổn định.
- evidence: ['In 1990, coal is the biggest source with 100 terawatt-hours.', 'In general, coal and renewables change place with each other, and gas increase then decrease.']

**COHERENCE_COHESION** — band 5.0 (raw 5.0, confidence 0.85)
- comment.en: You organised the information in a sensible time order, but there are almost no linking words like 'however', 'while', or 'then' to connect the ideas between sentences. That lack of cohesive devices is why coherence and cohesion stays at band 5.
- comment.vi: Bạn đã sắp xếp thông tin theo thứ tự thời gian hợp lý, nhưng gần như không có từ liên kết như 'however', 'while', hoặc 'then' để nối các ý giữa các câu. Sự thiếu hụt các từ liên kết này chính là lý do coherence and cohesion vẫn ở band 5.
- improvement.en: Start at least three sentences with a time or contrast linker (e.g. 'By 2005', 'In contrast', 'After peaking') to show how each idea connects to the one before it.
- improvement.vi: Hãy bắt đầu ít nhất ba câu bằng một từ nối thời gian hoặc đối lập (ví dụ: 'By 2005', 'In contrast', 'After peaking') để cho thấy mỗi ý liên kết với ý trước nó như thế nào.
- evidence: ['Renewables is opposite. In 1990 it is only 5 but it increase slowly until 2005 and then it increase very fast.', 'Natural gas increase from 20 in 1990 to 75 in 2010, it is the highest point. Then it decrease to 60 in 2020.']

**LEXICAL_RESOURCE** — band 5.0 (raw 5.0, confidence 0.8)
- comment.en: You kept using the same simple words like 'increase', 'decrease', 'go down' over and over, and tried hardly any less common vocabulary at all. That repetition and lack of range is why lexical resource is band 5.
- comment.vi: Bạn liên tục lặp lại những từ đơn giản như 'increase', 'decrease', 'go down' và gần như không thử dùng bất kỳ từ ít thông dụng nào. Sự lặp lại và thiếu phong phú từ vựng này chính là lý do lexical resource ở band 5.
- improvement.en: Before writing, make a list of six synonyms for 'increase' and 'decrease' (e.g. rise, climb, surge, drop, fall, decline) and force yourself to use a different one each time you need to describe a trend.
- improvement.vi: Trước khi viết, hãy chuẩn bị sẵn sáu từ đồng nghĩa của 'increase' và 'decrease' (ví dụ: rise, climb, surge, drop, fall, decline) và buộc chính mình dùng một từ khác nhau mỗi khi cần mô tả một xu hướng.
- evidence: ['coal is the biggest source with 100 terawatt-hours.', 'it increase very fast.']

**GRAMMATICAL_RANGE_ACCURACY** — band 5.0 (raw 5.0, confidence 0.9)
- comment.en: Almost every sentence has a subject-verb agreement or tense mistake, like 'coal is' or 'it go down', and there are hardly any complex sentences at all. That pattern of frequent, systematic errors is why grammar stays at band 5.
- comment.vi: Gần như mỗi câu đều có lỗi hoà hợp chủ-vị hoặc thì, như 'coal is' hoặc 'it go down', và gần như không có câu phức nào cả. Mẫu lỗi lặp lại và có hệ thống như vậy là lý do vì sao ngữ pháp vẫn dừng ở band 5.
- improvement.en: Before writing, put a past-time marker like 'In 1990' or 'By 2020' at the start of each sentence, then make sure every main verb after that marker is in past tense (was, had, increased, decreased, became, stayed).
- improvement.vi: Trước khi viết, hãy đặt một mốc thời gian quá khứ như 'In 1990' hoặc 'By 2020' ở đầu mỗi câu, sau đó đảm bảo mọi động từ chính sau mốc đó đều ở thì quá khứ (was, had, increased, decreased, became, stayed).
- evidence: ['The line graph show the electricity produce from four source', 'coal is the biggest source with 100 terawatt-hours. After that it go down every year']

### T1-002 (TASK_1, predicted overall 7.0)

**TASK_ACHIEVEMENT** — band 7.0 (raw 7.0, confidence 0.85)
- comment.en: You gave a clear overview that picked out the two biggest expenses and noted how their balance differed across countries, which is exactly what band 7 rewards. You also made relevant comparisons throughout. To reach band 8, the overview would need to be even more fully developed with all key data woven in.
- comment.vi: Bạn đã đưa ra một overview rõ ràng, nêu đúng hai chi tiêu lớn nhất và chỉ ra sự khác biệt trong tỉ lệ giữa chúng ở các quốc gia — đây là điều band 7 đánh giá cao. Bạn cũng đã so sánh liên quan suốt bài. Để lên band 8, overview cần được phát triển đầy đủ hơn với tất cả dữ liệu chính được tích hợp vào.
- improvement.en: In your overview sentence, add one more concrete detail, such as the approximate percentage for leisure or transport, to show you have selected not just the categories but also their scale.
- improvement.vi: Trong câu overview, hãy bổ sung một chi tiết cụ thể hơn, ví dụ như tỷ lệ gần đúng của leisure hoặc transport, để cho thấy bạn không chỉ chọn ra các danh mục mà còn biết mức độ của chúng.
- evidence: ['Overall, housing and food were the two largest expenses in all three countries, but the balance between them differed sharply: German households spent most on housing, whereas Brazilian households devoted the largest share to food.', 'Leisure consistently attracted the smallest proportion of spending everywhere.']

**COHERENCE_COHESION** — band 7.0 (raw 7.0, confidence 0.8)
- comment.en: Your ideas follow a clear order: overview, then housing, food, and the rest. Linking words like 'Overall', 'whereas', and 'while' are used at the right moments to show contrast and addition, not just as a list. This gives a clear progression throughout.
- comment.vi: Các ý tưởng của bạn được trình bày theo một trật tự rõ ràng: overview, sau đó là housing, food, và các mục còn lại. Các từ liên kết như 'Overall', 'whereas', 'while' được dùng đúng lúc để thể hiện sự đối lập và bổ sung, không chỉ là liệt kê. Điều này tạo ra một sự tiến triển rõ ràng xuyên suốt bài.
- improvement.en: Vary your sentence openings more: instead of starting two sentences with 'The remaining categories' and 'Transport', try beginning one with a participle phrase like 'Regarding the other categories...' to show even greater flexibility in cohesion.
- improvement.vi: Thay đổi cách mở câu nhiều hơn: thay vì bắt đầu hai câu bằng 'The remaining categories' và 'Transport', hãy thử bắt đầu một câu bằng cụm từ phân từ như 'Regarding the other categories...' để thể hiện sự linh hoạt cao hơn trong việc liên kết.
- evidence: ['Overall, housing and food were the two largest expenses in all three countries, but the balance between them differed sharply: German households spent most on housing, whereas Brazilian households devoted the largest share to food.', 'Leisure spending was very similar in Germany and Japan, at 12% and 10% respectively, but reached only 5% in Brazil, half the Japanese level.']

**LEXICAL_RESOURCE** — band 7.0 (raw 7.0, confidence 0.8)
- comment.en: You used a good range of vocabulary beyond the basics, including phrases like 'accounted for', 'showed the reverse pattern', and 'devoted the largest share', which shows flexibility and precision. There is some repetition of topic words like 'households' and 'spending', but it does not get in the way of meaning.
- comment.vi: Bạn đã sử dụng một phạm vi từ vựng tốt hơn mức cơ bản, bao gồm các cụm từ như 'accounted for', 'showed the reverse pattern', và 'devoted the largest share', điều này cho thấy sự linh hoạt và chính xác. Có một số lặp lại từ chủ đề như 'households' và 'spending', nhưng nó không làm ảnh hưởng đến việc truyền đạt ý nghĩa.
- improvement.en: Replace one instance of 'households' with a synonym like 'families' or 'residents' when referring to the people, to reduce repetition of the key content word and demonstrate even greater lexical flexibility.
- improvement.vi: Thay thế một lần xuất hiện của từ 'households' bằng một từ đồng nghĩa như 'families' hoặc 'residents' khi đề cập đến người dân, để giảm bớt sự lặp lại của từ nội dung chính và thể hiện sự linh hoạt từ vựng cao hơn.
- evidence: ['housing accounted for 32% of German household income', 'Food showed the reverse pattern, taking up 35% of Brazilian income']

**GRAMMATICAL_RANGE_ACCURACY** — band 7.0 (raw 7.0, confidence 0.8)
- comment.en: You used a good mix of complex structures like relative clauses and comparisons accurately most of the time. There are only a few small slips, such as the spacing around 'respectively', which do not confuse the reader.
- comment.vi: Bạn đã sử dụng một sự kết hợp tốt giữa các cấu trúc phức tạp như mệnh đề quan hệ và các câu so sánh một cách chính xác hầu hết thời gian. Chỉ có một vài lỗi nhỏ, như khoảng cách quanh từ 'respectively', không làm cho người đọc bị nhầm lẫn.
- improvement.en: In your final proofread, pay special attention to punctuation around adverbs like 'respectively' and 'however' — they usually need a comma before them when they appear mid-sentence.
- improvement.vi: Khi kiểm tra lại bài cuối cùng, hãy đặc biệt chú ý đến dấu câu xung quanh các trạng từ như 'respectively' và 'however' — chúng thường cần một dấu phẩy trước khi xuất hiện giữa câu.
- evidence: ['housing accounted for 32% of German household income, considerably higher than in Japan (25%) and Brazil (18%).', 'Leisure spending was very similar in Germany and Japan, at 12% and 10% respectively, but reached only 5% in Brazil, half the Japanese level.']

