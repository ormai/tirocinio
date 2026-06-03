import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Set AES_KEY to the output of `openssl rand --hex 32`

function getKey(): Buffer {
  if (building) return Buffer.from('');
  if (!env.AES_KEY) throw new Error('AES_KEY is not defined');
  return Buffer.from(env.AES_KEY, 'hex');
}

const key = getKey();

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
