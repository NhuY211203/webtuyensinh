import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../services/api";

export default function CareerTest() {
  const [questions, setQuestions] = useState([]);
  const [groups, setGroups] = useState({});
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [pendingQuestionId, setPendingQuestionId] = useState(null);
  const questionRefs = useRef({});

  useEffect(() => {
    let active = true;
    async function loadQuestions() {
      try {
        setLoading(true);
        const response = await api.getCareerTestQuestions();
        if (!active) return;
        setQuestions(response.data?.questions || []);
        setGroups(response.data?.groups || {});
      } catch (err) {
        if (!active) return;
        setError(err.message || "Không thể tải bài test. Vui lòng thử lại.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadQuestions();
    return () => {
      active = false;
    };
  }, []);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const readyToSubmit = questions.length > 0 && answeredCount === questions.length;

  function handleSelect(questionId, optionId) {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId,
    }));
    if (pendingQuestionId === questionId) {
      setPendingQuestionId(null);
      setError(null);
    }
  }

  async function handleSubmit() {
    if (!readyToSubmit) {
      const firstMissing = questions.find(q => !answers[q.id]);
      if (firstMissing) {
        setPendingQuestionId(firstMissing.id);
        const target = questionRefs.current[firstMissing.id];
        if (target?.scrollIntoView) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      setError("Bạn còn câu hỏi chưa trả lời. Vui lòng hoàn thành trước khi xem kết quả.");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload = questions.map(q => ({
        questionId: q.id,
        optionId: answers[q.id],
      }));
      const response = await api.submitCareerTest(payload);
      setResult(response.data);
    } catch (err) {
      setError(err.message || "Không thể chấm điểm. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  function getOptionGridClass(optionCount) {
    if (optionCount <= 2) return "grid-cols-1 sm:grid-cols-2";
    if (optionCount === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    if (optionCount === 4) return "grid-cols-1 sm:grid-cols-2";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  }

  function renderOption(question, option) {
    const selected = answers[question.id] === option.id;
    return (
      <button
        key={option.id}
        type="button"
        onClick={() => handleSelect(question.id, option.id)}
        role="radio"
        aria-checked={selected}
        className={`group w-full text-left px-4 py-4 rounded-xl border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00BCD4]/40 flex items-center gap-3 ${
          selected
            ? "bg-[#00838F] text-white border-[#00838F] shadow-lg shadow-[#00BCD4]/30"
            : "bg-white border-slate-200 hover:border-[#00BCD4] hover:bg-[#E0F7FA]"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full border-2 transition-colors ${
            selected ? "border-white bg-white/90" : "border-slate-300 group-hover:border-[#00BCD4]"
          }`}
        />
        <div className="font-medium text-base leading-snug">{option.label}</div>
      </button>
    );
  }

  function renderGroupCard(group) {
    if (!group) return null;
    return (
      <div className="p-4 rounded-lg border border-teal-100 bg-white shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-teal-700">{group.label}</h3>
          <span className="px-2 py-1 text-sm rounded-full bg-teal-50 text-teal-700">
            {group.score} điểm
          </span>
        </div>
        <p className="text-sm text-slate-600">{group.description}</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10 space-y-8 bg-slate-50 min-h-screen">
      <header className="space-y-3">
        <p className="text-xs tracking-[0.3em] text-[#00BCD4] font-semibold uppercase">Định hướng ngành nghề</p>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">Bài test định hướng 29 câu</h1>
          <p className="text-slate-600 text-base max-w-3xl">
            Hoàn thành bài test để nhận gợi ý nhóm ngành phù hợp nhất dựa trên dữ liệu tuyển sinh và mô tả ngành học.
          </p>
        </div>
        <div className="mt-4 rounded-2xl bg-white p-4 shadow border border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Tiến độ hoàn thành (29 câu)</span>
            <span className="font-semibold text-slate-700">
              {answeredCount}/{questions.length || 0} câu
            </span>
          </div>
          <div className="w-full bg-[#E0F7FA] rounded-full h-2">
            <div
              className="bg-[#00838F] h-2 rounded-full transition-all"
              style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </header>

      {error && (
        <div className="p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-500">Đang tải câu hỏi...</div>
      ) : (
        <div className="space-y-8">
          {questions.map((question, index) => (
            <section
              key={question.id}
              ref={el => {
                if (el) questionRefs.current[question.id] = el;
              }}
              className={`bg-white rounded-2xl shadow-sm border p-6 sm:p-8 space-y-5 ${
                pendingQuestionId === question.id ? "border-[#ff9d00]" : "border-slate-100"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-[#00838F] text-white flex items-center justify-center font-semibold text-base shadow shadow-[#00BCD4]/40">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-slate-900">{question.prompt}</h2>
                  <p className="text-sm text-slate-500">Chỉ chọn một đáp án mô tả đúng nhất với bạn.</p>
                </div>
              </div>
              <div
                className={`grid gap-3 ${getOptionGridClass(question.options.length)}`}
                role="radiogroup"
                aria-label={question.prompt}
              >
                {question.options.map(option => renderOption(question, option))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          aria-disabled={!readyToSubmit}
          className={`px-8 py-4 text-base font-semibold rounded-full transition-colors shadow ${
            readyToSubmit
              ? "text-white bg-[#00838F] hover:bg-[#006a73]"
              : "text-slate-600 bg-slate-200 hover:bg-slate-300"
          } ${submitting ? "cursor-not-allowed opacity-70" : ""}`}
        >
          {submitting ? "Đang chấm điểm..." : "Xem kết quả"}
        </button>
        {!readyToSubmit && (
          <p className="text-sm text-slate-500">
            Bạn vẫn có thể bấm "Xem kết quả" để hệ thống đưa bạn đến câu hỏi còn thiếu.
          </p>
        )}
      </div>

      {result && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-800">Kết quả gợi ý</h2>
          {result.filteredGroups && result.filteredGroups.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-yellow-800">
                Một số nhóm ngành được loại bỏ dựa trên câu trả lời về lực học:
              </p>
              <ul className="text-sm text-yellow-800 list-disc pl-5 space-y-1">
                {result.filteredGroups.map(item => (
                  <li key={item.code}>
                    <span className="font-semibold">{item.label}:</span>{" "}
                    {item.reasons.join(" ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid gap-4">
            {renderGroupCard(result.primaryGroup)}
            {result.secondaryGroups && result.secondaryGroups.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-600 uppercase">Nhóm ngành tiếp theo</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {result.secondaryGroups.map(group => renderGroupCard(group))}
                </div>
              </div>
            )}
          </div>
          {result.scores && (
            <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-600 uppercase">Bảng điểm chi tiết</p>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(result.scores).map(([code, score]) => (
                  <div key={code} className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-50">
                    <span className="text-sm font-medium text-slate-700">{groups[code]?.label || code}</span>
                    <span className="text-teal-600 font-semibold">{score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

