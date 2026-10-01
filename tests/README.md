# 测试目录

- `*.cjs`：Node 回归测试，可在仓库根目录逐个运行；目前 45 个。
- `*.js`：浏览器审计函数，覆盖布局几何、计算样式及交互，不是同名 `.cjs` 的重复副本。
- `*.html`：测试夹具，不用于生产服务。

## Node 回归

```bash
for file in tests/*.cjs; do node "$file" || exit 1; done
```

`overview-no-hero.cjs` 会读取 Git 历史中的已验收文件。GitHub Actions 因此使用 `fetch-depth: 0`。

## 浏览器审计

通过本地测试夹具加载 `.js`；部分脚本提供 `window.audit…` 入口，供浏览器工具动态加载调用。没有静态 HTML 引用不等于已废弃。不要仅凭扩展名或相同文件名删除测试。

本次审查未发现完全重复文件，保留了这些不同职责的检查；CI 仅执行 Node 回归，不声称覆盖全部移动端浏览器交互。
