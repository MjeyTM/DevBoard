export const extractNoteLinks = (content: string) => {
  const matches = content.match(/\[\[([^\]]+)\]\]/g) ?? [];
  return matches.map((match) => match.replace("[[", "").replace("]]", "").trim());
};
