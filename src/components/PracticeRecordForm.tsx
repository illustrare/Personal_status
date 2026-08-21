import { useState, type ChangeEvent, type FormEvent } from "react";
import type {
  KnowledgePoint,
  PracticeRecord,
  PracticeRecordKnowledgePointDraft,
  PracticeRecordType,
  ReviewRecallResult,
  TechniquePracticeDefaults,
} from "../types/domain";
import {
  calculateSuggestedExperience,
  type PracticeExperienceCalculation,
} from "../utils/practiceExperience";

const recordTypeOptions: Array<{
  value: PracticeRecordType;
  label: string;
}> = [
  { value: "exercise", label: "练习" },
  { value: "note", label: "笔记" },
  { value: "thinking", label: "思考" },
  { value: "test", label: "测试" },
  { value: "review", label: "复习" },
];

export const practiceRecordTypeLabels: Record<PracticeRecordType, string> = {
  exercise: "练习",
  note: "笔记",
  thinking: "思考",
  test: "测试",
  review: "复习",
};

const recordTypeUnits: Record<PracticeRecordType, string> = {
  exercise: "题",
  note: "个",
  thinking: "次",
  test: "题",
  review: "次",
};

export type PracticeRecordFormSubmission = Pick<
  PracticeRecord,
  | "title"
  | "content"
  | "durationMinutes"
  | "recordType"
  | "quantity"
  | "unit"
  | "accuracy"
  | "difficultyMultiplier"
  | "reviewResult"
  | "suggestedExperienceGain"
  | "experienceGain"
  | "manaGain"
  | "insightGain"
  | "soulGain"
  | "valueSource"
  | "adjustmentReason"
  | "practicedAt"
> & {
  knowledgePointAllocations: PracticeRecordKnowledgePointDraft[];
};

type PracticeRecordFormProps = {
  techniqueId: string;
  techniqueName: string;
  practiceDefaults: TechniquePracticeDefaults;
  selectedKnowledgePoints: KnowledgePoint[];
  knowledgePointAllocations: PracticeRecordKnowledgePointDraft[];
  onKnowledgePointAllocationChange: (
    knowledgePointId: string,
    allocationWeight: number,
  ) => void;
  onSubmit: (submission: PracticeRecordFormSubmission) => void;
};

function getDefaultQuantity(
  recordType: PracticeRecordType,
  practiceDefaults: TechniquePracticeDefaults,
): number {
  switch (recordType) {
    case "exercise":
      return practiceDefaults.requiredExerciseCount;
    case "note":
      return practiceDefaults.requiredNoteCount;
    case "thinking":
      return practiceDefaults.requiredThinkingCount;
    case "test":
    case "review":
      return 1;
  }
}

