import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FriendsPage.css'; // We'll re-use the same CSS file

function UserSearch({ onFriendRequestSent }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchMessage, setSearchMessage] = useState('');

  // Debounce search query
  useEffect(() => {
    // Don't search for empty or very short strings
    if (query.trim().length < 2) {
      setResults([]);
      setSearchMessage('');
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchMessage('Searching...');
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:3001/api/users/search`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { query: query }
        });
        setResults(response.data);
        setSearchMessage(response.data.length === 0 ? 'No users found.' : '');
      } catch (err) {
        console.error("Search failed:", err);
        setSearchMessage('Search failed.');
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleAddFriend = async (targetUserId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:3001/api/friendships/request/${targetUserId}`,
        {}, // No body needed
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchMessage(`Request sent to user ${targetUserId}!`);
      onFriendRequestSent(); // Notify parent component
    } catch (err) {
      // Display the specific error from the backend
      const errorMsg = err.response?.data?.error || 'Failed to send request.';
      setSearchMessage(errorMsg);
      console.error(err);
    }
  };

  return (
    <div className="user-search-container card">
      <h2>Find Friends</h2>
      <input
        type="text"
        className="search-input"
        placeholder="Search for users by username..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="search-results">
        {results.map(user => (
          <div key={user.user_id} className="friend-card search-result">
            <div className="friend-info">
              <img 
                src={user.profile_picture_url || 'https://i.pravatar.cc/40'} 
                alt={user.username} 
                className="friend-avatar" 
              />
              <span className="friend-name">{user.username}</span>
            </div>
            <button 
              className="friend-action-btn add-btn"
              onClick={() => handleAddFriend(user.user_id)}
            >
              Add Friend
            </button>
          </div>
        ))}
        {searchMessage && <p className="search-message">{searchMessage}</p>}
      </div>
    </div>
  );
}

export default UserSearch;