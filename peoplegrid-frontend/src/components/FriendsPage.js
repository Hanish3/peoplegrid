import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserSearch from './UserSearch'; // We will create this next
import './FriendsPage.css'; // And this one

// --- Friend Card Component ---
const FriendCard = ({ friend, onRemoveFriend }) => {
  return (
    <div className="friend-card">
      <div className="friend-info">
        <img 
          src={friend.friend_avatar || 'https://i.pravatar.cc/40'} 
          alt={friend.friend_username} 
          className="friend-avatar" 
        />
        <span className="friend-name">{friend.friend_username}</span>
      </div>
      <button 
        className="friend-action-btn remove-btn" 
        onClick={() => onRemoveFriend(friend.friendship_id)}
      >
        Remove
      </button>
    </div>
  );
};

// --- Friend Request Card Component ---
const FriendRequestCard = ({ request, onRespond }) => {
  return (
    <div className="friend-card request-card">
      <div className="friend-info">
        <img 
          src={request.sender_avatar || 'https://i.pravatar.cc/40'} 
          alt={request.sender_username} 
          className="friend-avatar" 
        />
        <span className="friend-name">{request.sender_username}</span>
      </div>
      <div className="friend-actions">
        <button 
          className="friend-action-btn accept-btn"
          onClick={() => onRespond(request.friendship_id, 'accept')}
        >
          Accept
        </button>
        <button 
          className="friend-action-btn reject-btn"
          onClick={() => onRespond(request.friendship_id, 'reject')}
        >
          Reject
        </button>
      </div>
    </div>
  );
};

// --- Main Friends Page Component ---
function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [triggerFetch, setTriggerFetch] = useState(0); // Helper state to trigger re-fetch

  const getToken = () => localStorage.getItem('token');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    const token = getToken();
    try {
      const [friendsRes, pendingRes] = await Promise.all([
        axios.get('http://localhost:3001/api/friendships', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:3001/api/friendships/pending', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setFriends(friendsRes.data);
      setPendingRequests(pendingRes.data);
    } catch (err) {
      setError('Failed to load friend data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when triggerFetch changes
  useEffect(() => {
    fetchData();
  }, [triggerFetch]);

  // Handler for accepting or rejecting a friend request
  const handleRespondToRequest = async (friendshipId, action) => {
    try {
      const token = getToken();
      await axios.put(`http://localhost:3001/api/friendships/respond/${friendshipId}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh data after responding
      setTriggerFetch(prev => prev + 1); 
    } catch (err) {
      setError(`Failed to ${action} request.`);
      console.error(err);
    }
  };

  // Handler for removing a friend
  const handleRemoveFriend = async (friendshipId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) {
      return;
    }
    try {
      const token = getToken();
      await axios.delete(`http://localhost:3001/api/friendships/${friendshipId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh data after removing
      setTriggerFetch(prev => prev + 1);
    } catch (err) {
      setError('Failed to remove friend.');
      console.error(err);
    }
  };

  // Handler to refresh list when a new request is sent from UserSearch
  const onFriendRequestSent = () => {
    // You could just show a "Request Sent" message
    // or re-fetch all data if your API logic changes status instantly
    console.log("Friend request sent!");
  };

  if (loading) return <div className="friends-container card">Loading...</div>;
  
  return (
    <>
      <UserSearch onFriendRequestSent={onFriendRequestSent} />

      <div className="friends-container card">
        <h2>Friend Requests</h2>
        {error && <p className="error-message">{error}</p>}
        {pendingRequests.length > 0 ? (
          pendingRequests.map(req => (
            <FriendRequestCard
              key={req.friendship_id}
              request={req}
              onRespond={handleRespondToRequest}
            />
          ))
        ) : (
          <p>No pending friend requests.</p>
        )}
      </div>
      
      <div className="friends-container card">
        <h2>Your Friends</h2>
        {friends.length > 0 ? (
          friends.map(friend => (
            <FriendCard
              key={friend.friendship_id}
              friend={friend}
              onRemoveFriend={handleRemoveFriend}
            />
          ))
        ) : (
          <p>You haven't added any friends yet. Use the search above to find people!</p>
        )}
      </div>
    </>
  );
}

export default FriendsPage;