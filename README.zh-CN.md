<a href="https://www.ultralytics.com"><img src="https://raw.githubusercontent.com/ultralytics/assets/main/logo/Ultralytics_Logotype_Original.svg" width="320" alt="Ultralytics logo"></a>

[English](README.md) | [简体中文](README.zh-CN.md)

# 🔌 Ultralytics OpenAPI

[![Ultralytics Actions](https://github.com/ultralytics/openapi/actions/workflows/format.yml/badge.svg)](https://github.com/ultralytics/openapi/actions/workflows/format.yml)
[![CI](https://github.com/ultralytics/openapi/actions/workflows/ci.yml/badge.svg)](https://github.com/ultralytics/openapi/actions/workflows/ci.yml)

[![Ultralytics Discord](https://img.shields.io/discord/1089800235347353640?logo=discord&logoColor=white&label=Discord&color=blue)](https://discord.com/invite/ultralytics)
[![Ultralytics Forums](https://img.shields.io/discourse/users?server=https%3A%2F%2Fcommunity.ultralytics.com&logo=discourse&label=Forums&color=blue)](https://community.ultralytics.com)
[![Ultralytics Reddit](https://img.shields.io/reddit/subreddit-subscribers/ultralytics?style=flat&logo=reddit&logoColor=white&label=Reddit&color=blue)](https://reddit.com/r/ultralytics)

Ultralytics OpenAPI 接受声明为 OpenAPI 3.0 至 3.2.0 的标准 HTTP 操作规范，并将其转换为可运行的 API 文档和类型化 SDK。将 `openapi.config.json` 指向本地文件或 URL，配置生成的软件包名称，即可从同一份契约生成两种输出。API 密钥仅保存在浏览器内存中，绝不会出现在复制的示例中。

| 输出            | 状态     |
| --------------- | -------- |
| 交互式 API 文档 | 已可用   |
| Python SDK      | 已可用   |
| TypeScript SDK  | 即将推出 |
| Go SDK          | 即将推出 |
| Java SDK        | 即将推出 |

## ⚙️ 配置

编辑 `openapi.config.json`，使用本地或 HTTPS OpenAPI 规范并选择生成的 Python 名称：

```json
{
  "source": "path/to/openapi.json",
  "name": "Example API",
  "apiKey": { "environment": "EXAMPLE_API_KEY" },
  "docs": { "basePath": "/reference" },
  "license": { "id": "AGPL-3.0-only", "file": "LICENSE" },
  "python": {
    "client": "Example",
    "install": "pip install example-api-sdk",
    "package": "example_api",
    "project": "example-api-sdk",
    "version": "0.1.0"
  }
}
```

第一个 OpenAPI 服务器将成为 SDK 的默认基础 URL。HTTP Bearer 认证和基于请求头的 API 密钥均派生自 `components.securitySchemes`。
设置 `OPENAPI_CONFIG` 可使用此仓库之外的配置，例如产品专属的使用方配置：

```bash
OPENAPI_CONFIG=../product/openapi.config.json bun run generate
OPENAPI_CONFIG=../product/openapi.config.json bun run build
```

对于相同的配置和契约，静态文档构建是确定性的。设置 `header` 可向生成的 Python、JavaScript、CSS、HTML 和 TOML 文件添加由使用方提供的源文件头。

## 🐍 Python

设置 `openapi.config.json` 中指定的 API 密钥环境变量（附带示例中为 `EXAMPLE_API_KEY`），然后使用同步或异步客户端：

```python
from example_api import Example

client = Example()
widgets = client.widgets.list()
```

```python
from example_api import AsyncExample

client = AsyncExample()
widgets = await client.widgets.list()
```

生成的软件包包含类型化资源和 `TypedDict` 响应、多部分上传、临时故障重试以及结构化 API 错误。它需要 Python 3.11 或更高版本。生成的软件包默认采用 AGPL-3.0；设置 `license.id` 和 `license.file` 可使用其他许可证。

## 🧩 一份契约，多种输出

`openapi.config.json` 中配置的源文件是唯一的 API 契约。`lib/openapi.ts` 负责文档和所有生成器共享的解析及操作名称。各语言实现位于 `lib/generators/`。SDK 会写入被忽略的 `generated/` 目录，并应发布到软件包注册表或独立仓库，而非此仓库。

```text
your-openapi.json
    └── 共享操作
        ├── 交互式文档
        ├── Python SDK
        ├── TypeScript SDK（即将推出）
        ├── Go SDK（即将推出）
        └── Java SDK（即将推出）
```

## 🛠️ 开发

安装 [Bun](https://bun.sh/) 和 [uv](https://docs.astral.sh/uv/)，然后克隆仓库，并使用您的规范和 Python 软件包名称更新 `openapi.config.json`：

```bash
git clone https://github.com/ultralytics/openapi
cd openapi
bun install
bun run dev      # 交互式文档
bun run generate # 在 generated/python 中生成 Python SDK
```

常用检查：

```bash
bun run typecheck
bun run lint
bun run knip
bun run test
bun run build
python3 -m compileall -q generated/python/src
```

## 💡 贡献

Ultralytics 因社区协作而蓬勃发展，我们非常重视您的贡献！请参阅[贡献指南](https://docs.ultralytics.com/zh/help/contributing)，了解参与方式。我们也欢迎您通过[问卷调查](https://www.ultralytics.com/survey?utm_source=github&utm_medium=social&utm_campaign=Survey)分享反馈。衷心感谢 🙏 所有贡献者！

[![Ultralytics 开源贡献者](https://raw.githubusercontent.com/ultralytics/assets/main/im/image-contributors.png)](https://github.com/ultralytics/openapi/graphs/contributors)

## 📄 许可证

- **AGPL-3.0 许可证**：生成器和文档应用采用 [AGPL-3.0 许可证](LICENSE)。
- **企业许可证**：商业许可证可通过 [Ultralytics Licensing](https://www.ultralytics.com/license) 单独获取。

生成的 SDK 默认采用 AGPL-3.0，其许可证可通过 `openapi.config.json` 配置。

## 📫 联系我们

如需报告与 Ultralytics OpenAPI 相关的错误或提出功能建议，请通过 [GitHub Issues](https://github.com/ultralytics/openapi/issues) 提交。欢迎加入我们的 [Discord](https://discord.com/invite/ultralytics) 社区参与讨论并获取支持！

<br>
<div align="center">
  <a href="https://github.com/ultralytics"><img src="https://github.com/ultralytics/assets/raw/main/social/logo-social-github.png" width="3%" alt="Ultralytics GitHub"></a>
  <img src="https://github.com/ultralytics/assets/raw/main/social/logo-transparent.png" width="3%" alt="space">
  <a href="https://www.linkedin.com/company/ultralytics/"><img src="https://github.com/ultralytics/assets/raw/main/social/logo-social-linkedin.png" width="3%" alt="Ultralytics LinkedIn"></a>
  <img src="https://github.com/ultralytics/assets/raw/main/social/logo-transparent.png" width="3%" alt="space">
  <a href="https://twitter.com/ultralytics"><img src="https://github.com/ultralytics/assets/raw/main/social/logo-social-twitter.png" width="3%" alt="Ultralytics Twitter"></a>
  <img src="https://github.com/ultralytics/assets/raw/main/social/logo-transparent.png" width="3%" alt="space">
  <a href="https://youtube.com/ultralytics?sub_confirmation=1"><img src="https://github.com/ultralytics/assets/raw/main/social/logo-social-youtube.png" width="3%" alt="Ultralytics YouTube"></a>
  <img src="https://github.com/ultralytics/assets/raw/main/social/logo-transparent.png" width="3%" alt="space">
  <a href="https://www.tiktok.com/@ultralytics"><img src="https://github.com/ultralytics/assets/raw/main/social/logo-social-tiktok.png" width="3%" alt="Ultralytics TikTok"></a>
  <img src="https://github.com/ultralytics/assets/raw/main/social/logo-transparent.png" width="3%" alt="space">
  <a href="https://ultralytics.com/bilibili"><img src="https://github.com/ultralytics/assets/raw/main/social/logo-social-bilibili.png" width="3%" alt="Ultralytics BiliBili"></a>
  <img src="https://github.com/ultralytics/assets/raw/main/social/logo-transparent.png" width="3%" alt="space">
  <a href="https://discord.com/invite/ultralytics"><img src="https://github.com/ultralytics/assets/raw/main/social/logo-social-discord.png" width="3%" alt="Ultralytics Discord"></a>
</div>
