import Svg, { Path } from 'react-native-svg';

type Props = {
  variant: 'far' | 'near';
  width: number;
  height: number;
};

export function TreeLine({ variant, width, height }: Props) {
  const fill = variant === 'far' ? '#1A3328' : '#0F241C';
  const d =
    variant === 'far'
      ? 'M0 220 C 40 180 50 90 80 90 C 70 40 110 30 120 80 C 150 20 200 50 190 120 C 240 70 280 110 270 170 C 320 90 370 140 360 200 L 400 220 L 400 260 L 0 260 Z'
      : 'M-20 240 C 20 200 30 80 70 90 C 60 20 120 10 130 80 C 170 -10 230 40 220 120 C 280 40 340 90 330 170 C 380 80 440 140 430 210 L 460 240 L 460 280 L -20 280 Z';

  return (
    <Svg width={width} height={height} viewBox={variant === 'far' ? '0 0 400 260' : '-20 0 480 280'}>
      <Path d={d} fill={fill} />
    </Svg>
  );
}
