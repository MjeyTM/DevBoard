export const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  const segment = () => Math.random().toString(16).slice(2, 10);
  return `${segment()}-${segment()}-${segment()}-${segment()}`;
};
