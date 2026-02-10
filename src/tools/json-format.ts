/**
 * JSON Format Module
 * Defines the export/import JSON schema and validation functions
 */

export const EXPORT_FORMAT_VERSION = "1.0";

export interface Label {
  name: string;
  color: string; // 6-digit hex (no # prefix)
}

export interface Issue {
  number: number;
  title: string;
  body: string | null;
  labels: Label[];
  created_at: string; // ISO timestamp
  state: "open" | "closed";
}

export interface ExportData {
  version: string; // Format version (e.g., "1.0")
  exported_at: string; // ISO timestamp
  repository: string; // "owner/repo"
  total_issues: number; // Count
  issues: Issue[];
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates the structure of exported JSON data
 */
export function validateExportData(
  data: unknown,
): { valid: true; data: ExportData } | { valid: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return {
      valid: false,
      errors: [{ field: "root", message: "Data must be an object" }],
    };
  }

  const obj = data as Record<string, unknown>;

  // Check version field
  if (!obj.version || typeof obj.version !== "string") {
    errors.push({ field: "version", message: "Missing or invalid version field" });
  } else if (obj.version !== EXPORT_FORMAT_VERSION) {
    errors.push({
      field: "version",
      message: `Unsupported version: expected ${EXPORT_FORMAT_VERSION}, got ${obj.version}`,
    });
  }

  // Check exported_at field
  if (!obj.exported_at || typeof obj.exported_at !== "string") {
    errors.push({ field: "exported_at", message: "Missing or invalid exported_at field" });
  }

  // Check repository field
  if (!obj.repository || typeof obj.repository !== "string") {
    errors.push({ field: "repository", message: "Missing or invalid repository field" });
  }

  // Check total_issues field
  if (typeof obj.total_issues !== "number") {
    errors.push({ field: "total_issues", message: "Missing or invalid total_issues field" });
  }

  // Check issues array
  if (!Array.isArray(obj.issues)) {
    errors.push({ field: "issues", message: "Missing or invalid issues array" });
  } else {
    // Validate each issue
    for (let i = 0; i < obj.issues.length; i++) {
      const issueErrors = validateIssue(obj.issues[i], i);
      errors.push(...issueErrors);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: obj as ExportData };
}

/**
 * Validates a single issue object
 */
export function validateIssue(issue: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `issues[${index}]`;

  if (!issue || typeof issue !== "object") {
    return [{ field: prefix, message: "Issue must be an object" }];
  }

  const obj = issue as Record<string, unknown>;

  // Check number field
  if (typeof obj.number !== "number") {
    errors.push({ field: `${prefix}.number`, message: "Missing or invalid number field" });
  }

  // Check title field
  if (!obj.title || typeof obj.title !== "string") {
    errors.push({ field: `${prefix}.title`, message: "Missing or invalid title field" });
  }

  // Check body field (can be null)
  if (obj.body !== null && typeof obj.body !== "string") {
    errors.push({ field: `${prefix}.body`, message: "Invalid body field (must be string or null)" });
  }

  // Check labels array
  if (!Array.isArray(obj.labels)) {
    errors.push({ field: `${prefix}.labels`, message: "Missing or invalid labels array" });
  } else {
    // Validate label structure
    for (let i = 0; i < obj.labels.length; i++) {
      const label = obj.labels[i];
      if (!label || typeof label !== "object") {
        errors.push({
          field: `${prefix}.labels[${i}]`,
          message: "Label must be an object",
        });
      } else {
        const labelObj = label as Record<string, unknown>;
        if (typeof labelObj.name !== "string") {
          errors.push({
            field: `${prefix}.labels[${i}].name`,
            message: "Label name must be a string",
          });
        }
        if (typeof labelObj.color !== "string") {
          errors.push({
            field: `${prefix}.labels[${i}].color`,
            message: "Label color must be a string",
          });
        }
      }
    }
  }

  // Check created_at field
  if (!obj.created_at || typeof obj.created_at !== "string") {
    errors.push({ field: `${prefix}.created_at`, message: "Missing or invalid created_at field" });
  }

  // Check state field
  if (obj.state !== "open" && obj.state !== "closed") {
    errors.push({
      field: `${prefix}.state`,
      message: 'Invalid state field (must be "open" or "closed")',
    });
  }

  return errors;
}
