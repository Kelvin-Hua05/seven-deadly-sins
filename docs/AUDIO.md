# Audio

預設關閉，須由使用者點擊 Sound 按鈕才會開始（瀏覽器限制）。

## 預設：程式合成
`src/lib/audio/audioEngine.ts` 以 Web Audio 即時合成。
首頁與七個角色的音高、明暗、雜訊量定義在 `src/data/audio.ts` 的 `HOME_VOICE` / `SIN_VOICES`。
音量常數在 `audioEngine.ts` 最上方。

## 換成真實音檔
1. 把音檔放進 `public/audio/`（建議 mp3 或 ogg，可無縫循環者佳）
2. 在 `src/data/audio.ts` 的 `AUDIO_FILES` 填入路徑：
   - `ambient`：所有場景共用的環境音
   - `perSin`：個別角色專屬環境音（優先於 ambient）
   - `cues`：`enter` / `scan` / `reveal` / `leave` 提示音
3. 沒填的項目仍使用合成音；檔案載入失敗也會退回合成音

## 授權
使用的音檔必須有合法授權（如 CC0 / 自行創作），並在此記錄來源。