'use client';

import { SignatureRequest, SignerStatus } from '@/lib/types';

export function CombinatoricsDebug({ request }: { request: SignatureRequest }) {
  if (!request.combinations || request.combinations.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 w-80 rounded-lg border border-gray-200 bg-white p-4 font-sans text-xs shadow-xl">
      <div className="mb-3 border-b pb-2">
        <h3 className="font-bold tracking-wider text-gray-700 uppercase">Reglas de Aprobación</h3>
        <p className="text-gray-500">{request.faculty}</p>
      </div>

      <div className="space-y-3">
        {request.combinations.map((combo) => {
          // Analizar cada requisito dentro de la combinación
          const requirementsAnalysis = combo.requirements.map((req) => {
            // Contar cuántos firmaron en este grupo
            const currentCount = request.signers.filter(
              (s) => s.groupId === req.groupId && s.status === SignerStatus.COMPLETED
            ).length;

            return {
              ...req,
              current: currentCount,
              isMet: currentCount >= req.count,
            };
          });

          // ¿Se cumplió TODA la combinación?
          const isComboMet = requirementsAnalysis.every((r) => r.isMet);

          return (
            <div
              key={combo.id}
              className={`rounded border p-2 transition-colors ${
                isComboMet ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${isComboMet ? 'bg-green-500' : 'bg-gray-300'}`}
                />
                <span
                  className={`font-semibold ${isComboMet ? 'text-green-700' : 'text-gray-700'}`}
                >
                  {combo.description}
                </span>
              </div>

              {/* Lista de requisitos individuales */}
              <ul className="ml-5 space-y-1">
                {requirementsAnalysis.map((req, idx) => (
                  <li key={idx} className="flex justify-between text-gray-600">
                    <span>
                      Grupo{' '}
                      <span className="rounded bg-gray-200 px-1 font-mono text-[10px]">
                        {req.groupId.replace('group-', '').toUpperCase()}
                      </span>
                    </span>
                    <span className={req.isMet ? 'font-bold text-green-600' : 'text-gray-500'}>
                      {req.current} / {req.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-3 border-t pt-2 text-center text-[10px] text-gray-400">
        Se debe cumplir al menos una de las opciones anteriores para completar el documento.
      </div>
    </div>
  );
}
