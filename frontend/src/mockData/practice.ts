/**
 * Practice modules: six per task, three exercises each.
 *
 * Split of language, applied consistently: the *instruction* around an exercise is
 * interface text and exists in both locales; the *material* — source sentences, exam
 * questions, model answers — is English in every locale, because it is the thing being
 * practised.
 *
 * `trains` is the field that makes the result → practice handoff work: when a learner's
 * weakest criterion is Grammatical Range, the grader's "Practice weak area" action looks
 * for a module for the same task that trains it. Get this wrong and the handoff sends
 * someone to the wrong drill, which is worse than not offering it.
 */

import type { CriterionCode, Difficulty, TaskType } from "@/lib/api/types";

import type { LocalizedText } from "./localized";

export interface MockPracticeExercise {
  id: string;
  /** What to do. Interface text. */
  prompt: LocalizedText;
  /** What to do it to. Exam material — English in every locale. */
  source?: string;
  hints: LocalizedText[];
  /** English: this is the standard the learner is comparing their own English against. */
  model_answer: string;
  feedback: LocalizedText;
}

export interface MockPracticeModule {
  id: string;
  task_type: TaskType;
  title: LocalizedText;
  description: LocalizedText;
  intro: LocalizedText;
  difficulty: Difficulty;
  trains: CriterionCode[];
  exercises: MockPracticeExercise[];
}

