export function mapLabelNames(labels, labelNames) {
  return labelNames.map((name) => {
    return labels.find((l) => l.name === name) || { name, color: '000000' };
  });
}
