import type { RealmRule } from "../types/domain";

function createRealmRule(
  level: number,
  name: string,
  requiredTotalCultivation: number,
  breakthroughTitle?: string,
  breakthroughDescription?: string,
): RealmRule {
  return {
    level,
    name,
    requiredTotalCultivation,
    requiredMana: Math.round(requiredTotalCultivation * 0.25),
    requiredInsight: Math.round(requiredTotalCultivation * 0.25),
    breakthroughRequired: breakthroughTitle !== undefined,
    breakthroughTitle,
    breakthroughDescription,
  };
}

export const defaultRealmRules: RealmRule[] = [
  createRealmRule(1, "炼气一层", 0),
  createRealmRule(2, "炼气二层", 10_000),
  createRealmRule(3, "炼气三层", 26_000),
  createRealmRule(4, "炼气四层", 67_000),
  createRealmRule(5, "炼气五层", 173_000),
  createRealmRule(6, "炼气六层", 446_000),
  createRealmRule(
    7,
    "筑基一阶",
    1_149_120,
    "完成第 7 级中段突破考试",
    "用一次阶段测试、课程项目或综合复盘证明中段能力已经稳定成形。",
  ),
  createRealmRule(8, "筑基二阶", 1_400_000),
  createRealmRule(9, "筑基三阶", 1_700_000),
  createRealmRule(10, "金丹一转", 2_100_000),
  createRealmRule(11, "金丹二转", 2_600_000),
  createRealmRule(12, "金丹三转", 3_200_000),
  createRealmRule(
    13,
    "元婴初成",
    4_000_000,
    "完成第 13 级最终突破考试",
    "用最终考试、长期项目或跨门派综合输出确认第一版修炼体系圆满。",
  ),
];
