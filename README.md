# WORDLE｜五字母英文猜字遊戲

繁體中文、免框架的 Wordle 靜態網站，支援台灣時間每日挑戰與無限練習。全部透過 **ChatGPT 網頁版 Codex、GitHub、GitHub Actions 和 GitHub Pages** 開發、測試及部署。玩家與專案維護者皆不需要安裝 VS Code、Node.js、Git 或其他本機工具。

目標遊戲網址：**https://nobuyo0214.github.io/wordle-game/**

> 這是預定部署網址，不代表網站已公開。首次啟用 Pages、合併 PR 且 Actions 部署成功後才會提供網站。

## 遊戲功能與規則

- 每局一個五字母英文答案，最多六次猜測。使用實體鍵盤或 QWERTY 虛擬鍵盤輸入，Enter／送出提交，Backspace／⌫ 刪除。
- 必須提交合法五字母英文單字。六次內猜中即獲勝；用盡機會會公布答案。
- **綠色**：字母及位置正確；**黃色**：答案包含字母，但位置不同；**灰色**：沒有此字母，或答案中該字母的數量已用完。
- 重複字母採雙輪配對：先扣除綠色，再依剩餘字母分配黃色，其餘灰色。鍵盤配色依綠 > 黃 > 灰保留，不會退回較低狀態。
- 字母輸入、翻轉、勝利跳動與無效輸入震動動畫，支援動畫關閉及系統減少動態效果設定。
- 每日挑戰 UTC+8 午夜換題，顯示倒數、保留輸入與猜測進度；跨午夜自動換題，完成後當日不可重新挑戰。
- 無限練習獨立保存，排除最近 50 個答案，完成後可「再玩一次」。
- 統計總場數、勝場、勝率，分別顯示每日及練習的目前／最長連勝及猜測次數長條圖。每日漏玩一天會中斷連勝。
- 說明、統計、設定視窗，淺色／深色、高對比、動畫、音效、音量與實體鍵盤開關；設定自動保存。
- 「複製結果」分享 emoji 方格，不洩漏答案；剪貼簿權限不足時可手動選取文字複製。
- 適用桌面、手機和平板；焦點提示、Escape 關閉對話框、逐格螢幕閱讀器狀態與即時文字通知。

## 技術架構與檔案

HTML5、CSS3、Vanilla JavaScript ES6+ modules、JSON 詞庫、localStorage。沒有框架、建置步驟、後端、資料庫、付費 API、API Key 或帳號系統。Node.js 與 Playwright 僅在 Codex 雲端或 GitHub Actions 執行測試；使用者無須安裝。

| 路徑                          | 功能                           |
| ----------------------------- | ------------------------------ |
| `index.html`                  | 繁體中文介面                   |
| `css/style.css`               | 響應式版面、主題與動畫         |
| `js/main.js`                  | 畫面、事件、模式切換與動畫鎖   |
| `js/game.js`                  | 遊戲判定與分享格式             |
| `js/keyboard.js`              | 虛擬鍵盤與顏色優先序           |
| `js/words.js`                 | 詞庫、台灣日期、每日與練習選字 |
| `js/storage.js`               | 版本化儲存、進度驗證及復原     |
| `js/statistics.js`            | 統計與結果去重                 |
| `js/settings.js`              | 設定、主題與合成音效           |
| `data/`                       | 答案、合法猜測字與來源說明     |
| `licenses/`、`LICENSE`        | 資料及程式授權                 |
| `tests/`                      | 邏輯與實際瀏覽器測試           |
| `scripts/serve.js`            | 雲端測試用靜態伺服器           |
| `.github/workflows/pages.yml` | Push／PR 自動測試、main 部署   |

所有資源採相對 URL，詞庫以模組位置解析，可在 `/wordle-game/` 子路徑執行。正式網站僅需靜態資源，Node.js 不在網站執行。

## 單字資料來源與授權

