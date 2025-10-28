import React from 'react';
import './Post.css';
import { format } from 'timeago.js';

// Accept all necessary props: post, currentUser, onLike, onDelete
function Post({ post, currentUser, onLike, onDelete }) {
  // Check if the logged-in user is the author of the post
  const isAuthor = currentUser && currentUser.user_id === post.authorId;

  return (
    <div className="card post">
      <div className="post-header">
        <img src={post.avatar} alt={post.author} className="avatar" />
        <div>
          <div className="post-author">{post.author}</div>
          <div className="post-timestamp">{format(post.timestamp)}</div>
        </div>
        
        {/* Conditionally render the delete button only if the user is the author */}
        {isAuthor && (
          <button className="delete-button" onClick={() => onDelete(post.id)}>
            &times;
          </button>
        )}
      </div>
      <p className="post-content">{post.content}</p>
      
      <div className="post-stats">{post.likes} Likes</div>
      <div className="post-actions">
        <button
          className={`like-button ${post.isLiked ? 'liked' : ''}`}
          onClick={() => onLike(post.id)}
        >
          👍 Like
        </button>
        <button>💬 Comment</button>
        <button>↪️ Share</button>
      </div>
    </div>
  );
}

export default Post;