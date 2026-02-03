import { DataPoint, PlotDimensions, PlotBounds } from './types';

// Utils for plotting

export const COLORS = ['#3b82f6', '#ef4444', '#10b93a'];
export const SHAPES = ['circle', 'square', 'triangle'] as const;
export type ShapeType = typeof SHAPES[number];

export const QUADRANT_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#10b93a',
  3: '#3b82f6',
  4: '#ffcd17'
};

export function calculateBounds(data: DataPoint[]): PlotBounds {
  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);
  const xMin = Math.min(...xValues), xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues), yMax = Math.max(...yValues);
  const xPad = (xMax - xMin) * 0.1, yPad = (yMax - yMin) * 0.1;
  
  return {
    xMin: xMin - xPad,
    xMax: xMax + xPad,
    yMin: yMin - yPad,
    yMax: yMax + yPad
  };
}

export function createScaler(bounds: PlotBounds, dims: PlotDimensions) {
  const scaleX = (x: number) => 
    dims.padding + ((x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * dims.plotWidth;
  
  const scaleY = (y: number) => 
    dims.height - dims.padding - ((y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * dims.plotHeight;
  
  return { scaleX, scaleY };
}

export function generateTicks(min: number, max: number, count = 8): number[] {
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + i * step);
}

export function euclideanDistance(p1: DataPoint, p2: DataPoint): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function findNearestNeighbors(data: DataPoint[], index: number, count = 5): number[] {
  return data
    .map((p, i) => ({ index: i, distance: i === index ? Infinity : euclideanDistance(data[index], p) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map(d => d.index);
}

export function getQuadrant(point: DataPoint, origin: DataPoint): number {
  if (point.x >= origin.x && point.y >= origin.y) return 1;
  if (point.x < origin.x && point.y >= origin.y) return 2;
  if (point.x < origin.x && point.y < origin.y) return 3;
  return 4;
}

export function createCategoryMaps(categories: string[]) {
  const colorMap: Record<string, string> = {};
  const shapeMap: Record<string, ShapeType> = {};
  categories.forEach((cat, i) => {
    colorMap[cat] = COLORS[i % COLORS.length];
    shapeMap[cat] = SHAPES[i % SHAPES.length];
  });
  return { colorMap, shapeMap };
}