使用 [Kinkelin/WordleCompetition](https://github.com/Kinkelin/WordleCompetition) 固定 commit `d48afc24fdc3ab84ac0ffe649e5245711245f45c` 的經典答案與合法猜測清單：

- **2,315 個答案候選字**：`data/official/shuffled_real_wordles.txt`，使用經典答案清單以降低冷僻字比例。
- **12,972 個合法猜測字**：`data/official/combined_wordlist.txt`，包含全部答案與更多低頻字。
- 轉換僅刪除註解與空行、大寫化、去重並輸出 JSON；沒有拼湊假單字，也不以完整低頻猜測清單抽答案。詞表仍可能包含部分玩家不熟悉的字，並非另經人工難度審查的全新清單。
- 按來源專案的 **CC BY-SA 3.0** 授權，轉換後資料使用相同授權；完整原授權及出處保留於 [data/NOTICE.md](data/NOTICE.md) 與 `licenses/word-data-CC-BY-SA-3.0.txt`。
- 應用程式碼使用 MIT，見 `LICENSE`。本專案是獨立實作，與 Wordle 商標所有人無關。

## 每日挑戰與資料保存

日期以裝置時間加 8 小時計算，不依賴裝置時區。將日期轉成整數日數 `day`，以 `(day * 997 + 137) mod 2315` 決定答案。答案版本 `v1-d48afc24` 綁定詞表順序，所有裝置載入同一版本即可取得相同每日題目。更新詞表不得任意排序，應另建立版本並處理資料遷移。

localStorage 鍵 `wordle-tw-v1`，格式版本 `1`，保存每日進度、練習進度、完成紀錄、近期答案與設定。完成結果依遊戲 ID 去重，還原時重新計算配色與勝負。損壞資料或不支援版本會復原為安全初始值並提示；localStorage 不可用時仍能在當次分頁遊玩。

**每日僅限一次是瀏覽器本地限制。清除瀏覽器網站資料、更換瀏覽器或裝置可能重設進度與紀錄，不提供跨裝置同步或防作弊。**

## 如何透過 Codex 修改遊戲

1. 在 ChatGPT 網頁版 Codex 開啟此儲存庫 `nobuyo0214/wordle-game`，以最新 `main` 開始工作。
2. 用繁體中文描述要修改的功能，要求 Codex 保留無框架靜態架構與相對路徑，並在雲端執行 `npm ci`、必要的瀏覽器安裝及 `npm test`。
3. 要求 Codex 將修改提交到新的功能分支，建立指向 `main` 的 PR，不要自動合併。
4. 在 GitHub 網站檢查 PR 的 **Files changed** 與 **Checks**。測試通過且內容符合需求後，由你決定是否按 **Merge pull request**。
5. main 更新後，GitHub Actions 自動重新測試及部署。上述操作均不需要本機開發工具。

若 Codex 無法透過 API 建立 PR，但已推送功能分支：到 [建立 PR 頁面](https://github.com/nobuyo0214/wordle-game/compare)，選 **base: main** 與 Codex 回報的功能分支，按 **Create pull request**，填入摘要即可。

## 如何查看 GitHub Actions 測試結果

1. 開啟 [儲存庫 Actions](https://github.com/nobuyo0214/wordle-game/actions)。
2. 點選 **Test and deploy GitHub Pages**，再點選最新執行紀錄。
3. 展開 **test → npm test**，查看測試數量與結果。PR 頁面的 **Checks** 也能查看。
4. 紅色失敗時，將失敗步驟或紀錄連結交給 Codex 修正；不要合併失敗版本。

每次 Push 與 Pull Request 都測試；只有 main 的非 PR 執行才可部署。`npm test` 包含 **28 項 Node.js 邏輯測試＋12 項 Playwright Chromium 瀏覽器測試，共 40 項**，涵蓋：

- 正確／錯誤／錯位、重複字母、合法詞、五字長度、六次上限與勝負。
- UTC+8 午夜切換、固定每日答案、進度還原、統計正確性與去重。
- 鍵盤配色優先序、結束後禁止輸入、資料損壞及儲存失效。
- 快速輸入、連續 Enter、動畫期間切換模式、分享、設定保存。
- 320／375／390／768／1280px 版面無水平溢出、虛擬鍵盤完整、GitHub Pages 子路徑載入。

雲端已執行通過不代表 GitHub 遠端 Checks 已完成；以該次 PR 或 Actions 實際結果為準。

## 首次啟用 GitHub Pages

1. 開啟 [Settings → Pages](https://github.com/nobuyo0214/wordle-game/settings/pages)（需要儲存庫管理權限）。
2. 在 **Build and deployment → Source** 選擇 **GitHub Actions**。
3. 檢查遊戲 PR 並決定是否合併到 `main`。Codex 不會自行合併。
4. 到 [Actions](https://github.com/nobuyo0214/wordle-game/actions) 查看 **Test and deploy GitHub Pages**；若需要重新執行，在工作流程頁按 **Run workflow**，分支選 `main`。
5. 確認 **test** 與 **deploy** 都是綠色成功，點選 deployment 網址，或到 Settings → Pages 點 **Visit site**。
6. 開啟 **https://nobuyo0214.github.io/wordle-game/**，確認 HTTPS、遊戲方格、鍵盤與單字正常載入。行動裝置可直接用瀏覽器開啟。

部署流程只上傳 HTML、CSS、JS、JSON 與授權文件，不包含測試依賴或機密資料。不需要使用者設定 API Key。免費 Pages 的可用性仍取決於 GitHub 帳號方案及儲存庫可見性；公開儲存庫可使用免費 Pages。

## 更新與已知限制

- 後續修改一律透過 Codex 功能分支與 PR；合併 main 後自動測試及部署，不需要下載專案或執行本機指令。
- 已在雲端 Chromium 驗證桌面及手機尺寸，尚未在實體 iPhone、Android 或 Safari 驗證。
- 日期依裝置時鐘；靜態詞庫可由開發工具檢視，不提供防作弊。
- 紀錄屬於目前網站來源，清除網站資料會遺失。多分頁沒有交易鎖，建議一次使用一個分頁。
- 瀏覽器拒絕儲存或配額耗盡時，只能保留當次分頁的記憶體狀態。
- 音效受瀏覽器互動政策影響；自動複製須 HTTPS 或 localhost，否則使用手動複製。
- PR 合併及 GitHub Pages 啟用前，不能視為已公開部署。部署與 Actions 狀態請依 GitHub 實際執行結果確認。
