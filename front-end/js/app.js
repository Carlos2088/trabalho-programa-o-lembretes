// ========================================
// CONFIGURAÇÃO
// ========================================
// Perfil "http" da API (dotnet run --launch-profile http)
const API_URL = "http://localhost:5207";

const estado = {
    pagina: 1,
    totalPaginas: 1,
    ordem: "DataCadastro",
    direcao: "DESC",
};

// ========================================
// ELEMENTOS
// ========================================
const $ = (id) => document.getElementById(id);

const formulario = $("formulario");
const formLembrete = $("formLembrete");
const lembreteId = $("lembreteId");
const descricao = $("descricao");
const erroDescricao = $("erroDescricao");
const contador = $("contador");
const tituloFormulario = $("tituloFormulario");
const btnSalvar = $("btnSalvar");

const filtroDescricao = $("filtroDescricao");
const tamanhoPagina = $("tamanhoPagina");
const cadastroInicial = $("cadastroInicial");
const cadastroFinal = $("cadastroFinal");
const atualizacaoInicial = $("atualizacaoInicial");
const atualizacaoFinal = $("atualizacaoFinal");
const erroFiltro = $("erroFiltro");

const listaLembretes = $("listaLembretes");
const mensagemVazia = $("mensagemVazia");
const carregando = $("carregando");
const alertaApi = $("alertaApi");
const totalRegistros = $("totalRegistros");
const paginaAtualEl = $("paginaAtual");

const btnPrimeira = $("btnPrimeira");
const btnAnterior = $("btnAnterior");
const btnProximo = $("btnProximo");
const btnUltima = $("btnUltima");

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener("DOMContentLoaded", () => {
    atualizarSetas();
    filtrarLembretes();
});

// ========================================
// QUERY STRING (compartilhada por filtro e impressão)
// ========================================
function montarParametros() {
    const params = new URLSearchParams();
    params.append("NumeroPagina", estado.pagina);
    params.append("TamanhoPagina", tamanhoPagina.value);
    params.append("Ordem", estado.ordem);
    params.append("Direcao", estado.direcao);

    const texto = filtroDescricao.value.trim();
    if (texto) params.append("Descricao", texto);

    // só envia a data se foi preenchida (vazio = sem filtro na API)
    if (cadastroInicial.value) params.append("DataCadastroInicial", cadastroInicial.value);
    if (cadastroFinal.value) params.append("DataCadastroFinal", cadastroFinal.value);
    if (atualizacaoInicial.value) params.append("DataAtualizacaoInicial", atualizacaoInicial.value);
    if (atualizacaoFinal.value) params.append("DataAtualizacaoFinal", atualizacaoFinal.value);
    return params;
}

function validarFiltros() {
    erroFiltro.textContent = "";
    if (cadastroInicial.value && cadastroFinal.value && cadastroInicial.value > cadastroFinal.value) {
        erroFiltro.textContent = "Cadastro: a data inicial não pode ser maior que a final.";
        return false;
    }
    if (atualizacaoInicial.value && atualizacaoFinal.value && atualizacaoInicial.value > atualizacaoFinal.value) {
        erroFiltro.textContent = "Atualização: a data inicial não pode ser maior que a final.";
        return false;
    }
    return true;
}

