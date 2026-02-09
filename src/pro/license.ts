import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export enum LicenseType {
    OPEN_SOURCE = 'oss',
    PRO_PERSONAL = 'pro_personal',
    PRO_ENTERPRISE = 'pro_enterprise'
}

export interface LicenseStatus {
    type: LicenseType;
    isValid: boolean;
    expiry?: Date;
    features: {
        maxWorkers: number;
        allowAdvancedChannels: boolean;
        allowVisualWorkflow: boolean;
        allowPentesting: boolean;
        allowSecurityDashboard: boolean; // Enterprise Only
        allowGodKey: boolean;
    };
    message?: string;
}

const LICENSE_FILE_PATH = join(homedir(), '.aeonsage', 'license.key');

/**
 * Validates the current license and returns capabilities.
 * In a real implementation, this would verify a cryptographic signature.
 * For now, we simulate checks based on simple key format or env vars.
 */
export async function validateLicense(): Promise<LicenseStatus> {
    // 1. Check for License Key
    let licenseKey = process.env.AEONSAGE_LICENSE;

    if (!licenseKey && existsSync(LICENSE_FILE_PATH)) {
        try {
            licenseKey = readFileSync(LICENSE_FILE_PATH, 'utf-8').trim();
        } catch {
            // ignore read error
        }
    }

    // 2. Default to Open Source
    const ossStatus: LicenseStatus = {
        type: LicenseType.OPEN_SOURCE,
        isValid: true,
        features: {
            maxWorkers: 1, // Single agent
            allowAdvancedChannels: true, // OPEN: All channels available
            allowVisualWorkflow: true,   // OPEN: Visual workflow enabled
            allowPentesting: false,      // PRO: Pentesting tools still excluded (file-level)
            allowSecurityDashboard: false, // ENT: UI is gated
            allowGodKey: false           // PRO: God Key still PRO
        },
        message: 'Running in Open Source Mode'
    };

    if (!licenseKey) {
        return ossStatus;
    }

    // 3. Simple Validation Logic (Placeholder for RSA signature check)
    // Format: TYPE-SIGNATURE (e.g., PRO-123456 or ENT-789012)

    if (licenseKey.startsWith('ENT-')) {
        return {
            type: LicenseType.PRO_ENTERPRISE,
            isValid: true,
            features: {
                maxWorkers: 999, // Unlimited
                allowAdvancedChannels: true,
                allowVisualWorkflow: true,
                allowPentesting: true,
                allowSecurityDashboard: true,
                allowGodKey: true
            },
            message: 'AeonSage Enterprise Active'
        };
    }

    if (licenseKey.startsWith('PRO-')) {
        return {
            type: LicenseType.PRO_PERSONAL,
            isValid: true,
            features: {
                maxWorkers: 3,
                allowAdvancedChannels: true,
                allowVisualWorkflow: true,
                allowPentesting: false, // Enterprise only
                allowSecurityDashboard: false, // Enterprise only
                allowGodKey: true
            },
            message: 'AeonSage Pro Active'
        };
    }

    // Invalid key fallback
    return {
        ...ossStatus,
        message: 'Invalid License Key - Falling back to Open Source'
    };
}
