import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSignatureStore } from '@/lib/store/signature-store';
import { DocumentStatus, Faculty, SignerStatus } from '@/lib/types';

// Mock NotificationService
vi.mock('@/lib/services/notifications', () => ({
  NotificationService: {
    sendInvitation: vi.fn(),
    sendReminder: vi.fn(),
  },
}));

describe('Signature Store', () => {
  beforeEach(() => {
    useSignatureStore.setState({
      requests: [],
      currentRequest: null,
    });
  });

  it('should create a signature request', () => {
    const { createRequest } = useSignatureStore.getState();
    const id = createRequest('tpl-1', 'acc-1', Faculty.APPROVE_WIRE);

    const { requests } = useSignatureStore.getState();
    expect(requests).toHaveLength(1);
    expect(requests[0].id).toBe(id);
    expect(requests[0].status).toBe(DocumentStatus.DRAFT);
  });

  it('should add a signer to a request', () => {
    const { createRequest, addSigner } = useSignatureStore.getState();
    const reqId = createRequest('tpl-1', 'acc-1', Faculty.APPROVE_WIRE);

    addSigner(reqId, 'test@test.com', 'Test User', 'group-1', []);

    const { requests } = useSignatureStore.getState();
    expect(requests[0].signers).toHaveLength(1);
    expect(requests[0].signers[0].email).toBe('test@test.com');
  });

  it('should update request status when sending for signature', () => {
    const { createRequest, addSigner, sendForSignature } = useSignatureStore.getState();
    const reqId = createRequest('tpl-1', 'acc-1', Faculty.APPROVE_WIRE);
    addSigner(reqId, 'test@test.com', 'Test User', 'group-1', []);

    sendForSignature(reqId);

    const { requests } = useSignatureStore.getState();
    expect(requests[0].status).toBe(DocumentStatus.PENDING);
  });

  it('should sign a field and update status', () => {
    const { createRequest, addSigner, sendForSignature, signField } = useSignatureStore.getState();
    const reqId = createRequest('tpl-1', 'acc-1', Faculty.APPROVE_WIRE);
    addSigner(reqId, 'test@test.com', 'Test User', 'group-1', []);
    sendForSignature(reqId);

    const signerId = useSignatureStore.getState().requests[0].signers[0].id;
    signField(reqId, signerId, 'field-1', 'signature-data');

    const { requests } = useSignatureStore.getState();
    expect(requests[0].signatures).toHaveLength(1);
    expect(requests[0].status).toBe(DocumentStatus.IN_PROGRESS);
    expect(requests[0].signers[0].status).toBe(SignerStatus.IN_PROGRESS);
  });

  it('should complete signer signature', () => {
    const { createRequest, addSigner, completeSignerSignature } = useSignatureStore.getState();
    const reqId = createRequest('tpl-1', 'acc-1', Faculty.APPROVE_WIRE);
    addSigner(reqId, 'test@test.com', 'Test User', 'group-1', []);

    const signerId = useSignatureStore.getState().requests[0].signers[0].id;
    completeSignerSignature(reqId, signerId);

    const { requests } = useSignatureStore.getState();
    expect(requests[0].signers[0].status).toBe(SignerStatus.COMPLETED);
  });

  it('should decline a request', () => {
    const { createRequest, addSigner, declineRequest } = useSignatureStore.getState();
    const reqId = createRequest('tpl-1', 'acc-1', Faculty.APPROVE_WIRE);
    addSigner(reqId, 'test@test.com', 'Test User', 'group-1', []);

    const signerId = useSignatureStore.getState().requests[0].signers[0].id;
    declineRequest(reqId, signerId, 'Not interested');

    const { requests } = useSignatureStore.getState();
    expect(requests[0].status).toBe(DocumentStatus.DECLINED);
    expect(requests[0].signers[0].status).toBe(SignerStatus.DECLINED);
  });

  it('should remove a signer', () => {
    const { createRequest, addSigner, removeSigner } = useSignatureStore.getState();
    const reqId = createRequest('tpl-1', 'acc-1', Faculty.APPROVE_WIRE);
    addSigner(reqId, 'test@test.com', 'Test User', 'group-1', []);

    const signerId = useSignatureStore.getState().requests[0].signers[0].id;
    removeSigner(signerId);

    const { requests } = useSignatureStore.getState();
    expect(requests[0].signers).toHaveLength(0);
  });
});