// ========================================
// GET /lembretes/filtro
// ========================================
async function filtrarLembretes() {
    if (!validarFiltros()) return;

    carregando.classList.remove("hidden");
    mensagemVazia.classList.add("hidden");
    alertaApi.classList.add("hidden");

    try {
        const response = await fetch(`${API_URL}/lembretes/filtro?${montarParametros()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const r = await response.json();

        // se a página ficou além do fim (ex.: excluiu o último item dela), volta uma
        const paginas = Math.max(1, Math.ceil(r.total / r.tamanhoPagina));
        if (r.total > 0 && estado.pagina > paginas) {
            estado.pagina = paginas;
            return filtrarLembretes();
        }

        estado.totalPaginas = paginas;
        renderizarLembretes(r.lembretes);

        totalRegistros.textContent = `${r.total} ${r.total === 1 ? "registro" : "registros"}`;
        paginaAtualEl.textContent = `Página ${r.numeroPagina} de ${paginas}`;
        btnPrimeira.disabled = btnAnterior.disabled = estado.pagina <= 1;
        btnProximo.disabled = btnUltima.disabled = estado.pagina >= paginas;
    } catch (erro) {
        console.error(erro);
        listaLembretes.innerHTML = "";
        alertaApi.classList.remove("hidden");
        mostrarToast("Erro na comunicação com a API.", true);
    } finally {
        carregando.classList.add("hidden");
    }
}

// ========================================
// GET /lembretes/imprimir  (usa filtros, página e ordenação atuais)
// ========================================
async function imprimirLembretes() {
    try {
        const response = await fetch(`${API_URL}/lembretes/imprimir?${montarParametros()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const url = URL.createObjectURL(await response.blob());
        const a = document.createElement("a");
        a.href = url;
        a.download = "relatorio-lembretes.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        mostrarToast("Relatório gerado com sucesso!");
    } catch (erro) {
        console.error(erro);
        mostrarToast("Não foi possível gerar o PDF.", true);
    }
}

// ========================================
// POST /lembretes
// ========================================
async function criarLembrete() {
    const response = await fetch(`${API_URL}/lembretes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: descricao.value.trim() }),
    });
    if (!response.ok) throw new Error(await lerErro(response));

    mostrarToast("Lembrete criado com sucesso!");
    estado.pagina = 1; // mostra o novo item (ordenação padrão: mais recente primeiro)
}

// ========================================
// GET /lembretes/{id}
// ========================================
async function buscarLembrete(id) {
    try {
        const response = await fetch(`${API_URL}/lembretes/${id}`);
        if (response.status === 404) {
            mostrarToast("Lembrete não encontrado (talvez já tenha sido excluído).", true);
            return filtrarLembretes();
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const l = await response.json();
        lembreteId.value = l.id;
        descricao.value = l.descricao;
        atualizarContador();
        limparErroDescricao();

        tituloFormulario.textContent = "Editar lembrete";
        formulario.classList.remove("hidden");
        formulario.scrollIntoView({ behavior: "smooth", block: "center" });
        descricao.focus();
    } catch (erro) {
        console.error(erro);
        mostrarToast("Não foi possível buscar o lembrete.", true);
    }
}

// ========================================
// PUT /lembretes/{id}
// ========================================
async function atualizarLembrete() {
    const response = await fetch(`${API_URL}/lembretes/${lembreteId.value}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: descricao.value.trim() }),
    });
    if (!response.ok) throw new Error(await lerErro(response));

    mostrarToast("Lembrete atualizado com sucesso!");
}

// ========================================
// DELETE /lembretes/{id}
// ========================================
async function excluirLembrete(id) {
    if (!confirm("Deseja realmente excluir este lembrete?")) return;

    try {
        const response = await fetch(`${API_URL}/lembretes/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        mostrarToast("Lembrete excluído com sucesso!");
        await filtrarLembretes();
    } catch (erro) {
        console.error(erro);
        mostrarToast("Não foi possível excluir o lembrete.", true);
    }
}

async function lerErro(response) {
    try {
        const t = (await response.text()).replace(/^"|"$/g, "");
        return t || `HTTP ${response.status}`;
    } catch {
        return `HTTP ${response.status}`;
    }
}

// ========================================
// RENDERIZAÇÃO
// ========================================
function renderizarLembretes(lembretes) {
    listaLembretes.innerHTML = "";

    if (!lembretes || lembretes.length === 0) {
        mensagemVazia.classList.remove("hidden");
        return;
    }
    mensagemVazia.classList.add("hidden");

    lembretes.forEach((l) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="desc">${escapar(l.descricao)}</td>
            <td class="data" data-label="Cadastro">${formatarData(l.dataCadastro)}</td>
            <td class="data" data-label="Atualização">${formatarData(l.dataAtualizacao)}</td>
            <td><span class="status ${l.isAtivo ? "status-ativo" : "status-inativo"}">${l.isAtivo ? "Ativo" : "Inativo"}</span></td>
            <td>
                <div class="actions">
                    <button class="btn btn-edit btn-sm" data-acao="editar" data-id="${l.id}">Editar</button>
                    <button class="btn btn-danger btn-sm" data-acao="excluir" data-id="${l.id}">Excluir</button>
                </div>
            </td>`;
        listaLembretes.appendChild(tr);
    });
}

// delegação de eventos (sem onclick inline)
listaLembretes.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-acao]");
    if (!btn) return;
    if (btn.dataset.acao === "editar") buscarLembrete(btn.dataset.id);
    if (btn.dataset.acao === "excluir") excluirLembrete(btn.dataset.id);
});

