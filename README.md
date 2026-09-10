# PalmiLab

Aplicação web para análise e visualização de pressão plantar a partir de dados de sensores FSR.

## Funcionalidades

- **Mapa de calor** interativo da superfície plantar (interpolação IDW)
- **Timeline** com reprodução (play/pause/step) e velocidades 0.5x–4x
- **Comparação** pé esquerdo e pé direito lado a lado
- **Gráficos** de pressão × tempo por sensor
- **Painel de sensores** com valores, barras e percentuais
- **Estatísticas** calculadas: máximo, média, pico, duração
- **Parser inteligente** que detecta delimitador e colunas automaticamente
- **Aceita 5 ou 9 sensores** sem erro

> Dados processados localmente no navegador. Não realiza diagnóstico médico.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Deploy

O deploy é automático via **GitHub Actions**:

1. Crie um repositório no GitHub
2. Faça push de todos os arquivos para a branch `main`
3. No GitHub: **Settings → Pages → Source** → selecione **GitHub Actions**
4. O workflow faz `npm ci` → `npm run build` → publica `dist/`
5. O site fica disponível em `https://seu-usuario.github.io/palmilab/`

**Importante:** se o repositório tiver um nome diferente de `palmilab`, altere o `base` em `vite.config.js`.
