document.addEventListener("DOMContentLoaded", () => {
    renderHistory();
    setupDragAndDrop();
});

// 📥 ১. Drag & Drop লজিক
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = '#818cf8';
            dropZone.style.background = 'rgba(129, 140, 248, 0.05)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            dropZone.style.background = 'transparent';
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            const imgInput = document.getElementById('imageInput');
            if (imgInput) imgInput.files = files;
            handleFileSelect(files);
        }
    }, false);
}

// 📸 ২. ফাইল সিলেক্ট ও প্রিভিউ রেন্ডারার
function handleFileSelect(files) {
    const file = files[0];
    if (!file) return;

    const container = document.getElementById('imagePreviewContainer');
    const imgPreview = document.getElementById('imagePreview');
    const fileIcon = document.getElementById('fileTextIcon');
    const nameDisplay = document.getElementById('fileNameDisplay');
    const content = document.getElementById('dropZoneContent');
    
    if (content) content.style.display = 'none';
    if (container) container.classList.remove('preview-hidden');
    if (nameDisplay) nameDisplay.innerText = file.name; 

    if (file.type.startsWith('image/')) {
        if (fileIcon) fileIcon.style.display = 'none';
        if (imgPreview) {
            imgPreview.style.display = 'block'; 
            const reader = new FileReader();
            reader.onload = function() { 
                imgPreview.src = reader.result; 
            }
            reader.readAsDataURL(file);
        }
    } else {
        if (imgPreview) {
            imgPreview.style.display = 'none';
            imgPreview.removeAttribute('src'); 
        }
        if (fileIcon) fileIcon.style.display = 'block';
    }
}

// ✕ ৩. ফাইল রিমুভ ফাংশন
function removeImage(event) {
    if (event) event.stopPropagation();
    
    const imgInput = document.getElementById('imageInput');
    const container = document.getElementById('imagePreviewContainer');
    const imgPreview = document.getElementById('imagePreview');
    const nameDisplay = document.getElementById('fileNameDisplay');
    const fileIcon = document.getElementById('fileTextIcon');
    const content = document.getElementById('dropZoneContent');

    if (imgInput) imgInput.value = "";
    if (container) container.classList.add('preview-hidden');
    
    if (imgPreview) {
        imgPreview.src = "";
        imgPreview.style.display = 'none';
    }
    
    if (nameDisplay) nameDisplay.innerText = ""; 
    if (fileIcon) fileIcon.style.display = 'none';
    if (content) content.style.display = 'block'; 
}

// ⚙️ ৪. ফাইল রিডার গেটওয়ে (ইমেজ -> Base64, কোড -> Text)
function processAttachedFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        if (file.type.startsWith('image/')) {
            reader.onloadend = () => {
                resolve({
                    type: 'image',
                    data: { inlineData: { data: reader.result.split(',')[1], mimeType: file.type } }
                });
            };
            reader.readAsDataURL(file);
        } else {
            reader.onloadend = () => {
                resolve({ type: 'text', data: reader.result });
            };
            reader.readAsText(file);
        }
        reader.onerror = reject;
    });
}

// 📋 ৫. ক্লিপবোর্ড কপি ও ডাউনলোড ফাংশน
function copyToClipboard() {
    const outputResult = document.getElementById('outputResult');
    if (!outputResult) return;
    const text = outputResult.innerText;
    navigator.clipboard.writeText(text);
    const btn = document.getElementById('copyBtn');
    if (btn) {
        btn.innerText = "✅ Copied";
        setTimeout(() => btn.innerText = "📋 Copy", 2000);
    }
}

function downloadReport() {
    const outputResult = document.getElementById('outputResult');
    if (!outputResult) return;
    const text = outputResult.innerText;
    const blob = new Blob([text], { type: 'text/plain' });
    const anchor = document.createElement('a');
    anchor.download = `AI-Support-Analysis-${Date.now()}.txt`;
    anchor.href = window.URL.createObjectURL(blob);
    anchor.click();
}

