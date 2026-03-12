function normalizeAdminEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function parseAdminEmailList(value) {
  return new Set(
    String(value ?? "")
      .split(/[,\r\n]+/)
      .map((item) => normalizeAdminEmail(item))
      .filter(Boolean),
  );
}

export function getAdminConfig(env = process.env) {
  return {
    reviewerEmails: parseAdminEmailList(env.ADMIN_REVIEWER_EMAILS),
    operatorEmails: parseAdminEmailList(env.ADMIN_OPERATOR_EMAILS),
    password: String(env.ADMIN_PASSWORD ?? ""),
    totpSecret: String(env.ADMIN_TOTP_SECRET ?? ""),
    sessionSecret: String(env.ADMIN_SESSION_SECRET ?? ""),
  };
}

export function getAdminConfigErrors(config = getAdminConfig()) {
  const errors = [];

  if (config.reviewerEmails.size === 0) {
    errors.push("ADMIN_REVIEWER_EMAILS");
  }

  if (config.operatorEmails.size === 0) {
    errors.push("ADMIN_OPERATOR_EMAILS");
  }

  if (!config.password) {
    errors.push("ADMIN_PASSWORD");
  }

  if (!config.totpSecret) {
    errors.push("ADMIN_TOTP_SECRET");
  }

  if (!config.sessionSecret) {
    errors.push("ADMIN_SESSION_SECRET");
  }

  return errors;
}

export function isAdminConfigured(config = getAdminConfig()) {
  return getAdminConfigErrors(config).length === 0;
}

export function getRoleForEmail(email, config = getAdminConfig()) {
  const normalizedEmail = normalizeAdminEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  if (config.operatorEmails.has(normalizedEmail)) {
    return "OPERATOR";
  }

  if (config.reviewerEmails.has(normalizedEmail)) {
    return "REVIEWER";
  }

  return null;
}

export function hasRequiredRole(role, requiredRole = "REVIEWER") {
  if (requiredRole === "OPERATOR") {
    return role === "OPERATOR";
  }

  return role === "REVIEWER" || role === "OPERATOR";
}

export function normalizeAdminEmailAddress(value) {
  return normalizeAdminEmail(value);
}
