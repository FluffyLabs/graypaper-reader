import type { ISelectionParams } from "@fluffylabs/links-metadata";

export interface ILocationParams extends Partial<ISelectionParams> {
  version: string;
  search?: string;
  section?: string;
}

export type SearchParams = {
  rest: string;
  v?: string;
  search?: string;
  section?: string;
};
