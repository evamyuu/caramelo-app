# 🐕 Caramelo App – Guardião Digital da Pessoa Idosa

> *"O cão de guarda que mora no celular da vó"*

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Face%20Detection-0097A7)](https://ai.google.dev/edge/mediapipe)
[![FIAP](https://img.shields.io/badge/FIAP-Global%20Solution%202026-red)](.)

<!-- Banner: adicione docs/assets/banner-github.png e descomente
<p align="center">
  <br />
  <img src="docs/assets/banner-github.png" alt="Banner Caramelo" width="1000"/>
  <br />
</p>
-->

## 🐾 Sobre o Projeto

O **Caramelo** é um assistente que protege e ajuda pessoas idosas no Brasil. Este é o seu **app**: a interface web mobile em que o Caramelo fala primeiro, faz as coisas junto com a pessoa e **sempre pede permissão antes**. Projeto desenvolvido para a **FIAP Global Solution 2026 (CitizenTech)**. A API fica em [`caramelo-api`](https://github.com/evamyuu/caramelo-api).

Cada tela segue a mesma estrutura do design: um chip de contexto, uma frase grande, a fala do Caramelo, no máximo duas ações e o Caramelo embaixo com uma dica de voz. A cor de fundo muda conforme o estado do Caramelo (calmo, ouvindo, alerta de golpe, aguardando permissão, concluído).

| Funcionalidade | Status | Onde |
| --- | --- | --- |
| Link em sala isolada (a API abre o link num navegador descartável e devolve um veredito) | Real | `features/guard` |
| Fazer junto (navegação assistida ao vivo via WebSocket, consentimento antes de passos sensíveis, CPF, senha e código digitados só pela pessoa) | Real | `features/cobrowse` |
| Modo guia (fallback quando o site recusa a sala segura: abre o site oficial no navegador da pessoa e fala cada passo) | Real | `features/cobrowse` |
| Rotina: "todo dia 5, vê meu pagamento do INSS" vira tarefa agendada; na hora, o Caramelo avisa e faz junto, e sugere rotinas a partir do que a pessoa repete | Real | `features/routine` |
| Instalar apps: só aplicativo oficial de uma lista conferida, aviso de app falso ("WhatsApp Gold") e página oficial da Play Store | Real (no Android gerenciado, instala sem a loja) | `features/store` |
| Mapa de golpes para parceiros (Claro, CiX, Febraban), em `?painel` | Real | `features/insights` |
| Fontes do assistente numa área discreta ("De onde eu tirei isso?") | Real | `features/home` |
| Biometria facial ao vivo (dentro do Fazer junto, não é um bloco na grade): quando um serviço pede a foto do rosto no "Fazer junto", o Caramelo fica com a pessoa na câmera e fala cada passo (enquadramento, luz, piscar, sorrir, virar o rosto, detectados com MediaPipe no aparelho); só quando tudo passa a foto vai para o site | Real (Portal Cidadão de teste) | `features/cobrowse`, `features/documents` |
| Treino da biometria (aberto por voz, ao pedir “biometria”) para gov.br, prova de vida do Meu INSS, CNH do Brasil e CAIXA Tem, e depois o app oficial aberto com as dicas. A foto do treino não sai do celular | Real | `features/documents` |
| Leitor de remédio (OCR no aparelho com tesseract.js; lê o rótulo, nunca interpreta dosagem) | Real | `features/companion` |
| Ligação suspeita (score de risco vindo da API) | Score real, ligação simulada | `features/guard` |
| Saldo do banco (payload de Open Finance, somente leitura) | Simulado | `features/companion` |

Os textos da interface são em português do Brasil por decisão de produto. O código é em inglês.

---

## 🏗️ Arquitetura

O projeto segue uma **organização por funcionalidade (feature-first)**: cada módulo do produto é dono das suas telas, hooks e lógica, e só o que é compartilhado sobe para `components`, `hooks` ou `lib`.

```text
caramelo-app/
├── src/
│   ├── main.tsx                # Ponto de entrada
│   ├── app/                    # Composition root: registro de telas e navegação
│   ├── components/             # UI reutilizável: Screen, Avatar, Checklist, Icon
│   ├── features/               # Uma pasta por módulo do produto (tela + hooks + lógica pura)
│   │   ├── home/               # Início, grade de apps, escuta por voz
│   │   ├── guard/              # Proteção contra golpes: análise de link, alerta de ligação
│   │   ├── cobrowse/           # Sessão segura: hook de WebSocket, visualização ao vivo, fases
│   │   ├── documents/          # Biometria facial: treino de enquadramento, luz e prova de vida
│   │   └── companion/          # Leitor de remédio, saldo do banco
│   ├── hooks/                  # Hooks entre funcionalidades (câmera)
│   ├── lib/                    # Cliente da API, fala, tipos compartilhados
│   └── styles/                 # Design tokens (moods) e estilos globais
│
├── index.html                  # HTML base do Vite
└── Dockerfile                  # Build estático servido por Nginx
```

### Decisões de Design
- **Feature-first** - Uma funcionalidade é dona das suas telas, hooks e lógica; o código só vai para `components`, `hooks` ou `lib` quando uma segunda funcionalidade precisa dele
- **Lógica pura separada de I/O** - `faceGuidance.ts`, `legibleWords` e o reducer da sessão não dependem de câmera, rede ou DOM, e têm testes unitários
- **Um único componente de layout** - Toda tela renderiza via `Screen`, então estrutura e acessibilidade ficam consistentes
- **Design tokens** - As cores vêm de `styles/tokens.css`; uma tela só declara o seu `mood`
- **Privacidade desde a concepção** - Detecção de rosto e OCR rodam no próprio aparelho, e a senha é digitada apenas pela pessoa

---

## 🚀 Tecnologias Utilizadas

### Core Frontend
- **React 18 + TypeScript (strict)** - Interface e segurança de tipos
- **Vite** - Servidor de desenvolvimento e build

### Inteligência no Aparelho
- **MediaPipe Tasks Vision** - Detecção de rosto no navegador
- **tesseract.js** - OCR no navegador
- **Web Speech API** - Entrada e saída de voz (pt-BR)

### Qualidade & Infraestrutura
- **Vitest** - Testes unitários
- **Docker + Nginx** - Build estático conteinerizado
- **GitHub Actions** - Integração contínua (typecheck, testes e build)

---

## 🛠️ Como Executar

### Pré-requisitos
- Node.js (v20+)
- [`caramelo-api`](https://github.com/evamyuu/caramelo-api) rodando na porta 8000

### Instalação e Execução

1. **Clone o repositório:**
```bash
git clone https://github.com/evamyuu/caramelo-app.git
cd caramelo-app
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

| Variável | Finalidade | Padrão |
| --- | --- | --- |
| `VITE_API_URL` | URL base da `caramelo-api` | `http://localhost:8000` |

4. **Suba o app:**
```bash
npm run dev        # http://localhost:5173
```

Ou com Docker:
```bash
docker build --build-arg VITE_API_URL=http://localhost:8000 -t caramelo-app .
docker run -p 8080:80 caramelo-app
```

5. **Rode o typecheck e os testes:**
```bash
npm run typecheck && npm test
```

| Script | Finalidade |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Typecheck e build de produção |
| `npm test` | Testes unitários |
| `npm run typecheck` | Apenas TypeScript |

> Câmera e microfone exigem HTTPS ou `localhost`. Para testar no celular, exponha o servidor de desenvolvimento por um túnel HTTPS e aponte `VITE_API_URL` para a URL pública da API.

---

## 🧭 Próximos Passos

- **Login Único gov.br** - Parceria com o governo para entrar como aplicação credenciada, sem captcha nem automação de tela; o modo guia segue como fallback para os demais sites
- **App Android** - Alerta de golpe durante a ligação recebida, usando o score de risco que já existe na API
- **Biometria dentro dos apps oficiais** - No app Android gerenciado, um serviço de acessibilidade lê o que o app oficial pede na tela ("pisque", "aproxime o rosto") e o Caramelo fala junto, numa bolha por cima; a câmera continua sendo do app oficial

---

## 👥 Equipe

Agradecemos às seguintes pessoas que contribuíram para este projeto:

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/evamyuu">
        <img src="https://avatars.githubusercontent.com/u/109860924?v=4" width="100px;" alt="Evelin Brandão"/><br>
        <sub><b>evamyuu</b></sub>
      </a><br/>
      <sub>Full-Stack · IA + UX/UI</sub>
    </td>
    <td align="center">
      <a href="https://github.com/vncys">
        <img src="https://avatars.githubusercontent.com/u/98789877?v=4" width="100px;" alt="Vinicyus Oliveira"/><br>
        <sub><b>donax</b></sub>
      </a><br/>
      <sub>Full-Stack · Infra + UX/UI</sub>
    </td>
  </tr>
</table>

---

## 🤝 Como Contribuir

Caramelo é um projeto acadêmico open source. A melhor forma de contribuir é abrindo issues com sugestões ou bugs encontrados.

- **Issues**: Descreva o problema ou sugestão
- **Pull Requests**: Fork → branch → PR com descrição clara, seguindo [Conventional Commits](https://www.conventionalcommits.org) e rodando `npm run typecheck && npm test` antes

---

## 📝 Licença

Este projeto está sob licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div>
  <p>Desenvolvido com 🤎 por Caramelo</p>
</div>
