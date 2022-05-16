import LaunchDarkly from 'launchdarkly-node-server-sdk';

let ldClient: LaunchDarkly.LDClient;

if (LAUNCH_DARKLY_API_KEY) {
  ldClient = LaunchDarkly.init(LAUNCH_DARKLY_API_KEY);
}

async function getFlagsForUser({
  key,
  email,
  phoneNumber,
  anonId,
  ip,
}: {
  key: string;
  email: string;
  phoneNumber: string;
  anonId?: string;
  ip?: string;
}) {

  if (!ldClient) return {};

  try {
    await ldClient.waitForInitialization();
    const user = key
      ? {
          key,
          email,
          ip,
          custom: {
            phoneNumber,
          },
        }
      : { key: anonId || 'ANON', anonymous: true, ip };

    ldClient.identify(user);
    const flags = await ldClient.allFlagsState(user);
    return flags.allValues();
  } catch (error) {
    return {};
  }
}

export async function getVariationValueForFlag({
  flag,
  key,
  email,
  phoneNumber,
  anonId,
  ip,
}: {
  flag: string;
  key: string;
  email: string;
  phoneNumber: string;
  anonId?: string;
  ip?: string;
}) {

  try {
    await ldClient.waitForInitialization();
    const user = key
    ? {
        key,
        email,
        ip,
        custom: {
          phoneNumber,
        },
      }
    : { key: anonId || 'ANON', anonymous: true, ip };

    ldClient.identify(user);
    const variationDetail = await ldClient.variationDetail(flag, user, {});
    return variationDetail.value;
  } catch (error) {
    return '';
  }
}

export default getFlagsForUser; 
