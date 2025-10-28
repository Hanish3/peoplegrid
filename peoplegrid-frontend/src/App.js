import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import CreatePost from './components/CreatePost';
import Post from './components/Post';
import ProfilePage from './components/ProfilePage';
import MessagesPage from './components/MessagesPage';
import FriendsPage from './components/FriendsPage';
import CampusGroupsPage from './components/CampusGroupsPage';
import './App.css';

function App() {
    const [token, setToken] = useState(null);
    const [posts, setPosts] = useState([]);
    const [activeView, setActiveView] = useState('feed');
    const [currentUser, setCurrentUser] = useState(null);

    const fetchPosts = async () => {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) return;
        try {
            const response = await axios.get('http://localhost:3001/api/posts', {
                headers: { Authorization: `Bearer ${currentToken}` }
            });
            
            const formattedPosts = response.data.map(post => ({
                id: post.post_id,
                author: post.username,
                authorId: post.user_id,
                avatar: post.profile_picture_url || 'https://i.pravatar.cc/50',
                // --- THE FIX: Pass the raw timestamp string directly ---
                timestamp: post.created_at, 
                content: post.content,
                likes: 0,
                isLiked: false,
            }));
            setPosts(formattedPosts);
        } catch (error) {
            console.error("Failed to fetch posts", error);
        }
    };

    const fetchUserProfile = async (currentToken) => {
        if (!currentToken) return;
        try {
            const response = await axios.get('http://localhost:3001/api/profile', { 
                headers: { Authorization: `Bearer ${currentToken}` } 
            });
            setCurrentUser(response.data);
        } catch (error) { 
            console.error("Could not fetch user profile", error); 
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            fetchUserProfile(storedToken);
            fetchPosts();
        }
    }, []);

    const handleLoginSuccess = (receivedToken) => {
        localStorage.setItem('token', receivedToken);
        setToken(receivedToken);
        fetchUserProfile(receivedToken);
        fetchPosts();
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setCurrentUser(null);
    };

    const handleCreatePost = async (content) => {
        if (!content.trim()) return;
        try {
            await axios.post('http://localhost:3001/api/posts', 
                { content },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchPosts();
        } catch (error) {
            console.error("Failed to create post", error);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) {
            return;
        }
        try {
            await axios.delete(`http://localhost:3001/api/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPosts();
        } catch (error) {
            console.error("Failed to delete post", error);
            alert("You are not authorized to delete this post.");
        }
    };

    const handleLikePost = (postId) => {
        console.log("Like functionality to be added for post:", postId);
    };

    const RenderActiveView = () => {
        switch (activeView) {
            case 'feed': 
                return (
                    <>
                        <CreatePost currentUser={currentUser} onCreatePost={handleCreatePost} />
                        {posts.map(post => (
                            <Post 
                                key={post.id} 
                                post={post} 
                                currentUser={currentUser}
                                onDelete={handleDeletePost} 
                                onLike={handleLikePost} 
                            />
                        ))}
                    </>
                );
            case 'profile': 
                return <ProfilePage />;
            case 'messages': 
                return <MessagesPage />;
            case 'friends': 
                return <FriendsPage />;
            case 'groups': 
                return <CampusGroupsPage />;
            default: 
                return <div>Page not found.</div>;
        }
    };

    if (!token) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="App">
            <Header onLogout={handleLogout} />
            <main className="main-content">
                <aside className="left-sidebar">
                    <h4>Navigation</h4>
                    <ul className="nav-list">
                        <li className={activeView === 'feed' ? 'active' : ''} onClick={() => setActiveView('feed')}>🏠 Home Feed</li>
                        <li className={activeView === 'profile' ? 'active' : ''} onClick={() => setActiveView('profile')}>👤 My Profile</li>
                        <li className={activeView === 'messages' ? 'active' : ''} onClick={() => setActiveView('messages')}>💬 Messages</li>
                        <li className={activeView === 'friends' ? 'active' : ''} onClick={() => setActiveView('friends')}>👥 Friends</li>
                        <li className={activeView === 'groups' ? 'active' : ''} onClick={() => setActiveView('groups')}>🏛️ Campus Groups</li>
                    </ul>
                </aside>
                <section className="feed">
                    <RenderActiveView />
                </section>
                <aside className="right-sidebar">
                    <div className="card right-sidebar-card">
                        <h3>Friends Online</h3>
                        <ul className="friend-list">
                            <li>Priya Sharma</li>
                            <li>Amit Singh</li>
                        </ul>
                    </div>
                </aside>
            </main>
        </div>
    );
}

export default App;