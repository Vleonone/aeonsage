/**
 * Post-Quantum Cryptography (PQC) Module - Opensource Stub
 * 
 * The PQC features are available exclusively in AeonSage PRO / Enterprise.
 */

export enum PQCAlgorithm {
    KYBER_1024 = 'kyber-1024',
    DILITHIUM_5 = 'dilithium-5'
}

export interface PQCKeyPair {
    publicKey: Buffer;
    privateKey: Buffer;
    algorithm: PQCAlgorithm;
}

export function generatePQCKeyPair(_algo: PQCAlgorithm = PQCAlgorithm.KYBER_1024): PQCKeyPair {
    throw new Error("PQC Security is a PRO feature. Please upgrade to use Quantum-Resistant Encryption.");
}

export function pqcEncrypt(_data: Buffer, _publicKey: Buffer): Buffer {
    throw new Error("PQC Security is a PRO feature. Please upgrade to use Quantum-Resistant Encryption.");
}

export function pqcDecrypt(_encrypted: Buffer, _privateKey: Buffer): Buffer {
    throw new Error("PQC Security is a PRO feature. Please upgrade to use Quantum-Resistant Encryption.");
}

export const IS_PQC_AVAILABLE = false;
