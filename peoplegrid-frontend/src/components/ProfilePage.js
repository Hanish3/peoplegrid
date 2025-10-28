import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  // This function fetches the user's profile data from the backend
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfileData(response.data);
      setFormData(response.data); // Pre-fill form data for editing
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setLoading(false); // Stop loading even if there's an error
    }
  };

  // Fetch the profile when the component first loads
  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setPhotoFile(e.target.files[0]);
  };

  const handleSave = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('profilePhoto', photoFile);

        await axios.post('http://localhost:3001/api/profile/upload-photo', photoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
      }

      await axios.put('http://localhost:3001/api/profile', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsEditing(false);
      setPhotoFile(null);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
      console.error('Failed to update profile:', err);
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  const styles = {
    card: { backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.15)', maxWidth: '600px', margin: '0 auto' },
    avatar: { width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem', border: '4px solid #0d6efd' },
    username: { fontSize: '2rem', fontWeight: 'bold', margin: 0 },
    infoItem: { marginBottom: '1rem', color: '#65676b' },
    label: { fontWeight: 'bold', color: '#050505', display: 'block', marginBottom: '0.25rem' },
    button: { backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '6px', cursor: 'pointer', marginRight: '0.5rem' },
    input: { width: '100%', padding: '0.8rem', marginBottom: '1rem', borderRadius: '6px', border: '1px solid #ced0d4', boxSizing: 'border-box' },
  };

  return (
    <div style={styles.card}>
      <img
        src={profileData?.profile_picture_url || 'https://i.pravatar.cc/150'}
        alt="User Avatar"
        style={styles.avatar}
      />
      <h1 style={styles.username}>{isEditing ? formData.username : profileData?.username}</h1>
      <p style={styles.infoItem}>{profileData?.email}</p>

      {isEditing ? (
        <div>
          <label style={styles.label}>Profile Photo</label>
          <input type="file" accept="image/*" onChange={handleFileChange} style={{...styles.input, padding: '0.5rem'}} />

          <label style={styles.label}>Username</label>
          <input type="text" name="username" value={formData.username || ''} onChange={handleInputChange} style={styles.input} />

          <label style={styles.label}>Bio</label>
          <textarea name="bio" value={formData.bio || ''} onChange={handleInputChange} style={{...styles.input, minHeight: '80px'}}></textarea>
          
          <label style={styles.label}>Age</label>
          <input type="number" name="age" value={formData.age || ''} onChange={handleInputChange} style={styles.input} />

          <label style={styles.label}>Pronouns</label>
          <input type="text" name="pronouns" value={formData.pronouns || ''} onChange={handleInputChange} style={styles.input} placeholder="e.g., he/him, she/her" />
          
          <label style={styles.label}>Relationship Status</label>
          <input type="text" name="relationship_status" value={formData.relationship_status || ''} onChange={handleInputChange} style={styles.input} />

          {error && <p style={{ color: '#dc3545', marginBottom: '1rem' }}>{error}</p>}

          <button onClick={handleSave} style={styles.button}>Save</button>
          <button onClick={() => { setIsEditing(false); setError(''); }} style={{ ...styles.button, backgroundColor: '#6c757d' }}>Cancel</button>
        </div>
      ) : (
        <div>
          <div style={styles.infoItem}><span style={styles.label}>Bio:</span> {profileData?.bio || 'No bio set.'}</div>
          <div style={styles.infoItem}><span style={styles.label}>Age:</span> {profileData?.age || 'Not specified.'}</div>
          <div style={styles.infoItem}><span style={styles.label}>Pronouns:</span> {profileData?.pronouns || 'Not specified.'}</div>
          <div style={styles.infoItem}><span style={styles.label}>Status:</span> {profileData?.relationship_status || 'Not specified.'}</div>
          
          <button onClick={() => setIsEditing(true)} style={styles.button}>Edit Profile</button>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;