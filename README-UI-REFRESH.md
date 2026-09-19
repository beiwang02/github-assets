# UI Refresh 正式版（ui-refresh-15）

正式版沿用原生 console.js 与 GitHubClient，不引入 Vue/Naive。新增 ui-refresh.css 最后加载，并纳入 Docker COPY、静态白名单和 /source/ui-refresh.css。

JSON 库：紧凑无箭头选择器、切换库弹窗仅选择/新建、编辑与复制在左、确认删除在右，说明为普通弱色文本。移除内容返回按钮和每行同步绿点，保留浏览器历史。顶部居中 Toast；弹窗不依赖 WebKit 入场动画。

生产无 demo 登录旁路。测试专用 tests/ui-refresh-fixture.html/js 使用 Map storage、history shim、mock fetch；不进入 Docker 静态服务白名单，不覆盖生产业务函数。预览项目不是部署源。

验证：async-submit.cjs、library-append.cjs、node --check、git diff --check 通过。直接 WebKit 320px 明暗各验证 JSON/资源/设置/登录及切换/新建/编辑/删除确认弹窗：根无横向溢出、按钮 Range 无多行、页面按钮无局部溢出，观察器稳定后未适配按钮为 0，弹窗宽292px且 opacity=1。实际点击切库选中 lib1，资源详情 opacity=1；主题点击正常，排序菜单 x=133..281 在320px内。仅模拟数据，未确认真实删除或上传。

限制：390/900/1440 的全矩阵尚未完成；CLI 浏览器上下文不稳定，切换视口后 JS 检查函数丢失。不声称全尺寸验收已完成。

部署保持原 .env、data、卷、端口和 Caddy；仅重建本 compose 服务，未操作 Naive 8766。
