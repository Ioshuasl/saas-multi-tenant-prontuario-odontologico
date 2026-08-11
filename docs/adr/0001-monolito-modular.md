# ADR-0001 — Monólito modular com Clean Architecture e DDD

- **Status:** Aceito
- **Data:** 2026-08-11
- **Contexto do projeto:** SaaS B2B multi-tenant para clínicas odontológicas, MVP com time pequeno

## Contexto

Precisamos de uma arquitetura que suporte um domínio grande e heterogêneo (agenda, prontuário, financeiro, mensageria) com um time de 1–2 desenvolvedores, sem sacrificar a possibilidade de crescer. As alternativas consideradas foram microsserviços desde o início, monólito em camadas técnicas (controllers/services/repositories globais) e monólito modular com fronteiras de domínio.

O domínio tem invariantes fortes e regras que não podem vazar para controllers: não duplo-agendar, evolução clínica imutável, soma de parcelas igual ao total aprovado, isolamento entre clínicas. Erro nessas regras é dano clínico, financeiro ou jurídico.

## Decisão

Adotamos **monólito modular** com um módulo por bounded context (`identity`, `clinic`, `patients`, `scheduling`, `clinical-records`, `treatments`, `billing`, `messaging`, `reporting`, `subscription`), cada um internamente organizado em camadas de **Clean Architecture**, com modelagem de domínio rica (DDD) e princípios SOLID.

As camadas usam o padrão Orius do time — 1 arquivo por operação (`list`/`get`/`create`/`update`/`delete`), classes curtas (`CreateService`, `ListRepository`), `actions/` só com efeito além do repositório, e `models/` rico (DDD). Nomenclatura de arquivo: `snake_case` no backend. O mapeamento completo e o exemplo canônico `Patient` estão em [16 — Estrutura de Pastas](../16-estrutura-de-pastas.md); a regra de dependência Clean Architecture permanece.

Regras de fronteira:

1. Dependências apontam para dentro: borda → `services/` → `models/`. O domínio não conhece Express, Prisma nem HTTP.
2. Um módulo só acessa outro pelo `<dominio>_public.ts` do outro (ports/DTOs), nunca por internals nem por JOIN em tabelas alheias.
3. Comunicação síncrona por port quando o resultado precisa ser atômico/imediato (ex.: aprovar orçamento → criar título); assíncrona por eventos de domínio + outbox nos demais casos.
4. Um único banco, mas cada módulo é dono das suas tabelas.
5. Um único artefato de deploy (`api`), com o worker rodando o mesmo código em outro comando.

As regras 1 e 2 são verificadas automaticamente no CI (ESLint boundaries + dependency-cruiser) — fronteira sem verificação automática apodrece.

## Consequências

**Positivas**

- Uma transação de banco cobre operações que atravessam módulos, sem saga distribuída. Isso é decisivo para invariantes financeiras.
- Um deploy, um ambiente local, um pipeline: custo operacional mínimo para time pequeno.
- Refatoração entre módulos é barata (mesmo compilador, mesmo repositório).
- Extração futura de um módulo para serviço próprio é possível justamente porque a fronteira existe desde o início (candidatos naturais: `messaging` e `reporting`).
- Testes de domínio rápidos e sem I/O, onde está a maior parte da complexidade.

**Negativas / custos aceitos**

- Escala é do processo inteiro, não de partes. Aceitável: o gargalo previsto é banco, e a escala horizontal do processo stateless resolve o resto.
- Uma falha grave (memory leak, loop) afeta todo o sistema. Mitigado com o worker em processo separado, health checks e limites de recurso.
- Exige disciplina: sem verificação automática, os módulos se acoplam em semanas.
- Mais cerimônia que um CRUD direto (entidades, casos de uso, ports). Aceitamos a cerimônia onde há regra de negócio e a reduzimos deliberadamente em CRUDs simples (ver abaixo).

## Alternativas rejeitadas

**Microsserviços desde o início:** custo operacional (observabilidade distribuída, consistência eventual, N pipelines) desproporcional a um time de 1–2 pessoas sem clientes ainda. Consistência eventual entre orçamento e financeiro seria um gerador constante de bug de dinheiro.

**Monólito em camadas técnicas globais** (um `/controllers`, `/services`, `/models` na raiz, sem módulos): é o caminho mais rápido no mês 1 e o mais lento no mês 12 — a regra de negócio se espalha por services gigantes, tudo depende de tudo, e não há fronteira para extrair nada depois. Note que a diferença não está nos nomes das pastas (que mantemos), e sim em elas estarem **dentro de cada módulo** e sob regra de dependência.

**DDD/Clean em tudo, sem exceção:** rejeitado por pragmatismo. Módulos e recursos essencialmente CRUD (catálogo de procedimentos, categorias financeiras, tags) usam uma versão enxuta (use case + repositório, sem value objects elaborados). A complexidade arquitetural é reservada a onde há invariante: agenda, prontuário, orçamento/financeiro.

## Verificação

- `pnpm arch:check` (dependency-cruiser) falha se `models/` importar framework ou se houver ciclo.
- ESLint `boundaries` falha em import de internals de outro módulo.
- Cobertura mínima de 90% em `models/`.
- Revisão de PR pergunta explicitamente: "essa regra está no domínio ou vazou?"

## Referências

- [docs/05-arquitetura.md](../05-arquitetura.md)
- Evans, *Domain-Driven Design*; Martin, *Clean Architecture*
