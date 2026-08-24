# Benchmark Report — 20260823-201717-d0fc

- Model: `inclusionai/ling-3.0-flash` · temperature `0.3`
- Pipeline: `pipeline-v3.0` · Prompts: `v3`
- Essays: 1/1 completed · wall clock 16.2s

## Scoring quality (overall band vs gold)

| Metric | Value |
| --- | --- |
| `n` | 1 |
| `mae` | 0.5 |
| `rmse` | 0.5 |
| `bias` | 0.5 |
| `within_0.5` | 1.0 |
| `within_1.0` | 1.0 |
| `spearman_rho` | None |
| `pred_std` | 0.0 |
| `gold_std` | 0.0 |
| `std_ratio` | None |

**SC-002 (>=90% within 0.5 band): 100% — PASS**

## By task type

| Task | n | MAE | bias | within_0.5 | rho |
| --- | --- | --- | --- | --- | --- |
| task_2 | 1 | 0.5 | 0.5 | 1.0 | None |

## Per criterion

| Criterion | n | MAE | bias | within_0.5 | std_ratio |
| --- | --- | --- | --- | --- | --- |
| TASK_RESPONSE | 1 | 0.5 | 0.5 | 1.0 | None |
| COHERENCE_COHESION | 1 | 0.0 | 0.0 | 1.0 | None |
| LEXICAL_RESOURCE | 1 | 0.5 | 0.5 | 1.0 | None |
| GRAMMATICAL_RANGE_ACCURACY | 1 | 1.0 | 1.0 | 0.0 | None |

## System quality

| Metric | Value |
| --- | --- |
| `quote_fidelity` | 1.0 |
| `quotes_returned` | 12 |
| `empty_evidence_rate` | 0.0 |
| `failure_rate` | 0.0 |
| `llm_calls` | 4 |
| `call_mode` | per_criterion_bilingual |
| `p50_latency_s` | 16.2 |
| `p95_latency_s` | 16.2 |
| `prompt_tokens_total` | 6514 |
| `completion_tokens_total` | 3064 |
| `tokens_per_essay` | 9578 |

## Per item

| Essay | Task | Gold | Pred | Error | Latency | Quote fidelity |
| --- | --- | --- | --- | --- | --- | --- |
| T2-001 | TASK_2 | 5.5 | 6.0 | +0.5 | 16.229s | 1.0 |

## Sample bilingual output (for human review, not scored)

### T2-001 (TASK_2, predicted overall 6.0)

**TASK_RESPONSE** — band 6.0 (raw 6.0, confidence 0.85)
- comment.en: The essay presents a relevant position but the development of main ideas is weak and often relies on generalisation rather than specific reasoning or examples. The position shifts from 'partly agree' in the introduction to a stronger stance in the conclusion without clear resolution, which affects consistency. Cohesive devices are used but the argument lacks focus and extension, keeping it at Band 6.
- comment.vi: Bài viết đưa ra quan điểm phù hợp nhưng sự phát triển ý chính yếu và dựa nhiều vào sự khái quát hóa thay vì lý giải cụ thể. Quan điểm chuyển từ 'partly agree' ở phần mở đầu sang kết luận mạnh hơn mà không có sự giải quyết rõ ràng, ảnh hưởng đến tính nhất quán. Các liên kết được sử dụng nhưng lập luận thiếu tập trung và phát triển, giữ bài ở mức Band 6.
- improvement.en: Instead of stating general claims like 'this investment can serve as the primary motivation,' explain the specific mechanism of how space exploration funding leads to solving Earth's problems with a concrete example, and ensure the position stated in the introduction is consistently maintained in the conclusion without shifting to a stronger or different stance.
- improvement.vi: Thay vì đưa ra các khẳng định chung như 'this investment can serve as the primary motivation,' hãy giải thích cơ chế cụ thể về cách tài trợ cho khám phá không gian dẫn đến giải quyết vấn đề trên Trái Đất bằng một ví dụ cụ thể, và đảm bảo quan điểm được nêu trong phần mở bài được duy trì nhất quán ở phần kết luận mà không chuyển sang lập trường mạnh hơn hoặc khác.
- evidence: ['From my perspective, I partly agree with this viewpoint due to several reasons that will be explained in the following essay.', 'this investment can serve as the primary motivation, which often promotes the development, potentially helping solve problems in the future.', 'In conclusion, although space exploration bring some benefit for science, I think the government should spend more money to solve the problem on earth first because it is more important for the people life.']

