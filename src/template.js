export const fillTemplate = (template, data = {}) =>
  template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => data[key] ?? '');
