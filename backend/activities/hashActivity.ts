import { Activity } from 'durabull';
import * as crypto from 'crypto';
import { blake3Hash } from '@webbuf/blake3';
import { WebBuf } from '@webbuf/webbuf';

export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha512' | 'blake3';

// Accept Buffer, typed serialized Buffer-like shapes, or ArrayBuffer/Uint8Array
export type SerializableBuffer =
  | Buffer
  | { data: number[] }
  | ArrayBuffer
  | Uint8Array
  | number[];

export interface HashResult {
  algorithm: HashAlgorithm;
  digest: string;
  computedAt: string;
}

/**
 * Activity to compute a hash digest for the given image data
 */
export class ComputeHashActivity extends Activity<[SerializableBuffer, HashAlgorithm], HashResult> {
  tries = 3;
  timeout = 30; // seconds

  async execute(imageBuffer: SerializableBuffer, algorithm: HashAlgorithm): Promise<HashResult> {
    let digest: string;

    // Convert serialized buffer back to Buffer if needed
    let buffer: Buffer;

    if (Buffer.isBuffer(imageBuffer)) {
      buffer = imageBuffer;
    } else if (Array.isArray(imageBuffer)) {
      // number[]
      buffer = Buffer.from(imageBuffer);
    } else if (imageBuffer instanceof ArrayBuffer) {
      buffer = Buffer.from(new Uint8Array(imageBuffer));
    } else if (ArrayBuffer.isView(imageBuffer)) {
      // Uint8Array or similar
      buffer = Buffer.from(imageBuffer as Uint8Array);
    } else if (typeof imageBuffer === 'object' && imageBuffer !== null && 'data' in imageBuffer) {
      // Serialized Buffer-like { data: number[] }
      const data = (imageBuffer as { data?: number[] }).data || [];
      buffer = Buffer.from(data);
    } else {
      // Fallback: attempt to interpret as an ArrayBuffer-like value, otherwise empty
      try {
        buffer = Buffer.from(imageBuffer as unknown as ArrayBufferLike);
      } catch {
        buffer = Buffer.from([]);
      }
    }

    if (algorithm === 'blake3') {
      // Use blake3 library - convert Buffer to WebBuf
      const webBuf = WebBuf.fromHex(buffer.toString('hex'));
      const hashResult = blake3Hash(webBuf);
      digest = hashResult.toHex();
    } else {
      // Use built-in crypto for other algorithms
      const hash = crypto.createHash(algorithm);
      hash.update(buffer);
      digest = hash.digest('hex');
    }

    return {
      algorithm,
      digest,
      computedAt: new Date().toISOString(),
    };
  }
}
