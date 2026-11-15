# Caderninho — Lembretes (UMFG · Programação III · 2026)

Front-end (HTML/CSS/JS puro) + Minimal API (.NET 8) + MySQL no Docker.

```
api/         Minimal API .NET 8 (EF Core + MySQL + QuestPDF)
front-end/   Interface (index.html, css/style.css, js/app.js)
docker-compose.yml   Banco MySQL
docs/ETAPAS.md       Relatório das etapas 1, 2, 3, 7 e 9
```

## Como executar

**1. Banco (Docker)**
```bash
docker compose up -d
```
Sobe o MySQL 8 na porta `3306` (usuário `root`, senha `root`, banco `umfg_lembrete_develop`),
igual ao `appsettings.Development.json`. As migrations rodam sozinhas quando a API inicia.
> Se já tem MySQL local na 3306, mude a porta no compose (ex.: `"3308:3306"`) e use o perfil `umfg`
> (`dotnet run --launch-profile umfg`), que aponta para a 3308.

**2. API**
```bash
cd api/umfg.programacaoiii.minimalapi.2026
dotnet run --launch-profile http
```
API em `http://localhost:5207`.

**3. Front-end** — abra `front-end/index.html` (ou use a extensão *Live Server* do VS Code).

## Correções feitas na API (bugs do código original)
| Problema | Efeito | Correção |
|---|---|---|
| `DataCadastroFinal` com padrão `MinValue` e `DataAtualizacaoInicial` com padrão `MaxValue` | `/lembretes/filtro` sem datas **nunca retornava nada** | Padrões invertidos para `MinValue` (inicial) / `MaxValue` (final) |
| `OrderBy(x => dto.Ordem)` ordenava por uma constante | Ordenação **ignorada** | Ordenação por campo real (`Descricao`, `DataCadastro`, `DataAtualizacao`), com whitelist |
| `Guid.Parse` direto | ID inválido gerava erro 500 | `Guid.TryParse` → 400 |
| POST recebia a entidade direto | Descrição vazia gerava 500 | Usa `LembreteDTO` + validação → 400 |
| PUT/DELETE em registro inativo | Alterava registro "excluído" | Retorna 404 |
| `UseHttpsRedirection` em dev | Redirect quebra o preflight do CORS no front em `http` | Só fora do ambiente Development |
| `.http` com `weatherforecast` | Arquivo de teste não correspondia à API | Reescrito com os endpoints reais |

## Publicar no GitHub (etapa 10)
```bash
cd umfg-lembretes
git init
git add .
git commit -m "feat: lembretes com filtros, paginacao, ordenacao e novo visual"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/umfg-lembretes.git
git push -u origin main
```
Crie o repositório como **Public** no GitHub e anexe o link no AVA.
