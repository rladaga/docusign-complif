import { describe, it, expect, beforeEach } from 'vitest';
import { useSchemaStore } from '@/lib/store/schema-store';
import { Faculty } from '@/lib/types';

describe('Schema Store', () => {
  beforeEach(() => {
    // Reset state manually or via a reset action if available.
    // Since schema-store doesn't have a reset, we rely on creating new data.
    useSchemaStore.setState({
      schemas: [],
      activeSchemaId: null,
      signers: [],
    });
  });

  it('should create a new schema', () => {
    const { createSchema } = useSchemaStore.getState();
    createSchema('acc-1', 'Test Schema');

    const { schemas, activeSchemaId } = useSchemaStore.getState();
    expect(schemas).toHaveLength(1);
    expect(schemas[0].name).toBe('Test Schema');
    expect(activeSchemaId).toBe(schemas[0].id);
  });

  it('should create a group in the active schema', () => {
    const { createSchema, createGroup } = useSchemaStore.getState();
    createSchema('acc-1', 'Schema with Groups');

    createGroup('Legal', 'Legal Department');

    const { schemas } = useSchemaStore.getState();
    const group = schemas[0].groups[0];
    expect(group).toBeDefined();
    expect(group.name).toBe('Legal');
  });

  it('should update rules for a faculty', () => {
    const { createSchema, updateRule, getRuleByFaculty } = useSchemaStore.getState();
    createSchema('acc-1', 'Schema with Rules');

    const combinations = [
      {
        id: 'c1',
        ruleId: 'r1',
        requirements: [{ groupId: 'g1', count: 1 }],
      },
    ];

    updateRule(Faculty.APPROVE_WIRE, combinations);

    const rule = getRuleByFaculty(Faculty.APPROVE_WIRE);
    expect(rule).toBeDefined();
    expect(rule?.combinations).toHaveLength(1);
    expect(rule?.combinations[0].id).toBe('c1');
  });

  it('should create a signer', () => {
    const { createSchema, createSigner } = useSchemaStore.getState();
    createSchema('acc-1', 'Schema for Signers');

    createSigner('John Doe', 'john@example.com', ['g1']);

    const { signers } = useSchemaStore.getState();
    expect(signers).toHaveLength(1);
    expect(signers[0].name).toBe('John Doe');
    expect(signers[0].accountId).toBe('acc-1');
  });

  it('should get group by ID', () => {
    const { createSchema, createGroup, getGroupById } = useSchemaStore.getState();
    createSchema('acc-1', 'Schema');
    createGroup('HR');

    const groupId = useSchemaStore.getState().schemas[0].groups[0].id;
    const group = getGroupById(groupId);

    expect(group).toBeDefined();
    expect(group?.name).toBe('HR');
  });
});
