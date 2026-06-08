/** Déplace un élément de `from` vers `to` (indices du tableau résultant). */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (to > items.length - 1) {
    next.push(item);
  } else {
    next.splice(to, 0, item);
  }
  return next;
}

/** Réindexe un index de sélection après un moveItem(from, to). */
export function remapIndex(
  index: number | null,
  from: number,
  to: number,
): number | null {
  if (index === null || from === to) return index;
  if (index === from) return to;
  if (from < to) {
    if (index > from && index <= to) return index - 1;
    return index;
  }
  if (index >= to && index < from) return index + 1;
  return index;
}
