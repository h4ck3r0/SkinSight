import React, { useState } from 'react';

const ChatWidget = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const questionCategories = [
        {
            title: "Medical Reports",
            questions: [
                {
                    text: "Help me analyze a medical report",
                    action: () => setInput("Can you help me analyze a medical report?")
                },
                {
                    text: "Understand test results",
                    action: () => setInput("Can you help me understand these test results?")
                }
            ]
        },
        {
            title: "Health Insights",
            questions: [
                {
                    text: "Explain blood test results",
                    action: () => setInput("What do these blood test values indicate?")
                },
                {
                    text: "Interpret diagnostic reports",
                    action: () => setInput("Can you interpret these diagnostic findings?")
                }
            ]
        },
        {
            title: "Healthcare Navigation",
            questions: [
                {
                    text: "Find nearby specialists",
                    action: () => setInput("Can you help me find specialists near me?")
                }
            ]
        }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        try {
            setLoading(true);
            const userMessage = input.trim();
            setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
            setInput('');

            // Use production API URL
            const baseUrl = import.meta.env.VITE_API_URL || 'https://mycarebridge.onrender.com';
            const apiUrl = `${baseUrl}/api/chat`;
            
            console.log('Sending chat request to:', apiUrl);
            console.log('Request payload:', { message: userMessage });
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage }),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Response data:', data);
            
            if (!response.ok) {
                console.error('API Error:', data);
                throw new Error(data.error || data.details || 'Failed to get response');
            }

            setMessages(prev => [...prev, { type: 'bot', text: data.response }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { 
                type: 'error', 
                text: `Error: ${error.message || 'Failed to process your message. Please try again.'}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size and type
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setMessages(prev => [...prev, { 
                type: 'error', 
                text: 'File size too large. Please upload an image under 5MB.' 
            }]);
            return;
        }

        if (!file.type.startsWith('image/')) {
            setMessages(prev => [...prev, { 
                type: 'error', 
                text: 'Please upload an image file (JPEG, PNG, etc.)' 
            }]);
            return;
        }

        try {
            setLoading(true);
            const reader = new FileReader();
            
            reader.onloadend = async () => {
                const base64Image = reader.result.split(',')[1];
                setMessages(prev => [...prev, { 
                    type: 'user', 
                    text: 'Analyzing uploaded image...', 
                    image: reader.result 
                }]);

                // Use production API URL
                const baseUrl = import.meta.env.VITE_API_URL || 'https://mycarebridge.onrender.com';
                const apiUrl = `${baseUrl}/api/analyze-image`;
                
                console.log('Sending image analysis request to:', apiUrl);
                console.log('Image data length:', base64Image.length);
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ image: base64Image }),
                });

                console.log('Image analysis response status:', response.status);

                // Handle non-JSON responses
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    console.error('Non-JSON response:', text);
                    throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log('Image analysis response data:', data);
                
                if (!response.ok) {
                    console.error('Image analysis API Error:', data);
                    throw new Error(data.error || data.details || 'Failed to analyze image');
                }

                setMessages(prev => [...prev, {
                    type: 'bot',
                    text: data.analysis,
                    extractedText: data.text
                }]);
            };

            reader.onerror = () => {
                throw new Error('Failed to read the image file.');
            };

            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Image analysis error:', error);
            setMessages(prev => [...prev, { 
                type: 'error', 
                text: `Error: ${error.message || 'Failed to analyze image. Please try again.'}` 
            }]);
        } finally {
            setLoading(false);
            setSelectedImage(null);
            e.target.value = ''; // Reset file input
        }
    };

    const toggleChat = () => {
        setIsExpanded(!isExpanded);
    };

    if (!isExpanded) {
        return (
            <button 
                onClick={toggleChat}
                className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
                aria-label="Open chat"
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                    />
                </svg>
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                <h3 className="text-lg font-semibold">Chat Assistant</h3>
                <button
                    onClick={toggleChat}
                    className="text-white hover:text-gray-200 focus:outline-none"
                    aria-label="Close chat"
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-6 w-6" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M6 18L18 6M6 6l12 12" 
                        />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="space-y-3">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-semibold text-blue-600 mb-3">
                                Welcome to CareBridge Assistant
                            </h3>
                            <p className="text-gray-600 text-sm px-4">
                                I can help you understand medical reports, find healthcare providers, and more.
                            </p>
                        </div>
                        {questionCategories.map((category, categoryIdx) => (
                            <div key={categoryIdx} className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-800 mb-3 px-1">
                                    {category.title}
                                </h4>
                                <div className="space-y-2">
                                    {category.questions.map((question, questionIdx) => (
                                        <button
                                            key={questionIdx}
                                            onClick={() => {
                                                question.action();
                                                document.querySelector('input[type="text"]')?.focus();
                                            }}
                                            className="group w-full text-left p-4 rounded-lg text-sm
                                            bg-white hover:bg-blue-50 active:bg-blue-100
                                            text-gray-700 hover:text-blue-700 active:text-blue-800
                                            transition-all duration-200
                                            border-2 border-blue-100 hover:border-blue-300 active:border-blue-400
                                            shadow-sm hover:shadow-md active:shadow-inner
                                            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50
                                            transform hover:scale-[1.01] active:scale-[0.99]
                                            flex items-center space-x-3 relative overflow-hidden"
                                        >
                                            <svg
                                                className="w-5 h-5 text-blue-500 group-hover:text-blue-600 group-active:text-blue-700 relative z-10"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d={
                                                        category.title === "Medical Reports"
                                                            ? "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        : category.title === "Health Insights"
                                                            ? "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                        : "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    }
                                                />
                                            </svg>
                                            <span className="font-medium group-hover:text-blue-700 relative z-10">{question.text}</span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100/50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out"></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                                msg.type === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : msg.type === 'error'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                            {msg.image && (
                                <div className="mb-2">
                                    <img 
                                        src={msg.image} 
                                        alt="Uploaded medical report" 
                                        className="max-w-full rounded-lg"
                                    />
                                </div>
                            )}
                            {msg.extractedText && (
                                <div className="mb-2 p-2 bg-white/50 rounded text-sm">
                                    <strong>Extracted Text:</strong>
                                    <p>{msg.extractedText}</p>
                                </div>
                            )}
                            {msg.text}
                        </div>
                    </div>
                    ))
                )}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            Send
                        </button>
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Upload Medical Report</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={loading}
                        />
                    </label>
                </div>
            </form>
        </div>
    );
};

export default ChatWidget;