import { ConfigService } from '@nestjs/config'
import { CryptoService } from './crypto.service'

const VALID_KEY = 'a'.repeat(64)

function makeService(hexKey: string = VALID_KEY): CryptoService {
  const config = { getOrThrow: jest.fn().mockReturnValue(hexKey) } as unknown as ConfigService
  return new CryptoService(config)
}

describe('CryptoService', () => {
  describe('constructor', () => {
    it('instancia com chave hex válida de 64 chars', () => {
      expect(() => makeService()).not.toThrow()
    })

    it('lança erro quando ENCRYPTION_KEY tem comprimento diferente de 64', () => {
      expect(() => makeService('a'.repeat(63))).toThrow(
        'ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes)',
      )
      expect(() => makeService('a'.repeat(65))).toThrow(
        'ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes)',
      )
    })
  })

  describe('encrypt / decrypt', () => {
    it('roundtrip retorna o texto original', () => {
      const svc = makeService()
      const plaintext = 'Nota clínica confidencial'
      const encrypted = svc.encrypt(plaintext)
      expect(svc.decrypt(encrypted)).toBe(plaintext)
    })

    it('encrypt retorna Buffer com pelo menos 17 bytes (16 IV + 1 bloco)', () => {
      const svc = makeService()
      const result = svc.encrypt('x')
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThanOrEqual(17)
    })

    it('duas chamadas a encrypt produzem outputs diferentes (IV aleatório)', () => {
      const svc = makeService()
      const a = svc.encrypt('mesmo texto')
      const b = svc.encrypt('mesmo texto')
      expect(a.toString('hex')).not.toBe(b.toString('hex'))
    })

    it('roundtrip funciona com string vazia', () => {
      const svc = makeService()
      expect(svc.decrypt(svc.encrypt(''))).toBe('')
    })

    it('roundtrip funciona com texto longo (> 1 bloco AES)', () => {
      const svc = makeService()
      const long = 'a'.repeat(1000)
      expect(svc.decrypt(svc.encrypt(long))).toBe(long)
    })

    it('roundtrip preserva caracteres UTF-8 especiais', () => {
      const svc = makeService()
      const text = 'Paciente relatou ansiedade: "não consigo 😔 dormir"'
      expect(svc.decrypt(svc.encrypt(text))).toBe(text)
    })
  })
})
