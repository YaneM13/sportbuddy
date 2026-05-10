import { readFileSync } from 'fs';
import { SignJWT, importPKCS8 } from 'jose';

const privateKey = readFileSync('C:\\Users\\jane_\\Downloads\\AuthKey_G29MS4HG78.p8', 'utf8');
const keyId = 'G29MS4HG78';
const teamId = '2H44LYTTV2';
const bundleId = 'com.yane31.SportBuddy';

const key = await importPKCS8(privateKey, 'ES256');

const jwt = await new SignJWT({})
  .setProtectedHeader({ alg: 'ES256', kid: keyId })
  .setIssuer(teamId)
  .setIssuedAt()
  .setExpirationTime('180d')
  .setAudience('https://appleid.apple.com')
  .setSubject(bundleId)
  .sign(key);

console.log('Secret Key:', jwt);