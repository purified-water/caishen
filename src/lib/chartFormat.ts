export const COLOR = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  yellow: "#eda100",
  magenta: "#e87ba4",
  muted: "#898781",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
};

export const CATEGORY_COLORS = [
  COLOR.blue,
  COLOR.orange,
  COLOR.aqua,
  COLOR.yellow,
  COLOR.magenta,
];

export function formatCurrency(value: number) {
  return value.toLocaleString("en-US");
}
