import { Injectable, OnModuleDestroy } from '@nestjs/common'
import puppeteer, { Browser } from 'puppeteer'

@Injectable()
export class PdfService implements OnModuleDestroy {
  private browserPromise: Promise<Browser> | null = null

  private getBrowser(): Promise<Browser> {
    this.browserPromise ??= puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    return this.browserPromise
  }

  async generate(html: string): Promise<Buffer> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' })
      const pdf = await page.pdf({ format: 'A4', printBackground: true })
      return Buffer.from(pdf)
    } finally {
      await page.close()
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browserPromise) {
      const browser = await this.browserPromise
      await browser.close()
      this.browserPromise = null
    }
  }
}
