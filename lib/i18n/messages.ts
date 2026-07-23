export type Locale = "en" | "pt";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "gravai-locale";

const en = {
  navHow: "How it works",
  navOperator: "Operator",
  connectWallet: "Connect wallet",
  connecting: "Connecting…",
  walletInstalled: "Install an EVM wallet like MetaMask to connect.",
  walletCancelled: "Connection was cancelled or could not be completed.",
  heroTitleLine1: "Human data.",
  heroTitleLine2Before: "Bought by ",
  heroTitleLine2Accent: "agents.",
  heroBody:
    "GravAI lets agents discover, verify, and buy human demonstrations for training — with USDC released only after a quality check.",
  ctaFlow: "See the autonomous loop",
  ctaCode: "Explore the code",
  badgeProvenance: "SHA-256 provenance",
  badgeNano: "x402 nanopayments",
  badgeVerify: "Agent verification",
  flowPreview: "Preview purchased",
  flowVerifier: "Verifier approves",
  flowDataset: "Dataset released",
  howEyebrow: "Payment follows proof",
  howTitle: "Quality decides whether money moves.",
  howSample:
    "The buyer agent pays for a cheap sample and receives actions, narration, and a provenance hash.",
  howVerify:
    "The verifier applies the quality rubric: context, actions, completeness, and usefulness.",
  howSettle:
    "Approved? The agent buys the full dataset. Rejected? The payment never happens.",
  ctaEyebrow: "Agentic data economy",
  ctaTitle: "Turn human work into verifiable data for agents.",
  walletLabel: "Wallet",
  loginClose: "Close login",
  loginTitle: "Open dashboard",
  loginCreds: "Demo credentials",
  loginPasswordLabel: "password",
  loginDemo: "Enter as demo",
  loginEmail: "Enter with email",
  loginEntering: "Signing in…",
  loginPasswordField: "Password",
  loginError: "Use the demo credentials shown below.",
} as const;

const pt: { [K in keyof typeof en]: string } = {
  navHow: "Como funciona",
  navOperator: "Operador",
  connectWallet: "Conectar carteira",
  connecting: "Conectando…",
  walletInstalled: "Instale uma carteira EVM, como MetaMask, para conectar.",
  walletCancelled: "A conexão foi cancelada ou não pôde ser concluída.",
  heroTitleLine1: "Dados humanos.",
  heroTitleLine2Before: "Comprados por ",
  heroTitleLine2Accent: "agentes.",
  heroBody:
    "GravAI permite que agentes descubram, verifiquem e comprem demonstrações humanas para treinamento — com pagamento em USDC liberado somente após uma avaliação de qualidade.",
  ctaFlow: "Ver o fluxo autônomo",
  ctaCode: "Explorar o código",
  badgeProvenance: "Proveniência SHA-256",
  badgeNano: "Nanopayments x402",
  badgeVerify: "Verificação por agente",
  flowPreview: "Preview adquirido",
  flowVerifier: "Verificador aprova",
  flowDataset: "Dataset liberado",
  howEyebrow: "Payment follows proof",
  howTitle: "A qualidade decide se o dinheiro se move.",
  howSample:
    "O agente comprador paga uma amostra barata e recebe ações, narração e hash de proveniência.",
  howVerify:
    "O verificador aplica a rubrica de qualidade: contexto, ações, completude e utilidade.",
  howSettle:
    "Aprovado? O agente compra o dataset completo. Reprovado? O pagamento não acontece.",
  ctaEyebrow: "Agentic data economy",
  ctaTitle: "Transforme trabalho humano em dados verificáveis para agentes.",
  walletLabel: "Carteira",
  loginClose: "Fechar login",
  loginTitle: "Abrir dashboard",
  loginCreds: "Credenciais de demo",
  loginPasswordLabel: "senha",
  loginDemo: "Entrar como demo",
  loginEmail: "Entrar com email",
  loginEntering: "Entrando…",
  loginPasswordField: "Senha",
  loginError: "Use as credenciais de demo exibidas abaixo.",
};

export const messages = { en, pt } as const;
export type MessageKey = keyof typeof en;
