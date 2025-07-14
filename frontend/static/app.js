let items = [];
let editingItemId = null;

// 页面加载时初始化
document.addEventListener("DOMContentLoaded", function() {
    loadItems();
    setupForm();
    
    // 每秒更新倒计时
    setInterval(updateCountdowns, 1000);
});

async function loadItems() {
    try {
        const response = await fetch("/api/items");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        items = await response.json();
        renderItems();
    } catch (error) {
        console.error("加载项目失败:", error);
        document.getElementById("itemsList").innerHTML = 
            "<div class=\"empty-state\"><h3>加载失败</h3><p>请检查网络连接并刷新页面</p></div>";
    }
}

function setupForm() {
    const form = document.getElementById("itemForm");
    const cancelButton = document.getElementById("cancelEdit");
    const submitBtn = document.getElementById("submitBtn");
    
    form.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        // 禁用提交按钮防止重复提交
        submitBtn.disabled = true;
        submitBtn.textContent = editingItemId ? "更新中..." : "添加中...";
        
        const formData = {
            name: document.getElementById("name").value.trim(),
            expiry: document.getElementById("expiry").value,
            price: parseFloat(document.getElementById("price").value),
            cycle_len: parseInt(document.getElementById("cycle_len").value),
            cycle_unit: document.getElementById("cycle_unit").value,
            chat_id: parseInt(document.getElementById("chat_id").value)
        };
        
        // 验证数据
        if (!formData.name || !formData.expiry || isNaN(formData.price) || 
            isNaN(formData.cycle_len) || isNaN(formData.chat_id)) {
            alert("请填写所有必填字段");
            resetSubmitButton();
            return;
        }
        
        if (formData.price < 0 || formData.cycle_len < 1) {
            alert("价格和周期长度必须为正数");
            resetSubmitButton();
            return;
        }
        
        try {
            let response;
            if (editingItemId) {
                response = await fetch(`/api/items/${editingItemId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch("/api/items", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                });
            }
            
            if (response.ok) {
                form.reset();
                editingItemId = null;
                cancelButton.style.display = "none";
                loadItems();
                
                // 显示成功消息
                showMessage(editingItemId ? "项目更新成功！" : "项目添加成功！", "success");
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(errorData.error || "操作失败，请重试");
            }
        } catch (error) {
            console.error("操作失败:", error);
            alert("网络错误，请检查连接后重试");
        } finally {
            resetSubmitButton();
        }
    });
    
    cancelButton.addEventListener("click", function() {
        form.reset();
        editingItemId = null;
        cancelButton.style.display = "none";
        resetSubmitButton();
    });
    
    function resetSubmitButton() {
        submitBtn.disabled = false;
        submitBtn.textContent = editingItemId ? "更新项目" : "添加项目";
    }
}

function renderItems() {
    const container = document.getElementById("itemsList");
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>暂无项目</h3>
                <p>添加您的第一个到期提醒项目吧！</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="item">
            <div class="item-header">
                <div class="item-name">${escapeHtml(item.name)}</div>
                <div class="item-countdown" id="countdown-${item.id}"></div>
            </div>
            <div class="item-details">
                <strong>到期时间:</strong> ${formatDateTime(item.expiry)}<br>
                <strong>价格:</strong> ¥${(item.price_cents / 100).toFixed(2)}<br>
                <strong>续费周期:</strong> ${item.cycle_len} ${getCycleUnitText(item.cycle_unit)}<br>
                <strong>Chat ID:</strong> ${item.chat_id}
            </div>
            <div class="item-actions">
                <button class="edit" onclick="editItem('${item.id}')">编辑</button>
                <button class="danger" onclick="deleteItem('${item.id}')">删除</button>
            </div>
        </div>
    `).join("");
    
    updateCountdowns();
}

function updateCountdowns() {
    items.forEach(item => {
        const element = document.getElementById(`countdown-${item.id}`);
        if (element) {
            const countdown = getCountdown(item.expiry);
            element.textContent = countdown.text;
            element.className = "item-countdown " + countdown.class;
        }
    });
}

function getCountdown(expiryString) {
    const now = new Date();
    const expiry = new Date(expiryString);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) {
        return { text: "已过期", class: "danger" };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const text = `${days}天 ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    
    let className = "";
    if (days <= 1) {
        className = "danger";
    } else if (days <= 7) {
        className = "warning";
    }
    
    return { text, class: className };
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Shanghai"
    }).format(date);
}

function getCycleUnitText(unit) {
    const units = {
        "day": "天",
        "month": "月",
        "year": "年"
    };
    return units[unit] || unit;
}

function editItem(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    editingItemId = itemId;
    
    document.getElementById("name").value = item.name;
    
    // 转换时间格式为 datetime-local 输入框格式
    const expiryDate = new Date(item.expiry);
    const localDateTime = new Date(expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
    document.getElementById("expiry").value = localDateTime;
    
    document.getElementById("price").value = (item.price_cents / 100).toFixed(2);
    document.getElementById("cycle_len").value = item.cycle_len;
    document.getElementById("cycle_unit").value = item.cycle_unit;
    document.getElementById("chat_id").value = item.chat_id;
    
    document.getElementById("cancelEdit").style.display = "inline-block";
    document.getElementById("submitBtn").textContent = "更新项目";
    
    // 滚动到表单
    document.querySelector(".form-section").scrollIntoView({ 
        behavior: "smooth",
        block: "start"
    });
}

async function deleteItem(itemId) {
    const item = items.find(i => i.id === itemId);
    const itemName = item ? item.name : "该项目";
    
    if (!confirm(`确定要删除"${itemName}"吗？此操作无法撤销。`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/items/${itemId}`, {
            method: "DELETE"
        });
        
        if (response.ok) {
            loadItems();
            showMessage("项目删除成功！", "success");
        } else {
            const errorData = await response.json().catch(() => ({}));
            alert(errorData.error || "删除失败，请重试");
        }
    } catch (error) {
        console.error("删除失败:", error);
        alert("网络错误，请检查连接后重试");
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function showMessage(message, type = "info") {
    // 创建消息元素
    const messageEl = document.createElement("div");
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        background: ${type === "success" ? "#28a745" : "#007bff"};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(messageEl);
    
    // 3秒后自动移除
    setTimeout(() => {
        messageEl.style.animation = "slideOutRight 0.3s ease-in";
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }, 3000);
}

// 添加CSS动画
const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);


