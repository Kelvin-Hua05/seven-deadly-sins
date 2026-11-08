# Animation Specification

## Hover
單色 → 角色主色漸進；亮度、輪廓、眼部微亮；輕微放大；光暈。不顯示罪名。

## Click timeline (GSAP)
A 空間移動 → B 粒子重建（頭→頸→肩→軀幹）→ C 掃描生成 → D 編輯式揭示
D 階段各元素獨立延遲進場。過場期間鎖定點擊。

具體秒數與 easing 於 Phase 3 實作後回填。

## Per-sin particle behavior (shader)
由 `uStyle` 選擇：0 擺動 / 1 對稱升騰 / 2 向內吸附 / 3 旋渦 / 4 下垂 / 5 爆裂 / 6 重影。
`uStyleAmt` 控制強度：hover 時部分顯現，角色頁全開，減少動態模式為 0。

## Reduced motion
關閉粒子抖動、鏡頭視差、轉頭、角色粒子行為與漂浮動畫；
過場縮短為近乎瞬間；只保留顯色與換頁。