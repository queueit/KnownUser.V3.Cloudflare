import * as crypto from 'js-sha256';
import {hex2bin} from "./queueitHelpers";

const __IntegrationConfixFieldName = "info";

export async function tryStoreIntegrationConfig(request: any, integrationConfigKV: any, secretKey: string) {
    const bodyJSON = await request.clone().json();
    const hash = bodyJSON.hash;
    const configInHex = bodyJSON.integrationInfo;

    if (console && console.warn) {
        if (!hash) {
            console.warn("Hash is missing");
        }
        if (!configInHex) {
            console.warn("Integration configuration is missing");
        }
        if (integrationConfigKV == null) {
            console.warn("IntegrationConfigKV is not available");
        }
    }

    if (!(hash && configInHex)) {
        return false;
    }

    if (crypto.sha256.hmac(secretKey, configInHex) !== hash) {
        if (console && console.warn) {
            console.warn("Hash didn't match the expected value");
        }
        return false;
    }

    await integrationConfigKV.put(__IntegrationConfixFieldName, hex2bin(configInHex));
    return true;
}

export async function getIntegrationConfig(integrationConfigKV: any) {
    return await integrationConfigKV.get(__IntegrationConfixFieldName, "text");
}