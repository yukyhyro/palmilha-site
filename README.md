# PodoSense

**Visualização e análise de pressão plantar**

Aplicação web para análise de dados de sensores FSR em palmilhas instrumentadas.

## Funcionalidades

- **Mapa de Pressão Dinâmico** — acompanha a timeline, mostra pressão no instante selecionado
- **Mapa de Pressão Geral** — visão estática de toda a coleta (média ponderada pelo tempo)
- **Timeline interativa** com play/pause/step e velocidades 0.5x–4x
- **Suporte a 5 ou 9 sensores** — detecta automaticamente
- **Posicionamento anatômico correto** — pé esquerdo e direito conforme Figura 2 de referência
- **Gráficos** de pressão × tempo
- **Estatísticas** calculadas dos dados reais
- **Parser inteligente** que detecta delimitador e colunas automaticamente

> Dados processados localmente. Não realiza diagnóstico médico.

## Deploy

Push na branch `main` → GitHub Actions faz o build automaticamente → GitHub Pages publica.
