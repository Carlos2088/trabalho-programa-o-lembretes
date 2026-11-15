# Relatório das etapas

## Etapa 1 — Estrutura do projeto
**Front-end:** `index.html` (estrutura), `css/style.css` (visual), `js/app.js` (lógica e chamadas HTTP com `fetch`).
**API:** `Program.cs` (endpoints, CORS, PDF), `Entidades/Lembrete.cs`, `DTO/`, `Contexto/MySqlContexto.cs` (EF Core + migrations automáticas).

| Método | Rota | Função |
|---|---|---|
| GET | `/lembretes` | lista todos os ativos |
| GET | `/lembretes/{id}` | busca por ID |
| GET | `/lembretes/filtro` | filtros + paginação + ordenação |
| GET | `/lembretes/imprimir` | PDF com os mesmos parâmetros do filtro |
| POST | `/lembretes` | cria (`{"descricao": "..."}`) |
| PUT | `/lembretes/{id}` | atualiza a descrição |
| DELETE | `/lembretes/{id}` | exclusão lógica (`IsAtivo = false`) |

**Comunicação:** o JS chama `fetch(API_URL + rota)`, envia JSON no POST/PUT (`Content-Type: application/json`),
recebe JSON e redesenha a tabela via DOM. Filtros viajam na *query string*.
Parâmetros de `/lembretes/filtro`: `NumeroPagina, TamanhoPagina, Ordem, Direcao, Descricao,
DataCadastroInicial, DataCadastroFinal, DataAtualizacaoInicial, DataAtualizacaoFinal`.

## Etapa 2 — Testes das requisições
Use `api/.../umfg.programacaoiii.minimalapi.2026.http` (VS Code REST Client / Visual Studio) ou o front.
Esperado: POST → 201; GET → 200; GET id inexistente → 404; GET id malformado → 400;
PUT → 200; DELETE → 204; POST com descrição vazia → 400.

## Etapa 3 — CORS
Origem = protocolo + domínio + porta. Front (ex.: `http://127.0.0.1:5500`) e API (`http://localhost:5207`) têm
origens diferentes; por segurança o navegador bloqueia a leitura da resposta (*Same-Origin Policy*) a menos que a API
autorize via cabeçalhos `Access-Control-Allow-*`.
A policy `Frontend` usa `AllowAnyOrigin/AnyHeader/AnyMethod` e é ativada com `app.UseCors("Frontend")`.
Em requisições com `Content-Type: application/json` (POST/PUT) e em DELETE/PUT o navegador envia antes um
*preflight* `OPTIONS`; o CORS responde a ele. Em produção, restrinja com `.WithOrigins("https://dominio-do-front")`.
CORS é proteção do **navegador**: Postman/curl não são afetados.

## Etapa 7 — Validação no DevTools (F12 → Network → Fetch/XHR)
Confira para cada ação:
- **Filtrar:** `GET /lembretes/filtro?NumeroPagina=1&TamanhoPagina=10&Ordem=DataCadastro&Direcao=DESC&Descricao=...&DataCadastroInicial=2026-11-01...` → 200, JSON com `lembretes,total,numeroPagina,tamanhoPagina`.
- **Clicar no título da coluna:** a query muda `Ordem`/`Direcao`.
- **Próxima página:** `NumeroPagina` incrementa.
- **Criar/Editar:** aba *Payload* mostra `{"descricao":"..."}`; *Headers* mostra `Content-Type: application/json`; antes dele aparece um `OPTIONS` (preflight, 204).
- **Excluir:** `DELETE /lembretes/{id}` → 204.
- **Resposta (*Headers*)** deve conter `access-control-allow-origin: *`.
- **Erro:** pare a API e veja `net::ERR_CONNECTION_REFUSED` + banner vermelho na tela.

## Etapa 9 — Checklist de testes finais
- [ ] Cadastrar (vazio mostra erro; válido mostra toast verde e aparece no topo)
- [ ] Editar (carrega via GET por ID, salva via PUT, "Atualização" muda)
- [ ] Excluir (confirmação, toast, some da lista; na última página volta uma página)
- [ ] Filtro por descrição (parcial, ignora maiúsculas)
- [ ] Filtros de data de cadastro e atualização (inicial, final, ambos; inicial > final mostra erro)
- [ ] Registros por página 5/10/20/50
- [ ] Paginação (« ‹ › »; botões desabilitam nos extremos)
- [ ] Ordenação (clique em Descrição/Cadastro/Atualização alterna ▲/▼)
- [ ] Nenhum registro → "Nenhum lembrete encontrado"
- [ ] API desligada → banner + toast de erro
- [ ] Imprimir PDF respeita filtros/página/ordem
- [ ] Layout responsivo (reduza a janela < 600px)
