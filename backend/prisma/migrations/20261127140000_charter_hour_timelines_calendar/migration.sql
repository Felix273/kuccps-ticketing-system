-- Service Charter hour-based timelines ("Immediately to 24 hours" / "48 hours")
-- are calendar hours, matching the charter wording. Day-based timelines remain working days.

-- Policies still on the shipped default move to the new default.
UPDATE "SlaPolicy"
SET "resolutionUnit" = 'calendar_hours'
WHERE "policyKey" IN ('category:equipment-issuance', 'category:hardware-support', 'category:software-support')
  AND "resolutionUnit" = 'working_hours'
  AND "resolutionValue" IS NOT DISTINCT FROM "defaultResolutionValue"
  AND "resolutionUnit" IS NOT DISTINCT FROM "defaultResolutionUnit";

-- The default (used by "Reset to defaults") changes for everyone.
UPDATE "SlaPolicy"
SET "defaultResolutionUnit" = 'calendar_hours'
WHERE "policyKey" IN ('category:equipment-issuance', 'category:hardware-support', 'category:software-support')
  AND "defaultResolutionUnit" = 'working_hours';
