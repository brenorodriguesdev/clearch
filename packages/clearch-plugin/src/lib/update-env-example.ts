/**
 * Line-based .env / .env.example merging: never duplicate keys; never overwrite user values
 * unless replaceOnlyIfValueIn matches the current value.
 */

export type EnvLineSpec = {
  key: string;
  value: string;
  /** If the key exists and its current value is one of these, replace with `value`. */
  replaceOnlyIfValueIn?: string[];
};

function normalizeNewlines(s: string): string {
  return s.replace(/\r\n/g, '\n');
}

function parseEnvValue(line: string): string | null {
  const t = line.trim();
  if (t.startsWith('#') || t === '') {
    return null;
  }
  const eq = t.indexOf('=');
  if (eq <= 0) {
    return null;
  }
  return t.slice(eq + 1).trim();
}

function parseEnvKey(line: string): string | null {
  const t = line.trim();
  if (t.startsWith('#') || t === '') {
    return null;
  }
  const eq = t.indexOf('=');
  if (eq <= 0) {
    return null;
  }
  return t.slice(0, eq).trim();
}

function existingKeys(lines: string[]): Set<string> {
  const s = new Set<string>();
  for (const line of lines) {
    const k = parseEnvKey(line);
    if (k) {
      s.add(k);
    }
  }
  return s;
}

/**
 * Merge env specs into content. Appends missing keys at end (optional grouped comment once).
 * If key exists and replaceOnlyIfValueIn matches current value, replaces that line in place.
 */
export function mergeEnvExample(
  content: string,
  specs: EnvLineSpec[],
  options?: { groupComment?: string }
): string {
  const nl = normalizeNewlines(content);
  const lines = nl.trim() === '' ? [] : nl.split('\n');
  const toAppend: string[] = [];
  const appendKeys = new Set<string>();

  for (const spec of specs) {
    const idx = lines.findIndex((ln) => parseEnvKey(ln) === spec.key);
    if (idx === -1) {
      if (!appendKeys.has(spec.key)) {
        toAppend.push(`${spec.key}=${spec.value}`);
        appendKeys.add(spec.key);
      }
      continue;
    }
    const cur = parseEnvValue(lines[idx]);
    if (cur !== null && spec.replaceOnlyIfValueIn?.includes(cur)) {
      lines[idx] = `${spec.key}=${spec.value}`;
    }
  }

  let out = lines.join('\n').trimEnd();
  if (toAppend.length > 0) {
    const c = options?.groupComment?.trim();
    if (c) {
      const line = c.startsWith('#') ? c : `# ${c}`;
      if (!lines.some((l) => l.trim() === line)) {
        out += `\n\n${line}`;
      }
    }
    out += `\n${toAppend.join('\n')}`;
  }
  return `${out}\n`;
}

/**
 * True if KEY= appears (ignoring comments).
 */
export function envExampleHasKey(content: string, key: string): boolean {
  return existingKeys(normalizeNewlines(content).split('\n')).has(key);
}
