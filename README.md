# Herdr2 官方网站（`herdr2-website`）

基于开源框架 **[Astro Starlight](https://starlight.astro.build/)** + **[starlight-theme-black](https://github.com/adrian-ub/starlight-theme-black)** 构建的 Herdr2 官方网站与一体化文档站。

## 特性概览

- **纯静态输出（`dist/`）**：零服务端运行时依赖，自带 **Pagefind 离线中文/英文全文搜索**，可直接部署至阿里云 OSS + CDN、阿里云 ESA Pages 或 ECS Nginx。
- **国内访问零阻塞**：字体通过 `@fontsource/geist-sans` / `@fontsource/geist-mono` 打包至静态产物，结合系统中文无衬线字体，不依赖 Google Fonts 等境外外链。
- **一键同步上游文档**：内置 `scripts/sync-docs.mjs`，可随时从 `../herdr2` 仓库拉取最新用户手册、架构文档、CLI 参考与全部真实截图 / SVG 图。
- **预留多语言结构**：默认中文根路径（`/`），预留英文路径（`/en/`），已同步英文 Core CLI 与 Drove 架构文档；后续只需在 `src/content/docs/en/guide/` 下补充英文翻译即可无缝生效。

---

## 本地开发与文档同步

```bash
# 安装依赖
pnpm install

# 从 ../herdr2 同步最新 Markdown 文档与图片（支持通过 HERDR2_REPO_DIR 指定路径）
pnpm sync-docs

# 启动本地开发预览服务器（默认 http://localhost:4321）
pnpm dev

# 构建生产静态产物（输出到 dist/，自动生成 Pagefind 搜索索引）
SITE_URL=https://你的域名 pnpm build

# 本地预览生产构建结果
pnpm preview
```

---

## 阿里云部署指南

执行 `SITE_URL=https://你的域名 pnpm build` 后，所有静态文件都在 `dist/` 目录中。

### 方式一：阿里云 OSS 静态网站托管 + CDN / ESA（推荐，最省心）

1. 在阿里云对象存储 **OSS** 创建 Bucket，开启「静态页面托管」：
   - 默认首页：`index.html`
   - 开通子目录首页（支持 `/guide/` 自动命中 `/guide/index.html`）
   - 默认 404 页：`404.html`
2. 使用 `ossutil` 将构建产物同步至 Bucket：
   ```bash
   SITE_URL=https://your-domain.com pnpm build
   ossutil cp -rf dist/ oss://your-bucket-name/ --update
   ```
3. 绑定自定义域名并开启 **阿里云 CDN / ESA** 与 HTTPS 证书即可。

### 方式二：阿里云 ECS + Nginx

将 `dist/` 同步至服务器目录（如 `/var/www/herdr2-website`），参考仓库中的 [`deploy/nginx.conf`](./deploy/nginx.conf) 配置 Nginx 并重载即可：

```bash
rsync -avz --delete dist/ root@your-ecs-ip:/var/www/herdr2-website/
```
