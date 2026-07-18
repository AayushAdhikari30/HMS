export const ROLES = {
  PATIENT: "patient",
  DOCTOR: "doctor",
  PHARMACIST: "pharmacist",
  LAB_ASSISTANT: "lab_assistant",
  ADMIN: "admin",
};

export const ROLE_LIST = Object.values(ROLES);


export const STAFF_ROLES = [
  ROLES.DOCTOR,
  ROLES.PHARMACIST,
  ROLES.LAB_ASSISTANT,
  ROLES.ADMIN,
];

export const ROLE_ID_PREFIXES = {
  [ROLES.DOCTOR]: "DOC",
  [ROLES.ADMIN]: "ADM",
  [ROLES.PHARMACIST]: "PHM",
  [ROLES.LAB_ASSISTANT]: "LAB",
};

export const JWT = {
  ACCESS_TOKEN_EXPIRES_IN: "15m",
  REFRESH_TOKEN_EXPIRES_IN: "7d",
  COOKIE_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,
};

export const TOKEN_TYPE = {
  EMAIL_VERIFY: "email_verify",
  PASSWORD_RESET: "password_reset",
};

export const TOKEN_TYPE_LIST = Object.values(TOKEN_TYPE);

// Reset links are deliberately short-lived; verification links are not urgent.
export const TOKEN_TTL_MS = {
  [TOKEN_TYPE.EMAIL_VERIFY]: 24 * 60 * 60 * 1000, // 24 hours
  [TOKEN_TYPE.PASSWORD_RESET]: 60 * 60 * 1000, // 1 hour
};

export const HTTP = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL: 500,
};

export const BCRYPT_SALT_ROUNDS = 12;

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
};

export const APPOINTMENT_STATUS_LIST = Object.values(APPOINTMENT_STATUS);

export const LAB_TEST_STATUS = {
  REQUESTED: "requested",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const LAB_TEST_STATUS_LIST = Object.values(LAB_TEST_STATUS);

export const REFERRAL_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const REFERRAL_STATUS_LIST = Object.values(REFERRAL_STATUS);

export const INVOICE_STATUS = {
  UNPAID: "unpaid",
  PARTIAL: "partial",
  PAID: "paid",
  CANCELLED: "cancelled",
};

export const INVOICE_STATUS_LIST = Object.values(INVOICE_STATUS);

export const PAYMENT_METHOD = {
  CASH: "cash",
  CARD: "card",
  INSURANCE: "insurance",
  ONLINE: "online",
};

export const PAYMENT_METHOD_LIST = Object.values(PAYMENT_METHOD);

export const NOTIFICATION_TYPE = {
  APPOINTMENT: "appointment",
  PRESCRIPTION: "prescription",
  LAB_TEST: "lab_test",
  REFERRAL: "referral",
  INVOICE: "invoice",
  SYSTEM: "system",
};

export const NOTIFICATION_TYPE_LIST = Object.values(NOTIFICATION_TYPE);
