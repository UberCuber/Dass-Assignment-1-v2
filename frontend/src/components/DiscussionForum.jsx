import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiSend, FiBookmark, FiTrash2, FiSmile, FiCornerDownRight, FiX, FiBell, FiBellOff } from 'react-icons/fi';
import './DiscussionForum.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '😮', '😢', '🔥', '👏'];

const DiscussionForum = ({ eventId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(null);
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const notificationsRef = useRef(true);
    const userRef = useRef(user);

    // Keep refs in sync with state
    useEffect(() => { notificationsRef.current = notificationsEnabled; }, [notificationsEnabled]);
    useEffect(() => { userRef.current = user; }, [user]);

    useEffect(() => {
        // Fetch existing messages
        api.get(`/messages/${eventId}`).then(res => setMessages(res.data.messages || [])).catch(() => { });

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Connect socket
        const token = localStorage.getItem('token');
        const s = io(SOCKET_URL, { auth: { token } });

        s.on('connect', () => {
            setConnected(true);
            s.emit('join-event', eventId);
        });

        s.on('disconnect', () => setConnected(false));

        s.on('new-message', (msg) => {
            setMessages(prev => [...prev, msg]);
            // Send notification if message is from someone else
            if (msg.author?._id !== userRef.current?._id) {
                setUnreadCount(prev => prev + 1);
                const authorName = msg.author?.organizerName || `${msg.author?.firstName || ''} ${msg.author?.lastName || ''}`.trim();

                if (notificationsRef.current) {
                    // In-app toast notification (always works)
                    const label = msg.isAnnouncement ? `Announcement from ${authorName}` : `${authorName}`;
                    toast.info(`${label}: ${msg.content.substring(0, 80)}`, { autoClose: 4000 });

                    // Browser notification (if permitted, works when tab is in background)
                    if ('Notification' in window && Notification.permission === 'granted') {
                        const title = msg.isAnnouncement ? `Announcement from ${authorName}` : `New message from ${authorName}`;
                        new Notification(title, {
                            body: msg.content.substring(0, 100),
                            tag: `forum-${eventId}-${msg._id}`,
                        });
                    }
                }
            }
        });

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
        socket.emit('send-message', {
            eventId,
            content: newMessage,
            parentMessage: replyTo?._id || null,
            isAnnouncement: user?.role === 'organizer' ? isAnnouncement : false,
        });
        setNewMessage('');
        setReplyTo(null);
        setIsAnnouncement(false);
        setUnreadCount(0);
    };

    const pinMessage = (msg) => {
        socket?.emit('pin-message', { eventId, messageId: msg._id, currentPinned: msg.isPinned });
    };

    const deleteMessage = (msg) => {
        socket?.emit('delete-message', { eventId, messageId: msg._id });
    };

    const reactToMessage = (msg, emoji) => {
        socket?.emit('react-message', { eventId, messageId: msg._id, emoji });
        setShowEmojiPicker(null);
    };

    const getAuthorName = (author) => {
        if (author?.organizerName) return author.organizerName;
        return `${author?.firstName || ''} ${author?.lastName || ''}`.trim() || 'Unknown';
    };

    const pinnedMessages = messages.filter(m => m.isPinned);

    // Group replies under parent messages
    const topLevelMessages = messages.filter(m => !m.parentMessage);
    const getReplies = (parentId) => messages.filter(m =>
        m.parentMessage === parentId || m.parentMessage?._id === parentId
    );

    const renderMessage = (msg, isReply = false) => (
        <div key={msg._id} className={`message ${msg.isAnnouncement ? 'message-announcement' : ''} ${msg.isPinned ? 'message-pinned' : ''} ${isReply ? 'message-reply' : ''}`}>
            <div className="message-header">
                <span className={`author ${msg.author?.role === 'organizer' ? 'author-organizer' : ''}`}>
                    {getAuthorName(msg.author)}
                    {msg.author?.role === 'organizer' && <span className="organizer-tag">Organizer</span>}
                </span>
                {msg.isAnnouncement && <span className="announcement-tag">Announcement</span>}
                <span className="message-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <div className="message-actions">
                    {!isReply && (
                        <button className="msg-action-btn" onClick={() => setReplyTo(msg)} title="Reply">
                            <FiCornerDownRight />
                        </button>
                    )}
                    <button className="msg-action-btn" onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)} title="React">
                        <FiSmile />
                    </button>
                    {user?.role === 'organizer' && (
                        <>
                            <button className="msg-action-btn" onClick={() => pinMessage(msg)} title={msg.isPinned ? 'Unpin' : 'Pin'}>
                                <FiBookmark />
                            </button>
                            <button className="msg-action-btn" onClick={() => deleteMessage(msg)} title="Delete">
                                <FiTrash2 />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {msg.parentMessage && !isReply && (
                <div className="reply-context">
                    Replying to {getAuthorName(msg.parentMessage?.author)}
                </div>
            )}

            <p className="message-content">{msg.content}</p>

            {/* Emoji picker */}
            {showEmojiPicker === msg._id && (
                <div className="emoji-picker">
                    {EMOJI_LIST.map(emoji => (
                        <button key={emoji} className="emoji-option" onClick={() => reactToMessage(msg, emoji)}>
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {/* Reactions */}
            {msg.reactions?.length > 0 && (
                <div className="message-reactions">
                    {msg.reactions.map(r => (
                        <button key={r.emoji}
                            className={`reaction-btn ${r.users?.includes(user?._id) ? 'reacted' : ''}`}
                            onClick={() => reactToMessage(msg, r.emoji)}>
                            {r.emoji} {r.users?.length}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="detail-card forum-container">
            <div className="forum-header">
                <h3>Discussion Forum <span className={`connection-dot ${connected ? 'connected' : ''}`}></span></h3>
                <div className="forum-header-actions">
                    {unreadCount > 0 && <span className="unread-badge">{unreadCount} new</span>}
                    <button
                        className={`msg-action-btn ${notificationsEnabled ? '' : 'notifications-off'}`}
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        title={notificationsEnabled ? 'Mute notifications' : 'Enable notifications'}>
                        {notificationsEnabled ? <FiBell /> : <FiBellOff />}
                    </button>
                </div>
            </div>

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
                {topLevelMessages.map(msg => (
                    <div key={msg._id} className="message-thread">
                        {renderMessage(msg)}
                        {getReplies(msg._id).length > 0 && (
                            <div className="thread-replies">
                                {getReplies(msg._id).map(reply => renderMessage(reply, true))}
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Reply indicator */}
            {replyTo && (
                <div className="reply-indicator">
                    <FiCornerDownRight />
                    <span>Replying to <strong>{getAuthorName(replyTo.author)}</strong>: {replyTo.content.substring(0, 60)}...</span>
                    <button className="msg-action-btn" onClick={() => setReplyTo(null)}><FiX /></button>
                </div>
            )}

            <div className="message-input-bar">
                {user?.role === 'organizer' && (
                    <label className="announcement-toggle" title="Send as announcement">
                        <input type="checkbox" checked={isAnnouncement} onChange={e => setIsAnnouncement(e.target.checked)} />
                        <span className="announcement-label">Announce</span>
                    </label>
                )}
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    placeholder={replyTo ? 'Write a reply...' : isAnnouncement ? 'Write an announcement...' : 'Type a message...'}
                    className="message-input"
                    onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                <button className="btn btn-primary btn-send" onClick={sendMessage}><FiSend /></button>
            </div>
        </div>
    );
};

export default DiscussionForum;
