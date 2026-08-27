import type { DecayRule } from "../types/domain";

const DEFAULT_UPDATED_AT = "2026-08-24T00:00:00.000Z";

export const defaultDecayRule: DecayRule = {
  enabled: true,
  reminderLeadDays: 3,
  warningDaysAfterDue: 3,
  decayDaysAfterDue: 7,
  updatedAt: DEFAULT_UPDATED_AT,
};
