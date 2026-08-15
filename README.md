<a href="https://www.ultralytics.com"><img src="https://raw.githubusercontent.com/ultralytics/assets/main/logo/Ultralytics_Logotype_Original.svg" width="320" alt="Ultralytics logo"></a>

[English](README.md) | [简体中文](README.zh-CN.md)

# 🔌 Ultralytics OpenAPI

[![Ultralytics Actions](https://github.com/ultralytics/openapi/actions/workflows/format.yml/badge.svg)](https://github.com/ultralytics/openapi/actions/workflows/format.yml)
[![CI](https://github.com/ultralytics/openapi/actions/workflows/ci.yml/badge.svg)](https://github.com/ultralytics/openapi/actions/workflows/ci.yml)

[![Ultralytics Discord](https://img.shields.io/discord/1089800235347353640?logo=discord&logoColor=white&label=Discord&color=blue)](https://discord.com/invite/ultralytics)
[![Ultralytics Forums](https://img.shields.io/discourse/users?server=https%3A%2F%2Fcommunity.ultralytics.com&logo=discourse&label=Forums&color=blue)](https://community.ultralytics.com)
[![Ultralytics Reddit](https://img.shields.io/reddit/subreddit-subscribers/ultralytics?style=flat&logo=reddit&logoColor=white&label=Reddit&color=blue)](https://reddit.com/r/ultralytics)

Ultralytics OpenAPI reads `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`, and `TRACE` operations from specifications declaring OpenAPI 3.0 through 3.2.0 and turns them into runnable API documentation and typed SDKs. Point `openapi.config.json` at a local file or URL, configure the generated package name, and produce both outputs from the same contract. API keys stay in browser memory and never appear in copied examples.

| Output                        | Status      |
| ----------------------------- | ----------- |
| Interactive API documentation | Available   |
| Python SDK                    | Available   |
| TypeScript SDK                | Coming soon |
| Go SDK                        | Coming soon |
| Java SDK                      | Coming soon |

## ⚙️ Configure

Edit `openapi.config.json` to use your local or HTTPS OpenAPI specification and choose the generated Python names:

```json
{
  "source": "path/to/openapi.json",
  "name": "Example API",
  "repository": "https://github.com/example/example-api",
  "apiKey": { "environment": "EXAMPLE_API_KEY" },
  "docs": { "basePath": "/reference" },
  "header": "Example API - https://example.com/license",
  "license": { "id": "AGPL-3.0-only", "file": "LICENSE", "url": "https://spdx.org/licenses/AGPL-3.0-only.html" },
  "python": {
    "authors": [{ "name": "Example", "email": "hello@example.com" }],
    "classifiers": ["Programming Language :: Python :: 3 :: Only"],
    "client": "Example",
    "description": "Typed Python SDK for Example API",
    "install": "pip install example-api-sdk",
    "keywords": ["api-client", "openapi", "sdk"],
    "package": "example_api",
    "project": "example-api-sdk",
    "readme": "README.python.md",
    "requiresPython": ">=3.11",
    "version": "0.1.0"
  }
}
```

`source`, `name`, `apiKey.environment`, and the `python` `client`, `package`, `project`, and `version` keys are required; everything else is optional. `python.install` defaults to `pip install <project>`, `python.readme` replaces the generated package README, `repository` fills the package URLs, and `docs.basePath` mounts the documentation under a sub-path. Relative paths resolve against the configuration file. The first OpenAPI server becomes the SDK's default base URL. HTTP bearer authentication and header-based API keys are derived from `components.securitySchemes`.
Set `OPENAPI_CONFIG` to use a configuration outside this repository, such as a product-specific consumer:

```bash
OPENAPI_CONFIG=../product/openapi.config.json bun run generate
OPENAPI_CONFIG=../product/openapi.config.json bun run build
```

The documentation header mark and favicon are the Ultralytics logomark by default; replace `components/logo.tsx`, `app/icon.svg`, and the `--brand-gradient-*` tokens in `app/globals.css` to brand your own docs. Static documentation builds are deterministic for the same configuration and contract. Set `header` to add a consumer-owned source header to generated Python, JavaScript, CSS, HTML, and TOML files.

## 🐍 Python

Set the API-key environment variable from `openapi.config.json` (`EXAMPLE_API_KEY` in the included example), then use the synchronous or asynchronous client:

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

Resources come from each operation's first tag and method names from the path: the static segment after the resource (`client.deployments.health()`, `client.explore.search()`) or `list`/`retrieve`/`create`/`update`/`delete` when there is none. Set `x-sdk-method` (a lowercase Python identifier, unique per resource) on an operation to choose a name explicitly; product-specific example values belong in the contract's `example` fields. The generated package includes typed resources and `TypedDict` responses, multipart uploads, retries for temporary failures, and structured API errors. It requires Python 3.11 or newer. Generated packages default to AGPL-3.0; set `license.id` and `license.file` to use another license.

## 🧩 One Contract, Multiple Outputs

The source configured in `openapi.config.json` is the only API contract. `lib/openapi.ts` owns parsing and operation names shared by the documentation and every generator. Language implementations live under `lib/generators/`. SDKs are written to the ignored `generated/` directory and belong in package registries or separate repositories, not this repository.

```text
your-openapi.json
    └── shared operations
        ├── interactive docs
        ├── Python SDK
        ├── TypeScript SDK (coming soon)
        ├── Go SDK (coming soon)
        └── Java SDK (coming soon)
```

## 🛠️ Development

Install [Bun](https://bun.sh/) and [uv](https://docs.astral.sh/uv/), then clone the repository and update `openapi.config.json` with your specification and Python package names:

```bash
git clone https://github.com/ultralytics/openapi
cd openapi
bun install
bun run dev      # interactive documentation
bun run generate # Python SDK in generated/python
```

Useful checks:

```bash
bun run sync
bun run typecheck
bun run lint
bun run knip
bun run test
bun run build
python3 -m compileall -q generated/python/src
```

## 💡 Contribute

Ultralytics thrives on community collaboration, and we deeply value your contributions! Please see our [Contributing Guide](https://docs.ultralytics.com/help/contributing) for details on how you can get involved. We also encourage you to share your feedback through our [Survey](https://www.ultralytics.com/survey?utm_source=github&utm_medium=social&utm_campaign=Survey). A huge thank you 🙏 to all our contributors!

[![Ultralytics open-source contributors](https://raw.githubusercontent.com/ultralytics/assets/main/im/image-contributors.png)](https://github.com/ultralytics/openapi/graphs/contributors)

## 📄 License

- **AGPL-3.0 License**: The generator and documentation application are licensed under the [AGPL-3.0 License](LICENSE).
- **Enterprise License**: Commercial licensing is available separately through [Ultralytics Licensing](https://www.ultralytics.com/license).

Generated SDKs default to AGPL-3.0, and their licenses are configurable through `openapi.config.json`.

## 📫 Contact

For bug reports or feature suggestions related to Ultralytics OpenAPI, please submit an issue via [GitHub Issues](https://github.com/ultralytics/openapi/issues). Join our [Discord](https://discord.com/invite/ultralytics) community for discussions and support!

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
