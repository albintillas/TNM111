export interface DataPoint {
  x: number;
  y: number;
  category: string;
}

export interface PlotDimensions {
  width: number;
  height: number;
  padding: number;
  plotWidth: number;
  plotHeight: number;
}

export interface PlotBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}
