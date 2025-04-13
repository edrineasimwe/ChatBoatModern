let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

function parseMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>');
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

  let fullPrompt = `You're an expert in ${scope}. Here's the conversation:\n\n`;
  chatHistory.forEach(msg => {
    fullPrompt += `${msg.role === "user" ? "User" : "AI"}: ${msg.text}\n`;
  });

  const apiKey = "AIzaSyDBNvMiSrEK0Dw8PnQQxK_qsokVoQbSWfs";
  const model = "models/gemini-1.5-pro-002";

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
    });

    const data = await res.json();
    const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
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

document.getElementById("themeSwitcher").addEventListener("change", function () {
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
