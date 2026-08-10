// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import { ApiReference } from "@/components/api-reference";
import { getConfig } from "@/lib/config";

export default function Page() {
  const config = getConfig();
  return (
    <ApiReference
      apiKeyEnvironment={config.apiKey.environment}
      python={config.python}
      specUrl={`${config.docs?.basePath ?? ""}/openapi.json`}
    />
  );
}
