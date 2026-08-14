# 03 — Personas e Jornadas

## 1. Personas

### P1 — Dr. Rafael, dentista-proprietário (decisor)

- Clínica própria, 3 cadeiras, 4 profissionais (2 CDs além dele, 1 auxiliar), 1 recepcionista.
- Atende 8–12 pacientes/dia; assume também a gestão à noite e no fim de semana.
- **Dores:** não sabe o lucro real do mês; descobre inadimplência tarde; prontuário em papel ocupa espaço e o preocupa juridicamente; a agenda tem furos por faltas.
- **O que espera do sistema:** ver a clínica em um painel, confiar no prontuário, saber quanto entra e sai, e não perder tempo com burocracia.
- **Critério de compra:** implantação rápida, preço previsível, suporte que responde, não travar o dia a dia da equipe.

### P2 — Camila, recepcionista/secretária (usuária de maior volume)

- Fica no sistema 8h/dia; é quem realmente decide se a ferramenta "funciona".
- Faz agendamento, confirmação, recebimento no balcão, remarcação, atendimento no WhatsApp — simultaneamente.
- **Dores:** WhatsApp no celular pessoal; precisa perguntar ao dentista se pode remarcar; anota pagamento no caderno; sem visão de encaixe quando alguém cancela.
- **O que espera:** agenda visual e rápida, WhatsApp dentro do sistema, poucos cliques, funcionar em máquina fraca.

### P3 — Dra. Letícia, dentista associada (usuária clínica)

- Atende em duas clínicas; quer registrar rápido e sair.
- **Dores:** perde tempo digitando evolução; não encontra a radiografia do paciente; não sabe quanto vai receber de comissão.
- **O que espera:** odontograma clicável, evolução em poucos segundos, anexos acessíveis, extrato de produção.

### P4 — Sr. José / Sra. Ana, pacientes (usuários externos)

- Querem marcar sem ligar, ser lembrados, saber quanto devem e receber o comprovante.
- **O que esperam:** link de agendamento que funciona no celular, confirmação por WhatsApp em um toque, anamnese respondida em casa.

### P5 — Equipe da plataforma (nós — operação do SaaS)

- Precisa provisionar tenant, investigar incidente sem violar dado clínico, medir adoção, cobrar assinatura e suspender inadimplente.
- **O que espera:** painel administrativo interno, logs de auditoria, acesso de suporte controlado e rastreado ("break-glass").

## 2. Mapa de papéis × permissões (visão inicial)

| Capacidade | Owner (dono) | Dentista | Recepção | Auxiliar/ASB | Financeiro | Suporte plataforma |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| Ver/editar agenda | ✔ | ✔ (própria + ver outras) | ✔ | ✔ (ver) | ✖ | ✖ |
| Cadastrar/editar paciente | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ |
| Ver prontuário clínico | ✔ | ✔ | ✖ (só dados administrativos) | ✔ (limitado) | ✖ | ✖ (só com break-glass auditado) |
| Registrar evolução clínica | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ |
| Criar/aprovar orçamento | ✔ | ✔ | ✔ (criar) | ✖ | ✖ | ✖ |
| Ver financeiro da clínica | ✔ | ✖ (só própria produção) | ✔ (recebimentos do dia) | ✖ | ✔ | ✖ |
| Configurar clínica/plano/usuários | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ |
| Enviar mensagem no WhatsApp | ✔ | ✔ | ✔ | ✖ | ✔ (cobrança) | ✖ |
| Exportar dados do tenant | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ |

Detalhamento em [Identidade e Acesso](./modulos/01-identidade-acesso.md).

## 3. Jornadas críticas

### J1 — Onboarding da clínica (self-service, meta: < 15 minutos até o primeiro agendamento)

```
Cadastro (e-mail + senha)
  → cria Tenant + Unidade + usuário Owner
  → wizard: dados da clínica (CNPJ/CRO, endereço, fuso)
  → wizard: profissionais e horários de atendimento
  → wizard: tabela de procedimentos (importar catálogo padrão sugerido)
  → wizard: conectar WhatsApp (opcional; pode pular)
  → agenda pronta + link público de agendamento gerado
```

Regras de sucesso: nenhum passo obrigatório além dos dois primeiros; catálogo de procedimentos pré-populado; possibilidade de carregar dados de demonstração e apagá-los em um clique.

### J2 — Agendamento pela recepção (meta: ≤ 3 interações)

```
Camila abre a Agenda (dia atual, todos os profissionais)
  → clica no slot livre desejado
  → busca paciente por nome/CPF/telefone (ou cria com nome + telefone)
  → escolhe procedimento/duração (duração sugerida pelo procedimento)
  → confirma → status AGENDADO
  → sistema agenda automaticamente: confirmação (WhatsApp) em D-1 e lembrete em H-3
```

### J3 — Autoagendamento pelo paciente

