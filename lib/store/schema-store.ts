/**
 * Schema Store - State management para configuración de cuenta
 *
 * Maneja:
 * - Grupos de firmantes (SignerGroups)
 * - Reglas de firma (SignatureRules)
 * - Schema activo
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  SignatureSchema,
  SignerGroup,
  SignatureRule,
  Faculty,
  SignatureCombination,
  Account,
  Signer,
} from '@/lib/types';
import { ACCOUNT_RULES } from '@/lib/mocks/rules';

interface SchemaState {
  accounts: Account[];
  schemas: SignatureSchema[];
  activeSchemaId: string | null;
  signers: Signer[];

  // Actions
  createSchema: (accountId: string, name: string) => void;
  createGroup: (name: string, description?: string) => void;
  updateRule: (faculty: Faculty, combinations: SignatureCombination[]) => void;
  createSigner: (name: string, email: string, groupIds: string[]) => void;
  setActiveSchemaId: (schemaId: string | null) => void;

  // Helpers
  getRuleByFaculty: (faculty: Faculty) => SignatureRule | undefined;
  getGroupById: (groupId: string) => SignerGroup | undefined;
}

// Inicializamos con los datos del mock
const initialAccounts: Account[] = [
  { id: 'account-1', name: 'Complif Inc.', createdAt: new Date(), updatedAt: new Date() },
  { id: 'account-2', name: 'Empresa Demo S.A.', createdAt: new Date(), updatedAt: new Date() },
];

const initialGroups: SignerGroup[] = [
  {
    id: 'group-a',
    schemaId: 'default-schema',
    name: 'Directores (Grupo A)',
    createdAt: new Date(),
  },
  {
    id: 'group-b',
    schemaId: 'default-schema',
    name: 'Gerentes (Grupo B)',
    createdAt: new Date(),
  },
  {
    id: 'group-c',
    schemaId: 'default-schema',
    name: 'Analistas (Grupo C)',
    createdAt: new Date(),
  },
];

const initialRules: SignatureRule[] = Object.entries(ACCOUNT_RULES).map(([faculty, rule]) => ({
  id: nanoid(),
  schemaId: 'default-schema',
  faculty: faculty as Faculty,
  combinations: rule.combinations || [],
  createdAt: new Date(),
}));

const initialSigners: Signer[] = [
  {
    id: 'signer-1',
    accountId: 'account-1',
    name: 'Juan Director',
    email: 'juan@complif.com',
    groupIds: ['group-a'],
    createdAt: new Date(),
  },
  {
    id: 'signer-2',
    accountId: 'account-1',
    name: 'Maria Gerente',
    email: 'maria@complif.com',
    groupIds: ['group-b'],
    createdAt: new Date(),
  },
];

const defaultSchema: SignatureSchema = {
  id: 'default-schema',
  accountId: 'account-1',
  name: 'Schema de Aprobación',
  groups: initialGroups,
  rules: initialRules,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const useSchemaStore = create<SchemaState>()(
  persist(
    immer((set, get) => ({
      accounts: initialAccounts,
      schemas: [defaultSchema],
      activeSchemaId: 'default-schema',
      signers: initialSigners,

      createSchema: (accountId, name) => {
        set((state) => {
          const newSchema: SignatureSchema = {
            id: nanoid(),
            accountId,
            name,
            groups: [],
            rules: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          state.schemas.push(newSchema);
          state.activeSchemaId = newSchema.id;
        });
      },

      createGroup: (name, description) => {
        set((state) => {
          const schema = state.schemas.find((s) => s.id === state.activeSchemaId);
          if (!schema) return;

          schema.groups.push({
            id: nanoid(),
            schemaId: schema.id,
            name,
            description,
            createdAt: new Date(),
          });
        });
      },

      updateRule: (faculty, combinations) => {
        set((state) => {
          const schema = state.schemas.find((s) => s.id === state.activeSchemaId);
          if (!schema) return;

          const ruleIndex = schema.rules.findIndex((r) => r.faculty === faculty);

          if (ruleIndex >= 0) {
            schema.rules[ruleIndex].combinations = combinations;
          } else {
            schema.rules.push({
              id: nanoid(),
              schemaId: schema.id,
              faculty,
              combinations,
              createdAt: new Date(),
            });
          }
        });
      },

      createSigner: (name, email, groupIds) => {
        set((state) => {
          const activeSchema = state.schemas.find((s) => s.id === state.activeSchemaId);
          state.signers.push({
            id: nanoid(),
            accountId: activeSchema?.accountId || 'account-1',
            name,
            email,
            groupIds,
            createdAt: new Date(),
          });
        });
      },

      setActiveSchemaId: (schemaId) => set({ activeSchemaId: schemaId }),

      getRuleByFaculty: (faculty) => {
        const state = get();
        const schema = state.schemas.find((s) => s.id === state.activeSchemaId);
        return schema?.rules.find((r) => r.faculty === faculty);
      },

      getGroupById: (groupId) => {
        const state = get();
        const schema = state.schemas.find((s) => s.id === state.activeSchemaId);
        return schema?.groups.find((g) => g.id === groupId);
      },
    })),
    {
      name: 'schema-storage',
    }
  )
);
