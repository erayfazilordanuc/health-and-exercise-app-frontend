export enum LoginMethod {
  'default',
  'registration',
  'guest',
}

export enum ConsentPurpose {
  KVKK_NOTICE_ACK,
  HEALTH_DATA_PROCESSING_ACK,
  EXERCISE_DATA_PROCESSING_ACK,
  STUDY_CONSENT_ACK,
}

export enum ConsentStatus {
  ACCEPTED,
  REJECTED,
  WITHDRAWN,
  ACKNOWLEDGED,
}

export enum ConsentPolicyPurpose {
  KVKK_NOTICE,
  HEALTH_DATA_PROCESSING,
  EXERCISE_DATA_PROCESSING,
  STUDY_CONSENT,
}

export enum ExercisePosition {
  STANDING,
  SEATED,
}

export enum MemberSort {
  DEFAULT = 'DEFAULT',
  LAST_LOGIN = 'LAST_LOGIN',
  TOTAL_APP_MINUTES = 'TOTAL_APP_MINUTES',
  EXERCISE_COMPLETIONS = 'EXERCISE_COMPLETIONS',
  BADGE_SCORE = 'BADGE_SCORE',
}

export enum SortDir {
  ASC = 'ASC',
  DESC = 'DESC',
}
