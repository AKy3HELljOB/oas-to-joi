export type SourceObject = Record<
  string,
  {
    refName?: string;
    method?: string;
    path?: string;
    definitions: Array<string>;
    references: Array<string>;
  }
>;
