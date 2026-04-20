export function toPascalCase(input: string): string {
  return input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

export function toCamelCase(input: string): string {
  const pascal = toPascalCase(input);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function assertKebabCase(name: string, label: string): void {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
    throw new Error(
      `${label} must be kebab-case (lowercase letters, numbers, single hyphens). Got: "${name}"`
    );
  }
}

export function assertProjectName(name: string): void {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error(
      `Project name must start with a letter and contain only lowercase letters, numbers, and hyphens. Got: "${name}"`
    );
  }
}
