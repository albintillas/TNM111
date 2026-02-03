import { DataPoint } from './types';

// To read CSV file 
export function parseCSV(csvContent: string): DataPoint[] {
  return csvContent.trim().split('\n').map(line => {
    const [x, y, category] = line.split(',');
    return { x: parseFloat(x), y: parseFloat(y), category: category.trim() };
  });
}
