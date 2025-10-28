export const VERSION_SEGMENT_INDEX = 0;
export const SELECTION_SEGMENT_INDEX = 1;
export const SEGMENT_SEPARATOR = "/";
export const SELECTION_DECOMPOSE_PATTERN = /[0-9A-F]{6}/gi;
export const SHORT_COMMIT_HASH_LENGTH = 7; // as many as git uses for `git rev-parse --short`
export const BASE64_VALIDATION_REGEX = /^#[-A-Za-z0-9+/]*={0,3}$/;
