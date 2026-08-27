import {
  aiDraftFieldStandards,
  type AiDraftFieldStandardKey,
} from "../data/aiDraftFieldStandards";

type FieldReferenceProps = {
  standardKey: AiDraftFieldStandardKey;
  recommendation?: string;
  preview?: string;
};

export function FieldReference({
  standardKey,
  recommendation,
  preview,
}: FieldReferenceProps) {
  const standard = aiDraftFieldStandards[standardKey];

  return (
    <span className="field-reference">
      <span>
        {standard.required ? "必填" : "可选"} · {standard.format}
      </span>
      <span>{recommendation ?? standard.reference}</span>
      {preview && <span className="field-effect">{preview}</span>}
    </span>
  );
}
