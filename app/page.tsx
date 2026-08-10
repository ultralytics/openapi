// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import { ApiReference } from "@/components/api-reference";
import config from "@/openapi.config.json";

export default function Page() {
  return <ApiReference apiKeyEnvironment={config.apiKey.environment} python={config.python} specUrl="/openapi.json" />;
}
