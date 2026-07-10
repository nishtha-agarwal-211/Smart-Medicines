import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Bot, User, Trash2 } from 'lucide-react';
import { chatWithGemini } from '../utils/gemini';
import { useMedications } from '../context/MedicationContext';
import { useUserProfile } from '../context/UserProfileContext';

// ── Simple markdown renderer ─────────────────────────────────────────────────
function renderMarkdown(text) {
    if (!text) return '';

    let html = text
        // Escape HTML entities
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Bold: **text** or __text__
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        // Italic: *text* or _text_
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Inline code: `code`
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Headings: ### text
        .replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
        .replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>')
        // Unordered lists: - item or * item
        .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
        // Numbered lists: 1. item
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>.*?<\/li>)/gs, (match) => {
        return '<ul class="md-list">' + match + '</ul>';
    });
    // Fix nested <ul>
    html = html.replace(/<\/ul>\s*<ul class="md-list">/g, '');

    return '<p>' + html + '</p>';
}

// ── Typing dots animation ────────────────────────────────────────────────────
function TypingDots() {
    return (
        <div className="typing-dots">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
        </div>
    );
}

export default function ChatAssistant({ onNavigate }) {
    const { medications } = useMedications();
    const { profile } = useUserProfile();
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: '👋 Hi! I\'m your AI health assistant. I can help you with questions about your medications, side effects, drug interactions, and general health guidance. What would you like to know?',
            timestamp: new Date().toISOString()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (messageOverride) => {
        const userMessage = (messageOverride || input).trim();
        if (!userMessage || loading) return;

        setInput('');

        // Add user message with real timestamp
        setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }]);
        setLoading(true);

        try {
            // Get AI response
            const response = await chatWithGemini(userMessage, medications, profile);

            // Add assistant message with real timestamp
            setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date().toISOString() }]);
        } catch (error) {
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: '❌ Sorry, I encountered an error. Please try again or check your API key configuration.',
                    timestamp: new Date().toISOString()
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const [listening, setListening] = useState(false);

    const handleVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice input is not supported in this browser. Try Chrome or Edge.');
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setListening(true);
        recognition.onend = () => setListening(false);
        recognition.onerror = () => setListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => (prev ? prev + ' ' + transcript : transcript));
        };
        recognition.start();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearChat = () => {
        setMessages([
            {
                role: 'assistant',
                content: '👋 Chat cleared! How can I help you?',
                timestamp: new Date().toISOString()
            }
        ]);
    };

    const quickQuestions = medications.length > 0 ? [
        'Can I take these medications together?',
        'What should I do if I miss a dose?',
        'Any foods I should avoid?',
        'What are common side effects?'
    ] : [
        'How does medication management work?',
        'What is medication adherence?',
        'Tips for remembering medications?'
    ];

    // Auto-send quick questions
    const handleQuickQuestion = (question) => {
        handleSend(question);
    };

    return (
        <div className="chat-container">
            <header className="chat-header">
                <button className="btn-back" onClick={() => onNavigate('dashboard')}>
                    ← Back
                </button>
                <div className="chat-header-content">
                    <Bot size={24} className="chat-icon" />
                    <div>
                        <h2>AI Health Assistant</h2>
                        <p className="chat-subtitle">Powered by Google Gemini</p>
                    </div>
                </div>
                {messages.length > 1 && (
                    <button
                        className="btn-clear-chat"
                        onClick={handleClearChat}
                        title="Clear chat history"
                    >
                        <Trash2 size={16} />
                        <span>Clear</span>
                    </button>
                )}
            </header>

            <div className="chat-messages">
                {messages.map((message, index) => (
                    <div key={index} className={`message message-${message.role}`}>
                        <div className="message-avatar">
                            {message.role === 'assistant' ? (
                                <Bot size={20} />
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                        <div className="message-content">
                            <div className="message-bubble">
                                {message.role === 'assistant' ? (
                                    <div
                                        className="md-content"
                                        dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                                    />
                                ) : (
                                    message.content
                                )}
                            </div>
                            <span className="message-time">
                                {message.timestamp
                                    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : ''}
                            </span>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="message message-assistant">
                        <div className="message-avatar">
                            <Bot size={20} />
                        </div>
                        <div className="message-content">
                            <div className="message-bubble typing-indicator">
                                <TypingDots />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
                <div className="quick-questions">
                    <p className="quick-questions-label">Try asking:</p>
                    <div className="quick-questions-grid">
                        {quickQuestions.map((question, index) => (
                            <button
                                key={index}
                                className="quick-question-btn"
                                onClick={() => handleQuickQuestion(question)}
                            >
                                {question}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="chat-input-container">
                <textarea
                    className="chat-input"
                    placeholder="Ask about your medications..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={1}
                    disabled={loading}
                />
                <button
                    className={`btn-mic ${listening ? 'btn-mic-listening' : ''}`}
                    onClick={handleVoiceInput}
                    disabled={loading}
                    title={listening ? 'Listening…' : 'Speak your question'}
                >
                    <Mic size={20} />
                </button>
                <button
                    className="btn-send"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                >
                    <Send size={20} />
                </button>
            </div>

            <div className="chat-disclaimer">
                💡 This AI provides general guidance. Always consult your doctor for medical decisions.
            </div>
        </div>
    );
}
