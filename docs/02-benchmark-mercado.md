# 02 — Benchmark de Mercado

Pesquisa realizada nos materiais públicos (páginas de produto, planos e preços, FAQ e blog) dos quatro players indicados: **Simples Dental**, **Clinicorp**, **Codental** e **Dental Office**. Todos os dados abaixo vêm de páginas públicas dos fornecedores consultadas em agosto de 2026 — preços e empacotamento mudam com frequência e devem ser reconferidos antes de qualquer decisão comercial.

Fontes principais:

- Simples Dental — <https://www.simplesdental.com/planos-e-precos>, <https://www.simplesdental.com/blog/funcionalidades-do-simples-dental/>
- Clinicorp — <https://www.clinicorp.com/planos>, <https://www.clinicorp.com/faq>
- Codental — <https://www.codental.com.br/preco>, <https://www.codental.com.br/sistema-para-dentista>
- Dental Office — <https://www.dentaloffice.com.br/funcionalidades/>, <https://www.dentaloffice.com.br/dental-office/>

---

## 1. Resumo por player

### 1.1 Simples Dental

Posicionamento: software odontológico "completo e simples", forte em reputação (destaca nota ~9,4/10 no Reclame Aqui) e em apps móveis para clínica e paciente.

- **Empacotamento:** três planos — Basic, Plus e Pro — com preço público (na consulta: R$ 149,90 / R$ 249,90 / R$ 349,90 mensais, com ~10% de desconto no anual).
- **Basic (entrada):** agenda online com link de agendamento, prontuário eletrônico completo, odontograma digital, orçamento digital, modelo de anamnese, receituário/atestado digitais, apps para dentista e paciente ("Meu Doutor"), conta digital e meios de pagamento, confirmação automática por WhatsApp (serviço pago à parte), site da clínica e campanhas (à parte), IA para criação de evoluções por voz (à parte).
- **Plus:** emissão de NFS-e, consulta de crédito com score, comissionamento automático, maquininha integrada, fluxo de caixa, relatórios/indicadores em Excel, controle de ortodontia e alinhadores, "Copiloto" (extensão no WhatsApp Web).
- **Pro:** contratos e termos de consentimento integrados ao orçamento, armazenamento ilimitado de imagens, integração com WhatsApp Web, funil de oportunidades/agendamentos e de orçamentos não aprovados (CRM), metas de vendas, programa de indicações, faceograma de HOF.
- **Destaques transversais:** controle por cadeiras, controle de convênio, controle de estoque, gestão de acesso e permissões, débitos do paciente, boleto/Pix/link de pagamento, indicador de inadimplência, agenda integrada à Alexa.

**Leituras para o nosso produto:** (a) o "Copiloto" no WhatsApp Web é o recurso mais promovido e está no plano intermediário/superior — sinal de que WhatsApp é o principal diferencial percebido; (b) fluxo de caixa e relatórios ficam fora do plano de entrada — abertura para nos diferenciarmos; (c) muitos itens são "pagos à parte", o que gera atrito de previsibilidade de custo.

### 1.2 Clinicorp

Posicionamento: gestão "de ponta a ponta" focada em **lucratividade** e em franquias/redes de odontologia e estética; declara mais de 60 funcionalidades organizadas em 6 pilares (marketing e vendas, experiência do paciente, gestão de pessoas, gestão financeira, gestão contábil, metas e indicadores).

- **Empacotamento:** Standard (R$ 159,90/mês) e Premium (R$ 369,90/mês), além de combos de IA com "valores sob consulta"; **implementação paga é obrigatória** em todos os planos.
- **Organização das funcionalidades por etapa da jornada** (é o mapa funcional mais completo dos quatro):
  1. **Captação:** CRM, controle de indicação, relatórios de primeira consulta, localização e faixa etária.
  2. **Agendamento:** agenda inteligente, agendamento online, check-in via app do paciente (Clini.me), confirmações e alertas (WhatsApp/SMS/e-mail/app), integração com chatbot (Cloudia), WhatsApp Web, marcadores, múltiplos agendamentos, relatórios de faltas e desmarcações.
  3. **Avaliação e orçamento:** emissão de orçamentos, contratos e termos, portal de assinaturas, plano de recorrência, prontuário digital, anamnese digital, fichas clínicas por especialidade, odontograma, integração com câmera intraoral, assinatura digital (profissional) e eletrônica (paciente), consulta SPC.
  4. **Pagamento e antinadimplência:** NFS-e, régua de cobrança automática, inclusão no SPC, controle de meios de pagamento, boletos, recibos, Pix cobrança, baixa automática de pagamentos, relatório de pagamentos vencidos.
  5. **Execução de tratamentos:** central de relacionamento, atestados e receituários, controle protético, gestão de casos de alinhadores, alerta de retorno, relatórios de retorno/aniversariantes/última consulta.
  6. **Financeiro e estratégia:** contas a pagar/receber, fluxo de caixa, relatórios financeiros básicos e avançados, comissões, estoque, metas, dashboard analítico, central de acessos, gestão e ranking de unidades.
