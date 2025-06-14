import React, { useState } from 'react';

const JsonToElectionTable = () => {
  const [rawJson, setRawJson] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');

  const handleParse = () => {
    try {
      const json = JSON.parse(rawJson);
      setParsedData(json);
      setError('');
    } catch (err) {
      setParsedData(null);
      setError('Invalid JSON format. Please check your input.');
    }
  };

  const handleCopyTable = () => {
    if (!parsedData || !parsedData.result) return;

    let tableTitle = parsedData.positionName || 'Election Result';
    let text = `${tableTitle}\n`;
    text += `Contest: ${parsedData.contestDetail}\n`;
    text += `Location: ${parsedData.contestLocationName}\n\n`;
    text += `Rank\tCandidate\tParty\tVotes\n`;

    parsedData.result.forEach((candidate) => {
      text += `${candidate.rank}\t${candidate.candidateName}\t${candidate.partyNameShort}\t${candidate.voteCount}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      alert(`Table copied to clipboard as "${tableTitle}"`);
    }).catch((err) => {
      console.error('Failed to copy:', err);
      alert('Failed to copy table.');
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Election Result Viewer</h1>

      <textarea
        rows={10}
        value={rawJson}
        onChange={(e) => setRawJson(e.target.value)}
        placeholder="Paste raw JSON here..."
        className="w-full p-4 border rounded-md font-mono mb-2"
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleParse}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Parse JSON
        </button>

        {parsedData && parsedData.result && (
          <button
            onClick={handleCopyTable}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Copy Table
          </button>
        )}
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {parsedData && parsedData.result && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{parsedData.positionName}</h2>
            <p><strong>Contest:</strong> {parsedData.contestDetail}</p>
            <p><strong>Location:</strong> {parsedData.contestLocationName}</p>
            {parsedData.timestamp && (
              <p className="text-sm text-gray-500">
                Updated: {new Date(parsedData.timestamp).toLocaleString()}
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border rounded-lg shadow">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 border-b">Rank</th>
                  <th className="text-left px-4 py-2 border-b">Candidate</th>
                  <th className="text-left px-4 py-2 border-b">Party</th>
                  <th className="text-right px-4 py-2 border-b">Votes</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.result.map((candidate, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b">{candidate.rank}</td>
                    <td className="px-4 py-2 border-b">{candidate.candidateName}</td>
                    <td className="px-4 py-2 border-b">{candidate.partyNameShort}</td>
                    <td className="px-4 py-2 border-b text-right">
                      {candidate.voteCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonToElectionTable;