```
Paciente abre link público da clínica (/agendar/{slug})
  → escolhe profissional/serviço → vê horários realmente livres
  → informa nome, telefone, CPF (opcional) → recebe código OTP por WhatsApp/SMS
  → confirma → agendamento criado com status SOLICITADO ou AGENDADO (conforme política da clínica)
  → recebe confirmação e link para responder a anamnese antes da consulta
```

Guardas obrigatórios: rate limit por IP/telefone, janela mínima de antecedência, bloqueio de horários fora do expediente, prevenção de double-booking com trava transacional.

### J4 — Confirmação e redução de faltas

```
D-1 09:00  → template "utility" de confirmação com botões [Confirmar] [Remarcar]
Paciente toca Confirmar  → webhook → status CONFIRMADO → agenda muda de cor
Paciente toca Remarcar   → conversa entra na caixa de entrada, marcada como "precisa de humano"
Sem resposta até H-6     → lembrete final
Paciente não comparece   → recepção marca FALTOU → paciente entra na régua de recontato
```

### J5 — Cancelamento → reencaixe (diferencial D3)

```
Consulta cancelada (por paciente ou clínica)
  → slot volta a livre
  → sistema busca fila de espera compatível (profissional, procedimento, preferências de horário)
  → envia oferta do horário aos N primeiros da fila (template utility, com botão de aceitar)
  → primeiro a aceitar ocupa o slot (trava otimista); os demais recebem aviso de que a vaga foi preenchida
```

### J6 — Atendimento clínico (meta: evolução registrada em < 60s)

```
Dentista abre a agenda do dia → clica no paciente → status ATENDENDO
  → aba Prontuário: anamnese (alertas de alergia/condições em destaque), odontograma, histórico
  → clica no dente/face no odontograma → registra achado ou executa procedimento planejado
  → escreve evolução (com atalhos/templates de texto) → assina (usuário logado + timestamp)
  → procedimento marcado como EXECUTADO → gera lançamento financeiro/comissão
  → status ATENDIDO; opcional: agendar retorno na mesma tela
```

Invariantes: evolução é **append-only** (correção gera nova versão vinculada, com motivo); todo acesso a prontuário é logado.

### J7 — Orçamento → aprovação → recebimento

```
Dentista/recepção monta orçamento (procedimentos + dentes/faces + valores da tabela)
  → envia ao paciente (PDF + link/WhatsApp)
  → paciente aprova (presencial ou pelo link)
  → aprovação gera Plano de Tratamento (itens PLANEJADOS) + Contas a Receber (parcelas)
  → recepção recebe parcela no balcão (dinheiro/cartão/Pix) → baixa da parcela
  → recibo enviado por WhatsApp
```

### J8 — Fechamento financeiro do mês (proprietário)

```
Dono abre Financeiro → Fluxo de caixa do mês
  → vê recebido x a receber x despesas x saldo
  → confere inadimplência (lista com dias em atraso e ação de cobrança)
  → confere produção por profissional (base de comissão)
  → exporta relatório (Excel/CSV) para o contador
```

### J9 — Atendimento no WhatsApp (caixa de entrada compartilhada)

```
Paciente escreve para o número da clínica
  → conversa aparece na Inbox, vinculada ao paciente pelo telefone (ou "não identificado")
  → recepção responde livremente (janela de 24h aberta = mensagem gratuita)
  → pode, a partir da conversa: abrir agenda, criar agendamento, ver débitos, enviar orçamento
  → toda mensagem fica no histórico do paciente
```

### J10 — LGPD: paciente exerce direitos

```
Titular solicita acesso/cópia/correção/eliminação
  → clínica registra a solicitação no sistema (com prazo)
  → sistema gera pacote de dados do titular (PDF + JSON)
  → eliminação: anonimização dos dados não sujeitos a guarda obrigatória; o prontuário permanece
    sob a base legal de obrigação legal/regulatória e guarda mínima aplicável, com justificativa registrada
```

## 4. Cenários de teste de aceitação derivados das jornadas

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| A1 | Dois usuários tentam agendar o mesmo slot simultaneamente | Um sucesso, outro recebe erro 409 com sugestão de horários |
| A2 | Paciente confirma pelo botão do WhatsApp | Status muda para CONFIRMADO em < 5s e a agenda reflete sem recarregar |
| A3 | Usuário da recepção abre prontuário clínico | 403 e evento de auditoria registrado |
| A4 | Orçamento aprovado com 6 parcelas | 6 contas a receber criadas, soma exatamente igual ao total do orçamento (sem erro de centavos) |
| A5 | Tenant A tenta acessar paciente do tenant B por ID direto | 404 (não 403, para não revelar existência) e alerta de segurança |
| A6 | Evolução clínica editada | Nova versão criada; versão anterior permanece consultável com autor e data |
| A7 | Cancelamento às 14h de consulta das 16h com 3 pacientes na fila de espera | Ofertas enviadas; primeiro a aceitar fica com o slot; slot não fica duplicado |
| A8 | Sessão WhatsApp desconectada ou kill switch | Automação não dispara, alerta no painel, agendamento não é bloqueado |
