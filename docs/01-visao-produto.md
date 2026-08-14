# 01 — Visão de Produto

## 1. Problema

Clínicas e consultórios odontológicos de pequeno e médio porte no Brasil operam com processos fragmentados:

- **Prontuário em papel ou planilha:** risco jurídico (o prontuário é documento de guarda obrigatória), perda de histórico, dificuldade de recuperar imagens/exames e nenhuma rastreabilidade de quem alterou o quê.
- **Agenda desorganizada e faltas altas:** ausência de confirmação ativa gera cadeiras vazias — o principal vazamento de receita da clínica, já que o custo fixo (cadeira, equipe, aluguel) é o mesmo com ou sem paciente.
- **Financeiro no caderno/planilha:** o dentista não sabe o lucro real do mês, quanto tem a receber, quem está inadimplente nem quanto pagar de comissão a cada profissional.
- **WhatsApp manual:** a recepção copia e cola mensagens uma a uma, sem histórico ligado ao paciente e sem padronização; quando a secretária sai da clínica, o histórico de conversas sai com ela (está no celular pessoal dela).

O resultado é um negócio com margem apertada, decisão por intuição e alto retrabalho administrativo.

## 2. Proposta de valor

> **Um único sistema em nuvem onde a clínica agenda, atende, registra o prontuário, cobra e conversa com o paciente — sem trocar de ferramenta e sem digitar a mesma informação duas vezes.**

Três promessas mensuráveis, que orientam as prioridades do MVP:

| Promessa | Como o produto entrega | Métrica |
| --- | --- | --- |
| **Menos cadeiras vazias** | Confirmação e lembrete automáticos por WhatsApp + link público de autoagendamento + fila de espera para reencaixe | Taxa de faltas (no-show) |
| **Prontuário seguro e defensável** | Prontuário digital com odontograma, anamnese, evoluções imutáveis (append-only), anexos e trilha de auditoria | % de atendimentos com evolução registrada no mesmo dia |
| **Clareza financeira** | Orçamento → contrato → parcelas → recebimento → fluxo de caixa, tudo derivado do tratamento executado | % de receita conciliada / inadimplência |

## 3. Diferenciais de posicionamento

O mercado brasileiro já é atendido por players consolidados (ver [Benchmark](./02-benchmark-mercado.md)). Não vencemos por lista de funcionalidades — vencemos por **fluxo, arquitetura e transparência**:

1. **WhatsApp no servidor (WAHA), não extensão no PC da recepção.** Vários concorrentes entregam a integração como extensão de navegador. Nós tratamos a conversa como dado da clínica: caixa de entrada compartilhada, histórico no paciente, automações no servidor — funciona com o computador da recepção desligado. Canal não oficial (ToS Meta); número dedicado e aviso de risco de ban ([ADR-0016](./adr/0016-waha-default-messaging.md)).
2. **Sem paywall no essencial clínico.** Odontograma, prontuário completo, anamnese e agenda online no plano de entrada. Monetizamos escala (nº de profissionais/unidades) e consumo (mensagens, IA), não o direito de registrar o atendimento.
3. **Precificação previsível e sem "consulte-nos".** Preço público, autosserviço, teste grátis sem cartão, implantação não obrigatória.
4. **Dados do cliente são do cliente.** Exportação completa (pacientes, prontuários, financeiro) em formato aberto, self-service, desde o primeiro plano — o oposto do lock-in por migração.
5. **Multi-unidade desde o desenho.** A modelagem de tenant já contempla clínica com múltiplas unidades e consolidação de indicadores, sem precisar de "versão franquia".

## 4. Público-alvo

| Segmento | Perfil | Por que é o alvo do MVP |
| --- | --- | --- |
| **Alvo primário** | Consultório/clínica com 1 a 5 cadeiras e 2 a 10 profissionais | Dor máxima, decisão de compra rápida (o próprio dentista decide), pouca customização exigida |
| Alvo secundário | Clínica com 6–20 cadeiras, múltiplos especialistas, secretaria dedicada | Ticket maior; exige permissões e comissionamento (entram no MVP+) |
| Fora do escopo inicial | Franquias/redes com dezenas de unidades, clínicas com faturamento majoritário por convênio (TISS) | Requisitos de integração e consolidação pesados; entram no roadmap pós-MVP |

