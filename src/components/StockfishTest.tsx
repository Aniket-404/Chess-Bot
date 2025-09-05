'use client';

import { useState } from 'react';
import { runEngineTests } from '@/lib';

export default function StockfishTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    // Capture console.log output
    const originalLog = console.log;
    const logs: string[] = [];
    
    console.log = (...args) => {
      const message = args.join(' ');
      logs.push(message);
      setTestResults(prev => [...prev, message]);
      originalLog(...args);
    };

    try {
      await runEngineTests();
    } catch (error) {
      const errorMessage = `❌ Error: ${error}`;
      logs.push(errorMessage);
      setTestResults(prev => [...prev, errorMessage]);
    } finally {
      console.log = originalLog;
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Stockfish Engine Test</h1>
      
      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded font-semibold"
        >
          {isLoading ? 'Running Tests...' : 'Run Stockfish Tests'}
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
        {testResults.length === 0 ? (
          <p className="text-gray-500">Click &ldquo;Run Stockfish Tests&rdquo; to start testing</p>
        ) : (
          <div className="space-y-2 font-mono text-sm">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-2 rounded ${
                  result.includes('✅') ? 'bg-green-100 text-green-800' :
                  result.includes('❌') ? 'bg-red-100 text-red-800' :
                  result.includes('🧪') || result.includes('🎉') ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-200'
                }`}
              >
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