- **Transversal:** usuários ilimitados, 10 GB de armazenamento em nuvem, app do paciente gratuito, importação de dados em até 10 dias úteis, treinamentos e suporte via chat.

**Leituras para o nosso produto:** (a) a jornada "captação → agendamento → orçamento → pagamento → execução → gestão" é uma excelente espinha dorsal de modelagem de domínio e será a base dos nossos bounded contexts; (b) **régua de cobrança** e **baixa automática** são os recursos financeiros de maior valor percebido; (c) implementação obrigatória e preço sob consulta criam atrito — nosso autosserviço é diferencial; (d) limite de 10 GB indica que armazenamento de imagem é custo relevante — precisa de política clara desde o início.

### 1.3 Codental

Posicionamento: "simplesmente funciona" — simplicidade, curva de aprendizado curta e preço de entrada agressivo.

- **Empacotamento:** Essencial (R$ 89,90/mês), Controle (R$ 134,90/mês) e Avançado (R$ 179,90/mês, "o mais vendido"), 10% off no anual, teste grátis de 7 dias sem cartão.
- **Limite por plano bem explícito:** número de agendas (1 / 3 / ilimitado) — modelo de escalonamento simples e compreensível.
- **Agendamento:** link de agendamento para o paciente, central de retorno, compromisso recorrente, bloqueio inteligente, confirmação automática e manual (com link que altera a agenda automaticamente), créditos bônus de SMS por plano.
- **Prontuário:** anamnese inteligente (enviada ao paciente para responder antes da consulta), orçamentos, evolução de tratamentos, tratamentos por convênio (tabela de preços por convênio), controle de pagamento, armazenamento ilimitado de imagens e exames, odontograma.
- **Documentos:** assinaturas digitais ilimitadas (evoluções, anamneses, contratos), prescrição com assinatura digital (exige certificado A1/A3), emissão de contrato ao fechar orçamento, assinatura do paciente pelo celular.
- **Relacionamento:** campanhas automatizadas (retorno semestral, inadimplência, aniversariantes, personalizada), pesquisa de satisfação automática 2h após o atendimento, extensão "Codental Connect" para WhatsApp Web, transcrição de evolução clínica com IA.
- **Custo variável transparente:** WhatsApp a R$ 0,07/mensagem para confirmação e R$ 0,30/mensagem para campanhas; SMS a partir de R$ 0,20; consulta Serasa à parte. Declara autorização da Meta para envio das mensagens automáticas.

**Leituras para o nosso produto:** (a) é o benchmark de **transparência de custo variável** — vamos replicar essa clareza; (b) "anamnese enviada antes da consulta" e "confirmação com link que altera a agenda sozinha" são fluxos de altíssimo custo-benefício e entram no MVP; (c) diferenciar planos por *número de agendas* é simples de comunicar e de implementar.

### 1.4 Dental Office

Posicionamento: ganho de produtividade quantificado no discurso ("até 60% de produtividade", "10% no lucro operacional", "5 horas/semana", "+40% de confirmação de consultas", "+35% de conversão"), com módulos de gestão, prontuário, agenda e marketing/CRM.

- **Financeiro:** ferramentas concentradas em redução de inadimplência e organização das finanças; painel gerencial e relatórios acessíveis remotamente.
- **Prontuário eletrônico:** foco em segurança, acesso ao histórico e conformidade com a LGPD.
- **Agenda digital:** status por cores (agendado, confirmado, atendendo, faltou), divisão por profissional, autoagendamento por link compartilhável, integração com WhatsApp Business para mensagens automáticas.
- **CRM / marketing:** dashboard de relacionamento para converter agendamentos em vendas e fidelizar pacientes.
- **Especialidades:** acompanhamento de Harmonização Orofacial, Implantodontia e Periodontia.
- **Mobilidade:** app gratuito para acompanhar pacientes, agenda e financeiro.
- **Comercial:** teste grátis de 7 dias; preço não público (formulário para contato com especialista).

**Leituras para o nosso produto:** (a) **status visual da consulta por cores** é padrão de mercado esperado pela recepção — nossa agenda precisa nascer com máquina de estados explícita; (b) o discurso de venda é orientado a números, o que reforça a necessidade dos nossos relatórios provarem ganho (faltas evitadas, receita recuperada); (c) a ausência de preço público é atrito que exploramos.

---

## 2. Matriz comparativa consolidada

