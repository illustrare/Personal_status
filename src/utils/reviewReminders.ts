import type { DecayRule, KnowledgePoint, KnowledgeReviewStatus } from "../types/domain";
import type { KnowledgePointProgress } from "./practiceProgress";
import {
  resolveKnowledgePointOwnership,
  type KnowledgeOwnershipIndex,
} from "./knowledgeOwnership";

export type ReviewReminderStatus =
  | "upcoming"
  | "due"
  | "overdue"
  | "warning"
  | "decayed";

export interface ReviewReminder {
  knowledgePointId: string;
  knowledgePointName: string;
  sectId: string;
  techniqueId: string;
  chapterName: string;
  progressRatio: number;
  reviewStatus: KnowledgeReviewStatus;
  reminderStatus: ReviewReminderStatus;
  nextReviewAt: string;
  daysUntilReview: number;
}

function getDayDifference(dateValue: string): number {
  const targetDate = new Date(dateValue);
  const today = new Date();

  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.ceil((targetDate.getTime() - today.getTime()) / 86_400_000);
}

function getReminderStatus(
  daysUntilReview: number,
  reviewStatus: KnowledgeReviewStatus,
  decayRule: DecayRule,
): ReviewReminderStatus {
  const overdueDays = Math.max(Math.abs(daysUntilReview), 0);

  if (daysUntilReview < 0 && overdueDays >= decayRule.decayDaysAfterDue) {
    return "decayed";
  }

  if (daysUntilReview < 0 && overdueDays >= decayRule.warningDaysAfterDue) {
    return "warning";
  }

  if (reviewStatus === "overdue" || daysUntilReview < 0) {
    return "overdue";
  }

  if (reviewStatus === "due" || daysUntilReview === 0) {
    return "due";
  }

  return "upcoming";
}

export function getReviewReminders(
  knowledgePoints: KnowledgePoint[],
  ownershipIndex: KnowledgeOwnershipIndex,
  knowledgePointProgressById: Record<string, KnowledgePointProgress>,
  decayRule: DecayRule,
): ReviewReminder[] {
  if (!decayRule.enabled) {
    return [];
  }

  return knowledgePoints
    .flatMap((knowledgePoint) => {
      if (knowledgePoint.archivedAt !== undefined) {
        return [];
      }

      const progress = knowledgePointProgressById[knowledgePoint.id];
      const ownership = resolveKnowledgePointOwnership(
        knowledgePoint,
        ownershipIndex,
      );

      if (!progress?.nextReviewAt || !ownership) {
        return [];
      }

      const daysUntilReview = getDayDifference(progress.nextReviewAt);

      return [
        {
          knowledgePointId: knowledgePoint.id,
          knowledgePointName: knowledgePoint.name,
          sectId: ownership.sectId,
          techniqueId: ownership.technique.id,
          chapterName: ownership.chapter.name,
          progressRatio: progress.totalProgressRatio,
          reviewStatus: progress.reviewStatus,
          reminderStatus: getReminderStatus(
            daysUntilReview,
            progress.reviewStatus,
            decayRule,
          ),
          nextReviewAt: progress.nextReviewAt,
          daysUntilReview,
        },
      ];
    })
    .sort(
      (firstReminder, secondReminder) =>
        firstReminder.daysUntilReview - secondReminder.daysUntilReview,
    );
}

export function getHomeReviewReminders(
  reviewReminders: ReviewReminder[],
  decayRule: DecayRule,
): ReviewReminder[] {
  return reviewReminders.filter(
    (reminder) =>
      reminder.daysUntilReview <= decayRule.reminderLeadDays ||
      reminder.reminderStatus !== "upcoming",
  );
}
