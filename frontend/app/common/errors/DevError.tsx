import React from 'react';

interface DevErrorProps {
  error: Error;
}

export function DevError({ error }: DevErrorProps) {
  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Development Error</h1>
      <p className="text-gray-700 mb-4">{error.message}</p>
      {error.stack && (
        <pre className="w-full p-4 bg-gray-100 rounded-lg overflow-x-auto text-sm">
          <code>{error.stack}</code>
        </pre>
      )}
    </main>
  );
}
