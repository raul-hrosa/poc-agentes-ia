import { InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ResendService } from './resend.service'

function makeService(from = 'no-reply@psiclinica.com.br'): ResendService {
  const config = {
    getOrThrow: jest.fn().mockReturnValue('re_test_key'),
    get: jest.fn().mockReturnValue(from),
  } as unknown as ConfigService
  return new ResendService(config)
}

describe('ResendService', () => {
  let fetchMock: jest.SpyInstance

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch')
  })

  afterEach(() => jest.restoreAllMocks())

  it('chama a API Resend com os dados corretos', async () => {
    fetchMock.mockResolvedValue({ ok: true } as Response)
    const svc = makeService()
    await svc.send('dest@example.com', 'Assunto', '<p>corpo</p>')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer re_test_key',
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('"to":"dest@example.com"'),
      }),
    )
  })

  it('inclui o campo "from" configurado no body', async () => {
    fetchMock.mockResolvedValue({ ok: true } as Response)
    const svc = makeService('custom@psiclinica.com.br')
    await svc.send('dest@example.com', 'Sub', '<p>html</p>')

    const call = fetchMock.mock.calls[0]
    const body = JSON.parse(call[1].body)
    expect(body.from).toBe('custom@psiclinica.com.br')
  })

  it('lança InternalServerErrorException quando a API retorna erro', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      text: jest.fn().mockResolvedValue('invalid api key'),
    } as unknown as Response)

    const svc = makeService()
    await expect(svc.send('x@x.com', 'Sub', '<p></p>')).rejects.toThrow(
      InternalServerErrorException,
    )
  })

  it('resolve sem erro em envio bem-sucedido', async () => {
    fetchMock.mockResolvedValue({ ok: true } as Response)
    const svc = makeService()
    await expect(svc.send('a@b.com', 'Teste', '<b>ok</b>')).resolves.toBeUndefined()
  })
})
