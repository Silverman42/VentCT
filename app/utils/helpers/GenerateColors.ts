export const GenerateColors = (index: number, total: number) => {
    // Distribute hues evenly across the color wheel
    const hue = (index * (360 / Math.max(total, 1))) % 360;
    const saturation = 60;
    const lightness = 85;
    const patternLightness = 95;

    const hslToHex = (h: number, s: number, l: number) => {
      l /= 100;
      const a = (s * Math.min(l, 1 - l)) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
          .toString(16)
          .padStart(2, "0");
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    const accentHslToHex = (h: number, s: number, l: number) => {
      l /= 100;
      const a = (s * Math.min(l, 1 - l)) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
          .toString(16)
          .padStart(2, "0");
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    return {
      color: hslToHex(hue, saturation, lightness),
      patternColor: hslToHex(hue, saturation, patternLightness),
      accentColor: accentHslToHex(hue, 100, 50),
    };
  };