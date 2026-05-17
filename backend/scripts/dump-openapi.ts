/**
 * Dumps the OpenAPI specification to disk as openapi.json.
 *
 * NOTE: generateOpenApi() imports docs modules that transitively import
 * src/schemas/* but NOT src/config/env.ts — so no env vars are required
 * for this script. If a future refactor pulls in env.ts, set these placeholders:
 *
 *   NODE_ENV=test \
 *   JWT_SECRET=ci_jwt_secret_min_16_chars \
 *   DATABASE_URL=postgres://ci:ci@localhost:5432/ci \
 *   GOOGLE_CLIENT_ID=ci \
 *   MP_ACCESS_TOKEN=ci \
 *   bun run scripts/dump-openapi.ts
 */

import { generateOpenApi } from "../src/docs/openapi";

const out = generateOpenApi();
Bun.write("openapi.json", JSON.stringify(out, null, 2));
console.log("openapi.json written");
