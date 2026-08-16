import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

export function AnimalSilhouettes() {
  return (
    <Svg width={260} height={90} viewBox="0 0 260 90">
      <Ellipse cx="36" cy="58" rx="18" ry="12" fill="#0F241C" />
      <Path d="M22 50 L 18 28 L 28 46" fill="#0F241C" />
      <Ellipse cx="90" cy="62" rx="16" ry="11" fill="#0F241C" />
      <Path d="M78 54 L 74 36 L 86 52" fill="#0F241C" />
      <Circle cx="140" cy="48" r="14" fill="#0F241C" />
      <Ellipse cx="140" cy="68" rx="12" ry="10" fill="#0F241C" />
      <Ellipse cx="196" cy="64" rx="14" ry="10" fill="#0F241C" />
      <Path d="M208 58 C 224 40, 216 30, 210 52" fill="#0F241C" />
      <Ellipse cx="236" cy="66" rx="10" ry="8" fill="#0F241C" />
    </Svg>
  );
}
