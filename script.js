// =========================================================
// ⚙️ 區塊一：程式邏輯 - 從 JSON 檔案載入數據
// =========================================================

let CLASS_SCHEDULE = {}; // 數據將從 CMS 生成的 JSON 檔案載入

document.addEventListener('DOMContentLoaded', () => {
    // 1. 嘗試從 schedule.json 載入數據 (CMS 會生成這個檔案)
    fetch('/schedule.json') 
        .then(response => {
            if (!response.ok) {
                // 如果找不到文件，則顯示錯誤
                throw new Error('無法載入課程數據檔案 (schedule.json)');
            }
            return response.json();
        })
        .then(data => {
            // 2. 將 JSON 陣列轉換為易於查找的物件格式
            // 讓 CLASS_SCHEDULE = { 'Day 1': {...}, 'Day 2': {...} }
            data.days.forEach(item => {
                CLASS_SCHEDULE[item.day_id] = item;
            });

            // 3. 數據載入成功後，開始網站初始化
            const todayDay = getTodayCycleDay();
            setupNavigation(todayDay);
            displayDayContent(todayDay);

            // 4. 綁定導航列的點擊事件
            document.getElementById('day-navigation').addEventListener('click', (event) => {
                if (event.target.tagName === 'A') {
                    event.preventDefault();
                    const targetDay = event.target.getAttribute('data-day');
                    displayDayContent(targetDay);
                    updateActiveClass(targetDay);
                }
            });
        })
        .catch(error => {
            console.error('數據載入錯誤:', error);
            document.getElementById('daily-content-display').innerHTML = 
                `<h2>數據載入失敗</h2><p>錯誤訊息：${error.message}</p><p>請管理員確認是否已在 <a href="/admin/">CMS 介面</a> 提交了課程數據。</p>`;
        });
});


/**
 * 根據今天的日期 (星期幾) 計算出 Day 1-7 循環中的哪一天
 * 假設：星期一 = Day 1, 星期日 = Day 7
 * @returns {string} 例如 'Day 1'
 */
function getTodayCycleDay() {
    const today = new Date();
    // 取得 0 (星期天) 到 6 (星期六)
    let dayOfWeek = today.getDay(); 

    // 將 0 (星期天) 轉換為 7
    if (dayOfWeek === 0) {
        dayOfWeek = 7;
    }
    
    // 如果您的學校循環起始日不同，請修改此處的邏輯
    return `Day ${dayOfWeek}`; 
}


/**
 * 建立導航連結並設置預設的活動狀態
 * 由於我們依賴 CLASS_SCHEDULE 載入的鍵，它會自動使用 Day 1, Day 2, ...
 * @param {string} currentDay - 當前的 Day (e.g., 'Day 1')
 */
function setupNavigation(currentDay) {
    const navContainer = document.getElementById('day-navigation');
    navContainer.innerHTML = '';
    
    // 遍歷所有載入的 Day 數據
    Object.keys(CLASS_SCHEDULE).sort().forEach(day => {
        const link = document.createElement('a');
        link.href = `#${day}`;
        link.textContent = day;
        link.setAttribute('data-day', day);
        if (day === currentDay) {
            link.classList.add('active');
        }
        navContainer.appendChild(link);
    });
}

/**
 * 更新導航列中被選中的 active 樣式
 * @param {string} activeDay - 當前被選中的 Day (e.g., 'Day 2')
 */
function updateActiveClass(activeDay) {
    document.querySelectorAll('#day-navigation a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-day') === activeDay) {
            link.classList.add('active');
        }
    });
}

/**
 * 根據選定的 Day 顯示手冊和時間表內容
 * @param {string} day - 要顯示的 Day (e.g., 'Day 2')
 */
function displayDayContent(day) {
    const data = CLASS_SCHEDULE[day];
    const displayElement = document.getElementById('daily-content-display');
    
    if (!data) {
        displayElement.innerHTML = `<h2>錯誤：找不到 ${day} 的資訊！</h2>`;
        return;
    }
    
    // 構建手冊 (Handbook) 區塊
    const handbookContent = data.handbook.length > 0
        ? `<ul>${data.handbook.map(item => `<li>${item.announcement}</li>`).join('')}</ul>`
        : `<p>本日無重要公告或手冊資訊。</p>`;


    // 構建時間表 (Timetable) 區塊
    const timetableBody = data.timetable.length > 0
        ? data.timetable.map(row => `
            <tr>
                <td>${row.period}</td>
                <td>${row.time}</td>
                <td>${row.subject}</td>
                <td>${row.location}</td>
            </tr>
        `).join('')
        : `<tr><td colspan="4">本日無課程安排。</td></tr>`;

    const timetableHTML = `
        <div class="timetable">
            <h3>⏰ 課程時間表</h3>
            <table>
                <thead>
                    <tr>
                        <th>節次</th>
                        <th>時間</th>
                        <th>科目</th>
                        <th>地點/備註</th>
                    </tr>
                </thead>
                <tbody>${timetableBody}</tbody>
            </table>
        </div>
    `;

    // 整合所有內容
    let htmlContent = `<h2>🗓️ ${day} 資訊 <span class="today-marker">${day === getTodayCycleDay() ? '(今日)' : ''}</span></h2>`;
    
    htmlContent += `
        <div class="handbook">
            <h3>📢 每日手冊 / 公告</h3>
            ${handbookContent}
        </div>
    `;
    
    htmlContent += timetableHTML;
    displayElement.innerHTML = htmlContent;
}