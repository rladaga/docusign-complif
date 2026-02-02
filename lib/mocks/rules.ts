import { SignatureRule, Faculty, SignatureCombination } from '@/lib/types';

// Simulamos las reglas configuradas para la "Cuenta 1"
export const ACCOUNT_RULES: Record<Faculty, Partial<SignatureRule>> = {
  // Regla para Préstamos: 1 Director (A) ó 2 Gerentes (B)
  [Faculty.REQUEST_LOAN]: {
    combinations: [
      {
        id: 'loan-combo-1',
        ruleId: 'rule-loan',
        description: '1 Director (Grupo A)',
        requirements: [{ groupId: 'group-a', count: 1 }],
      },
      {
        id: 'loan-combo-2',
        ruleId: 'rule-loan',
        description: '2 Gerentes (Grupo B)',
        requirements: [{ groupId: 'group-b', count: 2 }],
      },
    ] as SignatureCombination[],
  },

  // Regla para Transferencias: 2 Directores (A)
  [Faculty.APPROVE_WIRE]: {
    combinations: [
      {
        id: 'wire-combo-1',
        ruleId: 'rule-wire',
        description: '2 Directores (Grupo A)',
        requirements: [{ groupId: 'group-a', count: 2 }],
      },
      {
        id: 'wire-combo-2',
        ruleId: 'rule-wire',
        description: '1 Director (A) + 1 Gerente (B) + 1 Analista (C)',
        requirements: [
          { groupId: 'group-a', count: 1 },
          { groupId: 'group-b', count: 1 },
          { groupId: 'group-c', count: 1 },
        ],
      },
    ] as SignatureCombination[],
  },

  // Regla Default para todo lo demás
  [Faculty.CREATE_WIRE]: {
    combinations: [
      {
        id: 'default-combo',
        ruleId: 'rule-default',
        description: 'Firma Simple (1 Director)',
        requirements: [{ groupId: 'group-a', count: 1 }],
      },
    ] as SignatureCombination[],
  },

  [Faculty.APPROVE_LOAN]: {
    combinations: [
      {
        id: 'default-combo',
        ruleId: 'rule-default',
        description: 'Firma Simple (1 Director)',
        requirements: [{ groupId: 'group-a', count: 1 }],
      },
    ] as SignatureCombination[],
  },
  [Faculty.MODIFY_CONTACT_INFO]: {
    combinations: [
      {
        id: 'default-combo',
        ruleId: 'rule-default',
        description: 'Firma Simple (1 Director)',
        requirements: [{ groupId: 'group-a', count: 1 }],
      },
    ] as SignatureCombination[],
  },
  [Faculty.OPEN_ACCOUNT]: {
    combinations: [
      {
        id: 'default-combo',
        ruleId: 'rule-default',
        description: 'Firma Simple (1 Director)',
        requirements: [{ groupId: 'group-a', count: 1 }],
      },
    ] as SignatureCombination[],
  },
  [Faculty.CLOSE_ACCOUNT]: {
    combinations: [
      {
        id: 'default-combo',
        ruleId: 'rule-default',
        description: 'Firma Simple (1 Director)',
        requirements: [{ groupId: 'group-a', count: 1 }],
      },
    ] as SignatureCombination[],
  },
  [Faculty.MODIFY_LIMITS]: {
    combinations: [
      {
        id: 'default-combo',
        ruleId: 'rule-default',
        description: 'Firma Simple (1 Director)',
        requirements: [{ groupId: 'group-a', count: 1 }],
      },
    ] as SignatureCombination[],
  },
};
