import React from 'react';

// Sample user profile data
const userProfile = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://via.placeholder.com/150',
  bio: 'Passionate gamer and leaderboard enthusiast.',
};

const ProfilePage: React.FC = () => {
  return (
    <div className="profile-container">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <div className="flex items-center mb-4">
        <img
          src={userProfile.avatar}
          alt="User Avatar"
          className="w-24 h-24 rounded-full mr-4"
        />
        <div>
          <h2 className="text-xl font-semibold">{userProfile.name}</h2>
          <p className="text-gray-600">{userProfile.email}</p>
        </div>
      </div>
      <p className="text-gray-800">{userProfile.bio}</p>
    </div>
  );
};

export default ProfilePage;
