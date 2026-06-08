import { Page } from '@playwright/test'

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL('**/dashboard**')
}

export async function loginAsTestUser(page: Page) {
  await loginAs(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!)
}
