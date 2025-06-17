import React from 'react';

// Sample data for the leaderboard
const leaderboardData = [
  { id: 1, name: 'Alice', score: 1200 },
  { id: 2, name: 'Bob', score: 1100 },
  { id: 3, name: 'Charlie', score: 1050 },
  { id: 4, name: 'Diana', score: 1000 },
];

const LeaderboardPage: React.FC = () => {
  return (
    <div className="leaderboard-container">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Rank</th>
            <th className="border border-gray-300 px-4 py-2">Name</th>
            <th className="border border-gray-300 px-4 py-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((player, index) => (
            <tr key={player.id}>
              <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
              <td className="border border-gray-300 px-4 py-2">{player.name}</td>
              <td className="border border-gray-300 px-4 py-2 text-center">{player.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardPage;
