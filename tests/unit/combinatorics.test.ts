import { describe, it, expect } from 'vitest';
import {
  calculateValidCombinations,
  isRequestComplete,
  getRemainingCombinations,
  getCombinationProgress,
} from '@/lib/utils/combinatorics';
import {
  SignatureRule,
  SignatureCombination,
  SignerAssignment,
  Faculty,
  SignerStatus,
} from '@/lib/types';

describe('Combinatorics', () => {
  // Setup común
  const mockRule: SignatureRule = {
    id: 'rule-1',
    schemaId: 'schema-1',
    faculty: Faculty.APPROVE_WIRE,
    combinations: [
      {
        id: 'comb-1',
        ruleId: 'rule-1',
        requirements: [{ groupId: 'group-a', count: 2 }],
      },
      {
        id: 'comb-2',
        ruleId: 'rule-1',
        requirements: [
          { groupId: 'group-a', count: 1 },
          { groupId: 'group-b', count: 2 },
        ],
      },
      {
        id: 'comb-3',
        ruleId: 'rule-1',
        requirements: [
          { groupId: 'group-b', count: 3 },
          { groupId: 'group-c', count: 1 },
        ],
      },
    ],
    createdAt: new Date(),
  };

  describe('calculateValidCombinations', () => {
    it('should return combinations that are possible with assigned signers', () => {
      const signers: SignerAssignment[] = [
        {
          id: 's1',
          requestId: 'req-1',
          email: 'juan@test.com',
          name: 'Juan',
          groupId: 'group-a',
          order: 1,
          status: SignerStatus.PENDING,
          assignedFields: [],
          reminderCount: 0,
        },
        {
          id: 's2',
          requestId: 'req-1',
          email: 'maria@test.com',
          name: 'Maria',
          groupId: 'group-a',
          order: 2,
          status: SignerStatus.PENDING,
          assignedFields: [],
          reminderCount: 0,
        },
        {
          id: 's3',
          requestId: 'req-1',
          email: 'pedro@test.com',
          name: 'Pedro',
          groupId: 'group-b',
          order: 3,
          status: SignerStatus.PENDING,
          assignedFields: [],
          reminderCount: 0,
        },
        {
          id: 's4',
          requestId: 'req-1',
          email: 'ana@test.com',
          name: 'Ana',
          groupId: 'group-b',
          order: 4,
          status: SignerStatus.PENDING,
          assignedFields: [],
          reminderCount: 0,
        },
      ];

      const validCombinations = calculateValidCombinations(mockRule, signers);

      // Solo comb-1 (2 de A) y comb-2 (1 de A + 2 de B) deberían ser posibles
      // comb-3 no es posible porque solo tenemos 1 de B y necesitamos 3
      expect(validCombinations).toHaveLength(2);
      expect(validCombinations.map((c) => c.id)).toContain('comb-1');
      expect(validCombinations.map((c) => c.id)).toContain('comb-2');
    });

    it('should return empty array if no combinations are possible', () => {
      const signers: SignerAssignment[] = [
        {
          id: 's1',
          requestId: 'req-1',
          email: 'juan@test.com',
          name: 'Juan',
          groupId: 'group-c',
          order: 1,
          status: SignerStatus.PENDING,
          assignedFields: [],
          reminderCount: 0,
        },
      ];

      const validCombinations = calculateValidCombinations(mockRule, signers);
      expect(validCombinations).toHaveLength(0);
    });
  });

  describe('isRequestComplete', () => {
    it('should return true when a combination is satisfied', () => {
      const validCombinations: SignatureCombination[] = [mockRule.combinations[0]]; // 2 de A

      const signers: SignerAssignment[] = [
        {
          id: 's1',
          requestId: 'req-1',
          email: 'juan@test.com',
          name: 'Juan',
          groupId: 'group-a',
          order: 1,
          status: SignerStatus.COMPLETED, // Firmó
          assignedFields: [],
          reminderCount: 0,
        },
        {
          id: 's2',
          requestId: 'req-1',
          email: 'maria@test.com',
          name: 'Maria',
          groupId: 'group-a',
          order: 2,
          status: SignerStatus.COMPLETED, // Firmó
          assignedFields: [],
          reminderCount: 0,
        },
      ];

      const result = isRequestComplete(validCombinations, signers);

      expect(result.isComplete).toBe(true);
      expect(result.matchedCombination).toBeDefined();
      expect(result.matchedCombination?.id).toBe('comb-1');
    });

    it('should return false when no combination is satisfied', () => {
      const validCombinations: SignatureCombination[] = [mockRule.combinations[0]];

      const signers: SignerAssignment[] = [
        {
          id: 's1',
          requestId: 'req-1',
          email: 'juan@test.com',
          name: 'Juan',
          groupId: 'group-a',
          order: 1,
          status: SignerStatus.COMPLETED, // Solo 1 firmó
          assignedFields: [],
          reminderCount: 0,
        },
        {
          id: 's2',
          requestId: 'req-1',
          email: 'maria@test.com',
          name: 'Maria',
          groupId: 'group-a',
          order: 2,
          status: SignerStatus.PENDING, // Falta este
          assignedFields: [],
          reminderCount: 0,
        },
      ];

      const result = isRequestComplete(validCombinations, signers);

      expect(result.isComplete).toBe(false);
      expect(result.matchedCombination).toBeUndefined();
    });
  });

  describe('getRemainingCombinations', () => {
    it('should exclude combinations that are no longer possible', () => {
      const validCombinations: SignatureCombination[] = mockRule.combinations;

      // 1 de A completó, 1 de A declined
      // Ya no es posible comb-1 (necesita 2 de A, solo hay 1 disponible)
      const completedSigners: SignerAssignment[] = [
        {
          id: 's1',
          requestId: 'req-1',
          email: 'juan@test.com',
          name: 'Juan',
          groupId: 'group-a',
          order: 1,
          status: SignerStatus.COMPLETED,
          assignedFields: [],
          reminderCount: 0,
        },
      ];

      const allSigners: SignerAssignment[] = [
        ...completedSigners,
        {
          id: 's2',
          requestId: 'req-1',
          email: 'maria@test.com',
          name: 'Maria',
          groupId: 'group-a',
          order: 2,
          status: SignerStatus.DECLINED, // Rechazó
          assignedFields: [],
          reminderCount: 0,
        },
        {
          id: 's3',
          requestId: 'req-1',
          email: 'pedro@test.com',
          name: 'Pedro',
          groupId: 'group-b',
          order: 3,
          status: SignerStatus.PENDING,
          assignedFields: [],
          reminderCount: 0,
        },
      ];

      const remaining = getRemainingCombinations(validCombinations, completedSigners, allSigners);

      // comb-1 ya no es posible (necesita 2 de A, solo hay 1)
      // comb-2 podría seguir siendo posible si hay suficientes de B pendientes
      expect(remaining.map((c) => c.id)).not.toContain('comb-1');
    });
  });

  describe('getCombinationProgress', () => {
    it('should calculate progress correctly', () => {
      const combination = mockRule.combinations[1]; // 1 de A + 2 de B

      const signers: SignerAssignment[] = [
        {
          id: 's1',
          requestId: 'req-1',
          email: 'juan@test.com',
          name: 'Juan',
          groupId: 'group-a',
          order: 1,
          status: SignerStatus.COMPLETED, // 1 de A completado
          assignedFields: [],
          reminderCount: 0,
        },
        {
          id: 's2',
          requestId: 'req-1',
          email: 'pedro@test.com',
          name: 'Pedro',
          groupId: 'group-b',
          order: 2,
          status: SignerStatus.COMPLETED, // 1 de B completado
          assignedFields: [],
          reminderCount: 0,
        },
        {
          id: 's3',
          requestId: 'req-1',
          email: 'ana@test.com',
          name: 'Ana',
          groupId: 'group-b',
          order: 3,
          status: SignerStatus.PENDING, // 1 de B pendiente
          assignedFields: [],
          reminderCount: 0,
        },
      ];

      const groups = [
        { id: 'group-a', name: 'Directores' },
        { id: 'group-b', name: 'Gerentes' },
      ];

      const progress = getCombinationProgress(combination, signers, groups);

      expect(progress.isCompleted).toBe(false); // Falta 1 de B
      expect(progress.isPossible).toBe(true);
      expect(progress.progress).toHaveLength(2);

      const groupAProgress = progress.progress.find((p) => p.groupId === 'group-a');
      expect(groupAProgress?.completed).toBe(1);
      expect(groupAProgress?.required).toBe(1);

      const groupBProgress = progress.progress.find((p) => p.groupId === 'group-b');
      expect(groupBProgress?.completed).toBe(1);
      expect(groupBProgress?.required).toBe(2);
      expect(groupBProgress?.pending).toBe(1);
    });
  });
});