// 📝 ৬. উন্নত মার্কডাউন পার্সার (কোড ব্লক ও টেক্সট রেসপন্স ভিউয়ার ফিক্স)
function parseMarkdown(text) {
    return text
        .replace(/```([\s\S]*?)```/gm, '<div class="code-block-wrapper">$1</div>')
        .replace(/^### (.*$)/gim, '<h4 style="margin: 14px 0 6px 0; color: #fff;">$1</h4>')
        .replace(/^## (.*$)/gim, '<h4 style="margin: 14px 0 6px 0; color: #fff;">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #818cf8; font-weight: 700;">$1</strong>')
        .replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 2px 4px; border-radius: 4px; font-family: monospace; color: #f472b6;">$1</code>')
        .replace(/^\s*-\s*(.*$)/gim, '<li style="margin-left: 15px; margin-bottom: 4px; color: #cbd5e1;">$1</li>');
}

// ⚡ ৭. আউটপুট ও সেন্টিমেন্ট ডিসপ্লে
function handleResponseDisplay(rawText, userTicket, actionType) {
    const badge = document.getElementById('sentimentBadge');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const outputResult = document.getElementById('outputResult');
    let cleanText = rawText;

    if (rawText.startsWith('[SENTIMENT:')) {
        const match = rawText.match(/\[SENTIMENT:\s*(\w+)\]/);
        if (match) {
            const sentiment = match[1].toLowerCase();
            if (badge) {
                badge.innerText = sentiment === 'critical' ? '🔥 Critical' : sentiment === 'frustrated' ? '😡 Frustrated' : '😐 Neutral';
                badge.className = `badge ${sentiment}`;
                badge.classList.remove('hidden');
            }
            cleanText = rawText.replace(/\[SENTIMENT:.*?\]/, '').trim();
        }
    }
    
    if (copyBtn) copyBtn.classList.remove('hidden');
    if (downloadBtn) downloadBtn.classList.remove('hidden');
    if (outputResult) {
        outputResult.innerHTML = parseMarkdown(cleanText);
    }
    
    saveTicketToHistory(userTicket, cleanText, actionType);
}

// 💾 ৮. LocalStorage হিস্ট্রি ম্যানেজমেন্ট (ফাইল আপলোড বাগ ফিক্সড)
function saveTicketToHistory(ticketText, aiResponse, actionType) {
    let history = JSON.parse(localStorage.getItem("ai_support_history")) || [];
    
    // ডুপ্লিকেট চেকিং এভয়েড করা
    if (history.some(item => item.ticket === ticketText && item.type === actionType.toUpperCase())) return;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    history.unshift({ 
        ticket: ticketText, 
        response: aiResponse, 
        time: timestamp,
        type: actionType.toUpperCase() 
    });
    
    if (history.length > 15) history.pop(); // ধারণক্ষমতা ৮ থেকে বাড়িয়ে ১৫ করা হলো
    localStorage.setItem("ai_support_history", JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    let history = JSON.parse(localStorage.getItem("ai_support_history")) || [];
    historyList.innerHTML = history.length === 0 ? '<p style="font-size:0.75rem; color:#64748b; font-style:italic; text-align:center; padding:10px;">No records saved</p>' : '';
    
    history.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.gap = '4px';
        
        // টাইটেল অনেক বড় হলে সেটিকে ট্রাঙ্কেট (শর্ট) করার লজিক
        let displayTitle = item.ticket;
        if (displayTitle.length > 35) {
            displayTitle = displayTitle.substring(0, 32) + "...";
        }
        
        div.innerHTML = `
            <span style="font-weight:500; white-space: nowrap; overflow:hidden; text-overflow:ellipsis;" title="${item.ticket}">${displayTitle}</span>
            <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:#64748b; margin-top:2px;">
                <span class="badge ${item.type.toLowerCase()}" style="padding:2px 6px; font-size:0.65rem;">${item.type}</span>
                <span>🕒 ${item.time}</span>
            </div>
        `;
        
        div.onclick = () => {
            const issueInput = document.getElementById('issueInput');
            const outputResult = document.getElementById('outputResult');
            const copyBtn = document.getElementById('copyBtn');
            const downloadBtn = document.getElementById('downloadBtn');
            
            if (issueInput && !item.ticket.startsWith("Uploaded File:")) {
                issueInput.value = item.ticket;
            }
            if (outputResult) {
                outputResult.classList.remove('initial-state');
                outputResult.innerHTML = item.response;
            }
            if (copyBtn) copyBtn.classList.remove('hidden');
            if (downloadBtn) downloadBtn.classList.remove('hidden');
        };
        historyList.appendChild(div);
    });
}

function clearHistory() {
    if (confirm("Are you sure you want to clear recent tickets?")) {
        localStorage.removeItem("ai_support_history");
        renderHistory();
    }
}

// 🚀 ৯. মেইন অপারেশন API ইন্টিগ্রেশন
async function analyzeIssue(type) {
    const issueInputObj = document.getElementById('issueInput');
    const imageInputObj = document.getElementById('imageInput');
    const outputResult = document.getElementById('outputResult');
    const loading = document.getElementById('loading');

    const issueInput = issueInputObj ? issueInputObj.value.trim() : "";
    const attachedFile = imageInputObj ? imageInputObj.files[0] : null;

    if (!issueInput && !attachedFile) {
        alert("Please enter a description or upload/drag a file!");
        return;
    }

    if (loading) loading.classList.remove('hidden');
    if (outputResult) {
        outputResult.classList.remove('initial-state');
        outputResult.innerText = "Analyzing logs and payload stream...";
    }

    const promptConfig = {
        analyze: "You are an expert WordPress Technical Support Engineer. Analyze the ticket details, logs, or code attached. Provide 3 high-precision root causes and code snippets for solutions if applicable.",
        steps: "Generate a step-by-step technical troubleshooting email template guide based on the provided file/text input.",
        bug: "Convert this system error/file data into a developer-ready Bug Report.",
        escalate: "Check technical severity. State Escalation Required: YES or NO with a clear internal note."
    };

    try {
        let finalTicketContent = issueInput || `Uploaded File: ${attachedFile ? attachedFile.name : 'Unknown'}`;
        let payload = { systemPrompt: promptConfig[type], userIssue: finalTicketContent, actionType: type };

        if (attachedFile) {
            const processed = await processAttachedFile(attachedFile);
            if (processed.type === 'image') {
                payload.imageParts = processed.data;
            } else {
                payload.userIssue += `\n\n--- ATTACHED FILE CONTENT (${attachedFile.name}) ---\n${processed.data}`;
            }
        }

        const response = await fetch("http://localhost:3000/api/support", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        handleResponseDisplay(data.result, finalTicketContent, type);

    } catch (error) {
        if (outputResult) {
            outputResult.innerHTML = `<span style="color: #ef4444;">⚠️ Connection Error. Ensure your node backend server is running.</span>`;
        }
    } finally {
        if (loading) loading.classList.add('hidden');
    }
}