function getLocalDateTimeValue(date = new Date()): string {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function PracticeRecordForm({
  techniqueId,
  techniqueName,
  practiceDefaults,
  selectedKnowledgePoints,
  knowledgePointAllocations,
  onKnowledgePointAllocationChange,
  onSubmit,
}: PracticeRecordFormProps) {
  const [title, setTitle] = useState(`${techniqueName}修炼记录`);
  const [content, setContent] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | "">("");
  const [practicedAt, setPracticedAt] = useState(getLocalDateTimeValue);
  const [recordType, setRecordType] =
    useState<PracticeRecordType>("exercise");
  const [quantity, setQuantity] = useState(() =>
    getDefaultQuantity("exercise", practiceDefaults),
  );
  const [accuracy, setAccuracy] = useState<number | undefined>();
  const [difficultyMultiplier, setDifficultyMultiplier] = useState(1);
  const [reviewResult, setReviewResult] = useState<ReviewRecallResult | "">("");
  const [manualExperienceGain, setManualExperienceGain] = useState<
    number | undefined
  >();
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [formError, setFormError] = useState("");

  const currentTypeDefaults = practiceDefaults.recordTypeDefaults[recordType];
  const quantityUnit = recordTypeUnits[recordType];
  const allocationWeightByKnowledgePointId = new Map(
    knowledgePointAllocations.map(
      (allocation): [string, number] => [
        allocation.knowledgePointId,
        allocation.allocationWeight,
      ],
    ),
  );
  const knowledgePointById = new Map(
    selectedKnowledgePoints.map(
      (knowledgePoint): [string, KnowledgePoint] => [
        knowledgePoint.id,
        knowledgePoint,
      ],
    ),
  );
  const allocationTotal = knowledgePointAllocations.reduce(
    (total, allocation) => total + allocation.allocationWeight,
    0,
  );
  const isAllocationValid =
    knowledgePointAllocations.length > 0 &&
    Math.abs(allocationTotal - 1) <= 0.0002;
  const experienceCalculation: PracticeExperienceCalculation =
    calculateSuggestedExperience({
      recordType,
      quantity,
      difficultyMultiplier,
      knowledgePoints: selectedKnowledgePoints,
      allocations: knowledgePointAllocations,
      practiceDefaults,
    });
  const hasManualAdjustment = manualExperienceGain !== undefined;
  const finalExperienceGain = hasManualAdjustment
    ? manualExperienceGain
    : experienceCalculation.suggestedExperienceGain;
  const manaGain = roundToTwo(
    finalExperienceGain * currentTypeDefaults.manaWeight,
  );
  const insightGain = roundToTwo(
    finalExperienceGain * currentTypeDefaults.insightWeight,
  );

  function handleRecordTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextRecordType = event.target.value as PracticeRecordType;

    setRecordType(nextRecordType);
    setQuantity(getDefaultQuantity(nextRecordType, practiceDefaults));
    setManualExperienceGain(undefined);
    setAdjustmentReason("");
    setFormError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (title.trim().length === 0) {
      setFormError("请填写记录标题。");
      return;
    }

    if (!isAllocationValid) {
      setFormError("请选择知识点，并将分配合计调整为 100%。");
      return;
    }

    if (quantity < 1 || !Number.isFinite(quantity)) {
      setFormError("本次数量必须是至少为 1 的整数。");
      return;
    }

    if (
      durationMinutes === "" ||
      durationMinutes < 1 ||
      !Number.isFinite(durationMinutes)
    ) {
      setFormError("请填写至少 1 分钟的修炼耗时。");
      return;
    }

    if (recordType === "test" && difficultyMultiplier < 0.1) {
      setFormError("测试难度倍率不能低于 0.1。");
      return;
    }

    if (recordType === "review" && reviewResult === "") {
      setFormError("请选择本次复习结果。");
      return;
    }

    if (hasManualAdjustment && adjustmentReason.trim().length === 0) {
      setFormError("手动调整经验时需要填写调整原因。");
      return;
    }

    const practicedDate = new Date(practicedAt);

    if (Number.isNaN(practicedDate.getTime())) {
      setFormError("请选择有效的实际修炼时间。");
      return;
    }

    onSubmit({
      title: title.trim(),
      content: content.trim() || undefined,
      durationMinutes,
      recordType,
      quantity,
      unit: quantityUnit,
      accuracy:
        recordType === "exercise" || recordType === "test"
          ? accuracy
          : undefined,
      difficultyMultiplier:
        recordType === "test" ? difficultyMultiplier : undefined,
      reviewResult:
        recordType === "review" ? reviewResult || undefined : undefined,
      suggestedExperienceGain: experienceCalculation.suggestedExperienceGain,
      experienceGain: finalExperienceGain,
      manaGain,
      insightGain,
      soulGain: 0,
      valueSource: hasManualAdjustment ? "manual" : "technique_default",
      adjustmentReason: hasManualAdjustment
        ? adjustmentReason.trim()
        : undefined,
      practicedAt: practicedDate.toISOString(),
      knowledgePointAllocations: knowledgePointAllocations.map(
        (allocation) => ({ ...allocation }),
      ),
    });
  }

  return (
    <form
      className="practice-record-form placeholder-form"
      aria-label={`记录${techniqueName}修炼`}
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="techniqueId" value={techniqueId} />
      <label htmlFor={`title-${techniqueId}`}>
        记录标题
        <input
          id={`title-${techniqueId}`}
          name="title"
          value={title}
          required
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      <fieldset className="selected-knowledge-points">
        <legend>本次知识点</legend>
        {selectedKnowledgePoints.length > 0 ? (
          <ul>
            {selectedKnowledgePoints.map((knowledgePoint) => {
              const allocationWeight =
                allocationWeightByKnowledgePointId.get(knowledgePoint.id) ?? 0;

              return (
                <li key={knowledgePoint.id}>
                  <label
                    className="knowledge-allocation-row"
                    htmlFor={`allocation-${knowledgePoint.id}`}
                  >
                    <span>{knowledgePoint.name}</span>
                    <span className="allocation-input-row">
                      <input
                        id={`allocation-${knowledgePoint.id}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={Number((allocationWeight * 100).toFixed(2))}
                        onChange={(event) =>
                          onKnowledgePointAllocationChange(
                            knowledgePoint.id,
                            Number(event.target.value) / 100,
                          )
                        }
                      />
                      <span>%</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>尚未选择知识点。</p>
        )}
        <output className="allocation-total" data-valid={isAllocationValid}>
          分配合计：{Number((allocationTotal * 100).toFixed(2))}%
          {isAllocationValid ? "，有效" : "，需为 100%"}
        </output>
      </fieldset>

      <label htmlFor={`record-type-${techniqueId}`}>
        修炼类型
        <select
          id={`record-type-${techniqueId}`}
          name="recordType"
          value={recordType}
          onChange={handleRecordTypeChange}
        >
          {recordTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor={`quantity-${techniqueId}`}>
        本次数量
        <span className="quantity-input-row">
          <input
            id={`quantity-${techniqueId}`}
            name="quantity"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(event) => {
              setQuantity(Number(event.target.value));
              setManualExperienceGain(undefined);
              setAdjustmentReason("");
            }}
            onBlur={() =>
              setQuantity((currentQuantity) =>
                Math.max(1, Math.round(currentQuantity)),
              )
            }
          />
          <span>{quantityUnit}</span>
        </span>
      </label>

      {(recordType === "exercise" || recordType === "test") && (
        <label htmlFor={`accuracy-${techniqueId}`}>
          正确率（可选）
          <span className="quantity-input-row">
            <input
              id={`accuracy-${techniqueId}`}
              name="accuracy"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={
                accuracy === undefined
                  ? ""
                  : Number((accuracy * 100).toFixed(2))
              }
              onChange={(event) => {
                const nextPercentage = event.target.value;

                setAccuracy(
                  nextPercentage === ""
                    ? undefined
                    : Math.min(Math.max(Number(nextPercentage) / 100, 0), 1),
                );
              }}
            />
            <span>%</span>
          </span>
        </label>
      )}

      {recordType === "test" && (
        <>
          <label htmlFor={`difficulty-${techniqueId}`}>
            难度倍率
            <input
              id={`difficulty-${techniqueId}`}
              name="difficultyMultiplier"
              type="number"
              min="0.1"
              step="0.1"
              value={difficultyMultiplier}
              onChange={(event) => {
                setDifficultyMultiplier(Number(event.target.value));
                setManualExperienceGain(undefined);
                setAdjustmentReason("");
              }}
              onBlur={() =>
                setDifficultyMultiplier((currentMultiplier) =>
                  Math.max(0.1, currentMultiplier),
                )
              }
            />
          </label>
          <p className="practice-form-rule">
            当前每题基础经验：{currentTypeDefaults.baseExperiencePerUnit ?? 0}
          </p>
        </>
      )}

      {recordType === "review" && (
        <label htmlFor={`review-result-${techniqueId}`}>
          复习结果
          <select
            id={`review-result-${techniqueId}`}
            name="reviewResult"
            value={reviewResult}
            required
            onChange={(event) =>
              setReviewResult(event.target.value as ReviewRecallResult)
            }
          >
            <option value="" disabled>
              请选择复习结果
            </option>
            <option value="forgotten">忘记</option>
            <option value="effortful">勉强想起</option>
            <option value="recalled">顺利想起</option>
          </select>
        </label>
      )}

      <section className="experience-preview" aria-label="建议经验明细">
        <div className="experience-preview-total">
          <span>系统建议经验</span>
          <strong>{experienceCalculation.suggestedExperienceGain}</strong>
        </div>
        {experienceCalculation.knowledgePointResults.length > 0 && (
          <ul>
            {experienceCalculation.knowledgePointResults.map((result) => (
              <li key={result.knowledgePointId}>
                <span>
                  {knowledgePointById.get(result.knowledgePointId)?.name ??
                    result.knowledgePointId}
                </span>
                <span>
                  {result.allocatedQuantity} {quantityUnit} / +
                  {result.suggestedExperience} 经验
                  {recordType === "test" && " / 不计知识点进度"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <label htmlFor={`experience-${techniqueId}`}>
        最终经验
        <input
          id={`experience-${techniqueId}`}
          name="experienceGain"
          type="number"
          min="0"
          step="0.01"
          value={finalExperienceGain}
          onChange={(event) =>
            setManualExperienceGain(Math.max(0, Number(event.target.value)))
          }
        />
      </label>

      {hasManualAdjustment && (
        <>
          <label htmlFor={`adjustment-reason-${techniqueId}`}>
            调整原因
            <textarea
              id={`adjustment-reason-${techniqueId}`}
              name="adjustmentReason"
              value={adjustmentReason}
              onChange={(event) => setAdjustmentReason(event.target.value)}
            />
          </label>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setManualExperienceGain(undefined);
              setAdjustmentReason("");
            }}
          >
            恢复系统建议值
          </button>
        </>
      )}

      <div className="gain-preview" aria-label="本次属性收益">
        <span>法力 +{manaGain}</span>
        <span>神识 +{insightGain}</span>
      </div>

      <label htmlFor={`duration-${techniqueId}`}>
        修炼耗时（分钟）
        <input
          id={`duration-${techniqueId}`}
          name="durationMinutes"
          type="number"
          min="1"
          step="1"
          value={durationMinutes}
          required
          onChange={(event) =>
            setDurationMinutes(
              event.target.value === "" ? "" : Number(event.target.value),
            )
          }
        />
      </label>

      <label htmlFor={`practiced-at-${techniqueId}`}>
        实际修炼时间
        <input
          id={`practiced-at-${techniqueId}`}
          name="practicedAt"
          type="datetime-local"
          value={practicedAt}
          required
          onChange={(event) => setPracticedAt(event.target.value)}
        />
      </label>

      <label htmlFor={`content-${techniqueId}`}>
        备注、心得或复盘（可选）
        <textarea
          id={`content-${techniqueId}`}
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </label>

      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <button type="submit">保存修炼记录</button>
    </form>
  );
}
