import { env } from '$env/dynamic/private';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// openssl rand --hex 32
if (!env.AES_KEY) throw new Error('AES_KEY is not defined');
const key = Buffer.from(env.AES_KEY, 'hex');

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(cipher: string): string {
  const [iv, ciphertext] = cipher.split(':');
  const decipher = createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'hex')), decipher.final()]).toString('utf8');
}
