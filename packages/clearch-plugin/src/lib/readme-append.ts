export function appendReadmeSection(readme: string, marker: string, section: string): string {
  if (readme.includes(marker)) {
    return readme;
  }
  return `${readme.trimEnd()}\n\n${marker}\n\n${section.trim()}\n`;
}
