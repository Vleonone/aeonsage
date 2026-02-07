import { validateLicense, LicenseStatus, LicenseType } from '../pro/license.js';

export { LicenseType };

// Singleton to hold capabilities
let currentCapabilities: LicenseStatus | null = null;

export async function getCapabilities(): Promise<LicenseStatus> {
    if (currentCapabilities) {
        return currentCapabilities;
    }

    // Validate license on first call
    currentCapabilities = await validateLicense();

    // Log startup capability message
    console.log(`[AeonSage] License Mode: ${currentCapabilities.message}`);
    console.log(`[AeonSage] Max Workers: ${currentCapabilities.features.maxWorkers}`);

    return currentCapabilities;
}

// Helpers for specific checks
export const isPro = async () => (await getCapabilities()).type !== LicenseType.OPEN_SOURCE;
export const isEnterprise = async () => (await getCapabilities()).type === LicenseType.PRO_ENTERPRISE;

export const canSpawnWorkers = async () => (await getCapabilities()).features.maxWorkers > 1;
export const canUseAdvancedChannels = async () => (await getCapabilities()).features.allowAdvancedChannels;
export const canUseSecurityDashboard = async () => (await getCapabilities()).features.allowSecurityDashboard;
export const canUseGodKey = async () => (await getCapabilities()).features.allowGodKey;
