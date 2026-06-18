// js/chatbot.js
// Portfolio Chatbot with Google Gemini API ONLY

class PortfolioChatbot {
       constructor() {
        this.isOpen = false;
        this.messages = [];
        // Read API key from window object (set by api-config.js)
        this.geminiApiKey = window.GOOGLE_API_KEY;
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        
        console.log('🔑 API Key exists:', !!this.geminiApiKey);
        console.log('🔑 API Key length:', this.geminiApiKey ? this.geminiApiKey.length : 0);
        
        this.init();
    }

    init() {
        // Create chatbot UI
        this.createChatUI();
        
        // Load personal info from page
        this.personalInfo = this.extractPersonalInfo();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check if API key is configured
        if (!this.geminiApiKey) {
            console.warn('⚠️ Google Gemini API key not configured.');
            this.addSystemMessage('⚠️ Chatbot is not configured. Please set up your Google Gemini API key.');
        } else {
            console.log('✅ Google Gemini API key found!');
        }
    }

    extractPersonalInfo() {
        // Extract your info from the existing HTML
        return {
            name: document.querySelector('h1')?.innerText || "Ashok Lamichhane",
            bio: document.querySelector('.bio, .about')?.innerText || "",
            skills: Array.from(document.querySelectorAll('.skill, .skills li')).map(el => el.innerText),
            projects: Array.from(document.querySelectorAll('.project, .project-item')).map(el => ({
                title: el.querySelector('h3, .title')?.innerText || "",
                desc: el.querySelector('p, .desc')?.innerText || ""
            })),
            contact: {
                phone: document.querySelector('[href*="tel"]')?.href.replace('tel:', '') || "",
                email: document.querySelector('[href*="mailto"]')?.href.replace('mailto:', '') || "",
                github: document.querySelector('[href*="github"]')?.href || ""
            }
        };
    }

