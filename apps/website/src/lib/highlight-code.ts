const tokenPattern = /(\/\/[^\n]*|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\b(?:import|from|const|let|return|new|true|false)\b|\b[A-Za-z_$][\w$]*(?=\s*\())/gm;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

export function highlightCode(source: string) {
  let cursor = 0;
  let html = '';

  for (const match of source.matchAll(tokenPattern)) {
    const token = match[0];
    const index = match.index ?? cursor;
    html += escapeHtml(source.slice(cursor, index));
    const kind = token.startsWith('//')
      ? 'code-comment'
      : token.startsWith("'") || token.startsWith('"')
        ? 'code-string'
        : /^(import|from|const|let|return|new|true|false)$/.test(token)
          ? 'code-keyword'
          : 'code-function';
    html += `<span class="${kind}">${escapeHtml(token)}</span>`;
    cursor = index + token.length;
  }

  return html + escapeHtml(source.slice(cursor));
}
