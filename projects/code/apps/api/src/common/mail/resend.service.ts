import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name)
  private readonly apiKey: string
  private readonly from: string

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('RESEND_API_KEY')
    this.from = this.config.get<string>('RESEND_FROM_EMAIL', 'no-reply@psiclinica.com.br')
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.from, to, subject, html }),
    })

    if (!response.ok) {
      const detail = await response.text()
      this.logger.error(`Resend erro ${response.status} para ${to}: ${detail}`)
      throw new InternalServerErrorException('Falha ao enviar e-mail')
    }
  }
}
