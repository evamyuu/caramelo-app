# 🐕 Caramelo App – Interface Agêntica para a Pessoa Idosa

> *"Todo mundo merece um caramelo do lado"*

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Face%20Landmarker-0097A7)](https://ai.google.dev/edge/mediapipe)
[![FIAP](https://img.shields.io/badge/FIAP-Global%20Solution%202026-red)](.)

<p align="center">
  <br />
  <img src="docs/assets/banner-github.png" alt="Banner Caramelo" width="1000"/>
  <br />
</p>

## 🐾 Sobre o Projeto

O **Caramelo** é uma interface agêntica que vira a tela do celular da pessoa idosa — um agente de IA que entende o que ela pede e **faz junto com ela**, cuidando do aparelho, da rotina e dos serviços do dia a dia, sempre com a pessoa no controle e protegendo contra golpes. Este é o seu **app**, a tela que a Maria vê e com quem ela conversa. A API fica em [`caramelo-api`](https://github.com/evamyuu/caramelo-api).

---

## 🏗️ Arquitetura

Este projeto segue uma **organização por funcionalidade (feature-first)** — cada módulo do produto é dono das suas telas, hooks e lógica — com **visão computacional rodando no próprio aparelho**:

```text
caramelo-app/
├── src/
│   ├── app/                    # Registro de telas e navegação
│   ├── features/               # Uma pasta por módulo do produto
│   │   ├── home/               # Tela inicial, grade de apps e conversa por voz
│   │   ├── cobrowse/           # Fazer junto: sala segura ao vivo, licença e modo guia
│   │   ├── routine/            # Rotinas e lembretes
│   │   ├── store/              # Loja segura: só apps oficiais
│   │   ├── guard/              # Proteção: link suspeito e ligação
│   │   ├── documents/          # Biometria facial guiada
│   │   ├── companion/          # Leitor de remédio e saldo
│   │   └── insights/           # Mapa de golpes para parceiros
│   ├── components/             # Design System: Screen, Avatar, Checklist
│   ├── hooks/                  # Hooks compartilhados (câmera)
│   └── lib/                    # Cliente da API, voz e tipos
│
└── Dockerfile                  # Build estático servido por Nginx
```

---

## 🚀 Tecnologias Utilizadas

### Core Frontend
- **React 18 + TypeScript** - Interface e segurança de tipos
- **Vite** - Servidor de desenvolvimento e build

### Inteligência no Aparelho
- **MediaPipe Face Landmarker** - Enquadramento, luz e gestos da biometria facial
- **tesseract.js** - Leitura da caixa do remédio (OCR)
- **Web Speech API** - O Caramelo fala e escuta em português

### Qualidade & Infraestrutura
- **Vitest** - Testes unitários
- **Render** - App e API no ar
- **Docker + Nginx** - Build estático conteinerizado

---

## 🛠️ Como Executar

### Pré-requisitos
- Node.js (v20.0.0+)
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
# Edite o .env para apontar VITE_API_URL para a API
```

4. **Suba o app:**
```bash
npm run dev
```

O app abre em `http://localhost:5173`. Câmera e microfone exigem HTTPS ou `localhost`.

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
- **Pull Requests**: Fork → branch → PR com descrição clara

---

## 📝 Licença

Este projeto está sob licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div>
  <p>Desenvolvido com 🤎 por Caramelo</p>
</div>
