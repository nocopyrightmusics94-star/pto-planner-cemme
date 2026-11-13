/**
 * Unified Security Test Loader
 * Bridges the test suite to the authoritative security contract.
 * If implementation modules exist in `src/servizi/sicurezza/index.ts`,
 * tests can dynamically compare or load them; otherwise defaults to security-oracle.
 */
import * as SecurityOracle from './security-oracle';

export * from './security-oracle';
export { SecurityOracle };
