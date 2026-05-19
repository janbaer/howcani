import { __setConfigForTests } from './server/config/config.service';

// Seed a default config before any test module evaluates, so module-load
// singletons (e.g. embeddingService) that call getConfig() don't fail for
// lack of a config.yaml file. Specs needing specific values override via
// __setConfigForTests().
__setConfigForTests({});
