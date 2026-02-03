'use client';

import { useState, useMemo } from 'react';
import { DataPoint } from '../lib/types';
import { 
  calculateBounds, createScaler, generateTicks, findNearestNeighbors,
  getQuadrant, createCategoryMaps, QUADRANT_COLORS, ShapeType
} from '../lib/plotUtils';
import { renderShape } from './shapes';

interface Props {
  data: DataPoint[];
  width?: number;
  height?: number;
  padding?: number;
}

export default function ScatterPlot({ data, width = 700, height = 500, padding = 70 }: Props) {
  const [originIdx, setOriginIdx] = useState<number | null>(null);
  const [neighborIdx, setNeighborIdx] = useState<number | null>(null);
  const [neighbors, setNeighbors] = useState<number[]>([]);

  const categories = useMemo(() => [...new Set(data.map(d => d.category))], [data]);
  const { colorMap, shapeMap } = useMemo(() => createCategoryMaps(categories), [categories]);
  
  const bounds = useMemo(() => calculateBounds(data), [data]);
  const dims = { width, height, padding, plotWidth: width - 2 * padding, plotHeight: height - 2 * padding };
  const { scaleX, scaleY } = createScaler(bounds, dims);
  
  const xTicks = generateTicks(bounds.xMin, bounds.xMax);
  const yTicks = generateTicks(bounds.yMin, bounds.yMax);

  const handleClick = (idx: number) => {
    if (originIdx === idx) {
      setOriginIdx(null);
    } else {
      setOriginIdx(idx);
      setNeighbors([]);
      setNeighborIdx(null);
    }
  };

  const handleRightClick = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    if (neighborIdx === idx) {
      setNeighbors([]);
      setNeighborIdx(null);
    } else {
      setNeighbors(findNearestNeighbors(data, idx));
      setNeighborIdx(idx);
      setOriginIdx(null);
    }
  };

  const getPointStyle = (point: DataPoint, idx: number) => {
    let fill = colorMap[point.category];
    let stroke = '#374151';
    let strokeWidth = 1;

    if (neighbors.includes(idx)) {
      fill = '#ff00ff';
      strokeWidth = 2;
    } else if (originIdx !== null && idx !== originIdx) {
      fill = QUADRANT_COLORS[getQuadrant(point, data[originIdx])];
    }

    if (originIdx === idx || neighborIdx === idx) {
      stroke = '#000';
      strokeWidth = 3;
    }

    return { fill, stroke, strokeWidth };
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={width} height={height} className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Grid */}
        {xTicks.map((t, i) => (
          <line key={`xg${i}`} x1={scaleX(t)} y1={padding} x2={scaleX(t)} y2={height - padding} stroke="#f0f0f0" />
        ))}
        {yTicks.map((t, i) => (
          <line key={`yg${i}`} x1={padding} y1={scaleY(t)} x2={width - padding} y2={scaleY(t)} stroke="#f0f0f0" />
        ))}

        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#374151" strokeWidth="2" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#374151" strokeWidth="2" />

        {/* Ticks */}
        {xTicks.map((t, i) => (
          <g key={`xt${i}`}>
            <line x1={scaleX(t)} y1={height - padding} x2={scaleX(t)} y2={height - padding + 5} stroke="#374151" />
            <text x={scaleX(t)} y={height - padding + 18} textAnchor="middle" fontSize="11" fill="#6b7280">{t.toFixed(1)}</text>
          </g>
        ))}
        {yTicks.map((t, i) => (
          <g key={`yt${i}`}>
            <line x1={padding} y1={scaleY(t)} x2={padding - 5} y2={scaleY(t)} stroke="#374151" />
            <text x={padding - 8} y={scaleY(t)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#6b7280">{t.toFixed(1)}</text>
          </g>
        ))}

        {/* Origin lines when active */}
        {originIdx !== null && (
          <>
            <line x1={scaleX(data[originIdx].x)} y1={padding} x2={scaleX(data[originIdx].x)} y2={height - padding} stroke="#9ca3af" strokeWidth="2" strokeDasharray="6,4" />
            <line x1={padding} y1={scaleY(data[originIdx].y)} x2={width - padding} y2={scaleY(data[originIdx].y)} stroke="#9ca3af" strokeWidth="2" strokeDasharray="6,4" />
          </>
        )}

        {/* Data points */}
        {data.map((point, i) => {
          const { fill, stroke, strokeWidth } = getPointStyle(point, i);
          return (
            <g key={i} style={{ cursor: 'pointer' }} onClick={() => handleClick(i)} onContextMenu={e => handleRightClick(e, i)}>
              {renderShape(shapeMap[point.category] as ShapeType, { cx: scaleX(point.x), cy: scaleY(point.y), size: 7, fill, stroke, strokeWidth })}
              <title>{`(${point.x}, ${point.y}) - ${point.category}`}</title>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex gap-5 flex-wrap justify-center">
        {categories.map(cat => (
          <div key={cat} className="flex items-center gap-1.5">
            <svg width="20" height="20">
              {renderShape(shapeMap[cat] as ShapeType, { cx: 10, cy: 10, size: 6, fill: colorMap[cat], stroke: '#374151', strokeWidth: 1 })}
            </svg>
            <span className="text-sm text-gray-700">{cat}</span>
          </div>
        ))}
      </div>

      {/* Quadrant legend */}
      {originIdx !== null && (
        <div className="flex gap-3 flex-wrap justify-center text-xs text-gray-600">
          {[1, 2, 3, 4].map(q => (
            <div key={q} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: QUADRANT_COLORS[q] }} />
              <span>Q{q}</span>
            </div>
          ))}
        </div>
      )}

      {neighborIdx !== null && (
        <p className="text-xs text-gray-500">5 nearest neighbors shown in pink</p>
      )}
    </div>
  );
}
