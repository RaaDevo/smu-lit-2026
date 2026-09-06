const statusLabels: Record<string, string> = {
  AI_GENERATED_SCENARIO: "AI-generated scenario",
  LAWYER_APPROVED_WORKING_ASSUMPTION: "Lawyer-approved working assumption",
  CURRENT_VERIFIED_SINGAPORE_LAW: "Current verified Singapore law",
  SINGAPORE_PRIMARY_AUTHORITY: "Singapore primary authority",
  SINGAPORE_SECONDARY_MATERIAL: "Singapore secondary material",
  FOREIGN_COMMON_LAW_AUTHORITY: "Foreign common-law authority",
  FOREIGN_REGULATORY_DEVELOPMENT: "Foreign regulatory development",
  NOT_APPLICABLE: "Not applicable",
};

export function humanizeStatus(value: string) {
  if (statusLabels[value]) return statusLabels[value];
  if (!value.includes("_")) {
    return /^[A-Z]+$/.test(value)
      ? value.charAt(0) + value.slice(1).toLowerCase()
      : value;
  }
  const words = value.toLowerCase().replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