## 5. Modelo de negócio

- **SaaS por assinatura mensal/anual**, cobrada por clínica (tenant), com faixas por número de profissionais ativos.
- **Desconto anual** (~10–20%) para reduzir churn e melhorar caixa.
- **Trial de 14 dias sem cartão**, com dados de demonstração que podem ser descartados em um clique.
- **Consumo à parte:** transcrição por IA e consultas a bureaus de crédito, como créditos pré-pagos. WhatsApp no default WAHA **não** repassa tarifa Meta.
- **Add-ons futuros:** meios de pagamento integrados (Pix/boleto/link), assinatura digital, site da clínica.

### Faixas de plano (hipótese inicial a validar)

| Plano | Para quem | Inclui |
| --- | --- | --- |
| **Essencial** | 1 profissional | Agenda + prontuário completo + orçamentos + financeiro básico + WhatsApp (1 número, templates transacionais) |
| **Clínica** | 2–10 profissionais | Tudo do Essencial + permissões por perfil, comissionamento, fluxo de caixa, régua de cobrança, CRM de orçamentos, relatórios |
| **Rede** | Multi-unidade | Tudo do Clínica + consolidação multi-unidade, metas, API pública, SSO |

## 6. Escopo funcional macro (o "produto completo", em fases)

```
MVP (fase 1)              MVP+ (fase 2)              Pós-MVP (fase 3)
─────────────────         ─────────────────          ─────────────────
Identidade e acesso       Comissionamento            Convênios / TISS
Cadastro de clínica       Régua de cobrança          Meios de pagamento integrados
Pacientes                 CRM de orçamentos          Assinatura digital ICP-Brasil
Agenda + autoagendamento  Estoque                    App mobile (paciente/dentista)
Prontuário + odontograma  Documentos/receituário     IA: transcrição de evolução
Orçamentos e tratamentos  Multi-unidade              Site da clínica / marketing
Financeiro (AR/AP/caixa)  Metas e dashboards         Portal do paciente completo
WhatsApp transacional     Pesquisa de satisfação     Ortodontia/alinhadores
Relatórios essenciais     Importação de dados        Integração com raio-X/imagem
```

O detalhamento por item está em [Escopo do MVP](./04-escopo-mvp.md) e nos arquivos de [módulos](./modulos/).

## 7. Princípios de produto

1. **O fluxo da recepção é o fluxo do produto.** Se agendar, confirmar e receber exige mais de 3 cliques, está errado.
2. **Zero digitação duplicada.** Orçamento aprovado gera parcelas; procedimento executado atualiza odontograma, evolução e financeiro.
3. **Nada de dado clínico apagado.** Correções são versões novas com autoria e motivo, nunca sobrescrita.
4. **Rápido no navegador de clínica.** A recepção usa máquina modesta e internet instável: telas leves, otimista no UI, tolerante a reconexão.
5. **Multi-tenant é invariante de segurança, não configuração.** Nenhuma consulta sem `tenant_id`; isolamento garantido também no banco (RLS).
6. **Toda automação é auditável e reversível.** A clínica precisa ver o que o sistema enviou ao paciente e poder desligar.

## 8. Riscos de produto e mitigação

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Migração de dados do sistema atual é o maior bloqueio de venda | Alto | Importador CSV guiado desde o MVP+ e serviço de migração assistida |
| Aprovação de templates e número no WhatsApp Business é lenta/burocrática | Alto | Mitigado pelo [ADR-0016](./adr/0016-waha-default-messaging.md) (WAHA/QR). Risco residual: ban da sessão / QR cair; fallback e-mail |
| Concorrentes com anos de funcionalidades acumuladas | Médio | Não competir em amplitude no ano 1: vencer em prontuário+agenda+WhatsApp e em experiência de uso |
| Sensibilidade jurídica do prontuário (LGPD, guarda, auditoria) | Alto | Requisitos de compliance tratados como funcionalidade de primeira classe ([doc 10](./10-seguranca-lgpd-compliance.md)) |
| Ban ou queda da sessão WhatsApp (cliente não oficial) | Médio | Número dedicado, checkbox de ciência, alerta na UI, e-mail de fallback |
