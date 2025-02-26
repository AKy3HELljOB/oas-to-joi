export type SourceObject = Record<
  string,
  {
    isObject?: boolean;
    match?: "all" | "any" | "one";
    refName?: string;
    method?: string;
    path?: string;
    definitions: Array<string>;
    references: Array<string>;
  }
>;
