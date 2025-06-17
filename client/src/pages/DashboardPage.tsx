import React from 'react';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  return (
    <div className="dashboard-container">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <ul className="menu-list space-y-4">
        <li>
          <Link to="/map" className="text-blue-500 hover:underline">
            Map
          </Link>
        </li>
        <li>
          <Link to="/tokens" className="text-blue-500 hover:underline">
            Token Management
          </Link>
        </li>
        <li>
          <Link to="/challenges" className="text-blue-500 hover:underline">
            Challenge Management
          </Link>
        </li>
        <li>
          <Link to="/statistics" className="text-blue-500 hover:underline">
            Customer Statistics
          </Link>
        </li>
        <li>
          <Link to="/profile" className="text-blue-500 hover:underline">
            Personal Profile
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default DashboardPage;
