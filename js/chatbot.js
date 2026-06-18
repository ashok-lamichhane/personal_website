// js/chatbot.js
// DeepSeek Portfolio Chatbot - Client-Side Version with Cloudflare Worker Proxy

class PortfolioChatbot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.workerUrl = 'https://deepseek-proxy.ashok-lamichhane01.workers.dev/'; // ← CHANGE THIS to your Worker URL
        this.init();
    }

    init() {
        // Create chatbot UI
        this.createChatUI();
        
        // Load personal info from page
        this.personalInfo = this.extractPersonalInfo();
        
        // Set up event listeners
        this.setupEventListeners();
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
                    border-radius: 30px;
                    background: #0066cc;
                    color: white;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    font-size: 24px;
                ">
                    💬
                </button>
                
                <!-- Chat Window (hidden by default) -->
                <div id="chat-window" style="
                    position: absolute;
                    bottom: 80px;
                    right: 0;
                    width: 350px;
                    height: 500px;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                ">
                    <!-- Header -->
                    <div style="
                        background: #0066cc;
                        color: white;
                        padding: 15px;
                        font-weight: bold;
                    ">
                        Chat with Ashok's AI Assistant
                        <button id="chat-close" style="float: right; background: none; border: none; color: white; cursor: pointer;">✕</button>
                    </div>
                    
                    <!-- Messages Area -->
                    <div id="chat-messages" style="
                        flex: 1;
                        overflow-y: auto;
                        padding: 15px;
                        background: #f5f5f5;
                    ">
                        <div style="
                            background: white;
                            padding: 10px;
                            border-radius: 10px;
                            margin-bottom: 10px;
                            max-width: 80%;
                        ">
                            👋 Hi! I'm Ashok's AI assistant. Ask me about his skills, projects, or experience!
                        </div>
                    </div>
                    
                    <!-- Input Area -->
                    <div style="padding: 15px; background: white; border-top: 1px solid #ddd;">
                        <input type="text" id="chat-input" placeholder="Ask me anything..." style="
                            width: 80%;
                            padding: 8px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                        ">
                        <button id="chat-send" style="
                            width: 15%;
                            padding: 8px;
                            background: #0066cc;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        ">Send</button>
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
        
        // Add user message to chat
        this.addMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await this.callDeepSeekAPI(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'assistant');
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage("Sorry, I'm having trouble connecting. Please try again later.", 'assistant');
            console.error('Chat error:', error);
        }
    }

    // ⬇️⬇️⬇️ THIS IS THE ONLY METHOD THAT CHANGED ⬇️⬇️⬇️
    async callDeepSeekAPI(userMessage) {
        // System prompt with your personal info
        const systemPrompt = `You are Ashok Lamichhane's personal AI assistant for his portfolio website. 
        
IMPORTANT RULES:
1. ALWAYS prioritize answering questions using Ashok's personal information first:
   - Name: ${this.personalInfo.name}
   - Skills: ${this.personalInfo.skills.join(', ')}
   - Projects: ${JSON.stringify(this.personalInfo.projects)}
   - Contact: Phone - ${this.personalInfo.contact.phone}, Email - ${this.personalInfo.contact.email}, GitHub - ${this.personalInfo.contact.github}
   
2. If someone asks about Ashok's qualifications, experience, or contact info, answer from the data above.

3. For general questions not about Ashok (like "What is Python?" or "How to learn coding?"), answer helpfully from your general knowledge.

4. Keep responses concise (2-3 sentences max for general questions).

5. Be friendly and professional.`;

        try {
            // Send request to Cloudflare Worker instead of DeepSeek directly
            const response = await fetch(this.workerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // ⚠️ NO Authorization header here - Worker handles it!
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                
                if (response.status === 401) {
                    throw new Error('Invalid API key. Please check your key.');
                } else if (response.status === 403) {
                    throw new Error('API key permission denied.');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait.');
                } else {
                    throw new Error(`API error: ${response.status} - ${errorText}`);
                }
            }

            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid API response structure');
            }
            
            return data.choices[0].message.content;
            
        } catch (error) {
            // Check if it's a network error
            if (error.message.includes('fetch') || error.message.includes('network')) {
                throw new Error('Network error - please check your internet connection.');
            }
            throw error;
        }
    }
    // ⬆️⬆️⬆️ THIS IS THE ONLY METHOD THAT CHANGED ⬆️⬆️⬆️

    addMessage(text, sender) {
        const messagesDiv = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            margin-bottom: 10px;
            max-width: 80%;
            ${sender === 'user' ? 'margin-left: auto;' : 'margin-right: auto;'}
        `;
        messageDiv.innerHTML = `
            <div style="
                background: ${sender === 'user' ? '#0066cc' : 'white'};
                color: ${sender === 'user' ? 'white' : 'black'};
                padding: 10px;
                border-radius: 10px;
            ">
                ${text}
            </div>
        `;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    showTypingIndicator() {
        const messagesDiv = document.getElementById('chat-messages');
        this.typingDiv = document.createElement('div');
        this.typingDiv.id = 'typing-indicator';
        this.typingDiv.innerHTML = `
            <div style="background: white; padding: 10px; border-radius: 10px; width: 50px;">
                Typing...
            </div>
        `;
        messagesDiv.appendChild(this.typingDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    hideTypingIndicator() {
        if (this.typingDiv) {
            this.typingDiv.remove();
        }
    }
}

// Initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', () => {
    // No API key needed anymore - Worker handles it!
    window.chatbot = new PortfolioChatbot();
    console.log('✅ Chatbot initialized with Cloudflare Worker proxy');
});
