/**
 * Motor de validación de combinaciones
 *
 *
 * Determina:
 * - Qué combinaciones son válidas dada una lista de firmantes
 * - Si un documento está completo
 * - Qué combinaciones todavía son posibles
 * - El progreso de cada combinación
 */

import {
  SignatureRule,
  SignatureCombination,
  SignerAssignment,
  ValidationResult,
  CombinationProgress,
  SignerStatus,
} from '@/lib/types';

// ===============================
// CALCULAR COMBINACIONES VÁLIDAS
// ===============================

/**
 * Calcula qué combinaciones son POSIBLES dado un conjunto de firmantes asignados.
 *
 * Una combinación es posible si tenemos suficientes firmantes de cada grupo
 * requerido.
 *
 * Ejemplo:
 * Regla: (2 de grupo A) OR (1 de A + 2 de B)
 * Firmantes asignados: 1 de A, 3 de B
 *
 * Resultado:
 * - Combinación 1 (2 de A): NO POSIBLE (solo tenemos 1 de A)
 * - Combinación 2 (1 de A + 2 de B): SÍ POSIBLE (tenemos 1 de A y 3 de B)
 *
 * @param rule - La regla que contiene las combinaciones
 * @param assignedSigners - Los firmantes asignados a la request
 * @returns Array de combinaciones que son posibles de completar
 */

export function calculateValidCombinations(
  rule: SignatureRule,
  assignedSigners: SignerAssignment[]
): SignatureCombination[] {
  return rule.combinations.filter((combination) =>
    isCombinationPossible(combination, assignedSigners)
  );
}

/**
 * Verifica si UNA combinación específica es posible.
 *
 * Una combinación es posible si para cada requisito de grupo,
 * tenemos al menos la cantidad necesaria de firmantes asignados.
 */

function isCombinationPossible(
  combination: SignatureCombination,
  assignedSigners: SignerAssignment[]
): boolean {
  return combination.requirements.every((requirement) => {
    const signersInGroup = assignedSigners.filter(
      (signer) => signer.groupId === requirement.groupId
    );

    return signersInGroup.length >= requirement.count;
  });
}

// ========================================
// VERIFICAR SI EL DOCUMENTO ESTÁ COMPLETO
// ========================================

/**
 * Verifica si una signature request está COMPLETA.
 *
 * Un documento está completo cuando se satisface al menos UNA
 * de las combinaciones válidas.
 *
 * Ejemplo:
 * Combinaciones válidas:
 * 1. 2 de grupo A
 * 2. 1 de A + 2 de B
 *
 * Si ya firmaron: 1 de A (completo) + 2 de B (completos)
 * → Combinación 2 está satisfecha → COMPLETO
 *
 * @param validCombinations - Las combinaciones que son posibles
 * @param signers - Todos los firmantes asignados
 * @returns Resultado con isComplete, la combinación que se completó, y las que quedan
 */
export function isRequestComplete(
  validCombinations: SignatureCombination[],
  signers: SignerAssignment[]
): ValidationResult {
  const completedSigners = signers.filter((signer) => signer.status === SignerStatus.COMPLETED);

  for (const combination of validCombinations) {
    if (isCombinationSatisfied(combination, completedSigners)) {
      return {
        isComplete: true,
        matchedCombination: combination,
        remainingCombinations: [],
        message: `Documento completado mediante ${getCombinationDescription(combination, signers)}`,
      };
    }
  }

  const remainingCombinations = getRemainingCombinations(
    validCombinations,
    completedSigners,
    signers
  );

  return {
    isComplete: false,
    remainingCombinations,
    message: `Pendiente. ${remainingCombinations.length} combinación(es) posible(s).`,
  };
}

/**
 * Verifica si una combinación específica está SATISFECHA.
 *
 * Una combinación está satisfecha cuando tenemos suficientes
 * firmantes COMPLETADOS de cada grupo requerido.
 */

function isCombinationSatisfied(
  combination: SignatureCombination,
  completedSigners: SignerAssignment[]
): boolean {
  return combination.requirements.every((requirement) => {
    const completedInGroup = completedSigners.filter(
      (signer) => signer.groupId === requirement.groupId
    );

    return completedInGroup.length >= requirement.count;
  });
}

// ===========================================
// COMBINACIONES RESTANTES (Todavía posibles)
// ===========================================

/**
 * Calcula qué combinaciones todavía son POSIBLES de completar.
 *
 * Una combinación deja de ser posible si no hay suficientes firmantes
 * pendientes + completados para satisfacerla.
 *
 * Ejemplo:
 * Combinación requiere: 3 de grupo A
 * Ya firmaron: 1 de A
 * Pendientes: 1 de A
 * Total disponible: 2 de A
 * → Esta combinación YA NO ES POSIBLE (necesitamos 3, solo tenemos 2)
 *
 * @param validCombinations - Las combinaciones inicialmente válidas
 * @param completedSigners - Firmantes que ya completaron
 * @param allSigners - Todos los firmantes asignados
 * @returns Combinaciones que todavía pueden completarse
 */
