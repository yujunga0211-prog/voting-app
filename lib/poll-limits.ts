// Poll 입력 한도. 클라이언트 폼도 쓰므로 DB 코드가 없는 별도 파일에 둔다. 검증은 서버(polls 모듈)가 한다.
export const QUESTION_MAX_LENGTH = 200;
export const OPTION_MAX_LENGTH = 100;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;
export const MAX_CLOSING_DAYS = 30;
export const DEFAULT_CLOSING_DAYS = 3;
