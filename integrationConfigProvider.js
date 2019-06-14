const crypto = require('js-sha256');
const helpers = require('./queueitHelpers');
const __IntegrationConfixFieldName ="info";

exports.tryStoreIntegrationConfig= async function(request, integrationConfigKV ,secretKey)
{
   const bodyJSON = await request.clone().json();
   const hash = bodyJSON.hash;
   const configInHex = bodyJSON.integrationInfo;

  if(hash && configInHex && crypto.sha256.hmac(secretKey, configInHex) == hash)
  {
    await integrationConfigKV.put(__IntegrationConfixFieldName, helpers.hex2bin(configInHex));
    return true;
  }
  return false;
}
exports.getIntegrationConfig = async function(integrationConfigKV)
{
    return  await integrationConfigKV.get(__IntegrationConfixFieldName,"text");
}

