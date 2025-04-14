// Your existing JavaScript code goes here
let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

function parseMarkdown(text) {
  return text
    // Add a line break before numbered items (e.g. 1., 2., 3.)
    .replace(/(\s|^)(\d+\.)/g, '\n$2')
    // Format markdown bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    // Format italics
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Convert \n to <br> for HTML display
    .replace(/\n/g, '<br>');
}

function filterAIResponse(inputText) {
  // Regular expression to match everything before "7." and the paragraph starting with "7."
  const filterPattern = /^(.*?)(7\..*?)(\n\n.*?)(\n\n|\n|$)/s;

  // Apply the pattern to remove everything before "7." and the paragraph with "7." plus the next paragraph
  const filteredResponse = inputText.replace(filterPattern, '').trim();
  
  return filteredResponse;
}

function appendMessage(role, text) {
    const chatHistoryContainer = document.getElementById('chatHistory');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.innerHTML = parseMarkdown(text);
    chatHistoryContainer.appendChild(messageDiv);
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;

    if (role === 'ai') speakText(text);
}

function showTypingIndicator() {
    const chatHistoryContainer = document.getElementById('chatHistory');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatHistoryContainer.appendChild(typingDiv);
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

function speakText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
}

function saveHistory() {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}

function restoreHistory() {
    chatHistory.forEach(msg => appendMessage(msg.role, msg.text));
}

async function getAIResponse() {
    const input = document.getElementById('userInput').value.trim();
    const scope = document.getElementById('scope').value;

    if (!input) return;

    appendMessage('user', input);
    chatHistory.push({ role: "user", text: input });
    saveHistory();
    document.getElementById('userInput').value = "";

    showTypingIndicator();

    let fullPrompt = `You're an expert in ${scope} and only well vast in ${scope}. If asked anything related to another field, please respond with I am not well vast in that field and give a very abstract response. Here's the conversation:\n\n`;
    chatHistory.forEach(msg => {
        fullPrompt += `${msg.role === "user" ? "User" : "AI"}: ${msg.text}\n`;
    });

    const apiKey = "AIzaSyB0WYY_k7g1Ln54nhDWwP1T5DdzEZuz7Zw";
    const model = "models/gemini-1.5-pro-002";

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
        });

        const data = await res.json();
        let aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
        
        // Apply the filter to remove unwanted parts of the AI's response
        aiReply = filterAIResponse(aiReply);

        chatHistory.push({ role: "AI", text: aiReply });
        saveHistory();

        removeTypingIndicator();
        appendMessage('ai', aiReply);
    } catch (error) {
        removeTypingIndicator();
        appendMessage('ai', "Oops! Something went wrong.");
    }
}

function exportChat() {
    let text = '';
    chatHistory.forEach(msg => {
        text += `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.text}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'chat.txt';
    a.click();
}

document.getElementById("themeSwitcher").addEventListener("change", function() {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

window.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
        document.getElementById("themeSwitcher").checked = true;
    }
    restoreHistory();
});

// Add this for better UX - allow Enter key to send message
document.getElementById('userInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        getAIResponse();
    }
});

// Auto-resize textarea
document.getElementById('userInput').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
