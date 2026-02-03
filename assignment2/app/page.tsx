import fs from 'fs/promises';
import path from 'path';
import ScatterPlot from './components/ScatterPlot';
import { parseCSV } from './lib/csvParser';

async function loadDataset(filename: string) {
  const filePath = path.join(process.cwd(), 'data', filename);
  const content = await fs.readFile(filePath, 'utf8');
  return parseCSV(content);
}

export default async function Home() {
  const [data1, data2] = await Promise.all([
    loadDataset('data1.csv'),
    loadDataset('data2.csv')
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <main className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-gray-800 mb-2">Scatterplot Visualization</h1>
          <p className="text-gray-500">
            <span className="font-medium">Left-click</span> a point to set as origin · <span className="font-medium">Right-click</span> to show nearest neighbors
          </p>
        </header>
        
        <div className="space-y-16">
          <section className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-medium text-gray-700 mb-6">Dataset 1</h2>
            <ScatterPlot data={data1} />
          </section>
          
          <section className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-medium text-gray-700 mb-6">Dataset 2</h2>
            <ScatterPlot data={data2} />
          </section>
        </div>
      </main>
    </div>
  );
}
