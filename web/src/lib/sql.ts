export function quoteIdent(ident: string): string {
  const escaped = ident.replaceAll('"', '""');
  return `"${escaped}"`;
}

export function quoteStringLiteral(value: string): string {
  const escaped = value.replaceAll("'", "''");
  return `'${escaped}'`;
}
