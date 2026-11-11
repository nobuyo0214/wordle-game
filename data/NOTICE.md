# 單字資料來源與授權

來源：[Kinkelin/WordleCompetition](https://github.com/Kinkelin/WordleCompetition)

固定來源 commit：`d48afc24fdc3ab84ac0ffe649e5245711245f45c`

- `answers.json`：取自 `data/official/shuffled_real_wordles.txt`，2,315 個經典答案候選字（比完整猜測詞表更常見）。
- `allowed-guesses.json`：取自 `data/official/combined_wordlist.txt`，12,972 個合法猜測字，包含全部答案。
- 修改方式：刪除註解、空行，統一大寫、去重，保留來源順序，轉換為 JSON；沒有生成或拼湊單字。
- 原資料由 Kinkelin / WordleCompetition contributors 整理，來源專案說明為經典 Wordle 詞表。
- 依來源專案的 **Creative Commons Attribution-ShareAlike 3.0 Unported（CC BY-SA 3.0）** 授權再散布；本專案轉換後的單字資料亦使用同一授權。完整授權見 [授權全文](../licenses/word-data-CC-BY-SA-3.0.txt)，[授權網頁](https://creativecommons.org/licenses/by-sa/3.0/)。

每日演算法版本 `v1-d48afc24` 與這個答案陣列順序綁定，請勿任意排序或替換。更新詞表應建立新版本並處理舊進度遷移。
