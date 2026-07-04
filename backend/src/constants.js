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

export const HTTP = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

export const BCRYPT_SALT_ROUNDS = 12;
