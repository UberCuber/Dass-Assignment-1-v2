import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiSend, FiBookmark, FiTrash2 } from 'react-icons/fi';
import './DiscussionForum.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

const DiscussionForum = ({ eventId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // Fetch existing messages
        api.get(`/messages/${eventId}`).then(res => setMessages(res.data.messages || [])).catch(() => { });

        // Connect socket
        const token = localStorage.getItem('token');
        const s = io(SOCKET_URL, { auth: { token } });

        s.on('connect', () => {
            setConnected(true);
            s.emit('join-event', eventId);
        });

        s.on('disconnect', () => setConnected(false));
        s.on('new-message', (msg) => setMessages(prev => [...prev, msg]));
        s.on('message-updated', (msg) => setMessages(prev => prev.map(m => m._id === msg._id ? msg : m)));
        s.on('message-deleted', (msgId) => setMessages(prev => prev.filter(m => m._id !== msgId)));

        setSocket(s);
        return () => { s.emit('leave-event', eventId); s.disconnect(); };
    }, [eventId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        if (!newMessage.trim() || !socket) return;
        socket.emit('send-message', { eventId, content: newMessage });
        setNewMessage('');
    };

    const pinMessage = (msg) => {
        socket?.emit('pin-message', { eventId, messageId: msg._id, currentPinned: msg.isPinned });
    };

    const deleteMessage = (msg) => {
        socket?.emit('delete-message', { eventId, messageId: msg._id });
    };

    const reactToMessage = (msg, emoji) => {
        socket?.emit('react-message', { eventId, messageId: msg._id, emoji });
    };

    const getAuthorName = (author) => {
        if (author?.organizerName) return author.organizerName;
        return `${author?.firstName || ''} ${author?.lastName || ''}`.trim() || 'Unknown';
    };

    const pinnedMessages = messages.filter(m => m.isPinned);

    return (
        <div className="detail-card forum-container">
            <h3>Discussion Forum <span className={`connection-dot ${connected ? 'connected' : ''}`}></span></h3>

            {pinnedMessages.length > 0 && (
                <div className="pinned-section">
                    <h4><FiBookmark /> Pinned</h4>
                    {pinnedMessages.map(msg => (
                        <div key={msg._id} className="pinned-msg">
                            <strong>{getAuthorName(msg.author)}</strong>: {msg.content}
                        </div>
                    ))}
                </div>
            )}

            <div className="messages-list">
                {messages.map(msg => (
                    <div key={msg._id} className={`message ${msg.isAnnouncement ? 'message-announcement' : ''} ${msg.isPinned ? 'message-pinned' : ''}`}>
                        <div className="message-header">
                            <span className={`author ${msg.author?.role === 'organizer' ? 'author-organizer' : ''}`}>
                                {getAuthorName(msg.author)}
                            </span>
                            <span className="message-time">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                            {user?.role === 'organizer' && (
                                <div className="message-actions">
                                    <button className="msg-action-btn" onClick={() => pinMessage(msg)} title="Pin"><FiBookmark /></button>
                                    <button className="msg-action-btn" onClick={() => deleteMessage(msg)} title="Delete"><FiTrash2 /></button>
                                </div>
                            )}
                        </div>
                        <p className="message-content">{msg.content}</p>
                        <div className="message-reactions">
                            {['+1', 'like', 'ha', 'wow'].map(emoji => {
                                const reaction = msg.reactions?.find(r => r.emoji === emoji);
                                return (
                                    <button key={emoji} className={`reaction-btn ${reaction?.users?.includes(user?._id) ? 'reacted' : ''}`}
                                        onClick={() => reactToMessage(msg, emoji)}>
                                        {emoji} {reaction?.users?.length || ''}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="message-input-bar">
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..." className="message-input"
                    onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                <button className="btn btn-primary btn-send" onClick={sendMessage}><FiSend /></button>
            </div>
        </div>
    );
};

export default DiscussionForum;
