import { renderMathToString } from "./renderMathToString";

export function validateMath(str: string): null | string {
  try {
    renderMathToString(str);
    return null;
  } catch (e: unknown) {
    if (e instanceof Error) {
      return e.message;
    }

    return "Unkonwn error.";
  }
}
