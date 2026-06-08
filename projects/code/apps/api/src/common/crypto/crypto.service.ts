import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

@Injectable()
export class CryptoService {
  private readonly key: Buffer

  constructor(private readonly config: ConfigService) {
    const hexKey = this.config.getOrThrow<string>('ENCRYPTION_KEY')
    if (hexKey.length !== 64) {
      throw new Error('ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes)')
    }
    this.key = Buffer.from(hexKey, 'hex')
  }

  encrypt(text: string): Buffer {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv)
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    // IV nos primeiros 16 bytes conforme especificação
    return Buffer.concat([iv, encrypted])
  }

  decrypt(data: Buffer): string {
    const iv = data.subarray(0, 16)
    const encrypted = data.subarray(16)
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  }
}
