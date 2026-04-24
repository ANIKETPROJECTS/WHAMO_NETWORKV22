import { useState, useEffect, type ComponentProps } from 'react';
import { useNetworkStore, type UnitSystem, type PcharType } from '@/lib/store';
import { PIPE_MATERIALS, PIPE_MATERIALS_BY_ID } from '@/lib/pipe-materials';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, ChevronDown, ChevronRight, Plus, CheckCircle2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getNodeSequenceViolations } from '@/lib/validator';

type NumericInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type' | 'inputMode'> & {
  value: any;
  onValueChange: (val: string) => void;
};

function NumericInput({ value, onValueChange, ...props }: NumericInputProps) {
  const display =
    value === undefined || value === null || value === ''
      ? ''
      : typeof value === 'string'
        ? value
        : String(parseFloat(Number(value).toFixed(8)));
  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={display}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '' || v === '-' || /^-?\d*\.?\d*$/.test(v)) {
          onValueChange(v);
        }
      }}
    />
  );
}

function PcharEditor({ pType, activePc, updatePcharData }: {
  pType: number;
  activePc: PcharType;
  updatePcharData: (pumpType: number, data: PcharType) => void;
}) {
  const arrayToText = (arr: number[]) => arr.join(' ');
  const hratioToText = (m: number[][]) => m.map(r => r.join(' ')).join('\n');
  const textToArray = (text: string): number[] =>
    text.trim().split(/[\s,\n]+/).map(parseFloat).filter(n => !isNaN(n));
  const tratioToText = (f: number[]) => {
    const lines: string[] = [];
    for (let i = 0; i < f.length; i += 8) lines.push(f.slice(i, i + 8).join(' '));
    return lines.join('\n');
  };

  const [showPchar, setShowPchar] = useState(false);
  const [sratioText, setSratioText] = useState(() => arrayToText(activePc.sratio));
  const [qratioText, setQratioText] = useState(() => arrayToText(activePc.qratio));
  const [hratioText, setHratioText] = useState(() => hratioToText(activePc.hratio));
  const [tratioText, setTratioText] = useState(() => tratioToText(activePc.tratio));

  useEffect(() => {
    setSratioText(arrayToText(activePc.sratio));
    setQratioText(arrayToText(activePc.qratio));
    setHratioText(hratioToText(activePc.hratio));
    setTratioText(tratioToText(activePc.tratio));
  }, [pType]);

  const savePchar = (updates: Partial<PcharType>) => {
    updatePcharData(pType, { ...activePc, ...updates });
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold bg-orange-50 hover:bg-orange-100 transition-colors text-orange-800"
        onClick={() => setShowPchar(v => !v)}
        data-testid="btn-toggle-pchar"
        type="button"
      >
        <span>Pump Characteristics (PCHAR TYPE {pType})</span>
        {showPchar ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {showPchar && (
        <div className="p-3 space-y-3 bg-white">
          <p className="text-[10px] text-muted-foreground italic">
            PCHAR TYPE {pType} data is global — shared across all pumps of this type.
          </p>
          <div className="grid gap-1">
            <Label className="text-[10px] font-medium">SRATIO (space-separated)</Label>
            <textarea
              data-testid="textarea-sratio"
              className="w-full border rounded text-[10px] font-mono p-1.5 resize-none h-10 focus:outline-none focus:ring-1 focus:ring-orange-400"
              value={sratioText}
              onChange={(e) => setSratioText(e.target.value)}
              onBlur={(e) => savePchar({ sratio: textToArray(e.target.value) })}
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px] font-medium">QRATIO (space-separated)</Label>
            <textarea
              data-testid="textarea-qratio"
              className="w-full border rounded text-[10px] font-mono p-1.5 resize-none h-10 focus:outline-none focus:ring-1 focus:ring-orange-400"
              value={qratioText}
              onChange={(e) => setQratioText(e.target.value)}
              onBlur={(e) => savePchar({ qratio: textToArray(e.target.value) })}
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px] font-medium">HRATIO (one row per line)</Label>
            <textarea
              data-testid="textarea-hratio"
              className="w-full border rounded text-[10px] font-mono p-1.5 resize-none h-28 focus:outline-none focus:ring-1 focus:ring-orange-400"
              value={hratioText}
              onChange={(e) => setHratioText(e.target.value)}
              onBlur={(e) => {
                const rows = e.target.value.trim().split('\n').map(row =>
                  row.trim().split(/\s+/).map(parseFloat).filter(n => !isNaN(n))
                ).filter(r => r.length > 0);
                savePchar({ hratio: rows });
              }}
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px] font-medium">TRATIO (space-separated, 8 per line)</Label>
            <textarea
              data-testid="textarea-tratio"
              className="w-full border rounded text-[10px] font-mono p-1.5 resize-none h-28 focus:outline-none focus:ring-1 focus:ring-orange-400"
              value={tratioText}
              onChange={(e) => setTratioText(e.target.value)}
              onBlur={(e) => savePchar({ tratio: textToArray(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function PropertiesPanel() {

  const { 
    nodes, 
    edges, 
    selectedElementId, 
    selectedElementType, 
    updateNodeData, 
    updateEdgeData,
    deleteElement,
    globalUnit,
    hSchedules,
    updateHSchedule,
    addHSchedule,
    pcharData,
    updatePcharData,
    addPcharType,
    deletePcharType,
    qSchedules,
    updateQSchedule,
    applyMaterialToAllConduits,
    setApplyMaterialToAllConduits,
  } = useNetworkStore();

  const { toast } = useToast();
  const [newTypeNum, setNewTypeNum] = useState<string>("");
  const [profileApplied, setProfileApplied] = useState<string | null>(null);
  const [nodeNumInput, setNodeNumInput] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [materialPickerOpen, setMaterialPickerOpen] = useState(false);
  const [showMaterialProps, setShowMaterialProps] = useState(false);

  useEffect(() => {
    const el = selectedElementId
      ? nodes.find(n => n.id === selectedElementId)
      : null;
    setNodeNumInput(el?.data?.nodeNumber !== undefined ? String(el.data.nodeNumber) : "");
  }, [selectedElementId, nodes]);

  useEffect(() => {
    const isNode = selectedElementType === 'node';
    const element = isNode
      ? nodes.find(n => n.id === selectedElementId)
      : edges.find(e => e.id === selectedElementId);
    if (element?.data) {
      setFormData({ ...element.data });
      setIsDirty(false);
    }
  }, [selectedElementId]);

  const handleLocalChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!selectedElementId) return;
    const isNodeEl = selectedElementType === 'node';

    const numericValue = (val: any) =>
      typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val)) ? Number(val) : val;

    const processedData: Record<string, any> = {};
    Object.entries(formData).forEach(([key, value]) => {
      processedData[key] = Array.isArray(value) ? value : numericValue(value);
    });

    if (isNodeEl) {
      const thisNode = nodes.find(n => n.id === selectedElementId);
      const elementTypes = new Set(['pump', 'checkValve']);

      // Block save if new nodeNumber violates ascending order for non-element nodes
      if (thisNode && !elementTypes.has(thisNode.type!)) {
        const newNum = processedData.nodeNumber !== undefined ? Number(processedData.nodeNumber) : NaN;
        if (!isNaN(newNum)) {
          const duplicate = nodes.find(
            n => n.id !== selectedElementId && n.data?.nodeNumber === newNum
          );
          if (duplicate) {
            toast({
              variant: "destructive",
              title: "Duplicate Node Number",
              description: `Node number ${newNum} is already used by another node. Please choose a unique number.`,
            });
            return;
          }

          const nextNodes = nodes.map(n =>
            n.id === selectedElementId ? { ...n, data: { ...n.data, ...processedData } } : n
          );
          const violations = getNodeSequenceViolations(nextNodes, edges).filter(
            violation => violation.id === selectedElementId ||
              edges.some(e => (e.source === selectedElementId && e.target === violation.id) || (e.target === selectedElementId && e.source === violation.id))
          );

          if (violations.length > 0) {
            toast({
              variant: "destructive",
              title: "Invalid Node Number",
              description: violations[0].message,
            });
            return;
          }
        }
      }

      // For flowBoundary nodes, link schedulePoints to the global qSchedules for the (possibly changed) scheduleNumber
      if (element?.data?.type === 'flowBoundary' && processedData.scheduleNumber !== undefined) {
        const newSchedNum = Number(processedData.scheduleNumber);
        if (!isNaN(newSchedNum)) {
          processedData.schedulePoints = qSchedules[newSchedNum] || [];
        }
      }
      updateNodeData(selectedElementId, processedData);
    } else {
      updateEdgeData(selectedElementId, processedData);
      const currentLabel = (processedData.label as string) || '';
      if (currentLabel) {
        edges
          .filter(e =>
            e.id !== selectedElementId &&
            (e.data?.label as string) === currentLabel &&
            (e.data?.type === 'conduit' || e.data?.type === 'dummy')
          )
          .forEach(e => updateEdgeData(e.id, processedData));
      }
    }

    setIsDirty(false);
    toast({ variant: "success", title: "Saved", description: "Changes saved successfully." });
  };

  const handleNodeNumberBlur = () => {
    const newNum = parseInt(nodeNumInput, 10);
    if (isNaN(newNum)) {
      const original = nodes.find(n => n.id === selectedElementId)?.data?.nodeNumber;
      setNodeNumInput(original !== undefined ? String(original) : "");
      return;
    }
    const duplicate = nodes.find(
      n => n.id !== selectedElementId && n.data?.nodeNumber === newNum
    );
    if (duplicate) {
      toast({
        variant: "destructive",
        title: "Duplicate Node Number",
        description: `Node number ${newNum} is already used by another node. Please choose a unique number.`,
      });
      const original = nodes.find(n => n.id === selectedElementId)?.data?.nodeNumber;
      setNodeNumInput(original !== undefined ? String(original) : "");
      return;
    }
    handleLocalChange('nodeNumber', nodeNumInput);
  };

  if (!selectedElementId) return null;

  const isNode = selectedElementType === 'node';
  const element = isNode 
    ? nodes.find(n => n.id === selectedElementId) 
    : edges.find(e => e.id === selectedElementId);

  if (!element) return null;

  const currentUnit = (formData.unit as UnitSystem) || globalUnit;

  const SI_TO_FPS = {
    length: 3.28084, // m to ft
    diameter: 3.28084, // m to ft
    elevation: 3.28084, // m to ft
    celerity: 3.28084, // m/s to ft/s
    area: 10.7639, // m2 to ft2
    flow: 35.3147, // m3/s to ft3/s
    pressure: 1 / 6894.76, // Pa to psi
  };

  const convertValue = (value: number, from: UnitSystem, to: UnitSystem, type: keyof typeof SI_TO_FPS) => {
    if (from === to) return value;
    const factor = SI_TO_FPS[type] || 1;
    const result = to === 'FPS' ? value * factor : value / factor;
    return parseFloat(result.toFixed(8));
  };

  const fieldMapping: Record<string, keyof typeof SI_TO_FPS> = {
    length: 'length',
    diameter: 'diameter',
    elevation: 'elevation',
    reservoirElevation: 'elevation',
    tankTop: 'elevation',
    tankBottom: 'elevation',
    initialWaterLevel: 'elevation',
    riserDiameter: 'diameter',
    riserTop: 'elevation',
    distance: 'length',
    celerity: 'celerity',
    area: 'area',
    pipeWT: 'diameter',   // wall thickness (ft or m)
    pipeE: 'pressure',    // modulus of elasticity (psi or Pa)
    rq: 'flow',           // pump rated flow (m³/s or ft³/s)
    rhead: 'elevation',   // pump rated head (m or ft)
    valveDiam: 'diameter', // check valve diameter (m or ft)
  };

  const cacheableFields = Object.keys(fieldMapping);

  const handleUnitToggle = (newUnit: UnitSystem) => {
    if (newUnit === currentUnit) return;

    const existingCache: Record<string, any> = (formData._unitCache as any) || {};

    // Save current values into cache for the current unit
    const savedForCurrentUnit: Record<string, any> = {};
    cacheableFields.forEach(key => {
      const val = (element.data as any)?.[key];
      if (val !== undefined && val !== null && val !== '') {
        savedForCurrentUnit[key] = val;
      }
    });
    if (formData.schedulePoints) {
      savedForCurrentUnit.schedulePoints = JSON.parse(JSON.stringify(formData.schedulePoints));
    }

    const newCache = {
      ...existingCache,
      [currentUnit]: { ...(existingCache[currentUnit] || {}), ...savedForCurrentUnit },
    };

    const dataUpdate: any = { unit: newUnit, _unitCache: newCache };

    // For each convertible field: use cached value if defined, otherwise math-convert.
    // pipeE and pipeWT are excluded here — they are always math-converted below for precision.
    const cachedTarget: Record<string, any> = newCache[newUnit] || {};
    Object.entries(element.data || {}).forEach(([key, value]) => {
      if (!fieldMapping[key]) return;
      if (key === 'pipeE' || key === 'pipeWT') return;
      const cachedVal = cachedTarget[key];
      if (cachedVal !== undefined) {
        dataUpdate[key] = cachedVal;
      } else {
        const numValue = typeof value === 'string' ? parseFloat(value) : (typeof value === 'number' ? value : NaN);
        if (!isNaN(numValue)) {
          dataUpdate[key] = convertValue(numValue, currentUnit, newUnit, fieldMapping[key]);
        }
      }
    });

    // pipeE (Pa ↔ psi) and pipeWT (m ↔ ft): use cached value when available so that
    // round-trips (SI→FPS→SI) restore the exact original number. Fall back to
    // high-precision math conversion only when no cached value exists yet.
    if (formData.pipeE != null && formData.pipeE !== '') {
      const val = parseFloat(String(formData.pipeE));
      if (!isNaN(val)) {
        const cachedVal = cachedTarget['pipeE'];
        dataUpdate.pipeE = cachedVal !== undefined
          ? cachedVal
          : parseFloat(convertValue(val, currentUnit, newUnit, 'pressure').toPrecision(10));
      }
    }
    if (formData.pipeWT != null && formData.pipeWT !== '') {
      const val = parseFloat(String(formData.pipeWT));
      if (!isNaN(val)) {
        const cachedVal = cachedTarget['pipeWT'];
        dataUpdate.pipeWT = cachedVal !== undefined
          ? cachedVal
          : parseFloat(convertValue(val, currentUnit, newUnit, 'diameter').toPrecision(10));
      }
    }

    // Handle schedulePoints
    if (formData.schedulePoints) {
      if (cachedTarget.schedulePoints) {
        dataUpdate.schedulePoints = cachedTarget.schedulePoints;
      } else {
        dataUpdate.schedulePoints = (formData.schedulePoints as any[]).map(p => ({
          ...p,
          flow: convertValue(p.flow, currentUnit, newUnit, 'flow')
        }));
      }
    }

    if (isNode) {
      updateNodeData(selectedElementId, dataUpdate);
    } else {
      updateEdgeData(selectedElementId, dataUpdate);
    }
    setFormData(prev => ({ ...prev, ...dataUpdate }));
  };

  const handleChange = (key: string, value: any) => {
    // Preserve raw string while typing so intermediate decimal forms like "1." or "1.50"
    // aren't collapsed by Number() conversion. saveChanges() converts strings to numbers
    // when the value is committed.
    const numericValue = value;

    const update: any = { [key]: numericValue };
    if (cacheableFields.includes(key)) {
      const existingCache: Record<string, any> = (formData._unitCache as any) || (formData._unitCache as any) || {};
      const otherUnit: UnitSystem = currentUnit === 'FPS' ? 'SI' : 'FPS';
      update._unitCache = {
        ...existingCache,
        [currentUnit]: { ...(existingCache[currentUnit] || {}), [key]: numericValue },
        [otherUnit]: existingCache[otherUnit]
          ? { ...existingCache[otherUnit], [key]: undefined }
          : existingCache[otherUnit],
      };
    }

    setFormData(prev => ({ ...prev, ...update }));
    setIsDirty(true);
  };

  const PROFILE_FIELDS = [
    'type', 'length', 'diameter', 'celerity', 'friction', 'numSegments',
    'variable', 'distance', 'area', 'd', 'a', 'pipeE', 'pipeWT', 'manningsN',
    'cplus', 'cminus', 'hasAddedLoss', 'includeNumSegments',
  ];

  const applyProfile = (sourceEdge: typeof edges[0]) => {
    const update: Record<string, any> = {};
    PROFILE_FIELDS.forEach(field => {
      const val = (sourceEdge.data as any)?.[field];
      if (val !== undefined) update[field] = val;
    });
    if (sourceEdge.data?._unitCache) {
      update._unitCache = sourceEdge.data._unitCache;
    }
    setFormData(prev => ({ ...prev, ...update }));
    setIsDirty(true);
    const lbl = (sourceEdge.data?.label as string) || '';
    setProfileApplied(lbl);
    setTimeout(() => setProfileApplied(null), 3000);
  };

  const handleLabelChange = (newLabel: string) => {
    handleChange('label', newLabel);
    if (!isNode && newLabel.trim()) {
      const match = edges.find(e =>
        e.id !== selectedElementId &&
        (e.data?.label as string) === newLabel.trim() &&
        (e.data?.type === 'conduit' || e.data?.type === 'dummy')
      );
      if (match) applyProfile(match);
    }
  };

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20 shrink-0">
        <CardTitle className="text-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="capitalize truncate">{element.data?.type || element.type}</span>
            <span className="text-muted-foreground font-normal text-sm shrink-0">#{selectedElementId}</span>
          </div>
          <div className="flex bg-muted rounded-md p-0.5 gap-0.5 shrink-0">
            <Button
              variant={currentUnit === 'SI' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => handleUnitToggle('SI')}
            >
              SI
            </Button>
            <Button
              variant={currentUnit === 'FPS' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => handleUnitToggle('FPS')}
            >
              FPS
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6 pb-4 min-h-0">

        {/* Common Properties */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground/80">General</h4>
          <div className="grid gap-2">
            <Label htmlFor="label">Label / ID</Label>
            <Input 
              id="label" 
              data-testid="input-label"
              value={formData.label ?? ''} 
              onChange={(e) => isNode ? handleChange('label', e.target.value) : handleLabelChange(e.target.value)} 
            />
            {!isNode && (() => {
              const lbl = (formData.label as string) || '';
              const others = edges.filter(e => e.id !== selectedElementId && (e.data?.label as string) === lbl && (e.data?.type === 'conduit' || e.data?.type === 'dummy'));
              return others.length > 0 && !profileApplied ? (
                <p className="text-[10px] text-blue-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Profile auto-applied from existing &quot;{lbl}&quot;
                </p>
              ) : null;
            })()}
            {profileApplied && (
              <p className="text-[10px] text-green-600 flex items-center gap-1" data-testid="text-profile-applied">
                <CheckCircle2 className="h-3 w-3" />
                Profile &quot;{profileApplied}&quot; applied
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="comment">Comment</Label>
            <Input 
              id="comment" 
              placeholder="Internal comment (c/C style)"
              value={formData.comment ?? ''} 
              onChange={(e) => handleChange('comment', e.target.value)} 
            />
          </div>
        </div>

        <Separator />

        {/* Specific Properties based on Type */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground/80">Parameters</h4>
          
          {!isNode && (
            <div className="grid gap-2 mb-4">
              <Label>Connection Type</Label>
              <RadioGroup 
                value={formData.type || 'conduit'} 
                onValueChange={(v) => handleChange('type', v)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="conduit" id="conduit" />
                  <Label htmlFor="conduit">Conduit</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dummy" id="dummy" />
                  <Label htmlFor="dummy">Dummy Pipe</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {isNode && (element.data?.type === 'node' || element.data?.type === 'junction' || element.data?.type === 'reservoir' || element.data?.type === 'surgeTank' || element.data?.type === 'flowBoundary' || formData.type_st) && (
            <>
              <div className="grid gap-1">
                <Label htmlFor="nodeNum">Node Number</Label>
                {(() => {
                  const parsedNum = parseInt(nodeNumInput, 10);
                  const isDuplicate = !isNaN(parsedNum) && nodes.some(
                    n => n.id !== selectedElementId && n.data?.nodeNumber === parsedNum
                  );
                  return (
                    <>
                      <Input
                        id="nodeNum"
                        data-testid="input-node-number"
                        type="text" inputMode="numeric"
                        value={nodeNumInput}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '' || /^\d+$/.test(v)) {
                            setNodeNumInput(v);
                          }
                        }}
                        onBlur={handleNodeNumberBlur}
                        className={isDuplicate ? "border-destructive ring-1 ring-destructive focus-visible:ring-destructive" : ""}
                      />
                      {isDuplicate && (
                        <p className="text-xs text-destructive flex items-center gap-1 mt-0.5" data-testid="error-node-number-duplicate">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Node {parsedNum} already exists
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="elev">{element.data?.type === 'surgeTank' ? 'Node Elevation' : 'Elevation'} ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                <NumericInput 
                  id="elev" 
                  value={formData.elevation} 
                  onValueChange={(v) => handleChange('elevation', v)} 
                />
              </div>

              {element.data?.type === 'reservoir' && (
                <div className="grid gap-2 mb-4">
                  <Label>Boundary Condition Mode</Label>
                  <RadioGroup 
                    value={formData.mode || 'fixed'} 
                    onValueChange={(v) => handleChange('mode', v)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="mode-fixed" />
                      <Label htmlFor="mode-fixed">Fixed Elevation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="schedule" id="mode-schedule" />
                      <Label htmlFor="mode-schedule">H Schedule</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {element.data?.type === 'reservoir' && (formData.mode || 'fixed') === 'fixed' && (
                <div className="grid gap-2">
                  <Label htmlFor="resElev">Reservoir Elevation (HW) ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                  <NumericInput 
                    id="resElev" 
                    value={formData.reservoirElevation} 
                    onValueChange={(v) => handleChange('reservoirElevation', v)} 
                  />
                </div>
              )}

              {element.data?.type === 'reservoir' && formData.mode === 'schedule' && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="hScheduleNum">Schedule Number</Label>
                    <Select 
                      value={(formData.hScheduleNumber || 1).toString()} 
                      onValueChange={(v) => {
                        if (v === 'add-new') {
                          const maxSched = hSchedules.length > 0 
                            ? Math.max(...hSchedules.map(s => s.number)) 
                            : 5;
                          const newNum = maxSched + 1;
                          addHSchedule(newNum);
                          handleChange('hScheduleNumber', newNum);
                          return;
                        }
                        const num = parseInt(v);
                        addHSchedule(num);
                        handleChange('hScheduleNumber', num);
                      }}
                    >
                      <SelectTrigger id="hScheduleNum">
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: Math.max(5, ...hSchedules.map(s => s.number)) }, (_, i) => i + 1).map(num => (
                          <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                        ))}
                        <Separator className="my-1" />
                        <SelectItem value="add-new" className="text-primary font-medium cursor-pointer">
                          + Add New Schedule
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">T/H Pairs</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => {
                          const schedNum = formData.hScheduleNumber || 1;
                          const currentSched = hSchedules.find(s => s.number === schedNum);
                          const points = currentSched ? [...currentSched.points] : [];
                          updateHSchedule(schedNum, [...points, { time: 0, head: 0 }]);
                        }}
                      >
                        Add Pair
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {(hSchedules.find(s => s.number === (formData.hScheduleNumber || 1))?.points || []).map((point, index) => (
                        <div key={index} className="flex items-end gap-2 p-2 border rounded-md bg-muted/30 relative group">
                          <div className="grid gap-1 flex-1">
                            <Label className="text-[10px]">Time (T)</Label>
                            <NumericInput 
                              className="h-7 text-xs"
                              value={point.time}
                              onValueChange={(v) => {
                                const schedNum = formData.hScheduleNumber || 1;
                                const currentSched = hSchedules.find(s => s.number === schedNum);
                                if (currentSched) {
                                  const newPoints = [...currentSched.points];
                                  newPoints[index] = { ...newPoints[index], time: v as any };
                                  updateHSchedule(schedNum, newPoints);
                                }
                              }}
                            />
                          </div>
                          <div className="grid gap-1 flex-1">
                            <Label className="text-[10px]">Head (H) ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                            <NumericInput 
                              className="h-7 text-xs"
                              value={point.head}
                              onValueChange={(v) => {
                                const schedNum = formData.hScheduleNumber || 1;
                                const currentSched = hSchedules.find(s => s.number === schedNum);
                                if (currentSched) {
                                  const newPoints = [...currentSched.points];
                                  newPoints[index] = { ...newPoints[index], head: v as any };
                                  updateHSchedule(schedNum, newPoints);
                                }
                              }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const schedNum = formData.hScheduleNumber || 1;
                              const currentSched = hSchedules.find(s => s.number === schedNum);
                              if (currentSched) {
                                const newPoints = currentSched.points.filter((_, i) => i !== index);
                                updateHSchedule(schedNum, newPoints);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {(!hSchedules.find(s => s.number === (formData.hScheduleNumber || 1))?.points || hSchedules.find(s => s.number === (formData.hScheduleNumber || 1))!.points.length === 0) && (
                        <p className="text-[10px] text-muted-foreground text-center py-2 italic">No T/H pairs added.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {element.data?.type === 'flowBoundary' && (() => {
                const activeSchedNum = Number(formData.scheduleNumber ?? element.data?.scheduleNumber ?? 1);
                const activeQPoints: { time: number; flow: number | string }[] =
                  (qSchedules[activeSchedNum] as any[]) || [];

                const sharedCount = nodes.filter(
                  n => n.type === 'flowBoundary' &&
                       n.id !== selectedElementId &&
                       Number(n.data?.scheduleNumber) === activeSchedNum
                ).length;

                return (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="scheduleNum">Schedule Number</Label>
                      <NumericInput 
                        id="scheduleNum" 
                        value={formData.scheduleNumber} 
                        onValueChange={(v) => handleChange('scheduleNumber', v)} 
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Queue Schedule Points</Label>
                          {sharedCount > 0 && (
                            <p className="text-[10px] text-blue-600 mt-0.5">
                              Shared with {sharedCount} other Flow BC{sharedCount !== 1 ? 's' : ''} — edits sync instantly
                            </p>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 px-2"
                          onClick={() => {
                            updateQSchedule(activeSchedNum, [...activeQPoints, { time: 0, flow: 0 }]);
                          }}
                        >
                          Add Point
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {activeQPoints.map((point, index) => (
                          <div key={index} className="flex items-end gap-2 p-2 border rounded-md bg-muted/30 relative group">
                            <div className="grid gap-1 flex-1">
                              <Label className="text-[10px]">Time (T)</Label>
                              <NumericInput 
                                className="h-7 text-xs"
                                value={point.time}
                                onValueChange={(v) => {
                                  const newPoints = [...activeQPoints];
                                  newPoints[index] = { ...newPoints[index], time: v as any };
                                  updateQSchedule(activeSchedNum, newPoints);
                                }}
                              />
                            </div>
                            <div className="grid gap-1 flex-1">
                              <Label className="text-[10px]">Flow (Q) ({currentUnit === 'SI' ? 'm³/s' : 'ft³/s'})</Label>
                              <NumericInput 
                                className="h-7 text-xs"
                                value={point.flow}
                                onValueChange={(v) => {
                                  const newPoints = [...activeQPoints];
                                  newPoints[index] = { ...newPoints[index], flow: v as any };
                                  updateQSchedule(activeSchedNum, newPoints);
                                }}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const newPoints = activeQPoints.filter((_, i) => i !== index);
                                updateQSchedule(activeSchedNum, newPoints);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {activeQPoints.length === 0 && (
                          <p className="text-[10px] text-muted-foreground text-center py-2 italic">No schedule points added.</p>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {isNode && element.data?.type === 'pump' && (() => {
            const pType = Number(formData.pumpType ?? 1);
            const pc: PcharType | undefined = pcharData[pType];
            const defaultPchar: PcharType = {
              sratio: [],
              qratio: [],
              hratio: [],
              tratio: [],
            };
            const activePc = pc || defaultPchar;

            return (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="pumpStatus">Pump Status</Label>
                  <Select
                    value={formData.pumpStatus || 'ACTIVE'}
                    onValueChange={(v) => handleChange('pumpStatus', v)}
                  >
                    <SelectTrigger id="pumpStatus" data-testid="select-pumpstatus">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pumpType">Pump Type (PCHAR TYPE)</Label>
                  <div className="flex gap-1 items-center">
                    <Select
                      value={String(formData.pumpType ?? 1)}
                      onValueChange={(v) => handleChange('pumpType', v)}
                    >
                      <SelectTrigger id="pumpType" data-testid="select-pumptype" className="flex-1">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(pcharData).map(Number).sort((a, b) => a - b).map(t => (
                          <SelectItem key={t} value={String(t)}>TYPE {t}</SelectItem>
                        ))}
                        <div
                          className="flex gap-1 items-center px-2 py-1.5 border-t mt-1"
                          onPointerDown={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text" inputMode="decimal"
                            min="1"
                            className="flex h-7 w-full rounded border border-input bg-transparent px-2 py-0.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="Type no. (blank = auto)"
                            value={newTypeNum}
                            onChange={(e) => setNewTypeNum(e.target.value)}
                            data-testid="input-new-pchar-type"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            title="Add new PCHAR type"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              const parsed = newTypeNum.trim() !== "" ? parseInt(newTypeNum) : undefined;
                              const existingNums = Object.keys(pcharData).map(Number);
                              const nextNum = parsed !== undefined && !isNaN(parsed)
                                ? parsed
                                : (existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1);
                              if (pcharData[nextNum] !== undefined) return;
                              addPcharType(nextNum);
                              handleChange('pumpType', String(nextNum));
                              setNewTypeNum("");
                            }}
                            data-testid="button-add-pchar-type"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                      title="Delete this PCHAR type"
                      disabled={Object.keys(pcharData).length <= 1}
                      onClick={() => {
                        const currentType = Number(formData.pumpType ?? 1);
                        deletePcharType(currentType);
                        const remaining = Object.keys(pcharData).map(Number).filter(t => t !== currentType).sort((a, b) => a - b);
                        if (remaining.length > 0) handleChange('pumpType', String(remaining[0]));
                      }}
                      data-testid="button-delete-pchar-type"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <Label htmlFor="rq" className="text-xs">Rated Flow RQ ({currentUnit === 'SI' ? 'm³/s' : 'ft³/s'})</Label>
                    <NumericInput id="rq" data-testid="input-rq"
                      value={formData.rq}
                      onValueChange={(v) => handleChange('rq', v)} className="h-7 text-xs" />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="rhead" className="text-xs">Rated Head RHEAD ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                    <NumericInput id="rhead" data-testid="input-rhead"
                      value={formData.rhead}
                      onValueChange={(v) => handleChange('rhead', v)} className="h-7 text-xs" />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="rspeed" className="text-xs">Rated Speed RSPEED (RPM)</Label>
                    <NumericInput id="rspeed" data-testid="input-rspeed"
                      value={formData.rspeed}
                      onValueChange={(v) => handleChange('rspeed', v)} className="h-7 text-xs" />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="rtorque" className="text-xs">Rated Torque RTOROUE</Label>
                    <NumericInput id="rtorque" data-testid="input-rtorque"
                      value={formData.rtorque}
                      onValueChange={(v) => handleChange('rtorque', v)} className="h-7 text-xs" />
                  </div>
                  <div className="grid gap-1 col-span-2">
                    <Label htmlFor="wr2" className="text-xs">WR² (Moment of Inertia)</Label>
                    <NumericInput id="wr2" data-testid="input-wr2"
                      value={formData.wr2}
                      onValueChange={(v) => handleChange('wr2', v)} className="h-7 text-xs" />
                  </div>
                </div>

                <PcharEditor pType={pType} activePc={activePc} updatePcharData={updatePcharData} />
              </>
            );
          })()}

          {isNode && element.data?.type === 'checkValve' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="valveStatus">Valve Status</Label>
                <Select
                  value={formData.valveStatus || 'OPEN'}
                  onValueChange={(v) => handleChange('valveStatus', v)}
                >
                  <SelectTrigger id="valveStatus">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">OPEN</SelectItem>
                    <SelectItem value="CLOSED">CLOSED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="valveDiam">Diameter DIAM ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                <NumericInput
                  id="valveDiam"
                  data-testid="input-valvediam"
                  value={formData.valveDiam}
                  onValueChange={(v) => handleChange('valveDiam', v)}
                />
              </div>
            </>
          )}

          {isNode && (element.data?.type === 'surgeTank' || formData.type_st) && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="st-type">Tank Type</Label>
                <Select 
                  value={formData.type_st || 'SIMPLE'} 
                  onValueChange={(v) => {
                    handleChange('type_st', v);
                  }}
                >
                  <SelectTrigger id="st-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIMPLE">SIMPLE</SelectItem>
                    <SelectItem value="DIFFERENTIAL">DIFFERENTIAL</SelectItem>
                    <SelectItem value="AIRTANK">AIRTANK</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tankTop">Top Elevation ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                <NumericInput 
                  id="tankTop" 
                  value={formData.tankTop} 
                  onValueChange={(v) => handleChange('tankTop', v)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tankBottom">Bottom Elevation ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                <NumericInput 
                  id="tankBottom" 
                  value={formData.tankBottom} 
                  onValueChange={(v) => handleChange('tankBottom', v)} 
                />
              </div>

              {(formData.type_st === 'AIRTANK' || formData.type_st === 'DIFFERENTIAL') && (
                <div className="grid gap-2">
                  <Label htmlFor="htank">Initial Water Level (HTANK) ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                  <NumericInput 
                    id="htank" 
                    value={formData.initialWaterLevel} 
                    onValueChange={(v) => handleChange('initialWaterLevel', v)} 
                  />
                </div>
              )}

              {formData.type_st === 'DIFFERENTIAL' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="riserdiam">Riser Diameter ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                    <NumericInput 
                      id="riserdiam" 
                      value={formData.riserDiameter} 
                      onValueChange={(v) => handleChange('riserDiameter', v)} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="risertop">Riser Top Elevation ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                    <NumericInput 
                      id="risertop" 
                      value={formData.riserTop} 
                      onValueChange={(v) => handleChange('riserTop', v)} 
                    />
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2 my-2">
                <Checkbox 
                  id="hasShape" 
                  checked={formData.hasShape || false} 
                  onCheckedChange={(checked) => handleChange('hasShape', !!checked)}
                />
                <Label htmlFor="hasShape" className="font-semibold text-primary">Use SHAPE instead of DIAM</Label>
              </div>

              {!formData.hasShape && (
                <div className="grid gap-2">
                  <Label htmlFor="diam">Diameter ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                  <NumericInput 
                    id="diam" 
                    value={formData.diameter} 
                    onValueChange={(v) => handleChange('diameter', v)} 
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="st-celerity">Celerity ({currentUnit === 'SI' ? 'm/s' : 'ft/s'})</Label>
                  <NumericInput 
                    id="st-celerity" 
                    value={formData.celerity} 
                    onValueChange={(v) => handleChange('celerity', v)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="st-friction">Friction</Label>
                  <NumericInput 
                    id="st-friction" 
                    value={formData.friction} 
                    onValueChange={(v) => handleChange('friction', v)} 
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 my-2">
                <Checkbox 
                  id="hasAddedLossST" 
                  checked={formData.hasAddedLoss || false} 
                  onCheckedChange={(checked) => handleChange('hasAddedLoss', !!checked)}
                />
                <Label htmlFor="hasAddedLossST" className="font-semibold text-primary">Added Loss Coefficients</Label>
              </div>

              {formData.hasAddedLoss && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-md border border-border/50 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="st-cplus">CPLUS</Label>
                    <NumericInput 
                      id="st-cplus" 
                      value={formData.cplus} 
                      onValueChange={(v) => handleChange('cplus', v)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="st-cminus">CMINUS</Label>
                    <NumericInput 
                      id="st-cminus" 
                      value={formData.cminus} 
                      onValueChange={(v) => handleChange('cminus', v)} 
                    />
                  </div>
                </div>
              )}

              {formData.hasShape && (
                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Shape (E, A pairs)</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2"
                      onClick={() => {
                        const shape = (formData.shape as any[]) || [];
                        handleChange('shape', [...shape, { e: 0, a: 0 }]);
                      }}
                    >
                      Add Pair
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {((formData.shape as any[]) || []).map((pair, index) => (
                      <div key={index} className="flex items-end gap-2 p-2 border rounded-md bg-muted/30 relative group">
                        <div className="grid gap-1 flex-1">
                          <Label className="text-[10px]">E ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                          <NumericInput 
                            className="h-7 text-xs"
                            value={pair.e}
                            onValueChange={(v) => {
                              const newShape = [...(formData.shape as any[])];
                              newShape[index] = { ...newShape[index], e: v };
                              handleChange('shape', newShape);
                            }}
                          />
                        </div>
                        <div className="grid gap-1 flex-1">
                          <Label className="text-[10px]">A ({currentUnit === 'SI' ? 'm²' : 'ft²'})</Label>
                          <NumericInput 
                            className="h-7 text-xs"
                            value={pair.a}
                            onValueChange={(v) => {
                              const newShape = [...(formData.shape as any[])];
                              newShape[index] = { ...newShape[index], a: v };
                              handleChange('shape', newShape);
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const newShape = (formData.shape as any[]).filter((_, i) => i !== index);
                            handleChange('shape', newShape);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {(!formData.shape || (formData.shape as any[]).length === 0) && (
                      <p className="text-[10px] text-muted-foreground text-center py-2 italic">No shape pairs added.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {!isNode && (element.data?.type === 'conduit' || !element.data?.type) && (
            <>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="variable" 
                  checked={formData.variable || false} 
                  onCheckedChange={(checked) => handleChange('variable', !!checked)}
                />
                <Label htmlFor="variable" className="font-semibold text-primary">VARIABLE (optional)</Label>
              </div>

              {formData.variable && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-md border border-border/50 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="distance">DISTANCE ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                    <NumericInput 
                      id="distance" 
                      value={formData.distance} 
                      onValueChange={(v) => handleChange('distance', v)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">AREA ({currentUnit === 'SI' ? 'm²' : 'ft²'})</Label>
                    <NumericInput 
                      id="area" 
                      value={formData.area} 
                      onValueChange={(v) => handleChange('area', v)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="d">D ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                    <NumericInput 
                      id="d" 
                      value={formData.d} 
                      onValueChange={(v) => handleChange('d', v)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="a">A ({currentUnit === 'SI' ? 'm²' : 'ft²'})</Label>
                    <NumericInput 
                      id="a" 
                      value={formData.a} 
                      onValueChange={(v) => handleChange('a', v)} 
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Length ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                  <NumericInput 
                    id="length" 
                    value={formData.length} 
                    onValueChange={(v) => handleChange('length', v)} 
                  />
                </div>
                {!formData.variable && (
                  <div className="space-y-2">
                    <Label htmlFor="diam">Diameter ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                    <NumericInput 
                      id="diam" 
                      value={formData.diameter} 
                      onValueChange={(v) => {
                        const newDiam = parseFloat(v);
                        handleChange('diameter', v);

                        if (!isNaN(newDiam) && newDiam > 0) {
                          // Recalculate wave speed (celerity) if E and WT are set
                          const C0 = currentUnit === 'SI' ? 1440 : 4720;
                          const Kw = currentUnit === 'SI' ? 2.07e9 : 3e5;
                          const E  = parseFloat(formData.pipeE) || 0;
                          const WT = parseFloat(formData.pipeWT) || 0;
                          if (E > 0 && WT > 0) {
                            const c = C0 / Math.sqrt(1 + (Kw / E) * (newDiam / WT));
                            handleChange('celerity', parseFloat(c.toFixed(4)).toString());
                          }

                          // Recalculate friction from Manning's n (preferred) or vice-versa
                          const K = currentUnit === 'SI' ? 124.58 : 185;
                          const n = parseFloat(formData.manningsN);
                          if (!isNaN(n) && n > 0) {
                            const f = (K * n * n) / Math.pow(newDiam, 1 / 3);
                            handleChange('friction', parseFloat(f.toFixed(6)).toString());
                          } else {
                            const f = parseFloat(formData.friction);
                            if (!isNaN(f) && f > 0) {
                              const nNew = Math.sqrt((f * Math.pow(newDiam, 1 / 3)) / K);
                              handleChange('manningsN', parseFloat(nNew.toFixed(6)).toString());
                            }
                          }
                        }
                      }} 
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="celerity">Wave Speed ({currentUnit === 'SI' ? 'm/s' : 'ft/s'})</Label>
                    {(parseFloat(formData.pipeE) > 0 && parseFloat(formData.pipeWT) > 0)
                      ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">Auto</span>
                      : <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium" title="Set E and WT below to auto-calculate">Manual — set E &amp; WT to auto</span>
                    }
                  </div>
                  <NumericInput 
                    id="celerity" 
                    value={formData.celerity} 
                    onValueChange={(v) => {
                      handleChange('celerity', v);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="friction">Friction (f)</Label>
                  <NumericInput 
                    id="friction" 
                    data-testid="input-friction"
                    value={formData.friction} 
                    onValueChange={(v) => {
                      handleChange('friction', v);
                      const f = parseFloat(v);
                      const diam = parseFloat(formData.diameter) || 0;
                      const K = currentUnit === 'SI' ? 124.58 : 185;
                      if (!isNaN(f) && f > 0 && diam > 0) {
                        const n = Math.sqrt((f * Math.pow(diam, 1 / 3)) / K);
                        handleChange('manningsN', parseFloat(n.toFixed(6)).toString());
                      }
                    }}
                  />
                </div>
              </div>

              {(() => {
                const matId = formData.materialId ? Number(formData.materialId) : null;
                const mat = matId != null ? PIPE_MATERIALS_BY_ID[matId] : null;
                const applyMaterial = (idStr: string, forceAll: boolean = false) => {
                  const all = forceAll || applyMaterialToAllConduits;
                  if (idStr === '__none__') {
                    handleChange('materialId', '');
                    // Propagate "clear" to siblings (same label) or all conduits when toggle is on
                    const lbl = (formData.label as string) || '';
                    if (all || lbl) {
                      edges
                        .filter(e =>
                          e.id !== selectedElementId &&
                          e.data?.type === 'conduit' &&
                          (all || (e.data?.label as string) === lbl)
                        )
                        .forEach(e => updateEdgeData(e.id, { materialId: '' } as any));
                    }
                    return;
                  }
                  const id = parseInt(idStr, 10);
                  const m = PIPE_MATERIALS_BY_ID[id];
                  if (!m) return;
                  handleChange('materialId', String(id));
                  // Manning's n
                  const n = m.manningsN;
                  handleChange('manningsN', String(n));
                  // Young's Modulus (E) — pick unit
                  const eVal = currentUnit === 'SI' ? m.youngsModulus_Pa : m.youngsModulus_psi;
                  if (eVal > 0) {
                    handleChange('pipeE', String(eVal));
                  }
                  // Recompute friction f from Manning's n if diameter present
                  const D = parseFloat(formData.diameter) || 0;
                  if (D > 0 && n > 0) {
                    const K = currentUnit === 'SI' ? 124.58 : 185;
                    const f = (K * n * n) / Math.pow(D, 1 / 3);
                    handleChange('friction', parseFloat(f.toFixed(6)).toString());
                  }
                  // Recompute wave speed (celerity) if E, WT, D all present
                  const WT = parseFloat(formData.pipeWT) || 0;
                  if (eVal > 0 && WT > 0 && D > 0) {
                    const C0 = currentUnit === 'SI' ? 1440 : 4720;
                    const Kw = currentUnit === 'SI' ? 2.07e9 : 3e5;
                    const c = C0 / Math.sqrt(1 + (Kw / eVal) * (D / WT));
                    handleChange('celerity', parseFloat(c.toFixed(4)).toString());
                  }

                  // Propagate: by default to siblings sharing the same label;
                  // when "Apply to all conduits" is checked, propagate to every conduit.
                  const lbl = (formData.label as string) || '';
                  if (all || lbl) {
                    const siblings = edges.filter(e =>
                      e.id !== selectedElementId &&
                      e.data?.type === 'conduit' &&
                      (all || (e.data?.label as string) === lbl)
                    );
                    siblings.forEach(e => {
                      const eUnit: UnitSystem = (e.data?.unit as UnitSystem) || currentUnit;
                      const eEval = eUnit === 'SI' ? m.youngsModulus_Pa : m.youngsModulus_psi;
                      const sibUpdate: any = {
                        materialId: String(id),
                        manningsN: n,
                      };
                      if (eEval > 0) sibUpdate.pipeE = eEval;
                      const eD = parseFloat(String((e.data as any)?.diameter)) || 0;
                      if (eD > 0 && n > 0) {
                        const K = eUnit === 'SI' ? 124.58 : 185;
                        sibUpdate.friction = parseFloat(((K * n * n) / Math.pow(eD, 1 / 3)).toFixed(6));
                      }
                      const eWT = parseFloat(String((e.data as any)?.pipeWT)) || 0;
                      if (eEval > 0 && eWT > 0 && eD > 0) {
                        const C0 = eUnit === 'SI' ? 1440 : 4720;
                        const Kw = eUnit === 'SI' ? 2.07e9 : 3e5;
                        sibUpdate.celerity = parseFloat((C0 / Math.sqrt(1 + (Kw / eEval) * (eD / eWT))).toFixed(4));
                      }
                      updateEdgeData(e.id, sibUpdate);
                    });
                    if (siblings.length > 0) {
                      toast({
                        title: all ? 'Material applied to all conduits' : 'Material applied to group',
                        description: all
                          ? `${m.label} applied to ${siblings.length + 1} conduit${siblings.length + 1 > 1 ? 's' : ''}.`
                          : `${m.label} also applied to ${siblings.length} other "${lbl}" conduit${siblings.length > 1 ? 's' : ''}.`,
                      });
                    }
                  }
                };
                return (
                  <div className="space-y-3 rounded-md border border-dashed p-3 bg-blue-50/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <Label htmlFor="pipe-material" className="font-medium">Pipe Material</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Select a material to auto-fill Manning's n and Young's Modulus (E).
                        </p>
                      </div>
                    </div>
                    <Popover open={materialPickerOpen} onOpenChange={setMaterialPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="pipe-material"
                          data-testid="select-pipe-material"
                          variant="outline"
                          role="combobox"
                          aria-expanded={materialPickerOpen}
                          className="w-full justify-between bg-white font-normal"
                        >
                          <span className={mat ? '' : 'text-muted-foreground'}>
                            {mat ? mat.label : '-- Select pipe material --'}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                        <Command
                          filter={(value, search) => {
                            return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                          }}
                        >
                          <CommandInput
                            placeholder="Search material..."
                            data-testid="input-material-search"
                          />
                          <CommandList className="max-h-64">
                            <CommandEmpty>No material found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="-- None (manual entry) --"
                                onSelect={() => {
                                  applyMaterial('__none__');
                                  setMaterialPickerOpen(false);
                                }}
                                data-testid="material-option-none"
                              >
                                -- None (manual entry) --
                              </CommandItem>
                              {PIPE_MATERIALS.map(m => (
                                <CommandItem
                                  key={m.id}
                                  value={m.label}
                                  onSelect={() => {
                                    applyMaterial(String(m.id));
                                    setMaterialPickerOpen(false);
                                  }}
                                  data-testid={`material-option-${m.id}`}
                                >
                                  {m.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="apply-mat-all"
                        data-testid="checkbox-apply-material-all"
                        checked={applyMaterialToAllConduits}
                        onCheckedChange={(c) => {
                          const checked = !!c;
                          setApplyMaterialToAllConduits(checked);
                          // If turning ON and the current conduit already has a material,
                          // immediately push it to every conduit in the network.
                          if (checked && formData.materialId) {
                            applyMaterial(String(formData.materialId), true);
                          }
                        }}
                      />
                      <Label
                        htmlFor="apply-mat-all"
                        className="text-xs font-normal cursor-pointer"
                      >
                        Apply selected material to <strong>all conduits</strong> in the network
                      </Label>
                    </div>

                    {mat && (
                      <div className="rounded bg-white border overflow-hidden">
                        <button
                          type="button"
                          data-testid="btn-toggle-material-properties"
                          onClick={() => setShowMaterialProps(v => !v)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <span>{mat.label} — properties</span>
                          {showMaterialProps
                            ? <ChevronDown className="h-3.5 w-3.5" />
                            : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                        {showMaterialProps && (
                      <div
                        data-testid="material-properties-summary"
                        className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs px-3 pb-2.5 pt-1 border-t"
                      >
                        <div className="col-span-2 font-semibold text-foreground border-b pb-1 mb-1">
                          {mat.label} — properties
                        </div>
                        <div className="text-muted-foreground">Manning's n</div>
                        <div className="font-mono text-right" data-testid="mat-prop-mannings">{mat.manningsN}</div>

                        <div className="text-muted-foreground">Kutter's n</div>
                        <div className="font-mono text-right">{mat.kuttersN}</div>

                        <div className="text-muted-foreground">Hazen-Williams C</div>
                        <div className="font-mono text-right">{mat.hazenWilliamsC}</div>

                        <div className="text-muted-foreground">Modified H-W CR</div>
                        <div className="font-mono text-right">{mat.modifiedHWCR}</div>

                        <div className="text-muted-foreground">
                          Roughness ε ({currentUnit === 'SI' ? 'm' : 'ft'})
                        </div>
                        <div className="font-mono text-right">
                          {currentUnit === 'SI' ? mat.roughnessHeight_m : mat.roughnessHeight_ft}
                        </div>

                        <div className="text-muted-foreground">
                          Young's Modulus E ({currentUnit === 'SI' ? 'Pa' : 'psi'})
                        </div>
                        <div className="font-mono text-right" data-testid="mat-prop-e">
                          {(() => {
                            const v = currentUnit === 'SI' ? mat.youngsModulus_Pa : mat.youngsModulus_psi;
                            if (!v) return <span className="text-amber-600">n/a</span>;
                            return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
                          })()}
                        </div>

                        <div className="text-muted-foreground">Poisson's Ratio</div>
                        <div className="font-mono text-right">
                          {mat.poissonsRatio || <span className="text-amber-600">n/a</span>}
                        </div>

                        <div className="col-span-2 text-[10px] text-muted-foreground italic mt-1 pt-1 border-t">
                          Manning's n and E have been auto-filled below. Wall thickness (WT) still needs to be entered to compute wave speed.
                        </div>
                      </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-3 rounded-md border border-dashed p-3">
                <div>
                  <Label className="font-medium">Pipe Wall Properties (E &amp; WT)</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enter both <strong>E</strong> and <strong>WT</strong> to calculate wave speed.
                    Diameter is used automatically.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="pipe-e">
                      E ({currentUnit === 'SI' ? 'Pa' : 'psi'})
                    </Label>
                    <NumericInput
                      id="pipe-e"
                      data-testid="input-pipe-e"
                      placeholder={currentUnit === 'SI' ? 'e.g. 2.07e11' : 'e.g. 30000000'}
                      value={formData.pipeE}
                      onValueChange={(v) => {
                        handleChange('pipeE', v);
                        const E  = parseFloat(v);
                        const C0 = currentUnit === 'SI' ? 1440 : 4720;
                        const Kw = currentUnit === 'SI' ? 2.07e9 : 3e5;
                        const D  = parseFloat(formData.diameter) || 0;
                        const WT = parseFloat(formData.pipeWT) || 0;
                        if (!isNaN(E) && E > 0 && WT > 0 && D > 0) {
                          const c = C0 / Math.sqrt(1 + (Kw / E) * (D / WT));
                          handleChange('celerity', parseFloat(c.toFixed(4)).toString());
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pipe-wt">
                      WT ({currentUnit === 'SI' ? 'm' : 'ft'})
                    </Label>
                    <NumericInput
                      id="pipe-wt"
                      data-testid="input-pipe-wt"
                      placeholder={currentUnit === 'SI' ? 'e.g. 0.006' : 'e.g. 0.02'}
                      value={formData.pipeWT}
                      onValueChange={(v) => {
                        handleChange('pipeWT', v);
                        const WT = parseFloat(v);
                        const C0 = currentUnit === 'SI' ? 1440 : 4720;
                        const Kw = currentUnit === 'SI' ? 2.07e9 : 3e5;
                        const D  = parseFloat(formData.diameter) || 0;
                        const E  = parseFloat(formData.pipeE) || 0;
                        if (!isNaN(WT) && WT > 0 && E > 0 && D > 0) {
                          const c = C0 / Math.sqrt(1 + (Kw / E) * (D / WT));
                          handleChange('celerity', parseFloat(c.toFixed(4)).toString());
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="rounded bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <span>
                    {currentUnit === 'SI'
                      ? 'c = 1440 / √(1 + (2.07·10⁹/E) · (D/WT))'
                      : 'c = 4720 / √(1 + (3·10⁵/E) · (D/WT))'}
                  </span>
                  {formData.celerity && (formData.pipeE || formData.pipeWT) ? (
                    <span className="ml-2 font-semibold text-foreground">
                      = {parseFloat(Number(formData.celerity).toFixed(4))} {currentUnit === 'SI' ? 'm/s' : 'ft/s'}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 rounded-md border border-dashed p-3">
                <div className="space-y-2">
                  <Label htmlFor="mannings-n" className="font-medium">Manning's Coefficient (n)</Label>
                  <NumericInput
                    id="mannings-n"
                    data-testid="input-mannings-n"
                    placeholder="e.g. 0.013"
                    value={(() => {
                      if (formData.manningsN != null && formData.manningsN !== '') {
                        return formData.manningsN;
                      }
                      const f = parseFloat(formData.friction) || 0;
                      const diam = parseFloat(formData.diameter) || 0;
                      const K = currentUnit === 'SI' ? 124.58 : 185;
                      if (f > 0 && diam > 0) {
                        return parseFloat(Math.sqrt((f * Math.pow(diam, 1 / 3)) / K).toFixed(6));
                      }
                      return '';
                    })()}
                    onValueChange={(v) => {
                      const n = parseFloat(v);
                      handleChange('manningsN', v);
                      if (!isNaN(n) && n > 0) {
                        const diam = parseFloat(formData.diameter) || 0;
                        const K = currentUnit === 'SI' ? 124.58 : 185;
                        if (diam > 0) {
                          const f = (K * n * n) / Math.pow(diam, 1 / 3);
                          handleChange('friction', parseFloat(f.toFixed(6)).toString());
                        }
                      }
                    }}
                  />
                </div>
                <div className="rounded bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <span>f = {currentUnit === 'SI' ? '124.58' : '185'} · n² / D<sup>1/3</sup></span>
                  {formData.friction ? (
                    <span className="ml-2 font-semibold text-foreground">
                      = {parseFloat(Number(formData.friction).toFixed(6))}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="segments">Num Segments</Label>
                <div className="flex items-center gap-2">
                  <NumericInput 
                    id="segments" 
                    className="flex-1"
                    value={formData.numSegments ?? 1} 
                    onValueChange={(v) => handleChange('numSegments', v)} 
                  />
                  <div className="flex items-center gap-2 ml-2">
                    <Checkbox 
                      id="includeNumSeg" 
                      checked={formData.includeNumSegments !== false} 
                      onCheckedChange={(checked) => handleChange('includeNumSegments', !!checked)}
                    />
                    <Label htmlFor="includeNumSeg" className="text-xs whitespace-nowrap">Include in .INP</Label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 my-2">
                <Checkbox 
                  id="hasAddedLoss" 
                  checked={formData.hasAddedLoss || false} 
                  onCheckedChange={(checked) => handleChange('hasAddedLoss', !!checked)}
                />
                <Label htmlFor="hasAddedLoss" className="font-semibold text-primary">Include ADDEDLOSS</Label>
              </div>

              {formData.hasAddedLoss && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cplus">CPLUS (opt)</Label>
                    <NumericInput 
                      id="cplus" 
                      placeholder="0.0"
                      value={formData.cplus} 
                      onValueChange={(v) => handleChange('cplus', v === '' ? undefined : v)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cminus">CMINUS (opt)</Label>
                    <NumericInput 
                      id="cminus" 
                      placeholder="0.0"
                      value={formData.cminus} 
                      onValueChange={(v) => handleChange('cminus', v === '' ? undefined : v)} 
                    />
                  </div>
                </div>
              )}
              </div>
            </>
          )}

          {!isNode && element.data?.type === 'dummy' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="diam">Diameter ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                <NumericInput 
                  id="diam" 
                  value={formData.diameter} 
                  onValueChange={(v) => handleChange('diameter', v)} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 my-2">
                <Checkbox 
                  id="hasAddedLoss" 
                  checked={formData.hasAddedLoss || false} 
                  onCheckedChange={(checked) => handleChange('hasAddedLoss', !!checked)}
                />
                <Label htmlFor="hasAddedLoss" className="font-semibold text-primary">Include ADDEDLOSS</Label>
              </div>

              {formData.hasAddedLoss && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cplus">CPLUS (opt)</Label>
                    <NumericInput 
                      id="cplus" 
                      placeholder="0.0"
                      value={formData.cplus} 
                      onValueChange={(v) => handleChange('cplus', v === '' ? undefined : v)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cminus">CMINUS (opt)</Label>
                    <NumericInput 
                      id="cminus" 
                      placeholder="0.0"
                      value={formData.cminus} 
                      onValueChange={(v) => handleChange('cminus', v === '' ? undefined : v)} 
                    />
                  </div>
                </div>
              )}
              </div>
            </>
          )}
        </div>

      </CardContent>

      {/* Fixed footer with Save/Delete */}
      <div className="shrink-0 border-t border-border/50 bg-card px-6 py-4">
        <div className="flex gap-2">
          <Button
            variant="default"
            className="flex-1 gap-2"
            onClick={handleSave}
            disabled={!isDirty}
            data-testid="button-save-element"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button 
            variant="destructive" 
            className="flex-1 gap-2" 
            onClick={() => selectedElementId && selectedElementType && deleteElement(selectedElementId, selectedElementType)}
            data-testid="button-delete-element"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
