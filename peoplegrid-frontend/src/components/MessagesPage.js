import React from 'react';

function MessagesPage() {
  const styles = {
    card: {
      backgroundColor: '#ffffff',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
      textAlign: 'center',
      color: '#65676b',
    },
    icon: {
      fontSize: '4rem',
      marginBottom: '1rem',
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.icon}>💬</div>
      <h1>Your Messages</h1>
      <p>The real-time chat feature will be implemented here.</p>
      <p>Stay tuned!</p>
    </div>
  );
}

export default MessagesPage;