# Animation Specification

## Hover
單色 → 角色主色漸進；亮度、輪廓、眼部微亮；輕微放大；光暈。不顯示罪名。

## Click timeline (GSAP)
A 空間移動 → B 粒子重建（頭→頸→肩→軀幹）→ C 掃描生成 → D 編輯式揭示
D 階段各元素獨立延遲進場。過場期間鎖定點擊。

具體秒數與 easing 於 Phase 3 實作後回填。