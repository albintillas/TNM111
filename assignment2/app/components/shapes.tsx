import { ShapeType } from '../lib/plotUtils';

interface ShapeProps {
  cx: number;
  cy: number;
  size: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export function renderShape(shape: ShapeType, props: ShapeProps) {
  const { cx, cy, size, fill, stroke, strokeWidth } = props;

  if (shape === 'circle') {
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={size} 
        fill={fill} 
        opacity={0.8} 
        stroke={stroke} 
        strokeWidth={strokeWidth} 
      />
    );
  }

  if (shape === 'square') {
    return (
      <rect 
        x={cx - size} 
        y={cy - size} 
        width={size * 2} 
        height={size * 2} 
        fill={fill} 
        opacity={0.8} 
        stroke={stroke} 
        strokeWidth={strokeWidth} 
      />
    );
  }

  if (shape === 'triangle') {
    const topX = cx;
    const topY = cy - size;
    const bottomRightX = cx + size;
    const bottomRightY = cy + size;
    const bottomLeftX = cx - size;
    const bottomLeftY = cy + size;
    const trianglePath = `M ${topX},${topY} L ${bottomRightX},${bottomRightY} L ${bottomLeftX},${bottomLeftY} Z`;
    
    return (
      <path 
        d={trianglePath} 
        fill={fill} 
        opacity={0.8} 
        stroke={stroke} 
        strokeWidth={strokeWidth} 
      />
    );
  }

  return null;
}
