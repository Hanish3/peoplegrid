import React from 'react';

// A simple component for an individual group card
const GroupCard = ({ name, description }) => {
  const styles = {
    card: {
      backgroundColor: '#f0f2f5',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
      borderLeft: '4px solid #0d6efd',
    },
    name: {
      fontWeight: 'bold',
      fontSize: '1.2rem',
      margin: '0 0 0.5rem 0',
    },
  };
  return (
    <div style={styles.card}>
      <h3 style={styles.name}>{name}</h3>
      <p>{description}</p>
    </div>
  );
};

// The main component for the Campus Groups page
function CampusGroupsPage() {
  const styles = {
    container: {
      backgroundColor: '#ffffff',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
    },
  };

  // Dummy data for campus groups
  const groups = [
    { name: 'NIAT Coding Club', description: 'Weekly meetups for algorithms, data structures, and hackathons.' },
    { name: 'AI & Machine Learning Enthusiasts', description: 'Discussions, projects, and paper readings on all things AI.' },
    { name: 'Campus Photography Group', description: 'Join us for photo walks, workshops, and sharing your work.' },
  ];

  return (
    <div style={styles.container}>
      <h1>Campus Groups</h1>
      {groups.map(group => (
        <GroupCard key={group.name} name={group.name} description={group.description} />
      ))}
    </div>
  );
}

export default CampusGroupsPage;