// ========================================
// ORDENAÇÃO (clique no título da coluna)
// ========================================
document.querySelectorAll("th.sortable").forEach((th) => {
    const alternar = () => {
        const campo = th.dataset.campo;
        if (estado.ordem === campo) {
            estado.direcao = estado.direcao === "ASC" ? "DESC" : "ASC";
        } else {
            estado.ordem = campo;
            estado.direcao = "ASC";
        }
        estado.pagina = 1;
        atualizarSetas();
        filtrarLembretes();
    };
    th.addEventListener("click", alternar);
    th.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alternar(); }
    });
});

function atualizarSetas() {
    document.querySelectorAll("th.sortable").forEach((th) => {
        const ativo = th.dataset.campo === estado.ordem;
        th.setAttribute("aria-sort", ativo ? (estado.direcao === "ASC" ? "ascending" : "descending") : "none");
    });
}

// ========================================
// FORMULÁRIO
// ========================================
$("btnImprimir").addEventListener("click", imprimirLembretes);
$("btnNovo").addEventListener("click", abrirFormularioNovo);
$("btnCancelar").addEventListener("click", fecharFormulario);
$("btnTentar").addEventListener("click", filtrarLembretes);

descricao.addEventListener("input", () => { atualizarContador(); limparErroDescricao(); });

formLembrete.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!descricao.value.trim()) {
        erroDescricao.textContent = "Informe a descrição do lembrete.";
        descricao.classList.add("invalid");
        descricao.focus();
        mostrarToast("Preencha os campos obrigatórios.", true);
        return;
    }

    btnSalvar.disabled = true;
    try {
        if (lembreteId.value) await atualizarLembrete();
        else await criarLembrete();

        fecharFormulario();
        await filtrarLembretes();
    } catch (erro) {
        console.error(erro);
        mostrarToast(lembreteId.value ? "Não foi possível atualizar o lembrete." : "Não foi possível criar o lembrete.", true);
    } finally {
        btnSalvar.disabled = false;
    }
});

function abrirFormularioNovo() {
    lembreteId.value = "";
    descricao.value = "";
    atualizarContador();
    limparErroDescricao();
    tituloFormulario.textContent = "Novo lembrete";
    formulario.classList.remove("hidden");
    descricao.focus();
}

function fecharFormulario() {
    formulario.classList.add("hidden");
    formLembrete.reset();
    lembreteId.value = "";
    atualizarContador();
    limparErroDescricao();
}

function atualizarContador() { contador.textContent = `${descricao.value.length}/500`; }
function limparErroDescricao() { erroDescricao.textContent = ""; descricao.classList.remove("invalid"); }

// ========================================
// FILTROS
// ========================================
function aplicarFiltros() {
    estado.pagina = 1;
    filtrarLembretes();
}

$("btnFiltrar").addEventListener("click", aplicarFiltros);
[filtroDescricao, cadastroInicial, cadastroFinal, atualizacaoInicial, atualizacaoFinal].forEach((el) =>
    el.addEventListener("keyup", (e) => { if (e.key === "Enter") aplicarFiltros(); })
);
tamanhoPagina.addEventListener("change", aplicarFiltros);

$("btnLimpar").addEventListener("click", () => {
    filtroDescricao.value = "";
    cadastroInicial.value = cadastroFinal.value = "";
    atualizacaoInicial.value = atualizacaoFinal.value = "";
    tamanhoPagina.value = "10";
    estado.ordem = "DataCadastro";
    estado.direcao = "DESC";
    atualizarSetas();
    aplicarFiltros();
});

// ========================================
// PAGINAÇÃO
// ========================================
btnPrimeira.addEventListener("click", () => { estado.pagina = 1; filtrarLembretes(); });
btnAnterior.addEventListener("click", () => { if (estado.pagina > 1) { estado.pagina--; filtrarLembretes(); } });
btnProximo.addEventListener("click", () => { if (estado.pagina < estado.totalPaginas) { estado.pagina++; filtrarLembretes(); } });
btnUltima.addEventListener("click", () => { estado.pagina = estado.totalPaginas; filtrarLembretes(); });

// ========================================
// UTILITÁRIOS
// ========================================
function formatarData(data) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// evita XSS ao inserir texto vindo da API via innerHTML
function escapar(texto) {
    const d = document.createElement("div");
    d.textContent = texto ?? "";
    return d.innerHTML;
}

let toastTimer;
function mostrarToast(mensagem, erro = false) {
    const toast = $("toast");
    toast.textContent = mensagem;
    toast.classList.toggle("erro", erro);
    toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add("hidden"), 3500);
}
