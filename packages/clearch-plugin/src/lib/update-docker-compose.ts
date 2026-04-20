import yaml from 'js-yaml';

export type ComposeRoot = {
  services?: Record<string, unknown>;
  volumes?: Record<string, unknown>;
  networks?: Record<string, unknown>;
  [key: string]: unknown;
};

export function parseDockerCompose(content: string): ComposeRoot {
  const trimmed = content.trim();
  if (trimmed === '') {
    return {};
  }
  try {
    const doc = yaml.load(content) as unknown;
    if (doc === null || doc === undefined) {
      return {};
    }
    if (typeof doc !== 'object' || Array.isArray(doc)) {
      throw new Error('docker-compose root must be a mapping object');
    }
    return doc as ComposeRoot;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to parse docker-compose YAML: ${msg}`);
  }
}

/**
 * Merge services and volumes only when names are absent. Never removes or overwrites existing entries.
 */
export function mergeDockerCompose(existingContent: string | undefined, merge: {
  services?: Record<string, unknown>;
  volumes?: Record<string, unknown>;
}): string {
  const doc =
    existingContent !== undefined && existingContent.trim() !== ''
      ? parseDockerCompose(existingContent)
      : {};

  const next: ComposeRoot = { ...doc };
  next.services = { ...(doc.services ?? {}) };
  next.volumes = { ...(doc.volumes ?? {}) };

  if (merge.services) {
    for (const [name, def] of Object.entries(merge.services)) {
      if (next.services![name] !== undefined) {
        continue;
      }
      next.services![name] = def;
    }
  }

  if (merge.volumes) {
    for (const [name, def] of Object.entries(merge.volumes)) {
      if (next.volumes![name] !== undefined) {
        continue;
      }
      next.volumes![name] = def;
    }
  }

  if (Object.keys(next.volumes!).length === 0) {
    delete next.volumes;
  }

  return (
    yaml.dump(next, {
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
      flowLevel: -1,
    }) + '\n'
  );
}

/**
 * Load a compose fragment (e.g. full template file) and return only selected services and volumes.
 */
export function extractComposeServicesAndVolumes(
  yamlContent: string,
  serviceNames: string[],
  volumeNames: string[]
): { services: Record<string, unknown>; volumes: Record<string, unknown> } {
  const doc = parseDockerCompose(yamlContent);
  const services: Record<string, unknown> = {};
  const volumes: Record<string, unknown> = {};
  for (const name of serviceNames) {
    const s = doc.services?.[name];
    if (s !== undefined) {
      services[name] = s;
    }
  }
  for (const name of volumeNames) {
    const v = doc.volumes?.[name];
    if (v !== undefined) {
      volumes[name] = v;
    }
  }
  return { services, volumes };
}