export const PRACTICE_MODULES: MockPracticeModule[] = [
  // ── Task 1 ────────────────────────────────────────────────────────────────
  {
    id: "t1_paraphrase_introduction",
    task_type: "TASK_1",
    title: { en: "Paraphrase Introduction", vi: "Diễn đạt lại phần mở bài" },
    description: {
      en: "Rewrite the question as your opening sentence without copying it.",
      vi: "Viết lại đề bài thành câu mở đầu của bạn mà không chép lại nguyên văn.",
    },
    intro: {
      en: "Every Task 1 report opens by saying what the chart shows. Copying the question earns nothing — those words are excluded from your word count and from your Lexical Resource score. Change the noun, change the verb, change the structure.",
      vi: "Mọi bài Task 1 đều mở đầu bằng việc nói biểu đồ thể hiện điều gì. Chép lại đề bài không được tính điểm — những từ đó bị loại khỏi số từ và khỏi điểm Lexical Resource. Hãy đổi danh từ, đổi động từ, đổi cấu trúc.",
    },
    difficulty: "foundation",
    trains: ["LEXICAL_RESOURCE", "TASK_ACHIEVEMENT"],
    exercises: [
      {
        id: "t1_pi_1",
        prompt: {
          en: "Rewrite this question as an opening sentence. Change at least three words and the sentence structure.",
          vi: "Viết lại câu hỏi này thành câu mở đầu. Hãy đổi ít nhất ba từ và đổi cả cấu trúc câu.",
        },
        source:
          "The chart below shows the percentage of electricity generated from coal, natural gas and renewable sources in four countries in 2010 and 2020.",
        hints: [
          { en: "\"shows\" → illustrates, compares, gives information about", vi: "“shows” → illustrates, compares, gives information about" },
          { en: "\"percentage\" → proportion, share", vi: "“percentage” → proportion, share" },
        ],
        model_answer:
          "The bar chart compares the proportion of electricity produced from three sources — coal, natural gas and renewables — across four countries in 2010 and 2020.",
        feedback: {
          en: "A strong opening names the chart type, the measure and the time frame, and does it in one sentence.",
          vi: "Một câu mở tốt gọi tên loại biểu đồ, đơn vị đo và mốc thời gian — tất cả trong một câu.",
        },
      },
      {
        id: "t1_pi_2",
        prompt: {
          en: "Rewrite this question as an opening sentence.",
          vi: "Viết lại câu hỏi này thành câu mở đầu.",
        },
        source:
          "The graph below shows how people in a European city travelled to work between 2000 and 2020.",
        hints: [
          { en: "\"how people travelled to work\" → commuting patterns, modes of transport", vi: "“how people travelled to work” → commuting patterns, modes of transport" },
          { en: "Name the chart type: line graph.", vi: "Hãy gọi tên loại biểu đồ: line graph." },
        ],
        model_answer:
          "The line graph illustrates the changing commuting habits of residents in one European city over a twenty-year period from 2000 to 2020.",
        feedback: {
          en: "\"Over a twenty-year period\" is stronger than repeating both dates — it shows control of the time expression.",
          vi: "“Over a twenty-year period” mạnh hơn việc lặp lại cả hai mốc năm — nó cho thấy bạn kiểm soát được cách diễn đạt thời gian.",
        },
      },
      {
        id: "t1_pi_3",
        prompt: {
          en: "Rewrite this question. Avoid the word \"pie chart\" appearing twice.",
          vi: "Viết lại câu hỏi này. Tránh để cụm “pie chart” xuất hiện hai lần.",
        },
        source:
          "The pie charts below show household water consumption in two countries.",
        hints: [
          { en: "\"household water consumption\" → domestic water use", vi: "“household water consumption” → domestic water use" },
          { en: "Say what the two charts do together: break down, divide.", vi: "Hãy nói hai biểu đồ cùng làm gì: break down, divide." },
        ],
        model_answer:
          "The two pie charts break down domestic water use by purpose in two different countries.",
        feedback: {
          en: "Short is fine here. The introduction earns marks for accuracy and paraphrase, not for length.",
          vi: "Ngắn cũng không sao. Phần mở bài ăn điểm nhờ chính xác và diễn đạt lại, không phải nhờ độ dài.",
        },
      },
    ],
  },
  {
    id: "t1_write_overview",
    task_type: "TASK_1",
    title: { en: "Write Overview", vi: "Viết phần Overview" },
    description: {
      en: "State the big picture in one or two sentences — with no figures at all.",
      vi: "Nêu bức tranh tổng thể trong một hai câu — hoàn toàn không dùng số liệu.",
    },
    intro: {
      en: "The overview is the single highest-value sentence in a Task 1 report: without one, Task Achievement is capped. It says what someone glancing at the chart would notice, and it contains no numbers.",
      vi: "Overview là câu có giá trị cao nhất trong bài Task 1: thiếu nó, điểm Task Achievement sẽ bị giới hạn. Câu này nói điều mà một người liếc qua biểu đồ sẽ nhận ra ngay, và không chứa số liệu nào.",
    },
    difficulty: "intermediate",
    trains: ["TASK_ACHIEVEMENT"],
    exercises: [
      {
        id: "t1_wo_1",
        prompt: {
          en: "Write a one-sentence overview of this data. Use no figures.",
          vi: "Viết một câu overview cho dữ liệu này. Không dùng số liệu.",
        },
        source:
          "Coal — A: 62% → 31%; B: 48% → 44%; C: 20% → 9%; D: 71% → 66%. Renewables — A: 13% → 35%; B: 22% → 28%; C: 45% → 61%; D: 8% → 14%.",
        hints: [
          { en: "What happened to every country, without exception?", vi: "Điều gì đã xảy ra ở tất cả các nước, không ngoại lệ?" },
          { en: "Name the direction of both series in one sentence.", vi: "Hãy nêu hướng đi của cả hai nhóm dữ liệu trong một câu." },
        ],
        model_answer:
          "Overall, coal declined in all four countries over the decade while renewable generation rose in every case, though the scale of the shift varied considerably between countries.",
        feedback: {
          en: "Note what the model does: it states the trend, then qualifies it. \"Though the scale varied\" is what stops the overview being simplistic.",
          vi: "Hãy để ý bài mẫu làm gì: nêu xu hướng rồi bổ sung sắc thái. Cụm “though the scale varied” chính là thứ giữ cho overview không bị đơn giản hoá.",
        },
      },
      {
        id: "t1_wo_2",
        prompt: {
          en: "Write an overview of this commuting data. No figures.",
          vi: "Viết overview cho dữ liệu đi lại này. Không dùng số liệu.",
        },
        source:
          "Car — 54% → 26% across 2000–2020. Public transport — 28% → 38%. Cycling — 9% → 28%. Walking — 9% → 8%.",
        hints: [
          { en: "Three series move; one does not. Say so.", vi: "Ba nhóm có biến động, một nhóm gần như đứng yên. Hãy nói ra điều đó." },
          { en: "Which grew fastest, in proportion to where it started?", vi: "Nhóm nào tăng nhanh nhất so với điểm xuất phát của nó?" },
        ],
        model_answer:
          "Overall, car use fell steadily throughout the period while both public transport and cycling grew, with cycling expanding fastest in relative terms; walking alone remained essentially unchanged.",
        feedback: {
          en: "Naming the series that did not move is what separates an overview from a summary of the interesting parts.",
          vi: "Việc gọi tên nhóm dữ liệu không thay đổi chính là điểm khác biệt giữa một overview thật và một bản tóm tắt những phần thú vị.",
        },
      },
      {
        id: "t1_wo_3",
        prompt: {
          en: "Write an overview comparing the two countries. No figures.",
          vi: "Viết overview so sánh hai quốc gia. Không dùng số liệu.",
        },
        source:
          "Country X — bathing 34%, toilet 26%, laundry 17%, kitchen 12%, garden 11%. Country Y — garden 38%, bathing 22%, toilet 18%, laundry 13%, kitchen 9%.",
        hints: [
          { en: "What is the single biggest difference between the two?", vi: "Khác biệt lớn nhất giữa hai nước là gì?" },
          { en: "What do they have in common?", vi: "Hai nước có điểm gì chung?" },
        ],
        model_answer:
          "Overall, indoor personal use dominated consumption in Country X, whereas Country Y devoted its largest share to outdoor watering; the remaining categories followed a broadly similar order in both.",
        feedback: {
          en: "\"Whereas\" carries the contrast without any numbers. That is exactly the job of the overview.",
          vi: "“Whereas” gánh được sự tương phản mà không cần số liệu nào. Đó đúng là nhiệm vụ của phần overview.",
        },
      },
    ],
  },
  {
    id: "t1_write_body",
    task_type: "TASK_1",
    title: { en: "Write Body", vi: "Viết phần thân bài" },
    description: {
      en: "Group related data and support each point with figures.",
      vi: "Nhóm dữ liệu liên quan và dùng số liệu để đỡ cho từng ý.",
    },
    intro: {
      en: "The body is where figures belong. Group the data — by direction, by size, by country — and give each group a paragraph. Never walk through the chart left to right.",
      vi: "Thân bài là chỗ dành cho số liệu. Hãy nhóm dữ liệu — theo hướng biến động, theo độ lớn, theo quốc gia — và dành cho mỗi nhóm một đoạn. Đừng bao giờ đọc biểu đồ từ trái sang phải.",
    },
    difficulty: "intermediate",
    trains: ["TASK_ACHIEVEMENT", "COHERENCE_COHESION"],
    exercises: [
      {
        id: "t1_wb_1",
        prompt: {
          en: "Write one body sentence that compares two countries and includes both figures.",
          vi: "Viết một câu thân bài so sánh hai quốc gia và có đủ số liệu của cả hai.",
        },
        source: "Coal in 2020 — Country A: 31%, Country D: 66%.",
        hints: [
          { en: "Use one sentence, not two joined by \"and\".", vi: "Dùng một câu, không phải hai câu nối bằng “and”." },
          { en: "\"more than double\" is a comparison; \"66% and 31%\" is a list.", vi: "“more than double” là so sánh; “66% và 31%” chỉ là liệt kê." },
        ],
        model_answer:
          "By 2020, Country D still relied on coal for two thirds of its electricity, at 66 per cent — more than double the 31 per cent recorded in Country A.",
        feedback: {
          en: "The figures serve the comparison rather than replacing it. That is what \"support with data\" means.",
          vi: "Số liệu ở đây phục vụ cho phép so sánh chứ không thay thế nó. “Dùng số liệu để đỡ ý” nghĩa là như vậy.",
        },
      },
      {
        id: "t1_wb_2",
        prompt: {
          en: "Group these three movements into one sentence.",
          vi: "Gộp ba biến động này vào một câu.",
        },
        source:
          "Renewables rose: Country A 13% → 35%, Country C 45% → 61%, Country D 8% → 14%.",
        hints: [
          { en: "What do all three have in common? Lead with that.", vi: "Cả ba có điểm chung gì? Hãy mở đầu bằng điểm đó." },
          { en: "Then separate the largest change from the rest.", vi: "Sau đó tách biến động lớn nhất ra khỏi phần còn lại." },
        ],
        model_answer:
          "Renewable generation increased everywhere, though unevenly: Country A saw the steepest climb, from 13 to 35 per cent, while Country C, already the leader at 45 per cent, reached 61 per cent and Country D managed only a modest rise to 14 per cent.",
        feedback: {
          en: "One claim, then the evidence ranked by size. A reader can follow that; a list in chart order they cannot.",
          vi: "Một luận điểm, rồi dẫn chứng xếp theo độ lớn. Người đọc theo được cách này; còn liệt kê theo thứ tự trên biểu đồ thì không.",
        },
      },
      {
        id: "t1_wb_3",
        prompt: {
          en: "Write a body sentence about the category that barely changed.",
          vi: "Viết một câu thân bài về nhóm gần như không thay đổi.",
        },
        source: "Walking — 9% (2000), 9% (2005), 10% (2010), 9% (2015), 8% (2020).",
        hints: [
          { en: "Stability is a finding, not a gap. Say it deliberately.", vi: "Sự ổn định cũng là một phát hiện, không phải chỗ trống. Hãy nói nó một cách chủ ý." },
          { en: "\"fluctuated marginally\", \"remained flat at around\"", vi: "“fluctuated marginally”, “remained flat at around”" },
        ],
        model_answer:
          "Walking, by contrast, remained flat throughout, fluctuating only marginally around the 9 per cent mark before slipping to 8 per cent in 2020.",
        feedback: {
          en: "Reporting the unchanged series is part of covering the data — leaving it out costs Task Achievement.",
          vi: "Tường thuật cả nhóm không đổi cũng là một phần của việc bao quát dữ liệu — bỏ qua nó sẽ mất điểm Task Achievement.",
        },
      },
    ],
  },
  {
    id: "t1_compound_sentences",
    task_type: "TASK_1",
    title: { en: "Compound Sentences", vi: "Câu ghép" },
    description: {
      en: "Join two equal ideas so the comparison lands in one sentence.",
      vi: "Nối hai ý ngang hàng để phép so sánh gọn trong một câu.",
    },
    intro: {
      en: "Task 1 is built on comparison, and a comparison split across two sentences is weaker than one held in a single sentence. Compound sentences — joined by while, whereas, and, but — are the workhorse structure of this task.",
      vi: "Task 1 dựa trên so sánh, mà một phép so sánh bị tách làm hai câu sẽ yếu hơn khi được giữ trong một câu. Câu ghép — nối bằng while, whereas, and, but — là cấu trúc chủ lực của dạng bài này.",
    },
    difficulty: "foundation",
    trains: ["GRAMMATICAL_RANGE"],
    exercises: [
      {
        id: "t1_cs_1",
        prompt: {
          en: "Join these two sentences into one compound sentence.",
          vi: "Nối hai câu này thành một câu ghép.",
        },
        source: "Coal use fell in Country A. Renewable use rose in Country A.",
        hints: [
          { en: "\"while\" and \"whereas\" both mark contrast.", vi: "“while” và “whereas” đều đánh dấu sự tương phản." },
          { en: "Do not repeat \"in Country A\".", vi: "Đừng lặp lại “in Country A”." },
        ],
        model_answer:
          "In Country A, coal use fell sharply while renewable generation rose over the same period.",
        feedback: {
          en: "Moving \"In Country A\" to the front lets one mention serve both halves.",
          vi: "Đưa “In Country A” lên đầu câu giúp một lần nhắc phục vụ được cả hai vế.",
        },
      },
      {
        id: "t1_cs_2",
        prompt: {
          en: "Join these with a contrast.",
          vi: "Nối hai câu này bằng quan hệ tương phản.",
        },
        source: "Country C had the lowest coal use. Country D had the highest.",
        hints: [
          { en: "\"whereas\" is stronger than \"but\" in academic writing.", vi: "“whereas” mạnh hơn “but” trong văn viết học thuật." },
          { en: "Add the figures if you can do it without clutter.", vi: "Thêm số liệu nếu bạn làm được mà câu không bị rối." },
        ],
        model_answer:
          "Country C recorded the lowest reliance on coal at just 9 per cent, whereas Country D remained the most dependent at 66 per cent.",
        feedback: {
          en: "Two figures, one sentence, one comparison. That is the shape to aim for.",
          vi: "Hai số liệu, một câu, một phép so sánh. Đó là hình dạng cần nhắm tới.",
        },
      },
      {
        id: "t1_cs_3",
        prompt: {
          en: "Join three short sentences into one, without using \"and\" twice.",
          vi: "Gộp ba câu ngắn thành một, không dùng “and” hai lần.",
        },
        source:
          "Public transport rose. Cycling rose. Cycling rose faster than public transport.",
        hints: [
          { en: "One \"and\" plus a comparative clause.", vi: "Một chữ “and” cộng thêm một mệnh đề so sánh." },
          { en: "\"with cycling growing faster of the two\"", vi: "“with cycling growing faster of the two”" },
        ],
        model_answer:
          "Both public transport and cycling gained ground, with cycling growing considerably faster of the two.",
        feedback: {
          en: "\"With\" + participle is the cleanest way to attach a third idea without a third clause.",
          vi: "Cấu trúc “with” + phân từ là cách gọn nhất để gắn ý thứ ba mà không cần thêm mệnh đề thứ ba.",
        },
      },
    ],
  },
  {
    id: "t1_complex_sentences",
    task_type: "TASK_1",
    title: { en: "Complex Sentences", vi: "Câu phức" },
    description: {
      en: "Use subordinate and relative clauses to add detail without adding sentences.",
      vi: "Dùng mệnh đề phụ và mệnh đề quan hệ để thêm chi tiết mà không phải thêm câu.",
    },
    intro: {
      en: "Grammatical Range is the criterion most learners leave points on, and complex sentences are the fastest way to move it. A relative clause lets you attach a figure to a noun instead of spending a whole sentence on it.",
      vi: "Grammatical Range là tiêu chí nhiều học viên bỏ điểm nhất, và câu phức là cách nhanh nhất để cải thiện nó. Mệnh đề quan hệ cho phép bạn gắn số liệu vào danh từ thay vì tốn cả một câu.",
    },
    difficulty: "advanced",
    trains: ["GRAMMATICAL_RANGE"],
    exercises: [
      {
        id: "t1_cx_1",
        prompt: {
          en: "Combine these using a relative clause.",
          vi: "Kết hợp hai câu này bằng mệnh đề quan hệ.",
        },
        source:
          "Country C generated 61% of its electricity from renewables. Country C was the leader in 2020.",
        hints: [
          { en: "\"which\" attaches the second fact to the first.", vi: "“which” gắn ý thứ hai vào ý thứ nhất." },
          { en: "Commas around a non-defining clause.", vi: "Dùng dấu phẩy bao quanh mệnh đề quan hệ không xác định." },
        ],
        model_answer:
          "Country C, which led the group in 2020, generated 61 per cent of its electricity from renewable sources.",
        feedback: {
          en: "The clause sits inside the sentence rather than after it — that is what makes it read as one idea.",
          vi: "Mệnh đề nằm bên trong câu chứ không nối đuôi phía sau — đó là điều khiến nó đọc như một ý duy nhất.",
        },
      },
      {
        id: "t1_cx_2",
        prompt: {
          en: "Rewrite with a fronted subordinate clause, punctuated correctly.",
          vi: "Viết lại với mệnh đề phụ đứng trước, đặt dấu câu cho đúng.",
        },
        source:
          "Car use fell every year. Public transport could not absorb all of the difference.",
        hints: [
          { en: "\"Although…, …\" — note the comma.", vi: "“Although…, …” — chú ý dấu phẩy." },
          { en: "The main clause carries the more important fact.", vi: "Mệnh đề chính phải mang thông tin quan trọng hơn." },
        ],
        model_answer:
          "Although car use declined in every five-year interval, public transport absorbed only part of the shift, with cycling accounting for the remainder.",
        feedback: {
          en: "The comma after a fronted clause is the single most common punctuation slip at band 6.",
          vi: "Dấu phẩy sau mệnh đề phụ đứng đầu câu là lỗi dấu câu phổ biến nhất ở band 6.",
        },
      },
      {
        id: "t1_cx_3",
        prompt: {
          en: "Turn this into one complex sentence with a participle clause.",
          vi: "Chuyển thành một câu phức có mệnh đề phân từ.",
        },
        source:
          "Garden watering took 38% in Country Y. This made it the largest single category there.",
        hints: [
          { en: "\"…, making it the largest…\"", vi: "“…, making it the largest…”" },
          { en: "Drop \"This\" entirely.", vi: "Bỏ hẳn chữ “This”." },
        ],
        model_answer:
          "Garden watering accounted for 38 per cent of consumption in Country Y, making it the largest single category there.",
        feedback: {
          en: "A participle clause removes a weak \"This\" opening and shortens the sentence at the same time.",
          vi: "Mệnh đề phân từ vừa loại bỏ kiểu mở đầu yếu bằng “This”, vừa làm câu ngắn lại.",
        },
      },
    ],
  },
  {
    id: "t1_develop_ideas",
    task_type: "TASK_1",
    title: { en: "Develop Ideas", vi: "Phát triển ý" },
    description: {
      en: "Turn a bare figure into a reported finding.",
      vi: "Biến một con số trần thành một phát hiện được tường thuật.",
    },
    intro: {
      en: "A figure on its own is a caption. Development means saying what the figure means in relation to something else — a starting point, another country, the trend around it.",
      vi: "Một con số đứng một mình chỉ là dòng chú thích. Phát triển ý nghĩa là nói con số đó có ý nghĩa gì khi đặt cạnh thứ khác — điểm xuất phát, một quốc gia khác, hay xu hướng xung quanh nó.",
    },
    difficulty: "intermediate",
    trains: ["TASK_ACHIEVEMENT", "COHERENCE_COHESION"],
    exercises: [
      {
        id: "t1_di_1",
        prompt: {
          en: "Develop this figure into a full finding.",
          vi: "Phát triển con số này thành một phát hiện hoàn chỉnh.",
        },
        source: "Country A renewables: 35% in 2020.",
        hints: [
          { en: "Compare it with where it started.", vi: "Hãy so với điểm xuất phát của nó." },
          { en: "Say what that rate of change looks like.", vi: "Hãy nói mức thay đổi đó trông như thế nào." },
        ],
        model_answer:
          "Renewables supplied 35 per cent of Country A's electricity by 2020, nearly triple the 13 per cent recorded a decade earlier and the fastest expansion of any country shown.",
        feedback: {
          en: "One figure, two comparisons: against itself over time, and against the others. That is a developed point.",
          vi: "Một con số, hai phép so sánh: so với chính nó theo thời gian, và so với các nước còn lại. Đó là một ý đã được phát triển.",
        },
      },
      {
        id: "t1_di_2",
        prompt: {
          en: "Develop this figure.",
          vi: "Phát triển con số này.",
        },
        source: "Cycling: 28% in 2020, from 9% in 2000.",
        hints: [
          { en: "Which other series did it overtake?", vi: "Nó đã vượt qua nhóm nào?" },
          { en: "Use a multiple: \"three times\".", vi: "Dùng bội số: “three times”." },
        ],
        model_answer:
          "Cycling more than tripled over the period, climbing from 9 to 28 per cent and overtaking walking to become the third most common way of reaching work.",
        feedback: {
          en: "\"Overtaking\" places the figure in the story rather than beside it.",
          vi: "Chữ “overtaking” đặt con số vào trong câu chuyện chứ không để nó nằm bên lề.",
        },
      },
      {
        id: "t1_di_3",
        prompt: {
          en: "Develop this contrast.",
          vi: "Phát triển sự tương phản này.",
        },
        source: "Kitchen use: 12% in Country X, 9% in Country Y.",
        hints: [
          { en: "A small gap is still a finding — say it is small.", vi: "Khoảng cách nhỏ vẫn là một phát hiện — hãy nói rõ nó nhỏ." },
          { en: "Group it with the other similar categories.", vi: "Hãy gộp nó với các hạng mục tương tự khác." },
        ],
        model_answer:
          "Kitchen use was the smallest category in both countries and differed only marginally, at 12 per cent in Country X against 9 per cent in Country Y.",
        feedback: {
          en: "Naming a difference as marginal is a judgement — and judgement is what separates reporting from listing.",
          vi: "Gọi một khác biệt là “không đáng kể” chính là một nhận định — và nhận định là thứ tách bài tường thuật khỏi bản liệt kê.",
        },
      },
    ],
  },

  // ── Task 2 ────────────────────────────────────────────────────────────────
  {
    id: "t2_paraphrase_question",
    task_type: "TASK_2",
    title: { en: "Paraphrase the Question", vi: "Diễn đạt lại câu hỏi" },
    description: {
      en: "Open your essay without repeating the prompt's words.",
      vi: "Mở bài mà không lặp lại từ ngữ của đề.",
    },
    intro: {
      en: "Your first sentence is the examiner's first impression of your Lexical Resource. Copied words are excluded from assessment, so a copied introduction is a wasted sentence.",
      vi: "Câu đầu tiên là ấn tượng đầu tiên của giám khảo về vốn từ của bạn. Từ ngữ chép lại bị loại khỏi phần đánh giá, nên một mở bài chép nguyên là một câu bỏ đi.",
    },
    difficulty: "foundation",
    trains: ["LEXICAL_RESOURCE", "TASK_RESPONSE"],
    exercises: [
      {
        id: "t2_pq_1",
        prompt: {
          en: "Paraphrase this question as your opening sentence.",
          vi: "Diễn đạt lại câu hỏi này thành câu mở bài của bạn.",
        },
        source:
          "Some people believe that working from home benefits both employees and employers, while others argue that it damages collaboration and career development.",
        hints: [
          { en: "\"working from home\" → remote work, home-based employment", vi: "“working from home” → remote work, home-based employment" },
          { en: "\"some people believe / others argue\" → it is widely held / critics counter", vi: "“some people believe / others argue” → it is widely held / critics counter" },
        ],
        model_answer:
          "Remote work is often presented as a win for staff and organisations alike, though critics counter that it erodes teamwork and slows professional advancement.",
        feedback: {
          en: "The model keeps the structure of the debate while replacing nearly every content word. That is real paraphrase.",
          vi: "Bài mẫu giữ nguyên cấu trúc của cuộc tranh luận nhưng thay gần như toàn bộ từ nội dung. Đó mới là diễn đạt lại thật sự.",
        },
      },
      {
        id: "t2_pq_2",
        prompt: {
          en: "Paraphrase this question.",
          vi: "Diễn đạt lại câu hỏi này.",
        },
        source:
          "Traffic congestion is becoming worse in many major cities. What are the causes of this problem, and what measures could be taken to solve it?",
        hints: [
          { en: "\"traffic congestion\" → gridlock, road congestion", vi: "“traffic congestion” → gridlock, road congestion" },
          { en: "Signal that you will cover causes and solutions.", vi: "Hãy báo hiệu bạn sẽ nói cả nguyên nhân lẫn giải pháp." },
        ],
        model_answer:
          "Gridlock has intensified across the world's largest urban centres in recent decades, and both its origins and its possible remedies deserve examination.",
        feedback: {
          en: "The second half announces the essay's structure without saying \"in this essay I will\".",
          vi: "Nửa sau của câu báo trước cấu trúc bài mà không cần nói “trong bài này tôi sẽ”.",
        },
      },
      {
        id: "t2_pq_3",
        prompt: {
          en: "Paraphrase this question and add your position.",
          vi: "Diễn đạt lại câu hỏi này và nêu quan điểm của bạn.",
        },
        source:
          "In many countries, university education is funded by the government. Is this the best use of public money?",
        hints: [
          { en: "\"funded by the government\" → publicly financed, state-subsidised", vi: "“funded by the government” → publicly financed, state-subsidised" },
          { en: "Your position belongs in the introduction, not only the conclusion.", vi: "Quan điểm của bạn phải nằm ở mở bài, không chỉ ở kết bài." },
        ],
        model_answer:
          "Higher education is state-subsidised in much of the world. While this spending competes with other public priorities, I would argue that it remains among the most productive investments a government can make.",
        feedback: {
          en: "A clear position in the introduction is worth more to Task Response than any amount of hedging later.",
          vi: "Một quan điểm rõ ràng ngay ở mở bài có giá trị với Task Response hơn mọi kiểu nói nước đôi ở phần sau.",
        },
      },
    ],
  },
  {
    id: "t2_essay_outline",
    task_type: "TASK_2",
    title: { en: "Build an Essay Outline", vi: "Dựng dàn ý bài luận" },
    description: {
      en: "Plan four paragraphs in two minutes, before you write a word.",
      vi: "Lên dàn ý bốn đoạn trong hai phút, trước khi viết chữ nào.",
    },
    intro: {
      en: "Most essays that lose Coherence marks were never planned. Two minutes spent naming each paragraph's single idea buys back ten minutes of rewriting — and it is the difference between an argument and a pile of opinions.",
      vi: "Phần lớn bài mất điểm Coherence đều là bài không có dàn ý. Hai phút dành để gọi tên ý duy nhất của từng đoạn sẽ tiết kiệm mười phút viết lại — và đó là khác biệt giữa một lập luận và một đống ý kiến rời rạc.",
    },
    difficulty: "intermediate",
    trains: ["COHERENCE_COHESION", "TASK_RESPONSE"],
    exercises: [
      {
        id: "t2_eo_1",
        prompt: {
          en: "Write a four-line outline: introduction, body 1, body 2, conclusion. One line each.",
          vi: "Viết dàn ý bốn dòng: mở bài, thân bài 1, thân bài 2, kết bài. Mỗi phần một dòng.",
        },
        source:
          "To what extent do you agree that remote work benefits both employees and employers?",
        hints: [
          { en: "Each body line should be a claim, not a topic.", vi: "Mỗi dòng thân bài phải là một luận điểm, không phải một chủ đề." },
          { en: "\"Flexibility\" is a topic. \"Flexibility raises retention\" is a claim.", vi: "“Tính linh hoạt” là chủ đề. “Tính linh hoạt giúp giữ chân nhân sự” mới là luận điểm." },
        ],
        model_answer:
          "Intro: remote work is contested; I largely agree, with one qualification.\nBody 1: it benefits employees through recovered commuting time and autonomy, which raises retention.\nBody 2: employers gain a wider hiring pool and lower premises costs, though junior staff lose informal mentoring.\nConclusion: the benefits hold where management adapts; where it does not, the costs fall on new entrants.",
        feedback: {
          en: "Note the qualification carried from introduction to conclusion. That is what makes a position look considered rather than absolute.",
          vi: "Hãy để ý ý bảo lưu được giữ từ mở bài tới kết bài. Đó là điều khiến quan điểm trông như đã cân nhắc chứ không cực đoan.",
        },
      },
      {
        id: "t2_eo_2",
        prompt: {
          en: "Outline this problem/solution essay in four lines.",
          vi: "Lập dàn ý bốn dòng cho bài dạng nguyên nhân – giải pháp này.",
        },
        source:
          "What are the causes of worsening traffic congestion, and what measures could solve it?",
        hints: [
          { en: "One paragraph for causes, one for solutions — and make them match.", vi: "Một đoạn cho nguyên nhân, một đoạn cho giải pháp — và hai đoạn phải tương ứng nhau." },
          { en: "A solution that does not answer a stated cause is a wasted paragraph.", vi: "Giải pháp không trả lời cho nguyên nhân đã nêu là một đoạn bỏ đi." },
        ],
        model_answer:
          "Intro: congestion has worsened as cities grew faster than their road networks.\nBody 1 (causes): car ownership has outpaced road capacity, and low-density suburbs make driving the only practical option.\nBody 2 (solutions): each cause has a remedy — congestion pricing suppresses demand, and denser development around transit removes the need to drive.\nConclusion: pricing alone treats the symptom; planning treats the cause.",
        feedback: {
          en: "The solutions paragraph answers the causes paragraph point for point. That pairing is the whole structure.",
          vi: "Đoạn giải pháp trả lời đoạn nguyên nhân theo từng ý một. Chính sự tương ứng đó là toàn bộ cấu trúc bài.",
        },
      },
      {
        id: "t2_eo_3",
        prompt: {
          en: "Outline this discussion essay, covering both views and your own.",
          vi: "Lập dàn ý cho bài thảo luận này, bao gồm cả hai quan điểm và ý kiến của bạn.",
        },
        source:
          "Should children use computers as early as possible, or should this be delayed until secondary school?",
        hints: [
          { en: "Both views need equal weight before your own appears.", vi: "Hai quan điểm phải được cân bằng trước khi ý kiến của bạn xuất hiện." },
          { en: "Your view can be a condition, not a side.", vi: "Ý kiến của bạn có thể là một điều kiện, không nhất thiết phải chọn phe." },
        ],
        model_answer:
          "Intro: the debate is about timing, not value.\nBody 1 (early): digital fluency is now foundational, and early exposure normalises the tools.\nBody 2 (delay): unstructured screen time displaces the play and face-to-face talk that early development depends on.\nConclusion: my view is conditional — supervised, purposeful use early, unsupervised access delayed.",
        feedback: {
          en: "A conditional position answers the question more fully than picking a side, provided the condition is stated clearly.",
          vi: "Một quan điểm có điều kiện trả lời câu hỏi trọn vẹn hơn việc chọn phe, miễn là điều kiện đó được nêu rõ ràng.",
        },
      },
    ],
  },
  {
    id: "t2_expand_main_idea",
    task_type: "TASK_2",
    title: {
      en: "Expand a Main Idea into Supporting Ideas",
      vi: "Mở rộng ý chính thành các ý phụ trợ",
    },
    description: {
      en: "Take one claim and build the reason, example and consequence around it.",
      vi: "Lấy một luận điểm rồi dựng lý do, ví dụ và hệ quả quanh nó.",
    },
    intro: {
      en: "Band 6 essays state ideas; band 7 essays extend them. The pattern is reliable: claim → why it is true → an instance → what follows from it.",
      vi: "Bài band 6 nêu ý; bài band 7 mở rộng ý. Công thức rất ổn định: luận điểm → vì sao đúng → một ví dụ cụ thể → hệ quả rút ra.",
    },
    difficulty: "advanced",
    trains: ["TASK_RESPONSE"],
    exercises: [
      {
        id: "t2_em_1",
        prompt: {
          en: "Expand this claim into four sentences: claim, reason, example, consequence.",
          vi: "Mở rộng luận điểm này thành bốn câu: luận điểm, lý do, ví dụ, hệ quả.",
        },
        source: "Remote work saves employees time.",
        hints: [
          { en: "The reason must explain, not repeat.", vi: "Câu lý do phải giải thích, không phải nhắc lại." },
          { en: "End with what the saved time is used for.", vi: "Hãy kết bằng việc thời gian tiết kiệm được dùng vào đâu." },
        ],
        model_answer:
          "Remote work returns a substantial amount of time to employees. The reason is simple arithmetic: a typical urban commute consumes close to ten hours a week, all of it unpaid. A software engineer in Hanoi who previously spent two hours a day travelling recovers an entire working day each week. That recovered time tends to be spent on rest and family rather than additional work, which is precisely why retention improves.",
        feedback: {
          en: "The final sentence does the work: it connects the example back to something the employer cares about.",
          vi: "Câu cuối mới là câu gánh: nó nối ví dụ trở lại với thứ mà người sử dụng lao động quan tâm.",
        },
      },
      {
        id: "t2_em_2",
        prompt: {
          en: "Expand this claim the same way.",
          vi: "Mở rộng luận điểm này theo cách tương tự.",
        },
        source: "Congestion pricing reduces traffic.",
        hints: [
          { en: "Name a real mechanism, not just \"it works\".", vi: "Hãy gọi tên một cơ chế thật, đừng chỉ nói “nó hiệu quả”." },
          { en: "A consequence can be an objection you then handle.", vi: "Hệ quả có thể là một phản đối mà sau đó bạn xử lý." },
        ],
        model_answer:
          "Charging drivers to enter a city centre reliably reduces the number who do. The mechanism is price sensitivity: journeys that were merely convenient stop being worth their cost. London's scheme cut central traffic by roughly a fifth within a year of its introduction. The obvious objection is that such charges fall hardest on lower-income drivers, which is why the revenue has to be returned as improved public transport rather than absorbed into general spending.",
        feedback: {
          en: "Raising and answering the objection is what takes this from a supported claim to a developed argument.",
          vi: "Việc nêu ra rồi trả lời phản đối chính là thứ đưa đoạn này từ “luận điểm có dẫn chứng” lên thành “lập luận đã phát triển”.",
        },
      },
      {
        id: "t2_em_3",
        prompt: {
          en: "Expand this claim, and include one concession.",
          vi: "Mở rộng luận điểm này, và thêm một ý nhượng bộ.",
        },
        source: "Public funding of universities benefits the whole economy.",
        hints: [
          { en: "Concede something real, then explain why it does not overturn your claim.", vi: "Hãy nhượng bộ một điều có thật, rồi giải thích vì sao nó không lật đổ được luận điểm của bạn." },
          { en: "\"Admittedly…, but…\"", vi: "“Admittedly…, but…”" },
        ],
        model_answer:
          "Publicly funded higher education pays back into the economy that provides it. Graduates earn more and therefore contribute more in tax across a working life, while the research universities produce underpins industries that no single firm would fund alone. Admittedly, a proportion of graduates emigrate, taking that return with them. But the alternative — restricting access by price — removes far more potential contributors than emigration ever does.",
        feedback: {
          en: "The concession is answered by comparing it against the alternative, not by dismissing it. That is the stronger move.",
          vi: "Ý nhượng bộ được trả lời bằng cách so với phương án thay thế, chứ không phải bằng cách gạt đi. Đó là cách xử lý mạnh hơn.",
        },
      },
    ],
  },
  {
    id: "t2_compound_sentences",
    task_type: "TASK_2",
    title: { en: "Compound Sentences", vi: "Câu ghép" },
    description: {
      en: "Balance two ideas of equal weight in one sentence.",
      vi: "Cân bằng hai ý ngang trọng lượng trong một câu.",
    },
    intro: {
      en: "Compound sentences are how an essay holds two things in tension — a benefit and its cost, a claim and its limit — without breaking them into disconnected statements.",
      vi: "Câu ghép là cách bài luận giữ hai điều ở thế đối trọng — một lợi ích và cái giá của nó, một luận điểm và giới hạn của nó — mà không tách chúng thành những câu rời rạc.",
    },
    difficulty: "foundation",
    trains: ["GRAMMATICAL_RANGE"],
    exercises: [
      {
        id: "t2_cs_1",
        prompt: { en: "Join these two ideas into one sentence.", vi: "Nối hai ý này thành một câu." },
        source:
          "Remote work suits experienced staff. New graduates struggle without informal mentoring.",
        hints: [
          { en: "\"whereas\" or \"while\" marks the contrast cleanly.", vi: "“whereas” hoặc “while” đánh dấu tương phản một cách gọn gàng." },
          { en: "Keep both halves grammatically parallel.", vi: "Giữ hai vế song song về mặt ngữ pháp." },
        ],
        model_answer:
          "Remote work suits experienced staff well, whereas new graduates often struggle without the informal mentoring an office provides.",
        feedback: {
          en: "Parallel structure across the join is what makes a compound sentence read as balanced rather than bolted together.",
          vi: "Cấu trúc song song ở hai bên mối nối là điều khiến câu ghép đọc như đã cân bằng, chứ không phải bị ghép vá.",
        },
      },
      {
        id: "t2_cs_2",
        prompt: { en: "Join with a cause-and-effect link.", vi: "Nối bằng quan hệ nguyên nhân – kết quả." },
        source:
          "Cities expanded outwards. Driving became the only practical option for many residents.",
        hints: [
          { en: "\"so\" is weak here; try \"and as a result\" or a participle.", vi: "“so” hơi yếu ở đây; thử “and as a result” hoặc dùng phân từ." },
          { en: "One sentence, not two.", vi: "Một câu, không phải hai." },
        ],
        model_answer:
          "Cities expanded outwards faster than their transit networks could follow, and driving consequently became the only practical option for a large share of residents.",
        feedback: {
          en: "\"Consequently\" placed mid-sentence reads more naturally than opening the second clause with it.",
          vi: "Đặt “consequently” ở giữa câu đọc tự nhiên hơn là mở đầu mệnh đề thứ hai bằng từ đó.",
        },
      },
      {
        id: "t2_cs_3",
        prompt: { en: "Join three ideas without a list.", vi: "Nối ba ý mà không biến thành liệt kê." },
        source:
          "Tuition fees deter poorer applicants. Grants offset this partly. The gap has not closed.",
        hints: [
          { en: "Use \"although\" for the middle idea.", vi: "Dùng “although” cho ý ở giữa." },
          { en: "End on the fact that matters most.", vi: "Hãy kết bằng sự thật quan trọng nhất." },
        ],
        model_answer:
          "Although grants offset some of the effect, tuition fees continue to deter applicants from poorer households, and the participation gap has not closed.",
        feedback: {
          en: "Reordering so the concession comes first lets the sentence end on its strongest fact.",
          vi: "Đảo thứ tự để ý nhượng bộ lên trước giúp câu kết lại bằng sự thật mạnh nhất.",
        },
      },
    ],
  },
  {
    id: "t2_complex_sentences",
    task_type: "TASK_2",
    title: { en: "Complex Sentences", vi: "Câu phức" },
    description: {
      en: "Subordinate the smaller idea so the main point stays main.",
      vi: "Hạ ý nhỏ xuống mệnh đề phụ để ý chính vẫn là ý chính.",
    },
    intro: {
      en: "Complex sentences are not longer sentences. They are sentences where one idea is deliberately made less important than another — which is exactly what an argument needs.",
      vi: "Câu phức không phải là câu dài hơn. Đó là câu mà một ý được chủ ý đặt thấp hơn ý kia — đúng thứ mà một lập luận cần.",
    },
    difficulty: "advanced",
    trains: ["GRAMMATICAL_RANGE"],
    exercises: [
      {
        id: "t2_cx_1",
        prompt: {
          en: "Rewrite so the second idea becomes subordinate.",
          vi: "Viết lại sao cho ý thứ hai trở thành mệnh đề phụ.",
        },
        source:
          "Many governments subsidise higher education. They expect a long-term economic return.",
        hints: [
          { en: "\"because\" or \"on the expectation that\"", vi: "“because” hoặc “on the expectation that”" },
          { en: "The main clause should be the fact, not the motive.", vi: "Mệnh đề chính nên là sự việc, không phải động cơ." },
        ],
        model_answer:
          "Many governments subsidise higher education because they expect the resulting increase in tax revenue to exceed the cost over a working lifetime.",
        feedback: {
          en: "Subordinating the motive makes the fact the sentence's subject — the right emphasis for a body paragraph opening.",
          vi: "Hạ động cơ xuống mệnh đề phụ khiến sự việc trở thành trọng tâm của câu — đúng cách nhấn cho câu mở đoạn thân bài.",
        },
      },
      {
        id: "t2_cx_2",
        prompt: {
          en: "Add a relative clause carrying the evidence.",
          vi: "Thêm một mệnh đề quan hệ mang theo dẫn chứng.",
        },
        source:
          "Congestion pricing has been adopted in several cities. London introduced it in 2003.",
        hints: [
          { en: "\"…, which London introduced in 2003, …\"", vi: "“…, which London introduced in 2003, …”" },
          { en: "Keep the main clause about the policy, not the city.", vi: "Giữ mệnh đề chính nói về chính sách, không phải về thành phố." },
        ],
        model_answer:
          "Congestion pricing, which London introduced in 2003 and several other capitals have since copied, remains the most direct way of suppressing non-essential car journeys.",
        feedback: {
          en: "The relative clause carries two facts without either becoming a separate sentence.",
          vi: "Mệnh đề quan hệ gánh được hai thông tin mà không cần tách bất kỳ thông tin nào thành câu riêng.",
        },
      },
      {
        id: "t2_cx_3",
        prompt: {
          en: "Rewrite as a conditional sentence.",
          vi: "Viết lại thành câu điều kiện.",
        },
        source:
          "Companies must change how they mentor junior staff. Otherwise remote work will disadvantage new entrants.",
        hints: [
          { en: "\"Unless…, …\"", vi: "“Unless…, …”" },
          { en: "Watch the tense in each half.", vi: "Chú ý thì của từng vế." },
        ],
        model_answer:
          "Unless companies rebuild mentoring around distributed teams, remote work will continue to disadvantage precisely the employees who most need guidance.",
        feedback: {
          en: "\"Unless\" is worth practising: it is a conditional and a negative in one word, and it is under-used at band 6.",
          vi: "“Unless” rất đáng luyện: nó vừa là câu điều kiện vừa mang nghĩa phủ định trong một từ, và ở band 6 rất ít người dùng.",
        },
      },
    ],
  },
  {
    id: "t2_develop_ideas",
    task_type: "TASK_2",
    title: { en: "Develop Ideas", vi: "Phát triển ý" },
    description: {
      en: "Push past the first, obvious answer to the one that scores.",
      vi: "Đi xa hơn câu trả lời hiển nhiên đầu tiên, tới câu trả lời có điểm.",
    },
    intro: {
      en: "The first idea that comes to mind is usually the one every candidate writes. Development means going one step further: not \"pollution is bad\", but which pollution, borne by whom, and at what cost.",
      vi: "Ý đầu tiên hiện ra trong đầu thường là ý mà thí sinh nào cũng viết. Phát triển ý nghĩa là đi thêm một bước: không phải “ô nhiễm là xấu”, mà là loại ô nhiễm nào, ai gánh chịu, và cái giá là bao nhiêu.",
    },
    difficulty: "intermediate",
    trains: ["TASK_RESPONSE", "COHERENCE_COHESION"],
    exercises: [
      {
        id: "t2_di_1",
        prompt: {
          en: "This idea is too general. Rewrite it as a specific, arguable claim.",
          vi: "Ý này còn quá chung. Hãy viết lại thành một luận điểm cụ thể, có thể tranh luận.",
        },
        source: "Technology has changed education a lot.",
        hints: [
          { en: "Which technology? Which part of education?", vi: "Công nghệ nào? Phần nào của giáo dục?" },
          { en: "A claim someone could disagree with is a usable claim.", vi: "Một luận điểm mà người khác có thể phản đối mới là luận điểm dùng được." },
        ],
        model_answer:
          "Automated assessment has changed teaching more than it has changed learning: it frees teachers from marking, but it has not altered what students actually do when they study.",
        feedback: {
          en: "The specific version is also the more interesting one. Precision and interest usually arrive together.",
          vi: "Phiên bản cụ thể cũng chính là phiên bản thú vị hơn. Sự chính xác và sự hấp dẫn thường đến cùng nhau.",
        },
      },
      {
        id: "t2_di_2",
        prompt: {
          en: "Rewrite this as a specific claim.",
          vi: "Viết lại thành một luận điểm cụ thể.",
        },
        source: "Cars cause pollution in cities.",
        hints: [
          { en: "Which pollutant, and who is exposed to it?", vi: "Chất ô nhiễm nào, và ai là người hứng chịu?" },
          { en: "Specificity is what makes an example possible.", vi: "Có cụ thể thì mới đưa được ví dụ." },
        ],
        model_answer:
          "Urban car traffic concentrates fine particulate pollution along exactly the streets where the poorest residents live, so the health cost is borne by the people least likely to own a car.",
        feedback: {
          en: "Notice that the specific claim contains its own significance. A general claim has to have significance bolted on.",
          vi: "Hãy để ý luận điểm cụ thể đã tự mang trong nó ý nghĩa. Còn luận điểm chung chung thì phải gắn thêm ý nghĩa từ bên ngoài.",
        },
      },
      {
        id: "t2_di_3",
        prompt: {
          en: "Take this claim one step further than the obvious answer.",
          vi: "Đẩy luận điểm này đi xa hơn câu trả lời hiển nhiên.",
        },
        source: "Working from home reduces commuting, so it is better for the environment.",
        hints: [
          { en: "What does the obvious answer leave out?", vi: "Câu trả lời hiển nhiên đã bỏ sót điều gì?" },
          { en: "A good essay handles the complication rather than avoiding it.", vi: "Bài viết tốt xử lý phần phức tạp chứ không né tránh nó." },
        ],
        model_answer:
          "Remote work does cut commuting emissions, but the saving is smaller than it appears: heating and lighting a home office replaces a shared building's efficiency, and the time freed is often spent on additional non-work travel.",
        feedback: {
          en: "Handling the complication is what a band 7+ response does. The obvious version is not wrong — it is just unfinished.",
          vi: "Xử lý phần phức tạp chính là điều một bài band 7 trở lên làm. Phiên bản hiển nhiên không sai — nó chỉ chưa hoàn chỉnh.",
        },
      },
    ],
  },
];

export function findModule(id: string): MockPracticeModule | undefined {
  return PRACTICE_MODULES.find((module) => module.id === id);
}
