/**
 * Band-tiered examiner commentary, per criterion, in both interface languages.
 *
 * Written rather than generated, because this is the product's actual content: it is the
 * only thing on the result screen a learner reads for meaning. Each entry pairs a
 * *comment* (why this band, in descriptor language) with an *improvement* (one concrete
 * thing to do next). Neither restates the other — a comment that ends "…so develop your
 * ideas more" and an improvement that says "develop your ideas more" is one sentence
 * printed twice.
 *
 * Two variants per tier so a learner grading several essays does not read the same
 * paragraph back. The variant is chosen deterministically from the essay text, so the
 * same essay always produces the same feedback.
 */

import type { CriterionCode } from "@/lib/api/types";

import type { LocalizedText } from "./localized";

export type BandTier = "low" | "mid" | "high";

export interface FeedbackEntry {
  comment: LocalizedText;
  improvement: LocalizedText;
}

/** Bands below 6 read as "low", 6–6.5 as "mid", 7 and above as "high". */
export function bandTier(band: number): BandTier {
  if (band >= 7) return "high";
  if (band >= 6) return "mid";
  return "low";
}

type FeedbackBank = Record<CriterionCode, Record<BandTier, FeedbackEntry[]>>;

export const CRITERION_FEEDBACK: FeedbackBank = {
  TASK_ACHIEVEMENT: {
    low: [
      {
        comment: {
          en: "The report covers some of the data but leaves key features unmentioned, and a reader could not reconstruct the chart from your description. Several figures are quoted without saying what they are being compared with.",
          vi: "Bài viết có nhắc tới dữ liệu nhưng bỏ sót những đặc điểm quan trọng, và người đọc không thể hình dung lại biểu đồ chỉ từ phần mô tả của bạn. Một số con số được nêu ra mà không nói rõ đang so sánh với cái gì.",
        },
        improvement: {
          en: "Before writing, list the three things that would strike anyone looking at the chart — the highest, the lowest, and the biggest change — and make sure all three appear in your report.",
          vi: "Trước khi viết, hãy liệt kê ba điều đập vào mắt bất kỳ ai nhìn biểu đồ — cao nhất, thấp nhất và thay đổi lớn nhất — rồi đảm bảo cả ba đều xuất hiện trong bài.",
        },
      },
      {
        comment: {
          en: "There is no clear overview, so the report reads as a list of numbers rather than an account of what the data shows. Some detail is inaccurate against the figures given.",
          vi: "Bài chưa có phần overview rõ ràng nên đọc như một danh sách số liệu chứ không phải một bản tường thuật về điều dữ liệu thể hiện. Một vài chi tiết chưa khớp với số liệu đã cho.",
        },
        improvement: {
          en: "Write one overview sentence that contains no figures at all — just the direction of the story — and put it immediately after your introduction.",
          vi: "Hãy viết một câu overview hoàn toàn không có số liệu — chỉ nêu xu hướng chung — và đặt ngay sau phần mở bài.",
        },
      },
    ],
    mid: [
      {
        comment: {
          en: "The main features are selected and reported accurately, and the overview identifies the overall trend. Some supporting detail is thin, and one or two comparisons are stated without the figures that would anchor them.",
          vi: "Bạn đã chọn và tường thuật chính xác các đặc điểm chính, phần overview nêu được xu hướng tổng thể. Tuy nhiên một số chi tiết hỗ trợ còn mỏng, và một hai phép so sánh chưa kèm số liệu để làm chỗ dựa.",
        },
        improvement: {
          en: "Attach a figure to every comparison you make. \"Considerably higher\" becomes evidence the moment it reads \"considerably higher, at 62% against 41%\".",
          vi: "Hãy gắn số liệu vào mọi phép so sánh. “Cao hơn đáng kể” chỉ trở thành bằng chứng khi viết thành “cao hơn đáng kể, 62% so với 41%”.",
        },
      },
      {
        comment: {
          en: "The data is covered and the overview is present, but the selection is even rather than prioritised — small movements get the same weight as the dominant trend.",
          vi: "Bài đã bao quát dữ liệu và có overview, nhưng cách chọn thông tin còn dàn đều — những biến động nhỏ được nói với mức độ ngang bằng xu hướng chủ đạo.",
        },
        improvement: {
          en: "Give the largest change its own sentence, and compress the minor movements into a single clause. Weighting is part of what Task Achievement measures.",
          vi: "Hãy dành hẳn một câu cho biến động lớn nhất, và gom các thay đổi nhỏ vào một mệnh đề duy nhất. Biết phân bổ trọng số cũng là điều Task Achievement đo lường.",
        },
      },
    ],
    high: [
      {
        comment: {
          en: "The response covers the data fully and selects well: the overview states the dominant trend without figures, and each body paragraph groups related movements and supports them with accurate numbers.",
          vi: "Bài đáp ứng đầy đủ dữ liệu và chọn lọc tốt: phần overview nêu xu hướng chủ đạo mà không dùng số liệu, mỗi đoạn thân bài nhóm các biến động liên quan và có số liệu chính xác kèm theo.",
        },
        improvement: {
          en: "To push higher, sharpen the overview so it makes a claim rather than a summary — name the relationship between the series, not just their directions.",
          vi: "Muốn lên band cao hơn, hãy làm phần overview sắc hơn: đưa ra một nhận định chứ không chỉ tóm tắt — gọi tên mối quan hệ giữa các đường dữ liệu, không chỉ hướng đi của chúng.",
        },
      },
      {
        comment: {
          en: "Key features are identified confidently and the grouping is logical. Figures are integrated into the prose rather than listed, which is what separates a report from a caption.",
          vi: "Bạn xác định các đặc điểm chính một cách chắc chắn và cách nhóm thông tin hợp lý. Số liệu được lồng vào câu văn thay vì liệt kê — đó chính là điểm khác nhau giữa một bản báo cáo và một dòng chú thích.",
        },
        improvement: {
          en: "Watch for the one or two places where a figure is repeated in both the overview and the body. The overview should stay figure-free.",
          vi: "Hãy để ý một hai chỗ có số liệu lặp lại ở cả overview lẫn thân bài. Phần overview nên giữ nguyên tắc không dùng số liệu.",
        },
      },
    ],
  },

  TASK_RESPONSE: {
    low: [
      {
        comment: {
          en: "The essay responds to the topic but not fully to the question: one part of the prompt is answered at length while the other is barely addressed, and the position shifts between paragraphs.",
          vi: "Bài viết có bám chủ đề nhưng chưa trả lời trọn vẹn câu hỏi: một vế của đề được viết dài, vế còn lại gần như bị bỏ qua, và quan điểm thay đổi giữa các đoạn.",
        },
        improvement: {
          en: "Underline every task word in the prompt — \"discuss\", \"to what extent\", \"both views\" — and check that each one has a paragraph that answers it.",
          vi: "Hãy gạch chân mọi từ khoá nhiệm vụ trong đề — “discuss”, “to what extent”, “both views” — rồi kiểm tra mỗi từ đó có một đoạn trả lời tương ứng chưa.",
        },
      },
      {
        comment: {
          en: "Ideas are relevant but stay general: the essay asserts positions without developing them, and the examples given are too broad to support the claims they follow.",
          vi: "Các ý đều liên quan nhưng còn chung chung: bài đưa ra quan điểm mà chưa triển khai, còn ví dụ thì quá rộng nên không đỡ được cho luận điểm đứng trước nó.",
        },
        improvement: {
          en: "Take your weakest paragraph and add two sentences that answer \"why?\" and \"so what?\" after your main claim. Depth scores here, not breadth.",
          vi: "Hãy chọn đoạn yếu nhất và thêm hai câu trả lời cho “tại sao?” và “rồi sao?” ngay sau luận điểm chính. Ở tiêu chí này, chiều sâu mới tính điểm, không phải chiều rộng.",
        },
      },
    ],
    mid: [
      {
        comment: {
          en: "The question is addressed and a clear position is held throughout, but development is uneven — the strongest paragraph is well supported while another rests on a single unexplained example.",
          vi: "Bài trả lời đúng câu hỏi và giữ được quan điểm nhất quán, nhưng mức độ triển khai chưa đều — đoạn mạnh nhất có dẫn chứng tốt, trong khi một đoạn khác chỉ dựa vào một ví dụ chưa được giải thích.",
        },
        improvement: {
          en: "Give your second body paragraph the same treatment as your first: claim, reason, example, consequence. Consistency of development is what moves this criterion.",
          vi: "Hãy xử lý đoạn thân bài thứ hai giống như đoạn thứ nhất: luận điểm, lý do, ví dụ, hệ quả. Sự đồng đều trong triển khai là thứ giúp tiêu chí này tăng điểm.",
        },
      },
      {
        comment: {
          en: "Both parts of the question are covered and the conclusion follows from the argument. Some ideas are stated more than developed, and the essay stops short of saying why its examples matter.",
          vi: "Cả hai vế của câu hỏi đều được đề cập và phần kết luận đi ra từ lập luận. Một số ý mới dừng ở mức nêu chứ chưa triển khai, và bài chưa nói rõ vì sao ví dụ đưa ra lại quan trọng.",
        },
        improvement: {
          en: "After each example, add one sentence beginning \"This matters because…\". It forces the link between evidence and claim that examiners look for.",
          vi: "Sau mỗi ví dụ, hãy thêm một câu bắt đầu bằng “Điều này quan trọng vì…”. Cách này buộc bạn nối bằng chứng với luận điểm — đúng thứ giám khảo tìm kiếm.",
        },
      },
    ],
    high: [
      {
        comment: {
          en: "The question is answered fully, the position is clear from the introduction and sustained to the conclusion, and each main idea is extended with a reason and a consequence rather than left as an assertion.",
          vi: "Bài trả lời trọn vẹn câu hỏi, quan điểm rõ ngay từ mở bài và được giữ đến kết luận, mỗi ý chính đều được mở rộng bằng lý do và hệ quả thay vì dừng ở mức khẳng định.",
        },
        improvement: {
          en: "Consider conceding one point to the opposing view before rebutting it — a handled counter-argument reads as a stronger position than an unopposed one.",
          vi: "Hãy cân nhắc thừa nhận một ý của quan điểm đối lập trước khi phản bác — một lập luận có xử lý phản đề luôn mạnh hơn một lập luận không gặp đối thủ nào.",
        },
      },
      {
        comment: {
          en: "A well-focused response with a consistent position and relevant, extended support. The introduction sets up exactly the argument the body delivers.",
          vi: "Một bài viết tập trung tốt, quan điểm nhất quán và dẫn chứng liên quan, có triển khai. Phần mở bài dựng đúng lập luận mà thân bài sau đó thực hiện.",
        },
        improvement: {
          en: "Your conclusion currently summarises. Make it answer the question one final time in different words, and it will read as a close rather than a recap.",
          vi: "Phần kết hiện mới dừng ở tóm tắt. Hãy để nó trả lời câu hỏi thêm một lần nữa bằng cách diễn đạt khác — bài sẽ kết lại chứ không phải nhắc lại.",
        },
      },
    ],
  },

  COHERENCE_COHESION: {
    low: [
      {
        comment: {
          en: "Paragraphing does not follow the argument: two distinct ideas share a paragraph, and linking words are used at the start of sentences where the logic does not actually turn.",
          vi: "Cách chia đoạn chưa đi theo lập luận: hai ý khác nhau bị nhét chung một đoạn, và từ nối được đặt ở đầu câu trong khi mạch logic không hề chuyển hướng.",
        },
        improvement: {
          en: "One idea per paragraph, and open each with a sentence that states that idea. Fix the paragraphing before touching the linking words — most of them will stop being needed.",
          vi: "Mỗi đoạn một ý, và mở đầu đoạn bằng câu nêu chính ý đó. Hãy sửa cách chia đoạn trước khi động tới từ nối — phần lớn từ nối sẽ tự trở nên không cần thiết.",
        },
      },
      {
        comment: {
          en: "The reader has to work to follow the sequence. Referencing is unclear in several places — \"this\" and \"it\" point back to more than one possible thing.",
          vi: "Người đọc phải cố gắng mới theo được mạch bài. Cách quy chiếu ở nhiều chỗ chưa rõ — “this” và “it” có thể trỏ về nhiều thứ khác nhau.",
        },
        improvement: {
          en: "Read your essay and circle every \"this\" and \"it\". Where the noun it replaces is more than a line away, write the noun back in.",
          vi: "Hãy đọc lại bài và khoanh tròn mọi “this” và “it”. Chỗ nào danh từ được thay thế nằm cách xa hơn một dòng, hãy viết lại danh từ đó ra.",
        },
      },
    ],
    mid: [
      {
        comment: {
          en: "Information is arranged logically and paragraphs are used, but cohesion leans on a small set of connectors — several sentences open with the same one, which makes the joins visible.",
          vi: "Thông tin được sắp xếp hợp lý và bài có chia đoạn, nhưng liên kết còn dựa vào một nhóm từ nối hẹp — nhiều câu mở đầu bằng cùng một từ, khiến các mối nối lộ ra.",
        },
        improvement: {
          en: "Replace two of your \"Moreover\"/\"Furthermore\" openings with a reference back to the previous sentence's idea. Cohesion carried by meaning reads better than cohesion carried by signposts.",
          vi: "Hãy thay hai chỗ mở đầu bằng “Moreover”/“Furthermore” bằng một câu nhắc lại ý của câu trước. Liên kết bằng ý nghĩa đọc mượt hơn liên kết bằng biển chỉ đường.",
        },
      },
      {
        comment: {
          en: "Paragraphs have clear topics and the essay progresses sensibly. A few transitions between paragraphs are abrupt — the new idea arrives before the reader has been shown why it follows.",
          vi: "Các đoạn có chủ đề rõ và bài tiến triển hợp lý. Một vài chỗ chuyển đoạn còn đột ngột — ý mới xuất hiện trước khi người đọc được cho biết vì sao nó tiếp nối.",
        },
        improvement: {
          en: "End one paragraph by naming what is missing from it. The next paragraph then arrives as the answer rather than as a new subject.",
          vi: "Hãy kết một đoạn bằng cách chỉ ra điều đoạn đó còn thiếu. Đoạn tiếp theo sẽ xuất hiện như câu trả lời chứ không phải như một chủ đề mới.",
        },
      },
    ],
    high: [
      {
        comment: {
          en: "The essay sequences its argument clearly and paragraphs are coherent units. Cohesive devices are varied and mostly unobtrusive — the reader follows the logic without noticing the machinery.",
          vi: "Bài sắp xếp lập luận rõ ràng, các đoạn là những đơn vị mạch lạc. Phương tiện liên kết đa dạng và phần lớn không lộ liễu — người đọc theo được mạch logic mà không để ý tới bộ khung.",
        },
        improvement: {
          en: "One or two paragraphs still open with a connector where the topic sentence alone would carry it. Cutting them tightens the prose without losing the link.",
          vi: "Vẫn còn một hai đoạn mở đầu bằng từ nối trong khi chỉ riêng câu chủ đề đã đủ sức gánh. Bỏ chúng đi sẽ làm câu văn chặt hơn mà không mất liên kết.",
        },
      },
      {
        comment: {
          en: "Referencing and substitution are handled well, and each paragraph has a single, identifiable central topic. The progression from position to support to conclusion is easy to follow.",
          vi: "Cách quy chiếu và thay thế được xử lý tốt, mỗi đoạn có một chủ đề trung tâm nhận diện được. Mạch đi từ quan điểm tới dẫn chứng rồi tới kết luận rất dễ theo.",
        },
        improvement: {
          en: "Try varying paragraph length deliberately — a short paragraph after two long ones lands a point harder than another connector would.",
          vi: "Hãy thử chủ động thay đổi độ dài đoạn — một đoạn ngắn đặt sau hai đoạn dài sẽ nhấn mạnh ý tốt hơn bất kỳ từ nối nào.",
        },
      },
    ],
  },

  LEXICAL_RESOURCE: {
    low: [
      {
        comment: {
          en: "Vocabulary is adequate for the topic but repetitive: the same three or four content words carry most of the essay, and some collocations are not natural in English.",
          vi: "Vốn từ đủ dùng cho chủ đề nhưng lặp lại: chỉ ba bốn từ nội dung gánh gần hết bài, và một số cách kết hợp từ chưa tự nhiên trong tiếng Anh.",
        },
        improvement: {
          en: "Pick the noun you repeat most and find two ways to refer to it that are not synonyms — a category word and a pronoun phrase will do more than a thesaurus entry.",
          vi: "Hãy chọn danh từ bạn lặp nhiều nhất và tìm hai cách gọi khác không phải từ đồng nghĩa — một từ chỉ loại và một cụm đại từ sẽ hiệu quả hơn tra từ điển đồng nghĩa.",
        },
      },
      {
        comment: {
          en: "Word choice is generally understandable, but several less common words are used slightly off-meaning, which distracts from otherwise sound points.",
          vi: "Cách dùng từ nhìn chung vẫn hiểu được, nhưng một vài từ ít gặp bị dùng hơi lệch nghĩa, làm phân tán sự chú ý khỏi những ý vốn đã ổn.",
        },
        improvement: {
          en: "Prefer the ordinary word you control to the impressive word you do not. Accuracy scores higher than reach at this band.",
          vi: "Hãy ưu tiên từ bình thường mà bạn nắm chắc hơn là từ ấn tượng mà bạn chưa kiểm soát được. Ở band này, dùng đúng ăn điểm hơn dùng cao.",
        },
      },
    ],
    mid: [
      {
        comment: {
          en: "There is enough range to discuss the topic with some flexibility, and paraphrasing of the prompt is mostly successful. A few word choices are approximate, and one or two collocations are unidiomatic.",
          vi: "Vốn từ đủ để bàn về chủ đề với độ linh hoạt nhất định, và phần diễn đạt lại đề bài phần lớn thành công. Một vài lựa chọn từ còn xấp xỉ, và một hai cách kết hợp từ chưa đúng tự nhiên.",
        },
        improvement: {
          en: "Learn collocations rather than single words: \"pose a risk\", \"a marked increase\", \"place a burden on\". Range shows in the phrase, not the word.",
          vi: "Hãy học theo cụm thay vì từ đơn: “pose a risk”, “a marked increase”, “place a burden on”. Độ rộng vốn từ thể hiện ở cụm chứ không ở từ lẻ.",
        },
      },
      {
        comment: {
          en: "Vocabulary is appropriate to the register and mostly precise. Repetition of a few key terms is the main thing holding this criterion back.",
          vi: "Vốn từ phù hợp với văn phong và phần lớn chính xác. Việc lặp lại một vài thuật ngữ chính là điều đang kìm tiêu chí này lại.",
        },
        improvement: {
          en: "Rewrite your topic sentences so that none of them reuses a content word from the prompt. It is the fastest way to show range where it is noticed.",
          vi: "Hãy viết lại các câu chủ đề sao cho không câu nào dùng lại từ nội dung của đề bài. Đây là cách nhanh nhất để thể hiện vốn từ ở đúng chỗ được chú ý.",
        },
      },
    ],
    high: [
      {
        comment: {
          en: "A wide and flexible range, used precisely. Less common items appear naturally rather than being inserted for effect, and the paraphrasing of the prompt is genuine rather than word-swapping.",
          vi: "Vốn từ rộng và linh hoạt, dùng chính xác. Những từ ít gặp xuất hiện tự nhiên chứ không bị nhét vào để gây ấn tượng, và phần diễn đạt lại đề là diễn đạt thật chứ không phải thay từ.",
        },
        improvement: {
          en: "Occasional slips in collocation are the only thing between this and the top band. Read for phrase-level accuracy on your final pass, not word-level.",
          vi: "Vài chỗ kết hợp từ chưa chuẩn là thứ duy nhất ngăn cách bài này với band cao nhất. Ở lượt đọc soát cuối, hãy soát theo cụm chứ đừng soát theo từ.",
        },
      },
      {
        comment: {
          en: "Strong control of topic vocabulary with effective, unforced paraphrase. Register stays consistently academic without becoming stiff.",
          vi: "Bạn kiểm soát tốt vốn từ theo chủ đề, diễn đạt lại hiệu quả và không gượng. Văn phong giữ được tính học thuật một cách nhất quán mà không bị cứng.",
        },
        improvement: {
          en: "Push one level further by using a precise verb where you currently use a verb plus adverb — \"plummeted\" rather than \"fell sharply\".",
          vi: "Hãy tiến thêm một bậc bằng cách dùng động từ chính xác thay cho động từ kèm trạng từ — “plummeted” thay vì “fell sharply”.",
        },
      },
    ],
  },

  GRAMMATICAL_RANGE: {
    low: [
      {
        comment: {
          en: "Sentences are mostly simple or joined with \"and\"/\"but\", and errors in article and verb form occur often enough to slow the reader down in places.",
          vi: "Câu chủ yếu là câu đơn hoặc nối bằng “and”/“but”, và lỗi mạo từ cùng dạng động từ xuất hiện đủ nhiều để làm người đọc chậm lại ở một số chỗ.",
        },
        improvement: {
          en: "Take three consecutive short sentences and join each pair with a relative clause. One structure, practised until it is automatic, moves this band more than variety does.",
          vi: "Hãy lấy ba câu ngắn liền nhau và nối từng cặp bằng mệnh đề quan hệ. Một cấu trúc được luyện tới mức thành phản xạ sẽ nâng band này hơn là sự đa dạng.",
        },
      },
      {
        comment: {
          en: "The grammar carries the meaning, but subject–verb agreement and tense consistency break down in longer sentences.",
          vi: "Ngữ pháp vẫn tải được nội dung, nhưng sự hoà hợp chủ ngữ – động từ và tính nhất quán về thì bị vỡ ở những câu dài.",
        },
        improvement: {
          en: "When a sentence passes about 25 words, split it. Accuracy in two clear sentences scores better than ambition in one broken one.",
          vi: "Khi một câu vượt khoảng 25 từ, hãy tách ra. Hai câu rõ ràng và đúng ăn điểm hơn một câu tham vọng mà sai.",
        },
      },
    ],
    mid: [
      {
        comment: {
          en: "A mix of simple and complex forms with generally good control. Errors appear mainly in the more ambitious sentences — subordinate clauses, and articles before abstract nouns.",
          vi: "Bài có pha trộn câu đơn và câu phức, kiểm soát nhìn chung tốt. Lỗi chủ yếu nằm ở những câu tham vọng hơn — mệnh đề phụ, và mạo từ trước danh từ trừu tượng.",
        },
        improvement: {
          en: "Proofread only for articles on your last pass. Reading once for a single error type catches far more than reading once for everything.",
          vi: "Ở lượt soát cuối, chỉ soát riêng mạo từ. Đọc một lượt để tìm một loại lỗi sẽ bắt được nhiều hơn hẳn đọc một lượt để tìm mọi thứ.",
        },
      },
      {
        comment: {
          en: "Complex structures are attempted and often successful. Punctuation of subordinate clauses is the most frequent slip, and a few sentences run on where a full stop was needed.",
          vi: "Bạn có thử dùng cấu trúc phức và thường thành công. Lỗi hay gặp nhất là dấu câu ở mệnh đề phụ, và một vài câu bị kéo dài trong khi lẽ ra phải chấm.",
        },
        improvement: {
          en: "Practise the comma rule for fronted subordinate clauses: \"Although costs have fallen, demand has not.\" It is one rule and it appears in every essay you will write.",
          vi: "Hãy luyện quy tắc dấu phẩy cho mệnh đề phụ đứng trước: “Although costs have fallen, demand has not.” Chỉ một quy tắc, nhưng nó xuất hiện trong mọi bài bạn viết.",
        },
      },
    ],
    high: [
      {
        comment: {
          en: "A wide range of structures used with sustained accuracy: conditionals, relative clauses and passive forms all appear where they serve the meaning rather than as display.",
          vi: "Bài dùng nhiều cấu trúc khác nhau với độ chính xác duy trì ổn định: câu điều kiện, mệnh đề quan hệ và thể bị động đều xuất hiện ở chỗ chúng phục vụ nội dung, không phải để phô diễn.",
        },
        improvement: {
          en: "The remaining errors are minor and confined to punctuation. A single slow read aloud before submitting would remove most of them.",
          vi: "Những lỗi còn lại đều nhỏ và chỉ nằm ở dấu câu. Đọc to thật chậm một lượt trước khi nộp là đủ để loại bỏ phần lớn.",
        },
      },
      {
        comment: {
          en: "Sentence forms are varied and controlled, and length is used deliberately — short sentences land points, longer ones carry qualification.",
          vi: "Các dạng câu đa dạng và được kiểm soát tốt, độ dài câu được dùng có chủ đích — câu ngắn để nhấn ý, câu dài để mang sắc thái bổ sung.",
        },
        improvement: {
          en: "Try one cleft sentence per essay — \"What the data shows is…\" — where you want a point to carry weight.",
          vi: "Hãy thử mỗi bài một câu chẻ — “What the data shows is…” — ở chỗ bạn muốn một ý có sức nặng.",
        },
      },
    ],
  },
};
