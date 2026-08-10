<a href="https://www.ultralytics.com"><img src="https://raw.githubusercontent.com/ultralytics/assets/main/logo/Ultralytics_Logotype_Original.svg" width="320" alt="Ultralytics logo"></a>

# 🔌 Ultralytics OpenAPI

[![Ultralytics Actions](https://github.com/ultralytics/openapi/actions/workflows/format.yml/badge.svg)](https://github.com/ultralytics/openapi/actions/workflows/format.yml)
[![CI](https://github.com/ultralytics/openapi/actions/workflows/ci.yml/badge.svg)](https://github.com/ultralytics/openapi/actions/workflows/ci.yml)

[![Ultralytics Discord](https://img.shields.io/discord/1089800235347353640?logo=discord&logoColor=white&label=Discord&color=blue)](https://discord.com/invite/ultralytics)
[![Ultralytics Forums](https://img.shields.io/discourse/users?server=https%3A%2F%2Fcommunity.ultralytics.com&logo=discourse&label=Forums&color=blue)](https://community.ultralytics.com)
[![Ultralytics Reddit](https://img.shields.io/reddit/subreddit-subscribers/ultralytics?style=flat&logo=reddit&logoColor=white&label=Reddit&color=blue)](https://reddit.com/r/ultralytics)

Ultralytics OpenAPI generates runnable API documentation and typed SDKs from one OpenAPI contract. The documentation shares the shadcn Nova and Base UI foundation used by [Ultralytics Platform](https://platform.ultralytics.com), and API keys stay in browser memory without appearing in copied examples.

| Output | Status |
| --- | --- |
| Interactive API documentation | Available |
| Python SDK | Available |
| TypeScript SDK | Coming soon |
| Go SDK | Coming soon |
| Java SDK | Coming soon |

## 🐍 Python

Set `ULTRALYTICS_API_KEY`, then use the synchronous or asynchronous client:

```python
from ultralytics_platform import Platform

client = Platform()
datasets = client.datasets.list()
```

```python
from ultralytics_platform import AsyncPlatform

client = AsyncPlatform()
datasets = await client.datasets.list()
```

The generated package includes typed resources and responses, multipart uploads, retries for temporary failures, and structured API errors. It requires Python 3.10 or newer and is MIT licensed.

## 🧩 One Contract, Multiple Outputs

`public/openapi.json` is the only API contract. `lib/openapi.ts` owns parsing and operation names shared by the documentation and every generator. Language implementations live under `lib/generators/`; generated packages live under `generated/`.

```text
openapi.json
    └── shared operations
        ├── interactive docs
        ├── Python SDK
        ├── TypeScript SDK (coming soon)
        ├── Go SDK (coming soon)
        └── Java SDK (coming soon)
```

## 🛠️ Development

Install [Bun](https://bun.sh/) and [uv](https://docs.astral.sh/uv/), then run:

```bash
git clone https://github.com/ultralytics/openapi
cd openapi
bun install
bun run sync
bun run generate
bun run dev
```

Useful checks:

```bash
bun run typecheck
bun run lint
bun run test
bun run build
python3 -m compileall -q generated/python/src
```

## 💡 Contribute

Bug reports and focused feature proposals are welcome in [GitHub Issues](https://github.com/ultralytics/openapi/issues). Please keep the core rule in mind: the simplest complete solution wins.

[![Ultralytics open-source contributors](https://raw.githubusercontent.com/ultralytics/assets/main/im/image-contributors.png)](https://github.com/ultralytics/openapi/graphs/contributors)

## 📄 License

The generator and documentation application are available under the [AGPL-3.0 License](LICENSE). Generated SDK packages include their own permissive license. For commercial licensing, contact [Ultralytics Licensing](https://www.ultralytics.com/license).

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
