// js/chatbot.js - Debug Version
class PortfolioChatbot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        
        console.log('🚀 Chatbot constructor called');
        
        // Read API key from window object
        this.geminiApiKey = window.GOOGLE_API_KEY;
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        
        // DEBUG: Log API key status
        console.log('🔑 API Key Debug:');
        console.log('  - Exists:', !!this.geminiApiKey);
        console.log('  - Type:', typeof this.geminiApiKey);
        console.log('  - Length:', this.geminiApiKey ? this.geminiApiKey.length : 0);
        console.log('  - First 10 chars:', this.geminiApiKey ? this.geminiApiKey.substring(0, 10) + '...' : 'N/A');
        console.log('  - Starts with AIza:', this.geminiApiKey ? this.geminiApiKey.startsWith('AIza') : false);
        
        this.init();
    }

    init() {
        console.log('📦 Initializing chatbot...');
        this.createChatUI();
        this.personalInfo = this.extractPersonalInfo();
        this.setupEventListeners();
        
        if (!this.geminiApiKey) {
            console.error('❌ No API key found!');
            this.addSystemMessage('⚠️ Chatbot is not configured. Please add your Google Gemini API key.');
        } else if (!this.geminiApiKey.startsWith('AIza')) {
            console.error('❌ Invalid API key format! Should start with "AIza"');
            this.addSystemMessage('⚠️ Invalid API key format. Please check your Google Gemini API key.');
        } else {
            console.log('✅ Google Gemini API key found and valid!');
            this.addSystemMessage('✅ Chatbot is ready! Ask me anything about Ashok.');
        }
    }

    extractPersonalInfo() {
        console.log('📋 Extracting personal info from page...');
        const info = {
            name: document.querySelector('h1')?.innerText || "Ashok Lamichhane",
            bio: document.querySelector('.about-info p')?.innerText || "",
            skills: Array.from(document.querySelectorAll('.skill-item p')).map(el => el.innerText),
            projects: Array.from(document.querySelectorAll('.portfolio-item')).map(el => ({
                title: el.querySelector('.portfolio-item-title')?.innerText || "",
                desc: el.querySelector('.description p')?.innerText?.substring(0, 100) || ""
            })),
            contact: {
                phone: document.querySelector('[href*="tel"]')?.href.replace('tel:', '') || "",
                email: document.querySelector('[href*="mailto"]')?.href.replace('mailto:', '') || "",
                github: document.querySelector('[href*="github"]')?.href || ""
            }
        };
        console.log('✅ Personal info extracted:', info.name);
        return info;
    }

    createChatUI() {
        console.log('🎨 Creating chat UI...');
        const chatHTML = `
            <div id="chatbot-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
                <button id="chat-toggle" style="
                    width: 60px; height: 60px; border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; border: none; cursor: pointer;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    font-size: 28px; transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                    💬
                </button>
                
                <div id="chat-window" style="
                    position: absolute; bottom: 80px; right: 0;
                    width: 380px; max-height: 550px;
                    background: white; border-radius: 12px;
                    box-shadow: 0 5px 30px rgba(0,0,0,0.2);
                    display: none; flex-direction: column; overflow: hidden;
                    border: 1px solid #e0e0e0;
                ">
                    <div style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white; padding: 15px 20px;
                        display: flex; justify-content: space-between; align-items: center;
                    ">
                        <span style="font-weight: bold; font-size: 16px;">🤖 Ashok's AI Assistant</span>
                        <button id="chat-close" style="
                            background: none; border: none; color: white;
                            cursor: pointer; font-size: 20px;
                        ">✕</button>
                    </div>
                    
                    <div id="chat-messages" style="
                        flex: 1; overflow-y: auto; padding: 15px;
                        background: #f8f9fa; min-height: 350px;
                    ">
                        <div style="
                            background: white; padding: 12px 15px;
                            border-radius: 15px 15px 15px 5px;
                            margin-bottom: 12px; max-width: 85%;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                            line-height: 1.4;
                        ">
                            👋 Hi! I'm Ashok's AI assistant. Ask me about his skills, projects, or experience!
                        </div>
                    </div>
                    
                    <div style="
                        padding: 15px; background: white;
                        border-top: 1px solid #e0e0e0;
                        display: flex; gap: 10px;
                    ">
                        <input type="text" id="chat-input" placeholder="Ask me anything..." style="
                            flex: 1; padding: 10px 12px;
                            border: 2px solid #e0e0e0; border-radius: 8px;
                            font-size: 14px; outline: none;
                            transition: border-color 0.3s;
                        " onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e0e0e0'">
                        <button id="chat-send" style="
                            padding: 10px 20px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white; border: none; border-radius: 8px;
                            cursor: pointer; font-weight: bold;
                            transition: transform 0.1s;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatHTML);
        console.log('✅ Chat UI created');
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
        
        console.log('✅ Event listeners setup complete');
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message) return;
        
        console.log('📤 Sending message:', message);
        
        if (!this.geminiApiKey) {
            this.addMessage('⚠️ Chatbot is not configured. Please add your Google Gemini API key.', 'assistant');
            return;
        }
        
        input.disabled = true;
        input.placeholder = 'Processing...';
        
        this.addMessage(message, 'user');
        input.value = '';
        this.showTypingIndicator();
        
        try {
            console.log('🔄 Calling Gemini API...');
            const response = await this.callGeminiAPI(message);
            console.log('✅ Response received:', response.substring(0, 50) + '...');
            this.hideTypingIndicator();
            this.addMessage(response, 'assistant');
        } catch (error) {
            console.error('❌ Chat error:', error);
            this.hideTypingIndicator();
            this.addMessage(`Error: ${error.message}`, 'assistant');
        } finally {
            input.disabled = false;
            input.placeholder = 'Ask me anything...';
            input.focus();
        }
    }

    async callGeminiAPI(userMessage) {
        const systemPrompt = `You are Ashok Lamichhane's personal AI assistant.

Personal info about Ashok:
- Name: ${this.personalInfo.name}
- Skills: ${this.personalInfo.skills.join(', ')}
- Projects: ${JSON.stringify(this.personalInfo.projects)}
- Contact: ${JSON.stringify(this.personalInfo.contact)}

Answer questions about Ashok using this info. For general questions, answer helpfully. Keep responses concise.`;

        console.log('🌐 Making API call to Gemini...');
        console.log('🔑 Using API key starting with:', this.geminiApiKey.substring(0, 10) + '...');

        try {
            const response = await fetch(`${this.apiUrl}?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: systemPrompt },
                            { text: `User: ${userMessage}` }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500
                    }
                })
            });

            console.log('📊 API Response Status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ API Error Response:', errorData);
                
                if (response.status === 403 || response.status === 401) {
                    throw new Error('Invalid API key. Please check your Gemini API key.');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait.');
                } else {
                    throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
                }
            }

            const data = await response.json();
            console.log('✅ API Response received:', data);
            
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }
            
            throw new Error('Invalid response from API');
            
        } catch (error) {
            console.error('❌ API Call Failed:', error);
            if (error.message.includes('fetch') || error.message.includes('network')) {
                throw new Error('Network error - please check your connection.');
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
        messageDiv.style.cssText = `margin-bottom: 12px; max-width: 85%;`;
        messageDiv.innerHTML = `
            <div style="
                background: #d4edda; color: #155724;
                padding: 12px 15px; border-radius: 10px;
                border: 1px solid #c3e6cb;
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
        this.typingDiv.style.cssText = `margin-bottom: 12px; margin-right: auto; max-width: 85%;`;
        this.typingDiv.innerHTML = `
            <div style="
                background: white; padding: 12px 20px;
                border-radius: 15px 15px 15px 5px;
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
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes dotPulse {
        0%, 20% { opacity: 0.2; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
        100% { opacity: 0.2; transform: scale(0.8); }
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing chatbot...');
    window.chatbot = new PortfolioChatbot();
});
