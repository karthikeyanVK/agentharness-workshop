// Terminal colors via Node's built-in styleText. Plain text when piped or NO_COLOR is set.
import { styleText } from "node:util";

export const green = (s: string): string => styleText("green", s);
export const red = (s: string): string => styleText("red", s);
export const yellow = (s: string): string => styleText("yellow", s);
export const cyan = (s: string): string => styleText("cyan", s);