Legenda: ● presente e destacado · ◐ presente em plano superior / pago à parte · ○ não identificado no material público

| Funcionalidade | Simples Dental | Clinicorp | Codental | Dental Office | **Nosso MVP** |
| --- | :-: | :-: | :-: | :-: | :-: |
| Prontuário digital completo | ● | ● | ● | ● | ● |
| Odontograma | ● | ● | ● | ● | ● |
| Anamnese digital (respondida pelo paciente) | ● | ● | ● | ◐ | ● |
| Fichas clínicas por especialidade | ○ | ● | ○ | ● | fase 2 |
| Evolução clínica com autoria e histórico | ● | ● | ● | ● | ● |
| Anexos/imagens no prontuário | ◐ (ilimitado no Pro) | ◐ (10 GB) | ● (ilimitado) | ● | ● (cota por plano) |
| Agenda com status por cor | ● | ● | ● | ● | ● |
| Link público de autoagendamento | ● | ● | ● | ● | ● |
| Confirmação automática (WhatsApp/SMS) | ◐ pago | ◐ pago | ◐ pago | ● | ● (crédito à parte) |
| Bloqueio de horário / compromisso recorrente | ● | ● | ● | ◐ | ● |
| Central de retorno / alerta de retorno | ● | ● | ● | ◐ | fase 2 |
| Fila de espera / reencaixe | ○ | ◐ | ○ | ○ | ● (diferencial) |
| Orçamento digital | ● | ● | ● | ● | ● |
| Contrato e termo de consentimento | ◐ (Pro) | ◐ | ◐ | ○ | fase 2 |
| Assinatura eletrônica do paciente | ◐ pago | ◐ pago | ● | ○ | fase 2 |
| Receituário/atestado digital | ● | ● | ● | ◐ | fase 2 |
| Contas a receber + parcelamento | ● | ● | ● | ● | ● |
| Contas a pagar | ◐ | ● | ◐ | ● | ● |
| Fluxo de caixa | ◐ (Plus) | ● | ◐ | ● | ● |
| Régua de cobrança automática | ◐ | ● | ● (campanha) | ● | fase 2 |
| Comissionamento de profissionais | ◐ (Plus) | ● | ○ | ◐ | fase 2 |
| NFS-e | ◐ pago | ◐ pago | ○ | ○ | pós-MVP |
| Meios de pagamento integrados (Pix/boleto/link/maquininha) | ● | ● | ○ | ◐ | pós-MVP |
| Caixa de entrada WhatsApp compartilhada | ○ | ◐ (WhatsApp Web) | ◐ (extensão) | ◐ | ● (diferencial) |
| Extensão de WhatsApp Web | ● | ● | ● | ○ | ○ (por escolha) |
| Chatbot / agente de IA no WhatsApp | ○ | ◐ (combo IA) | ○ | ○ | pós-MVP |
| Transcrição de evolução por IA | ◐ pago | ◐ (combo IA) | ● (Avançado) | ○ | pós-MVP |
| CRM / funil de orçamentos | ◐ (Pro) | ● | ◐ | ● | fase 2 |
| Pesquisa de satisfação (NPS) | ○ | ◐ | ● | ○ | fase 2 |
| Controle de estoque | ● | ◐ pago | ○ | ◐ | fase 2 |
| Convênios com tabela de preços própria | ● | ● | ● | ◐ | fase 2 |
| Multi-unidade / ranking de unidades | ◐ | ● | ○ | ◐ | fase 2 (modelado no MVP) |
| Permissões por perfil | ● | ● | ◐ | ● | ● |
| Metas e dashboard analítico | ◐ (Pro) | ● | ○ | ● | fase 2 |
| App do paciente | ● | ● | ○ | ● | pós-MVP |
| App do profissional | ● | ● | ○ | ● | pós-MVP (PWA no MVP) |
| Site da clínica | ◐ pago | ○ | ● | ◐ | pós-MVP |
| Consulta de crédito (Serasa/SPC) | ◐ pago | ◐ pago | ◐ pago | ○ | pós-MVP |
| Exportação completa dos dados (self-service) | ○ | ○ | ○ | ○ | ● (diferencial) |
| Preço público na web | ● | ● | ● | ○ | ● |
| Trial sem cartão | ● | ○ | ● (7 dias) | ● (7 dias) | ● (14 dias) |

## 3. Padrões de mercado que devemos simplesmente adotar

Esses itens são **expectativa mínima** — não implementá-los é ser descartado na avaliação:

