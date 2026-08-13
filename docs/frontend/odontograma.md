# Odontograma SVG (frontend `clinico`)

Representação gráfica da arcada no atendimento. Alinhado ao contrato do backend. Sem lib de terceiros.

Norma de domínio: [módulo prontuário §4](../modulos/05-prontuario.md) · API: [08-api-v1](../08-api-v1.md) · UI: [09 §4.2](../09-frontend.md).

## 1. Permanente (referência vetorizada)

- Arte = ilustração FDI de referência (`frontend/public/odontogram/reference-fdi.png`), layout 1024×434.
- Overlay SVG: 32 hit-areas (dente inteiro + faces `M|D|V|L|O|C`) geradas a partir de `OdontogramReferenceRegions.ts`.
- Saudável: overlay transparente (o desenho da referência aparece 1:1). Achado: cor semitransparente na face/dente.
- Vetorização (VTracer) fica em `frontend/src/packages/clinico/assets/odontogram/` (chart + glifos `.svg`) para reprocessar / impressão.
- Regenerar: `python scripts/odontogram/vectorize_reference.py`

## 2. Decídua

Ainda usa glifos SVG desenhados (não há a mesma referência). Toggle **Decídua** no painel.

## 3. Interação

- Hover/foco em qualquer parte do dente (coroa, raiz ou número) destaca o **dente inteiro**; a face alvo aparece no texto ao vivo (`aria-live`).
- Clique na **coroa** → FormDialog com a face (`M|D|V|L|O|C`).
- Clique na **raiz** ou no **número FDI** → dente inteiro (`face: null`).
- `ABSENT` / `EXTRACTED` → a condição pinta o overlay do dente.

## 4. Contrato HTTP (não muda)

`PUT /api/v1/patients/:patientId/record/odontogram/teeth/:toothCode`

```json
{ "dentition": "PERMANENT", "face": "O", "condition": "CARIES", "notes": null, "justification": null }
```

## 5. Arquivos

| Path | Papel |
| --- | --- |
| `frontend/public/odontogram/reference-fdi.png` | Arte na tela (permanente) |
| `frontend/src/packages/clinico/assets/odontogram/reference-fdi.svg` | Chart vetorizado |
| `frontend/src/packages/clinico/assets/odontogram/glyphs/*.svg` | Glifo por dente |
| `scripts/odontogram/vectorize_reference.py` | Detecta 32 dentes + VTracer |
