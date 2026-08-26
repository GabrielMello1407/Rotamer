import { defineConfig, devices } from '@playwright/test';

const PORTA = 3100;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] === undefined ? 0 : 2,
  reporter: process.env['CI'] === undefined ? 'list' : [['list'], ['html', { open: 'never' }]],

  // A senha é guardada com bcrypt em custo 12, que é caro de propósito. Com
  // vários testes criando conta ao mesmo tempo, a máquina fica ocupada e a
  // resposta demora mais que os cinco segundos padrão — aperto do ambiente de
  // teste, não lentidão do produto.
  expect: { timeout: 15_000 },

  /**
   * Um minuto por teste.
   *
   * Um caminho completo aqui sobe o WASM do RDKit no navegador, chama o RDKit
   * do servidor e ainda espera o PubChem, que é de terceiro e às vezes só
   * responde "estou ocupado". Com a suíte inteira em paralelo, trinta segundos
   * reprovam por aperto de máquina, não por defeito.
   */
  timeout: 60_000,

  /**
   * Quatro de cada vez.
   *
   * Cada teste sobe um Chromium com o WASM do RDKit dentro e ainda faz o
   * servidor rodar o RDKit dele. Um por núcleo deixa a máquina sem fôlego e o
   * que reprova é a espera, não o produto.
   */
  workers: 4,

  use: {
    baseURL: `http://127.0.0.1:${String(PORTA)}`,
    trace: 'on-first-retry',
    locale: 'pt-BR',
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Escola pública em celular fraco é o caso de uso, não o caso extremo.
    { name: 'celular', use: { ...devices['Pixel 5'] } },
  ],

  webServer: {
    command: `pnpm build && pnpm start --port ${String(PORTA)}`,
    url: `http://127.0.0.1:${String(PORTA)}`,
    reuseExistingServer: process.env['CI'] === undefined,
    timeout: 180_000,
  },
});