1. Prontuário com odontograma + anamnese + evolução + anexos, tudo em nuvem.
2. Agenda multiprofissional com status coloridos e visão dia/semana.
3. Link público de autoagendamento integrado à agenda real.
4. Confirmação e lembrete de consulta por WhatsApp, com resposta do paciente atualizando a agenda automaticamente.
5. Orçamento digital que, ao ser aprovado, vira plano de tratamento **e** contas a receber parceladas.
6. Contas a receber/pagar, fluxo de caixa e relatório de inadimplência.
7. Perfis de acesso distintos (dono, dentista, recepção) com restrição sobre dados clínicos e financeiros.
8. Cobrança de mensagens como consumo separado da mensalidade, com preço por mensagem explícito.
9. Teste grátis sem cartão de crédito e importação/migração de dados assistida.
10. Conformidade com LGPD comunicada de forma explícita (é argumento de venda, não só requisito).

## 4. Onde vamos ser diferentes (hipóteses de diferenciação)

| # | Diferencial | Justificativa vinda do benchmark |
| --- | --- | --- |
| D1 | **WhatsApp servidor-side com Cloud API oficial + caixa de entrada compartilhada** | Três dos quatro entregam via extensão de WhatsApp Web, dependente da máquina da recepção; a conversa fica no celular/PC de alguém, não na clínica |
| D2 | **Prontuário, agenda e financeiro completos no plano de entrada** | Concorrentes reservam fluxo de caixa, comissão, CRM e relatórios para planos superiores |
| D3 | **Fila de espera com reencaixe automático** | Nenhum player promove reencaixe: quando um paciente cancela, a cadeira fica vazia; podemos oferecer a vaga ativamente pelo WhatsApp |
| D4 | **Exportação total dos dados self-service** | Nenhum concorrente promove saída fácil; vira argumento de confiança e reduz medo de lock-in |
| D5 | **Preço público, autosserviço, sem implantação obrigatória** | Clinicorp exige implementação paga; Dental Office não publica preço |
| D6 | **Transparência operacional das automações** | Log visível de "o que o sistema enviou ao paciente", com kill switch por automação |
| D7 | **Multi-unidade modelado desde o MVP** | Concorrentes tratam rede como plano/versão separada; nós já nascemos com `unidade` na modelagem |

## 5. Referências de precificação (agosto/2026, valores mensais divulgados)

| Player | Entrada | Intermediário | Superior | Observações |
| --- | --- | --- | --- | --- |
| Codental | R$ 89,90 | R$ 134,90 | R$ 179,90 | 10% off anual; 1/3/∞ agendas; WhatsApp R$ 0,07 (confirmação) e R$ 0,30 (campanha); SMS a partir de R$ 0,20 |
| Simples Dental | R$ 149,90 | R$ 249,90 | R$ 349,90 | ~10% off anual (R$ 137,41 / R$ 229,08 / R$ 320,74); vários itens pagos à parte |
| Clinicorp | R$ 159,90 (Standard) | R$ 369,90 (Premium) | Combos IA sob consulta | Implementação paga obrigatória; trimestral com desconto |
| Dental Office | não publicado | não publicado | não publicado | Trial de 7 dias; preço via consultor |

**Implicação de posicionamento:** a faixa competitiva de entrada está entre **R$ 90 e R$ 160/mês**. Nossa hipótese é entrar em ~R$ 129/mês entregando o que o concorrente cobra no plano intermediário, com custo variável de mensagens repassado de forma transparente. Ver [Métricas e KPIs](./14-metricas-kpis.md) para o impacto em unit economics.

## 6. Custo variável de WhatsApp — o que a plataforma da Meta cobra

Relevante para precificação e para o desenho do módulo de comunicação (fonte: documentação de pricing da WhatsApp Business Platform, <https://developers.facebook.com/docs/whatsapp/pricing/>):

- Desde **1º de julho de 2025** a cobrança é **por mensagem entregue**, não mais por conversa de 24h.
- Só há cobrança em mensagens de **template** entregues; a tarifa varia por **categoria** do template e por **país** do destinatário.
- Categorias: **marketing** (mais cara), **utility** (transacional: confirmação, lembrete, recibo), **authentication** (OTP, com descontos por volume) e **service** (resposta livre dentro da janela de atendimento aberta pelo cliente — gratuita).
- Mensagens não-template são gratuitas, mas só podem ser enviadas dentro de uma janela de atendimento aberta pelo paciente.
- Templates de *utility* entregues dentro de uma janela de atendimento aberta são gratuitos.
- A Meta só altera preços no 1º dia de cada trimestre, com aviso prévio.

**Consequências de projeto:**

1. Modelar explicitamente a **janela de atendimento de 24h** por contato — o custo da mensagem depende dela.
2. Classificar cada template por categoria e **preferir *utility*** em confirmações/lembretes/cobranças.
3. Medir custo por clínica e expor no painel ("você gastou R$ X em mensagens este mês").
4. Nunca disparar marketing sem opt-in registrado — além de LGPD, é a categoria mais cara.