    createChatUI() {
        // Create chat container
        const chatHTML = `
            <div id="chatbot-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
                <!-- Chat Button -->
                <button id="chat-toggle" style="
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    font-size: 28px;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                    💬
                </button>
                
                <!-- Chat Window (hidden by default) -->
                <div id="chat-window" style="
                    position: absolute;
                    bottom: 80px;
                    right: 0;
                    width: 380px;
                    max-height: 550px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 5px 30px rgba(0,0,0,0.2);
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid #e0e0e0;
                ">
                    <!-- Header -->
                    <div style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span style="font-weight: bold; font-size: 16px;">🤖 Ashok's AI Assistant</span>
                        <button id="chat-close" style="
                            background: none;
                            border: none;
                            color: white;
                            cursor: pointer;
                            font-size: 20px;
                        ">✕</button>
                    </div>
                    
                    <!-- Messages Area -->
                    <div id="chat-messages" style="
                        flex: 1;
                        overflow-y: auto;
                        padding: 15px;
                        background: #f8f9fa;
                        min-height: 350px;
                    ">
                        <div style="
                            background: white;
                            padding: 12px 15px;
                            border-radius: 15px 15px 15px 5px;
                            margin-bottom: 12px;
                            max-width: 85%;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                            line-height: 1.4;
                        ">
                            👋 Hi! I'm Ashok's AI assistant. Ask me about his skills, projects, or experience!
                        </div>
                    </div>
                    
                    <!-- Input Area -->
                    <div style="
                        padding: 15px;
                        background: white;
                        border-top: 1px solid #e0e0e0;
                        display: flex;
                        gap: 10px;
                    ">
                        <input type="text" id="chat-input" placeholder="Ask me anything..." style="
                            flex: 1;
                            padding: 10px 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            font-size: 14px;
                            outline: none;
                            transition: border-color 0.3s;
                        " onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e0e0e0'">
                        <button id="chat-send" style="
                            padding: 10px 20px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: bold;
                            transition: transform 0.1s;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    setupEventListeners() {
        const toggleBtn = document.getElementById('chat-toggle');
        const chatWindow = document.getElementById('chat-window');
        const closeBtn = document.getElementById('chat-close');
        const sendBtn = document.getElementById('chat-send');
        const input = document.getElementById('chat-input');
        
        if (!toggleBtn || !chatWindow || !closeBtn || !sendBtn || !input) {
            console.error('❌ Chat elements not found!');
            return;
        }
        
        toggleBtn.addEventListener('click', () => {
            chatWindow.style.display = 'flex';
            toggleBtn.style.display = 'none';
        });
        
        closeBtn.addEventListener('click', () => {
            chatWindow.style.display = 'none';
            toggleBtn.style.display = 'block';
        });
        
        sendBtn.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message) return;
        
        // Check if API key exists
        if (!this.geminiApiKey) {
            this.addMessage('⚠️ Chatbot is not configured. Please set up your Google Gemini API key.', 'assistant');
            return;
        }
        
        // Disable input while processing
        input.disabled = true;
        input.placeholder = 'Processing...';
        
        // Add user message to chat
        this.addMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await this.callGeminiAPI(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'assistant');
        } catch (error) {
            this.hideTypingIndicator();
            console.error('Chat error:', error);
            
            let errorMessage = 'Sorry, I\'m having trouble connecting. ';
            if (error.message.includes('API key')) {
                errorMessage += 'Please check your Gemini API key.';
            } else if (error.message.includes('429')) {
                errorMessage += 'Too many requests. Please try again later.';
            } else if (error.message.includes('network')) {
                errorMessage += 'Please check your internet connection.';
            } else if (error.message.includes('403')) {
                errorMessage += 'API key is invalid or has insufficient permissions.';
            } else {
                errorMessage += 'Please try again later.';
            }
            this.addMessage(errorMessage, 'assistant');
        } finally {
            input.disabled = false;
            input.placeholder = 'Ask me anything...';
            input.focus();
        }
    }

    async callGeminiAPI(userMessage) {
        // Build the system prompt with personal information
        const systemPrompt = `You are Ashok Lamichhane's personal AI assistant for his portfolio website.

IMPORTANT RULES:
1. ALWAYS prioritize answering questions using Ashok's personal information first:
   - Name: ${this.personalInfo.name}
   - Skills: ${this.personalInfo.skills.join(', ')}
   - Projects: ${JSON.stringify(this.personalInfo.projects)}
   - Contact: Phone - ${this.personalInfo.contact.phone}, Email - ${this.personalInfo.contact.email}, GitHub - ${this.personalInfo.contact.github}
   - Bio: ${this.personalInfo.bio}
   
2. If someone asks about Ashok's qualifications, experience, or contact info, answer from the data above.

3. For general questions not about Ashok (like "What is Python?" or "How to learn coding?"), answer helpfully from your general knowledge.

4. Keep responses concise (2-3 sentences for general questions, slightly longer for detailed questions).

5. Be friendly, professional, and helpful.

6. If you don't know something, say "I don't have that information in my knowledge base."`;

        try {
            // Call Google Gemini API directly (no proxy!)
            const response = await fetch(`${this.apiUrl}?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: systemPrompt },
                            { text: `User: ${userMessage}` }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                        topP: 0.8,
                        topK: 40
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini API Error:', errorData);
                
                if (response.status === 403 || response.status === 401) {
                    throw new Error('Invalid API key. Please check your Gemini API key.');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait and try again.');
                } else {
                    throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
                }
            }

            const data = await response.json();
            
            // Extract the response text
            if (data.candidates && data.candidates.length > 0) {
                const candidate = data.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    return candidate.content.parts[0].text;
                }
            }
            
            throw new Error('Invalid response structure from Gemini API');
            
        } catch (error) {
            if (error.message.includes('fetch') || error.message.includes('network')) {
                throw new Error('Network error - please check your internet connection.');
            }
            throw error;
        }
    }

    addMessage(text, sender) {
        const messagesDiv = document.getElementById('chat-messages');
        if (!messagesDiv) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            margin-bottom: 12px;
            max-width: 85%;
            ${sender === 'user' ? 'margin-left: auto;' : 'margin-right: auto;'}
            animation: slideIn 0.3s ease;
        `;
        messageDiv.innerHTML = `
            <div style="
                background: ${sender === 'user' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
                color: ${sender === 'user' ? 'white' : '#333'};
                padding: 12px 15px;
                border-radius: ${sender === 'user' ? '15px 15px 5px 15px' : '15px 15px 15px 5px'};
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                word-wrap: break-word;
                line-height: 1.4;
            ">
                ${this.escapeHTML(text)}
            </div>
        `;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    addSystemMessage(text) {
        const messagesDiv = document.getElementById('chat-messages');
        if (!messagesDiv) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            margin-bottom: 12px;
            max-width: 85%;
            animation: slideIn 0.3s ease;
        `;
        messageDiv.innerHTML = `
            <div style="
                background: #fff3cd;
                color: #856404;
                padding: 12px 15px;
                border-radius: 10px;
                border: 1px solid #ffc107;
                word-wrap: break-word;
                line-height: 1.4;
            ">
                ${this.escapeHTML(text)}
            </div>
        `;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTypingIndicator() {
        this.hideTypingIndicator();
        
        const messagesDiv = document.getElementById('chat-messages');
        if (!messagesDiv) return;
        
        this.typingDiv = document.createElement('div');
        this.typingDiv.id = 'typing-indicator';
        this.typingDiv.style.cssText = `
            margin-bottom: 12px;
            margin-right: auto;
            max-width: 85%;
        `;
        
        this.typingDiv.innerHTML = `
            <div style="
                background: white;
                padding: 12px 20px;
                border-radius: 15px 15px 15px 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                display: inline-block;
            ">
                <span style="display: inline-block; animation: dotPulse 1.4s infinite;">●</span>
                <span style="display: inline-block; animation: dotPulse 1.4s infinite 0.2s;">●</span>
                <span style="display: inline-block; animation: dotPulse 1.4s infinite 0.4s;">●</span>
            </div>
        `;
        
        messagesDiv.appendChild(this.typingDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    hideTypingIndicator() {
        if (this.typingDiv) {
            this.typingDiv.remove();
            this.typingDiv = null;
        }
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes dotPulse {
        0%, 20% {
            opacity: 0.2;
            transform: scale(0.8);
        }
        50% {
            opacity: 1;
            transform: scale(1.2);
        }
        100% {
            opacity: 0.2;
            transform: scale(0.8);
        }
    }
`;
document.head.appendChild(style);

// Initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new PortfolioChatbot();
    console.log('✅ Chatbot initialized with Google Gemini API');
});