export function getRemainingCombinations(
  validCombinations: SignatureCombination[],
  completedSigners: SignerAssignment[],
  allSigners: SignerAssignment[]
): SignatureCombination[] {
  return validCombinations.filter((combination) => {
    if (isCombinationSatisfied(combination, completedSigners)) {
      return false;
    }

    return canStillSatisfyCombination(combination, completedSigners, allSigners);
  });
}

/**
 * Verifica si una combinación TODAVÍA PUEDE satisfacerse.
 *
 * Considera tanto los que ya firmaron como los que están pendientes.
 */

function canStillSatisfyCombination(
  combination: SignatureCombination,
  completedSigners: SignerAssignment[],
  allSigners: SignerAssignment[]
): boolean {
  return combination.requirements.every((requirement) => {
    const completed = completedSigners.filter((s) => s.groupId === requirement.groupId).length;

    const pending = allSigners.filter(
      (s) =>
        s.groupId === requirement.groupId &&
        s.status !== SignerStatus.COMPLETED &&
        s.status !== SignerStatus.DECLINED
    ).length;

    const totalAvailable = completed + pending;

    return totalAvailable >= requirement.count;
  });
}

// ==========================
// PROGRESO DE COMBINACIONES
// ==========================

/**
 * Calcula el progreso detallado de cada combinación.
 *
 * Útil para mostrar en el UI cuántos firmantes faltan por grupo.
 *
 * Ejemplo de output:
 * {
 *   combination: {...},
 *   isPossible: true,
 *   isCompleted: false,
 *   progress: [
 *     { groupName: "Directores", required: 2, completed: 1, pending: 1 },
 *     { groupName: "Gerentes", required: 1, completed: 0, pending: 2 }
 *   ]
 * }
 */
export function getCombinationProgress(
  combination: SignatureCombination,
  signers: SignerAssignment[],
  groups: Array<{ id: string; name: string }>
): CombinationProgress {
  const completedSigners = signers.filter((s) => s.status === SignerStatus.COMPLETED);

  const progress = combination.requirements.map((requirement) => {
    const group = groups.find((g) => g.id === requirement.groupId);
    const groupName = group?.name || requirement.groupId;

    const completed = completedSigners.filter((s) => s.groupId === requirement.groupId).length;

    const pending = signers.filter(
      (s) =>
        s.groupId === requirement.groupId &&
        s.status !== SignerStatus.COMPLETED &&
        s.status !== SignerStatus.DECLINED
    ).length;

    return {
      groupId: requirement.groupId,
      groupName,
      required: requirement.count,
      completed,
      pending,
    };
  });

  return {
    combination,
    isPossible: canStillSatisfyCombination(combination, completedSigners, signers),
    isCompleted: isCombinationSatisfied(combination, completedSigners),
    progress,
  };
}

/**
 * Calcula el progreso de TODAS las combinaciones válidas.
 */

export function getAllCombinationsProgress(
  validCombinations: SignatureCombination[],
  signers: SignerAssignment[],
  groups: Array<{ id: string; name: string }>
): CombinationProgress[] {
  return validCombinations.map((combination) =>
    getCombinationProgress(combination, signers, groups)
  );
}

// =======
// HELPERS
// =======

/**
 * Genera una descripción legible de una combinación.
 *
 * Ejemplo: "2 Directores + 1 Gerente"
 */

function getCombinationDescription(
  combination: SignatureCombination,
  signers: SignerAssignment[]
): string {
  const parts = combination.requirements.map((req) => {
    // Encontrar firmantes de este grupo que completaron
    const completedSigners = signers.filter(
      (s) => s.groupId === req.groupId && s.status === SignerStatus.COMPLETED
    );

    const names = completedSigners.slice(0, req.count).map((s) => s.name);

    if (names.length > 0) {
      return `${req.count} del grupo ${req.groupId} (${names.join(', ')})`;
    }

    return `${req.count} del grupo ${req.groupId}`;
  });

  return parts.join(' + ');
}

/**
 * Agrupa firmantes por grupo.
 *
 * Útil para análisis y debugging.
 */

export function groupSignersByGroup(
  signers: SignerAssignment[]
): Record<string, SignerAssignment[]> {
  return signers.reduce(
    (acc, signer) => {
      if (!acc[signer.groupId]) {
        acc[signer.groupId] = [];
      }
      acc[signer.groupId].push(signer);
      return acc;
    },
    {} as Record<string, SignerAssignment[]>
  );
}

/**
 * Valida que una regla tenga sentido (no combinaciones imposibles).
 *
 * Por ejemplo, si una combinación requiere 5 firmantes del grupo A,
 * pero el schema solo tiene 3 personas en el grupo A, es imposible.
 */

export function validateRule(
  rule: SignatureRule,
  availableGroups: Array<{ id: string; maxMembers: number }>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  rule.combinations.forEach((combination, index) => {
    combination.requirements.forEach((requirement) => {
      const group = availableGroups.find((g) => g.id === requirement.groupId);

      if (!group) {
        errors.push(`Combinación ${index + 1}: Grupo ${requirement.groupId} no existe`);
      } else if (requirement.count > group.maxMembers) {
        errors.push(
          `Combinación ${index + 1}: Requiere ${requirement.count} del grupo ${requirement.groupId}, pero solo hay ${group.maxMembers} disponibles`
        );
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
