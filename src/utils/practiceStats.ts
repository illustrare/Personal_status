import type {
  PracticeRecord,
  PracticeRecordKnowledgePoint,
  Technique,
} from '../types/domain';

export interface ProfilePracticeStats {
  totalExperience: number;
  totalMana: number;
  totalInsight: number;
  totalSoul: number;
}

export interface SectPracticeStats {
  sectId: string;
  totalExperience: number;
  totalMana: number;
  totalInsight: number;
  totalSoul: number;
  recordCount: number;
}

export interface TechniquePracticeStats {
  techniqueId: string;
  sectId: string;
  totalExperience: number;
  totalMana: number;
  totalInsight: number;
  totalSoul: number;
  recordCount: number;
}

export interface KnowledgePointPracticeStats {
  knowledgePointId: string;
  totalExperience: number;
  totalMana: number;
  totalInsight: number;
  totalSoul: number;
  recordCount: number;
}

export interface PracticeStats {
  profileStats: ProfilePracticeStats;
  sectStatsById: Record<string, SectPracticeStats>;
  techniqueStatsById: Record<string, TechniquePracticeStats>;
  knowledgePointStatsById: Record<string, KnowledgePointPracticeStats>;
}

export function getActivePracticeRecords(
  practiceRecords: PracticeRecord[],
): PracticeRecord[] {
  return practiceRecords.filter(
    (record) => record.deletedAt === undefined,
  );
}

export function calculateProfilePracticeStats(
  practiceRecords: PracticeRecord[],
): ProfilePracticeStats {
  return getActivePracticeRecords(practiceRecords).reduce<ProfilePracticeStats>(
    (stats, record) => ({
      totalExperience: stats.totalExperience + record.experienceGain,
      totalMana: stats.totalMana + record.manaGain,
      totalInsight: stats.totalInsight + record.insightGain,
      totalSoul: stats.totalSoul + record.soulGain,
    }),
    {
      totalExperience: 0,
      totalMana: 0,
      totalInsight: 0,
      totalSoul: 0,
    },
  );
}

export function calculateSectPracticeStatsById(
  practiceRecords: PracticeRecord[],
): Record<string, SectPracticeStats> {
  return getActivePracticeRecords(practiceRecords).reduce<
    Record<string, SectPracticeStats>
  >((statsById, record) => {
    const currentStats = statsById[record.sectId] ?? {
      sectId: record.sectId,
      totalExperience: 0,
      totalMana: 0,
      totalInsight: 0,
      totalSoul: 0,
      recordCount: 0,
    };

    return {
      ...statsById,
      [record.sectId]: {
        sectId: record.sectId,
        totalExperience: currentStats.totalExperience + record.experienceGain,
        totalMana: currentStats.totalMana + record.manaGain,
        totalInsight: currentStats.totalInsight + record.insightGain,
        totalSoul: currentStats.totalSoul + record.soulGain,
        recordCount: currentStats.recordCount + 1,
      },
    };
  }, {});
}

export function calculatePracticeStats(
  practiceRecords: PracticeRecord[],
  practiceRecordKnowledgePoints: PracticeRecordKnowledgePoint[],
): PracticeStats {
  return {
    profileStats: calculateProfilePracticeStats(practiceRecords),
    sectStatsById: calculateSectPracticeStatsById(practiceRecords),
    techniqueStatsById: calculateTechniquePracticeStatsById(practiceRecords),
    knowledgePointStatsById: calculateKnowledgePointPracticeStatsById(
      practiceRecords,
      practiceRecordKnowledgePoints,
    ),
  };
}

export const calculateHistoricalPracticeStats = calculatePracticeStats;

export function calculateCurrentOwnershipPracticeStats(
  practiceRecords: PracticeRecord[],
  practiceRecordKnowledgePoints: PracticeRecordKnowledgePoint[],
  techniques: Technique[],
): PracticeStats {
  return {
    profileStats: calculateProfilePracticeStats(practiceRecords),
    sectStatsById: calculateCurrentOwnershipSectPracticeStatsById(
      practiceRecords,
      techniques,
    ),
    techniqueStatsById: calculateCurrentOwnershipTechniquePracticeStatsById(
      practiceRecords,
      techniques,
    ),
    knowledgePointStatsById: calculateKnowledgePointPracticeStatsById(
      practiceRecords,
      practiceRecordKnowledgePoints,
    ),
  };
}

