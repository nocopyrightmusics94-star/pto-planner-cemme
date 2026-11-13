/**
 * Unified Security Test Loader
 * Bridges the test suite directly to production security modules in `src/servizi/sicurezza`.
 */
import * as SecurityOracle from './security-oracle';
import {
  StorageIntegritaSimulator,
  verificaPermessoOperazione,
  GestoreRateLimiting,
  type OperazioneAziendale,
} from './security-oracle';

// Direct production exports
export * from '@/servizi/sicurezza';

// Testing simulation harnesses for M2/M3 boundary features
export {
  StorageIntegritaSimulator,
  verificaPermessoOperazione,
  GestoreRateLimiting,
  type OperazioneAziendale,
  SecurityOracle,
};
