import { describe, it, expect } from 'vitest';
import {
  calculateValidCombinations,
  isRequestComplete,
  getRemainingCombinations,
  getCombinationProgress,
  getAllCombinationsProgress,
  groupSignersByGroup,
  validateRule,
} from '@/lib/utils/combinatorics';
import {
  SignatureRule,
  SignerAssignment,
  Faculty,
  SignerStatus,
  SignatureCombination,
} from '@/lib/types';

describe('Motor de Combinatoria (Approval Logic)', () => {
  // Mock Data
  const mockRule: SignatureRule = {
    id: 'rule-1',
    schemaId: 'schema-1',
    faculty: Faculty.APPROVE_WIRE,
    createdAt: new Date(),
    combinations: [
      {
        id: 'combo-1',
        ruleId: 'rule-1',
        description: '2 Directores (A)',
        requirements: [{ groupId: 'group-a', count: 2 }],
      },
      {
        id: 'combo-2',
        ruleId: 'rule-1',
        description: '1 Director (A) + 1 Gerente (B)',
        requirements: [
          { groupId: 'group-a', count: 1 },
          { groupId: 'group-b', count: 1 },
        ],
      },
    ],
  };

  it('debe identificar combinaciones posibles correctamente', () => {
    // Caso: Tenemos 1 Director y 1 Gerente asignados
    const signers: Partial<SignerAssignment>[] = [
      { id: 's1', groupId: 'group-a' },
      { id: 's2', groupId: 'group-b' },
    ];

    const validCombos = calculateValidCombinations(mockRule, signers as SignerAssignment[]);

    // Combo 1 (2 Directores) NO debería ser posible
    // Combo 2 (1 Dir + 1 Gerente) SÍ debería ser posible
    expect(validCombos).toHaveLength(1);
    expect(validCombos[0].id).toBe('combo-2');
  });

  it('debe marcar el documento como COMPLETED cuando se cumple una combinación', () => {
    const validCombos = mockRule.combinations;

    // Caso: 1 Director y 1 Gerente han firmado (COMPLETED)
    const signers: Partial<SignerAssignment>[] = [
      { id: 's1', groupId: 'group-a', status: SignerStatus.COMPLETED },
      { id: 's2', groupId: 'group-b', status: SignerStatus.COMPLETED },
    ];

    const result = isRequestComplete(validCombos, signers as SignerAssignment[]);

    expect(result.isComplete).toBe(true);
    expect(result.matchedCombination?.id).toBe('combo-2');
  });

  it('debe mantener el documento IN_PROGRESS si faltan firmas', () => {
    const validCombos = mockRule.combinations;

    // Caso: 1 Director firmó, falta el Gerente
    const signers: Partial<SignerAssignment>[] = [
      { id: 's1', groupId: 'group-a', status: SignerStatus.COMPLETED },
      { id: 's2', groupId: 'group-b', status: SignerStatus.PENDING },
    ];

    const result = isRequestComplete(validCombos, signers as SignerAssignment[]);

    expect(result.isComplete).toBe(false);
  });

  it('debe filtrar combinaciones imposibles (getRemainingCombinations)', () => {
    const validCombos = mockRule.combinations;
    // Escenario: s3 (Grupo A) rechazó. Solo queda s1 (Grupo A).
    // Combo 1 requiere 2 de A -> Imposible.
    // Combo 2 requiere 1 de A + 1 de B -> Posible (tenemos s1 y s2).
    const signers: Partial<SignerAssignment>[] = [
      { id: 's1', groupId: 'group-a', status: SignerStatus.COMPLETED },
      { id: 's2', groupId: 'group-b', status: SignerStatus.PENDING },
      { id: 's3', groupId: 'group-a', status: SignerStatus.DECLINED },
    ];

    const completed = signers.filter(
      (s) => s.status === SignerStatus.COMPLETED
    ) as SignerAssignment[];
    const all = signers as SignerAssignment[];

    const remaining = getRemainingCombinations(validCombos, completed, all);

    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('combo-2');
  });

  it('debe calcular el progreso de una combinación (getCombinationProgress)', () => {
    const combo = mockRule.combinations[1]; // 1 A + 1 B
    const signers: Partial<SignerAssignment>[] = [
      { id: 's1', groupId: 'group-a', status: SignerStatus.COMPLETED },
      { id: 's2', groupId: 'group-b', status: SignerStatus.PENDING },
    ];
    const groups = [
      { id: 'group-a', name: 'Directores' },
      { id: 'group-b', name: 'Gerentes' },
    ];

    const progress = getCombinationProgress(combo, signers as SignerAssignment[], groups);

    expect(progress.isPossible).toBe(true);
    expect(progress.isCompleted).toBe(false);
    expect(progress.progress).toHaveLength(2);

    const progA = progress.progress.find((p) => p.groupId === 'group-a');
    expect(progA?.completed).toBe(1);
    expect(progA?.groupName).toBe('Directores');

    const progB = progress.progress.find((p) => p.groupId === 'group-b');
    expect(progB?.completed).toBe(0);
    expect(progB?.pending).toBe(1);
  });

  it('debe calcular el progreso de todas las combinaciones (getAllCombinationsProgress)', () => {
    const signers: Partial<SignerAssignment>[] = [
      { id: 's1', groupId: 'group-a', status: SignerStatus.COMPLETED },
    ];
    const groups = [
      { id: 'group-a', name: 'Directores' },
      { id: 'group-b', name: 'Gerentes' },
    ];

    const allProgress = getAllCombinationsProgress(
      mockRule.combinations,
      signers as SignerAssignment[],
      groups
    );
    expect(allProgress).toHaveLength(2);
  });

  it('debe agrupar firmantes por grupo (groupSignersByGroup)', () => {
    const signers: Partial<SignerAssignment>[] = [
      { id: 's1', groupId: 'group-a' },
      { id: 's2', groupId: 'group-b' },
      { id: 's3', groupId: 'group-a' },
    ];

    const grouped = groupSignersByGroup(signers as SignerAssignment[]);
    expect(grouped['group-a']).toHaveLength(2);
    expect(grouped['group-b']).toHaveLength(1);
  });

  it('debe validar reglas contra grupos disponibles (validateRule)', () => {
    const availableGroups = [
      { id: 'group-a', maxMembers: 1 }, // Solo 1 director disponible
      { id: 'group-b', maxMembers: 5 },
    ];

    // Combo 1 requiere 2 de A, pero solo hay 1 disponible -> Error
    const validation = validateRule(mockRule, availableGroups);

    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors[0]).toContain('Requiere 2 del grupo group-a');
  });
});
