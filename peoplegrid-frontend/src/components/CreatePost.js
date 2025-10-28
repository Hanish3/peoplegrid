import React, { useState } from 'react';
import './CreatePost.css';

// Accept the 'currentUser' prop passed down from App.js
function CreatePost({ currentUser, onCreatePost }) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    onCreatePost(content);
    setContent('');
  };

  // Use optional chaining (?.) in case currentUser hasn't loaded yet
  const placeholderText = currentUser?.username 
    ? `What's on your mind, ${currentUser.username}?` 
    : "What's on your mind?";

  return (
    <div className="card create-post">
      <div className="create-post-header">
        <img 
          src={currentUser?.profile_picture_url || 'https://i.pravatar.cc/50'} 
          alt="user" 
          className="avatar" 
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholderText}
        ></textarea>
      </div>
      <div className="create-post-actions">
        <button>📷 Photo/Video</button>
        <button>✍️ Blog Post</button>
        <button className="post-button" onClick={handleSubmit}>
          Post
        </button>
      </div>
    </div>
  );
}

export default CreatePost;