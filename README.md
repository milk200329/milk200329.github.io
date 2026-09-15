# 仙台夏日行程 App

單一頁面的協作行程表：GitHub Pages 部署、Firebase Realtime Database 即時同步、PWA 可離線／加入主畫面。

## 檔案說明

- `index.html` — 主程式（所有畫面與邏輯都在這裡）
- `manifest.json` — PWA 設定
- `sw.js` — Service Worker（HTML 走「網路優先」，避免更新後看到舊版；CDN 函式庫走「快取優先」以支援離線）
- `icon.svg` — App 圖示

## 1. 設定 Firebase

1. 到 [Firebase Console](https://console.firebase.google.com/) 建立專案（或使用既有專案）。
2. 開啟 **Realtime Database**，建立資料庫（選離你最近的地區，例如 asia-southeast1）。
3. 在「規則」分頁貼上（因為你要「擁有網址的人都能編輯」，這裡先開放公開讀寫，**不需要登入**）：

   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```

   ⚠️ 這代表任何拿到你的 GitHub Pages 網址、又知道資料庫 URL 的人都能修改資料。若擔心被亂改，可以：
   - 之後改用「以密語當共享金鑰」的規則（例如把整個行程放在 `trips/{一組不容易猜到的亂碼}/` 底下，`.env` 般管理），或
   - 之後接入 Firebase Anonymous Auth 再收斂規則。
   - 目前先以最簡單、符合你需求的公開讀寫規則實作。

4. 在「專案設定 → 你的應用程式」新增一個 Web App，複製產生的 `firebaseConfig`。
5. 打開 `index.html`，找到這一段，貼上你自己的設定並存檔：

   ```js
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     databaseURL: "https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app",
     projectId: "YOUR_PROJECT",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

6. 第一次有人打開網頁時，程式會自動把仙台行程的種子資料寫進 Realtime Database（只會寫一次，之後都以資料庫內容為準）。之後所有人看到、編輯的都是同一份即時資料。

## 2. 部署到 GitHub Pages

1. 把這四個檔案放進你的 GitHub repo（可放在根目錄，或 `/docs` 資料夾）。
2. Repo → Settings → Pages → Source 選擇對應的分支／資料夾 → Save。
3. 等幾分鐘後，GitHub 會給你一個網址，例如 `https://你的帳號.github.io/repo名稱/`，把網址分享給團員即可，所有人打開後都是同一份、即時同步的行程。

## 3. 功能對照

- **天數按鈕**：畫面上方深色列可橫向滑動，點一下會捲到該天，並高亮目前所在天數。
- **每日時間軸**：每筆行程左側點狀虛線＋圓點標記，右側鉛筆圖示可編輯時間／內容／備註／刪除。
- **拖曳排序**：按住左側「⠿」把手（手機需按住約 0.1 秒再拖曳，避免跟滑動頁面衝突）即可上下拖動排序，放開後自動存回 Firebase。
- **新增行程**：每天時間軸下方「＋ 新增行程」。
- **旅程資訊卡**（目的地／日期／成員／住宿／航班）：點文字即可直接編輯，失焦自動存檔，所有人即時看到更新。
- **匯率換算**：上方「匯率換算」展開，使用 [open.er-api.com](https://www.exchangerate-api.com/docs/free)（免金鑰）即時匯率，預設日圓→新台幣，可任選幣別、互換方向。
- **天氣**：上方「仙台天氣」展開，使用 [Open-Meteo](https://open-meteo.com/)（免金鑰）抓 9/19–9/26 仙台天氣；只有出發前 16 天內才有實際預報，太早查會顯示提示文字。
- **PWA**：可用瀏覽器「加入主畫面」；`sw.js` 會快取 App 本身，離線也能瀏覽行程；HTML 一律先嘗試連網抓最新版本，確保你之後更新程式碼、團員重新整理就能看到最新版，不會卡在舊快取。

## 4. 之後想更新行程內容？

直接在 App 裡編輯即可（所有變更即時寫回 Firebase，不需要改程式碼、不需要重新部署）。只有想調整版面／新增功能時才需要改 `index.html` 重新部署。