**COHERENCE_COHESION** — band 6.0 (raw 6.0, confidence 0.9)
- comment.en: The essay uses cohesive devices effectively but they are often mechanical, with formulaic connectors like 'On the one hand' and 'However' acting as scaffolding rather than natural transitions. Referencing is weak due to repetitive noun use, and paragraphing is adequate but lacks the clear central topic sentences needed for Band 7.
- comment.vi: Bài sử dụng các cohesive devices một cách hiệu quả nhưng mang tính cơ học, với các liên kết công thức như 'On the one hand' và 'However' đóng vai trò như khung đỡ thay vì chuyển tiếp tự nhiên. Việc tham chiếu yếu do lặp lại danh từ, và cách chia đoạn văn đầy đủ nhưng thiếu câu chủ đề rõ ràng cần thiết cho Band 7.
- improvement.en: Replace formulaic connectors like 'On the one hand' and 'However' with more natural transitions that arise from the logical relationship between ideas, and use pronouns or synonyms to reduce repetitive referencing of 'the government' and 'money' so that cohesion feels seamless rather than mechanical.
- improvement.vi: Thay thế các liên kết công thức như 'On the one hand' và 'However' bằng các chuyển tiếp tự nhiên hơn phát sinh từ mối quan hệ logic giữa các ý tưởng, và sử dụng đại từ hoặc từ đồng nghĩa để giảm tham chiếu lặp lại 'the government' và 'money' để sự liên kết trở nên liền mạch thay vì cơ học.
- evidence: ['On the one hand, the major reason that explain why many countries spend a great deal of money and effort on space exploration is innovation and development.', 'However, there are several compelling reasons why some people advocate for focusing on tackling problems on earth is poverty and pollution.', 'As a result, if government spend money for solve this problem, the life of poor people will be better and they can have a good life.']

**LEXICAL_RESOURCE** — band 6.0 (raw 6.0, confidence 0.9)
- comment.en: The writer uses an adequate range of vocabulary and attempts less common items like 'innovation' and 'breakthroughs', but frequent errors in word choice and collocation, such as 'spend money for solve' and 'build the system for clean the air', prevent a higher score. Repetition of key terms like 'space' and 'problem' also limits the range.
- comment.vi: Người viết sử dụng từ vựng đủ mức và cố gắng dùng các từ ít phổ biến hơn như 'innovation' và 'breakthroughs', nhưng các lỗi sai về chọn từ và kết hợp từ như 'spend money for solve' và 'build the system for clean the air' khiến điểm số không thể cao hơn. Việc lặp lại các từ khóa như 'space' và 'problem' cũng làm giới hạn phạm vi từ vựng.
- improvement.en: Focus on using correct prepositions and verb collocations, such as 'spend money solving problems' instead of 'spend money for solve this problem', and review how nouns like 'system' combine with verbs like 'clean' to form natural phrases like 'a system to clean the air'.
- improvement.vi: Hãy tập trung vào việc sử dụng giới từ và cụm động từ chính xác, ví dụ 'spend money solving problems' thay vì 'spend money for solve this problem', và xem xét danh từ 'system' kết hợp với động từ 'clean' như thế nào để tạo thành cụm tự nhiên như 'a system to clean the air'.
- evidence: ['spend money for solve this problem', 'build the system for clean the air', 'send rocket to the space']

**GRAMMATICAL_RANGE_ACCURACY** — band 6.0 (raw 6.0, confidence 0.85)
- comment.en: The essay demonstrates a mix of simple and complex sentence forms, but grammatical errors such as subject-verb agreement issues and article misuse are frequent enough to reduce clarity. While the range of structures is present, accuracy is inconsistent, placing it at Band 6 where errors rarely impede communication but are noticeable.
- comment.vi: Bài viết thể hiện sự pha trộn giữa câu đơn giản và câu phức tạp, nhưng các lỗi ngữ pháp như sự hòa hợp chủ ngữ - động từ và cách dùng mạo từ xảy ra đủ thường xuyên để làm giảm sự rõ ràng. Mặc dù có sự đa dạng về cấu trúc, độ chính xác không nhất quán, đưa bài viết vào Band 6 nơi các lỗi hiếm khi cản Trở giao tiếp nhưng vẫn dễ nhận thấy.
- improvement.en: Focus on proofreading for subject-verb agreement and article usage, especially in complex sentences, to ensure that the majority of sentences are error-free and meet the Band 7 standard for grammatical accuracy.
- improvement.vi: Hãy tập trung vào việc kiểm tra lại sự hòa hợp chủ ngữ - động từ và cách dùng mạo từ, đặc biệt trong các câu phức tạp, để đảm bảo đa số câu đều đúng ngữ pháp và đạt tiêu chuẩn Band 7 về độ chính xác.
- evidence: ['it is argued that in the large number of countries, governments allocated large amounts of financial resources to space exploration.', 'As a result, if government spend money for solve this problem, the life of poor people will be better and they can have a good life.', 'The government should use the money to build the system for clean the air instead of send rocket to the space which is very expensive and not help people directly.']

