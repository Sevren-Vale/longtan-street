# 素材与依赖说明

- 像素地图、店面、街道道具、人物、食材及烹饪动画由本项目的 Canvas 绘制代码生成。地图使用公开地名与游戏化布局。音效在浏览器内用 Web Audio 合成。
- 标题插画为本项目用 OpenAI 内置图像生成工具生成，使用之前检查了街景、像素风格、招牌、构图和文字。项目内路径为 `public/longtan-title.png`。
- 界面调用系统已安装的中文字体组合。项目不随构建产物分发字体文件。
- 工程依赖为 Vite（MIT）、TypeScript（Apache-2.0）、Vitest（MIT）、Playwright（Apache-2.0）及其锁定的间接依赖。依赖包的许可证随包提供。
- GitHub Actions 工作流引用 GitHub 官方 Actions 以及 pnpm 官方安装 Action。

## 标题插画生成提示词

> Original title screen background for Chinese 2D cozy pixel art browser game about a graduate returning to Longtan commercial street in Guiyang County, Hunan, China. Wide landscape 3:2 composition. Dense intricate hand-placed 16-bit pixel clusters with deliberate square pixel edges and restrained rich greens and warm cinnabar and golden apricot. Slightly overhead elevated viewpoint on a real-feeling modern Chinese county pedestrian neighborhood: tiled storefront eaves and shabby cream concrete apartment fronts and green balcony rails, rustic food carts with red cloth canopy and hanging Chinese lanterns, stone pavers, planted street trees, little potted plants, distant soft rounded green Hunan hills. Bright late-afternoon sun. Main street and small frying stall are middle-right; stretch of calm dark shady forest green texture at left for HTML overlay. No overlaid interface, no title, no letters or glyphs anywhere, leave storefront plaques blank, no watermark, no western storefront architecture. Inspired by a lovingly hand-crafted Chinese pixel RPG environment, fine pixel artwork, composition with a lot of character and specific details, no photorealism.

## 调研素材

[Kenney Food Kit](https://kenney.nl/assets/food-kit) 是 CC0 三维食物包，许可涵盖商用、编辑、再分发，免署名。此项目选择自绘二维食材和中式器皿。Phaser 官方示例明确区分 MIT 示例代码与单独授权的素材，本项目未引入其中的代码或素材。 [Phaser 示例许可证](https://github.com/phaserjs/examples#license)
