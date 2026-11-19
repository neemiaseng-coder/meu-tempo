export const admissionSteps = [
  {
    "label": "Solicitar documentos"
  },
  {
    "label": "Agendar exame laboratorial"
  },
  {
    "label": "Agendar médico do trabalho"
  },
  {
    "label": "Solicitar registro contábil"
  },
  {
    "label": "Cadastrar no relógio de ponto"
  },
  {
    "label": "Assinar documentos digitais",
    "detail": "Documentos de registro."
  },
  {
    "label": "Integração e regimento interno"
  },
  {
    "label": "Abrir conta-salário"
  },
  {
    "label": "Entregar uniforme",
    "detail": "Calça, camiseta, sapato, avental e boné."
  },
  {
    "label": "Registrar saída do uniforme",
    "detail": "Lançar a entrega no estoque de uniformes."
  },
  {
    "label": "Anexar documentos ao prontuário",
    "detail": "ASO, contrato de trabalho, regimento e ficha de registro."
  },
  {
    "label": "Registrar admissão e contratos",
    "detail": "Informar no sistema a data de admissão, o 1º contrato e o 2º contrato para acompanhamento."
  }
];

const genericSteps = ['Cadastro', 'Documentação', 'Entrevista / alinhamento', 'Formalização', 'Concluído'];

export function createProcessChecklist(type, contractType = 'CLT') {
  const steps = type === 'admission' && contractType.toUpperCase() === 'CLT'
    ? admissionSteps : genericSteps.map(label => ({ label }));
  return steps.map(step => ({ ...step, done: false }));
}
