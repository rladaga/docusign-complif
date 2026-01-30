'use client';

import { useState, useEffect } from 'react';
import { useSchemaStore } from '@/lib/store/schema-store';
import { Faculty, SignatureCombination, GroupRequirement } from '@/lib/types';
import { Plus, Trash2, Save } from 'lucide-react';
import { nanoid } from 'nanoid';

interface RuleManagerProps {
  initialFaculty?: Faculty;
}

export function RuleManager({ initialFaculty }: RuleManagerProps) {
  const { schemas, activeSchemaId, getRuleByFaculty, updateRule } = useSchemaStore();
  const activeSchema = schemas.find((s) => s.id === activeSchemaId);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty>(
    initialFaculty || Faculty.APPROVE_WIRE
  );

  // Estado local para editar las combinaciones antes de guardar
  const [combinations, setCombinations] = useState<SignatureCombination[]>([]);

  // Cargar combinaciones al montar o cambiar facultad
  useEffect(() => {
    const rule = getRuleByFaculty(selectedFaculty);
    setCombinations(rule?.combinations || []);
  }, [selectedFaculty, getRuleByFaculty]);

  const handleFacultyChange = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
  };

  const addCombination = () => {
    setCombinations([
      ...combinations,
      {
        id: nanoid(),
        ruleId: 'temp',
        requirements: [],
        description: 'Nueva combinación',
      },
    ]);
  };

  const removeCombination = (index: number) => {
    const newCombos = [...combinations];
    newCombos.splice(index, 1);
    setCombinations(newCombos);
  };

  const updateCombinationDescription = (index: number, description: string) => {
    const newCombos = [...combinations];
    newCombos[index] = { ...newCombos[index], description };
    setCombinations(newCombos);
  };

  const addRequirement = (comboIndex: number) => {
    if (!activeSchema?.groups.length) return alert('Primero debes crear grupos de firmantes.');

    const newCombos = [...combinations];
    const combo = newCombos[comboIndex];
    newCombos[comboIndex] = {
      ...combo,
      requirements: [
        ...combo.requirements,
        {
          groupId: activeSchema.groups[0].id,
          count: 1,
        },
      ],
    };
    setCombinations(newCombos);
  };

  const updateRequirement = (
    comboIndex: number,
    reqIndex: number,
    field: keyof GroupRequirement,
    value: any
  ) => {
    const newCombos = [...combinations];
    const combo = newCombos[comboIndex];
    const newRequirements = [...combo.requirements];
    newRequirements[reqIndex] = {
      ...newRequirements[reqIndex],
      [field]: field === 'count' ? parseInt(value) || 1 : value,
    };
    newCombos[comboIndex] = { ...combo, requirements: newRequirements };
    setCombinations(newCombos);
  };

  const removeRequirement = (comboIndex: number, reqIndex: number) => {
    const newCombos = [...combinations];
    const combo = newCombos[comboIndex];
    const newRequirements = [...combo.requirements];
    newRequirements.splice(reqIndex, 1);
    newCombos[comboIndex] = { ...combo, requirements: newRequirements };
    setCombinations(newCombos);
  };

  const handleSave = () => {
    updateRule(selectedFaculty, combinations);
    alert(`Reglas para ${selectedFaculty} guardadas correctamente.`);
  };

  return (
    <div className="space-y-6">
      {/* Selector de Facultad */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <label className="mb-2 block text-sm font-semibold text-gray-900">
          Seleccionar Facultad (Acción)
        </label>
        <select
          value={selectedFaculty}
          onChange={(e) => handleFacultyChange(e.target.value as Faculty)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-lg font-medium text-indigo-600 focus:border-indigo-500 focus:ring-indigo-500"
        >
          {Object.values(Faculty).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-500">
          Configura qué combinaciones de firmantes son necesarias para aprobar esta acción.
        </p>
      </div>

      {/* Editor de Combinaciones */}
      <div className="space-y-4">
        {combinations.map((combo, comboIndex) => (
          <div
            key={combo.id}
            className="relative rounded-xl border border-indigo-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  Opción de Aprobación #{comboIndex + 1}
                </h3>
                <input
                  type="text"
                  value={combo.description || ''}
                  onChange={(e) => updateCombinationDescription(comboIndex, e.target.value)}
                  placeholder="Descripción (ej: 2 Directores + 1 Gerente)"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => removeCombination(comboIndex)}
                className="ml-4 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {combo.requirements.map((req, reqIndex) => (
                <div key={reqIndex} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                  <span className="text-sm font-medium text-gray-500">Requiere:</span>
                  <input
                    type="number"
                    min="1"
                    value={req.count}
                    onChange={(e) =>
                      updateRequirement(comboIndex, reqIndex, 'count', e.target.value)
                    }
                    className="w-16 rounded border-gray-300 px-2 py-1 text-center text-black"
                  />
                  <span className="text-sm text-gray-500">firmantes del</span>
                  <select
                    value={req.groupId}
                    onChange={(e) =>
                      updateRequirement(comboIndex, reqIndex, 'groupId', e.target.value)
                    }
                    className="flex-1 rounded border-gray-300 px-2 py-1 text-black"
                  >
                    {activeSchema?.groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeRequirement(comboIndex, reqIndex)}
                    className="ml-auto text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addRequirement(comboIndex)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" /> Agregar Requisito de Grupo
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addCombination}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50 py-4 font-medium text-indigo-600 hover:bg-indigo-100"
        >
          <Plus className="h-5 w-5" />
          Agregar Nueva Combinación Posible
        </button>
      </div>

      {/* Footer Actions */}
      <div className="sticky bottom-6 flex justify-end rounded-xl bg-white/80 p-4 shadow-lg backdrop-blur-sm">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white shadow-md hover:bg-indigo-700"
        >
          <Save className="h-5 w-5" />
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}
