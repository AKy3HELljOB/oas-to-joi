import { SourceObject } from "../types/source-object.type";

// нормализация: убрать дубли + сортировать, чтобы сравнивать по значению, а не по ссылке/порядку
function normalizeStringArray(arr: readonly string[]): string[] {
  return [...new Set(arr)].sort();
}

// собрать “подпись” объекта только по definitions/references (по всем вложенным record-значениям)
function signatureByDefsRefs(obj: SourceObject): string {
  const defs: string[] = [];
  const refs: string[] = [];

  for (const v of Object.values(obj)) {
    defs.push(...(v.definitions ?? []));
    refs.push(...(v.references ?? []));
  }

  const defsN = normalizeStringArray(defs);
  const refsN = normalizeStringArray(refs);

  // строковая сигнатура для быстрого сравнения
  return `d:${defsN.join("\u0001")}|r:${refsN.join("\u0001")}`;
}

// найти первый совпадающий элемент
export function findSourceObjectName(
  haystack: SourceObject[],
  needle: SourceObject,
): string | undefined {
  const sig = signatureByDefsRefs(needle);
  return Object.keys(
    haystack.find((item) => signatureByDefsRefs(item) === sig) || {},
  )[0];
}

// если нужен индекс:
export function findSourceObjectIndex(
  haystack: SourceObject[],
  needle: SourceObject,
): number {
  const sig = signatureByDefsRefs(needle);
  return haystack.findIndex((item) => signatureByDefsRefs(item) === sig);
}
