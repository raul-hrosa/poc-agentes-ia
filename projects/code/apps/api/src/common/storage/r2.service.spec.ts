import { ConfigService } from '@nestjs/config'

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}))

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}))

import { S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { R2Service } from './r2.service'

function makeConfig(): ConfigService {
  return {
    getOrThrow: jest.fn().mockImplementation((key: string) => {
      const values: Record<string, string> = {
        R2_ACCOUNT_ID: 'acc123',
        R2_BUCKET_NAME: 'psiclinica-bucket',
        R2_ACCESS_KEY_ID: 'access-key',
        R2_SECRET_ACCESS_KEY: 'secret-key',
      }
      return values[key]
    }),
  } as unknown as ConfigService
}

describe('R2Service', () => {
  let svc: R2Service
  let sendMock: jest.Mock

  beforeEach(() => {
    sendMock = jest.fn().mockResolvedValue({})
    ;(S3Client as jest.Mock).mockImplementation(() => ({ send: sendMock }))
    svc = new R2Service(makeConfig())
  })

  afterEach(() => jest.clearAllMocks())

  describe('upload', () => {
    it('chama S3Client.send com PutObjectCommand e retorna a key', async () => {
      const buffer = Buffer.from('pdf content')
      const result = await svc.upload('docs/file.pdf', buffer, 'application/pdf')

      expect(sendMock).toHaveBeenCalledTimes(1)
      expect(result).toBe('docs/file.pdf')
    })
  })

  describe('getPresignedUrl', () => {
    it('retorna URL assinada via getSignedUrl', async () => {
      ;(getSignedUrl as jest.Mock).mockResolvedValue('https://presigned.example.com/file')

      const url = await svc.getPresignedUrl('docs/file.pdf', 3600)

      expect(getSignedUrl).toHaveBeenCalledTimes(1)
      expect(url).toBe('https://presigned.example.com/file')
    })
  })

  describe('delete', () => {
    it('chama S3Client.send com DeleteObjectCommand', async () => {
      await svc.delete('docs/old-file.pdf')
      expect(sendMock).toHaveBeenCalledTimes(1)
    })
  })
})
