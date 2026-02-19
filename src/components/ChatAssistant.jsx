import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Loader, Bot, User } from 'lucide-react';
import { chatWithGemini } from '../utils/gemini';
import { useMedications } from '../context/MedicationContext';

export default function ChatAssistant({ onNavigate }) {
    const { medications } = useMedications();
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: '👋 Hi! I\'m your AI health assistant. I can help you with questions about your medications, side effects, drug interactions, and general health guidance. What would you like to know?'
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

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            // Get AI response
            const response = await chatWithGemini(userMessage, medications);

            // Add assistant message
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: '❌ Sorry, I encountered an error. Please try again or check your API key configuration.'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
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

    const handleQuickQuestion = (question) => {
        setInput(question);
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
                                {message.content}
                            </div>
                            <span className="message-time">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                <Loader size={16} className="spinner" />
                                <span>AI is thinking...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
                <div className="quick-questions">
                    <p className="quick-questions-label">Quick questions:</p>
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
                    className="btn-send"
                    onClick={handleSend}
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
