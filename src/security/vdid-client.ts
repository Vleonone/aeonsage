/**
 * VDID Client Stub for Open Source Edition
 * 
 * This file replaces the full proprietary implementation in open source builds.
 * It provides the same interface but with no-op or limited functionality.
 */

export class VDIDClient {
    constructor() { }

    async verify(_identity: any): Promise<{ valid: boolean; tier: string }> {
        console.warn('[VDID] Running in Open Source mode. Identity verification is simulated.');
        return { valid: true, tier: 'open-source' };
    }

    async sign(_data: string): Promise<string> {
        return 'signature-stub'; // No actual signing
    }

    async getPublicKey(): Promise<string> {
        return 'public-key-stub';
    }
}
