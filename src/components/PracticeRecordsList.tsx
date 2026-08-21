import { practiceRecordTypeLabels } from './PracticeRecordForm';
import type {
  KnowledgePoint,
  PracticeRecord,
  PracticeRecordKnowledgePoint,
} from '../types/domain';

type PracticeRecordsListProps = {
  records: PracticeRecord[];
  recordKnowledgePoints: PracticeRecordKnowledgePoint[];
  knowledgePoints: KnowledgePoint[];
  onDelete: (recordId: string) => void;
  onRestore: (recordId: string) => void;
};

function formatRecordTime(isoTime: string): string {
  return new Date(isoTime).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PracticeRecordsList({
  records,
  recordKnowledgePoints,
  knowledgePoints,
  onDelete,
  onRestore,
}: PracticeRecordsListProps) {
  const knowledgePointNameById = new Map(
    knowledgePoints.map(
      (knowledgePoint): [string, string] => [
        knowledgePoint.id,
        knowledgePoint.name,
      ],
    ),
  );

  return (
    <section className="practice-records-section" aria-label="修炼记录列表">
      <div className="practice-records-heading">
        <h2>修炼记录</h2>
        <span>{records.length} 条</span>
      </div>

      {records.length === 0 ? (
        <p className="empty-state">当前功法还没有修炼记录。</p>
      ) : (
        <ol className="practice-records-list">
          {records.map((record) => {
            const linkedKnowledgePoints = recordKnowledgePoints.filter(
              (link) => link.recordId === record.id,
            );
            const isDeleted = record.deletedAt !== undefined;

            return (
              <li key={record.id} data-deleted={isDeleted}>
                <article>
                  <div className="practice-record-title-row">
                    <div>
                      <span>
                        {practiceRecordTypeLabels[record.recordType]} ·{' '}
                        {formatRecordTime(record.practicedAt)}
                      </span>
                      <h3>{record.title}</h3>
                    </div>
                    {isDeleted && <strong>已删除</strong>}
                  </div>

                  <p>
                    {linkedKnowledgePoints
                      .map(
                        (link) =>
                          `${knowledgePointNameById.get(link.knowledgePointId) ?? link.knowledgePointId} ${Math.round(link.allocationWeight * 10000) / 100}%`,
                      )
                      .join('、')}
                  </p>

                  <dl>
                    <div>
                      <dt>完成量</dt>
                      <dd>
                        {record.quantity} {record.unit}
                      </dd>
                    </div>
                    <div>
                      <dt>最终经验</dt>
                      <dd>
                        {record.experienceGain}
                        {record.valueSource === 'manual'
                          ? `（系统建议 ${record.suggestedExperienceGain}）`
                          : '（系统建议）'}
                      </dd>
                    </div>
                    <div>
                      <dt>属性收益</dt>
                      <dd>
                        法力 {record.manaGain} / 神识 {record.insightGain}
                      </dd>
                    </div>
                  </dl>

                  {record.content && <p>{record.content}</p>}
                  {record.adjustmentReason && (
                    <p>手动调整原因：{record.adjustmentReason}</p>
                  )}

                  <div className="record-actions">
                    {isDeleted ? (
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => onRestore(record.id)}
                      >
                        恢复
                      </button>
                    ) : (
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => onDelete(record.id)}
                      >
                        删除
                      </button>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
