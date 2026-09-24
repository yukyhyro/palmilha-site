# PodoSense

**Visualização e análise de pressão plantar**

Aplicação web para carregar, visualizar e analisar dados de pressão plantar coletados por palmilhas instrumentadas com sensores FSR.

## Funcionalidades

- Upload de arquivos TXT (pé direito e/ou esquerdo)
- Detecção automática de formato (delimitador, cabeçalho, sensores)
- Suporte para 5 ou 9 sensores por pé
- Mapa de calor dinâmico com interpolação IDW
- Mapa de pressão geral (média ponderada pelo tempo)
- Timeline interativa com reprodução automática
- Painel de sensores com valores em tempo real
- Gráficos de pressão ao longo do tempo
- Gráficos por região anatômica (Antepé, Mediopé, Calcâneo)
- Estatísticas completas da coleta
- Interface responsiva (desktop, tablet, celular)

## Tecnologias

- React 18
- Vite
- Recharts
- CSS (tema escuro científico)

## Deploy

O deploy é automático via GitHub Actions para GitHub Pages.