export function calculateKnowledgePointPracticeStatsById(
  practiceRecords: PracticeRecord[],
  practiceRecordKnowledgePoints: PracticeRecordKnowledgePoint[],
): Record<string, KnowledgePointPracticeStats> {
  const activeRecordById = new Map(
    getActivePracticeRecords(practiceRecords).map(
      (record): [string, PracticeRecord] => [record.id, record],
    ),
  );

  return practiceRecordKnowledgePoints.reduce<
    Record<string, KnowledgePointPracticeStats>
  >((statsById, link) => {
    const record = activeRecordById.get(link.recordId);

    if (!record) {
      return statsById;
    }

    const currentStats = statsById[link.knowledgePointId] ?? {
      knowledgePointId: link.knowledgePointId,
      totalExperience: 0,
      totalMana: 0,
      totalInsight: 0,
      totalSoul: 0,
      recordCount: 0,
    };

    return {
      ...statsById,
      [link.knowledgePointId]: {
        knowledgePointId: link.knowledgePointId,
        totalExperience:
          currentStats.totalExperience +
          record.experienceGain * link.allocationWeight,
        totalMana:
          currentStats.totalMana + record.manaGain * link.allocationWeight,
        totalInsight:
          currentStats.totalInsight +
          record.insightGain * link.allocationWeight,
        totalSoul:
          currentStats.totalSoul + record.soulGain * link.allocationWeight,
        recordCount: currentStats.recordCount + 1,
      },
    };
  }, {});
}

export function calculateTechniquePracticeStatsById(
  practiceRecords: PracticeRecord[],
): Record<string, TechniquePracticeStats> {
  return getActivePracticeRecords(practiceRecords).reduce<
    Record<string, TechniquePracticeStats>
  >((statsById, record) => {
    const currentStats = statsById[record.techniqueId] ?? {
      techniqueId: record.techniqueId,
      sectId: record.sectId,
      totalExperience: 0,
      totalMana: 0,
      totalInsight: 0,
      totalSoul: 0,
      recordCount: 0,
    };

    return {
      ...statsById,
      [record.techniqueId]: {
        techniqueId: record.techniqueId,
        sectId: record.sectId,
        totalExperience: currentStats.totalExperience + record.experienceGain,
        totalMana: currentStats.totalMana + record.manaGain,
        totalInsight: currentStats.totalInsight + record.insightGain,
        totalSoul: currentStats.totalSoul + record.soulGain,
        recordCount: currentStats.recordCount + 1,
      },
    };
  }, {});
}

export function calculateCurrentOwnershipSectPracticeStatsById(
  practiceRecords: PracticeRecord[],
  techniques: Technique[],
): Record<string, SectPracticeStats> {
  const currentSectIdByTechniqueId = new Map(
    techniques.map((technique) => [technique.id, technique.sectId]),
  );

  return getActivePracticeRecords(practiceRecords).reduce<
    Record<string, SectPracticeStats>
  >((statsById, record) => {
    const sectId =
      currentSectIdByTechniqueId.get(record.techniqueId) ?? record.sectId;
    const currentStats = statsById[sectId] ?? {
      sectId,
      totalExperience: 0,
      totalMana: 0,
      totalInsight: 0,
      totalSoul: 0,
      recordCount: 0,
    };

    return {
      ...statsById,
      [sectId]: {
        sectId,
        totalExperience: currentStats.totalExperience + record.experienceGain,
        totalMana: currentStats.totalMana + record.manaGain,
        totalInsight: currentStats.totalInsight + record.insightGain,
        totalSoul: currentStats.totalSoul + record.soulGain,
        recordCount: currentStats.recordCount + 1,
      },
    };
  }, {});
}

export function calculateCurrentOwnershipTechniquePracticeStatsById(
  practiceRecords: PracticeRecord[],
  techniques: Technique[],
): Record<string, TechniquePracticeStats> {
  const currentSectIdByTechniqueId = new Map(
    techniques.map((technique) => [technique.id, technique.sectId]),
  );

  return getActivePracticeRecords(practiceRecords).reduce<
    Record<string, TechniquePracticeStats>
  >((statsById, record) => {
    const sectId =
      currentSectIdByTechniqueId.get(record.techniqueId) ?? record.sectId;
    const currentStats = statsById[record.techniqueId] ?? {
      techniqueId: record.techniqueId,
      sectId,
      totalExperience: 0,
      totalMana: 0,
      totalInsight: 0,
      totalSoul: 0,
      recordCount: 0,
    };

    return {
      ...statsById,
      [record.techniqueId]: {
        techniqueId: record.techniqueId,
        sectId,
        totalExperience: currentStats.totalExperience + record.experienceGain,
        totalMana: currentStats.totalMana + record.manaGain,
        totalInsight: currentStats.totalInsight + record.insightGain,
        totalSoul: currentStats.totalSoul + record.soulGain,
        recordCount: currentStats.recordCount + 1,
      },
    };
  }, {});
}
