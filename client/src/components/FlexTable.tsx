import { useState, useCallback, useRef } from 'react';
import { useNetworkStore, type UnitSystem } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface FlexTableProps {
  open: boolean;
  onClose: () => void;
}

// Mirrors PropertiesPanel's cacheableFields and fieldMapping
const CACHEABLE_FIELDS = new Set([
  'length', 'diameter', 'elevation', 'reservoirElevation',
  'tankTop', 'tankBottom', 'initialWaterLevel', 'riserDiameter',
  'riserTop', 'distance', 'celerity', 'area', 'pipeWT', 'pipeE',
]);

function buildCacheUpdate(
  existingCache: Record<string, any>,
  currentUnit: UnitSystem,
  key: string,
  numericValue: number
): Record<string, any> {
  const otherUnit: UnitSystem = currentUnit === 'FPS' ? 'SI' : 'FPS';
  return {
    ...existingCache,
    [currentUnit]: { ...(existingCache[currentUnit] || {}), [key]: numericValue },
    [otherUnit]: existingCache[otherUnit]
      ? { ...existingCache[otherUnit], [key]: undefined }
      : existingCache[otherUnit],
  };
}

type CellValue = string | number | boolean | undefined;

interface EditableCellProps {
  value: CellValue;
  type?: 'text' | 'number' | 'select';
  options?: { label: string; value: string }[];
  onChange: (val: string) => void;
  readOnly?: boolean;
  className?: string;
  'data-testid'?: string;
}

function EditableCell({
  value,
  type = 'text',
  options,
  onChange,
  readOnly,
  className,
  'data-testid': testId,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayVal = value === undefined || value === null ? '' : String(value);

  const startEdit = () => {
    if (readOnly) return;
    setLocalVal(displayVal);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    setEditing(false);
    if (localVal !== displayVal) {
      onChange(localVal);
    }
  };

  if (type === 'select' && options) {
    return (
      <td className={cn('border-r border-slate-200 p-0', className)}>
        <Select value={displayVal || options[0]?.value} onValueChange={onChange}>
          <SelectTrigger
            data-testid={testId}
            className="h-7 border-0 rounded-none bg-transparent text-xs focus:ring-1 focus:ring-blue-400 focus:ring-inset w-full"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
    );
  }

  return (
    <td
      className={cn(
        'border-r border-slate-200 relative',
        readOnly ? 'bg-slate-50 cursor-default' : 'cursor-text hover:bg-blue-50/40',
        className
      )}
      onClick={startEdit}
    >
      {editing ? (
        <input
          ref={inputRef}
          data-testid={testId}
          className="w-full h-7 px-2 text-xs border-0 outline-none ring-1 ring-blue-500 ring-inset bg-white"
          type={type === 'number' ? 'number' : 'text'}
          step={type === 'number' ? 'any' : undefined}
          value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <span className="block px-2 py-1 text-xs truncate min-w-0">{displayVal}</span>
      )}
    </td>
  );
}

function PipesTable({ unit }: { unit: UnitSystem }) {
  const { edges, updateEdgeData, selectElement } = useNetworkStore();

  const handleChange = useCallback(
    (id: string, field: string, rawStr: string, currentData: any) => {
      const isNumericField = field !== 'label' && field !== 'comment' && field !== 'type';
      const numericValue = isNumericField
        ? (rawStr.trim() === '' ? rawStr : (parseFloat(rawStr) || 0))
        : rawStr;

      const update: any = { [field]: numericValue };

      if (typeof numericValue === 'number' && CACHEABLE_FIELDS.has(field)) {
        const existingCache: Record<string, any> = (currentData?._unitCache as any) || {};
        const currentUnit = (currentData?.unit as UnitSystem) || unit;
        update._unitCache = buildCacheUpdate(existingCache, currentUnit, field, numericValue);
      }

      updateEdgeData(id, update);
    },
    [unit, updateEdgeData]
  );

  const lenUnit = unit === 'FPS' ? 'ft' : 'm';
  const velUnit = unit === 'FPS' ? 'ft/s' : 'm/s';

  if (edges.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        No pipes in the network.
      </div>
    );
  }

  return (
    <div className="overflow-auto flex-1 border border-slate-200 rounded">
      <table className="min-w-max w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#1a73e8] text-white">
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-8">#</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-24">Label</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-28">Type</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-28">Diameter ({lenUnit})</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-28">Length ({lenUnit})</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-32">Wave Speed ({velUnit})</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-24">Friction</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-24">Segments</th>
            <th className="px-2 py-2 text-left font-semibold min-w-[160px]">Comment</th>
          </tr>
        </thead>
        <tbody>
          {edges.map((edge, idx) => {
            const d = edge.data as any;
            const isDummy = d?.type === 'dummy';
            const isEven = idx % 2 === 0;
            return (
              <tr
                key={edge.id}
                data-testid={`row-pipe-${edge.id}`}
                className={cn(
                  'border-b border-slate-100 hover:bg-blue-50/50 transition-colors cursor-pointer',
                  isEven ? 'bg-white' : 'bg-slate-50/60'
                )}
                onClick={() => selectElement(edge.id, 'edge')}
              >
                <td className="border-r border-slate-200 px-2 py-1 text-slate-500 text-center w-8">{idx + 1}</td>
                <EditableCell
                  data-testid={`cell-label-${edge.id}`}
                  value={d?.label}
                  onChange={v => handleChange(edge.id, 'label', v, d)}
                />
                <EditableCell
                  data-testid={`cell-type-${edge.id}`}
                  type="select"
                  value={d?.type || 'conduit'}
                  options={[
                    { label: 'Conduit', value: 'conduit' },
                    { label: 'Dummy Pipe', value: 'dummy' },
                  ]}
                  onChange={v => handleChange(edge.id, 'type', v, d)}
                />
                <EditableCell
                  data-testid={`cell-diameter-${edge.id}`}
                  type="number"
                  value={d?.diameter ?? ''}
                  onChange={v => handleChange(edge.id, 'diameter', v, d)}
                />
                <EditableCell
                  data-testid={`cell-length-${edge.id}`}
                  type="number"
                  value={isDummy ? '' : (d?.length ?? '')}
                  readOnly={isDummy}
                  onChange={v => handleChange(edge.id, 'length', v, d)}
                />
                <EditableCell
                  data-testid={`cell-celerity-${edge.id}`}
                  type="number"
                  value={d?.celerity ?? ''}
                  onChange={v => handleChange(edge.id, 'celerity', v, d)}
                />
                <EditableCell
                  data-testid={`cell-friction-${edge.id}`}
                  type="number"
                  value={d?.friction ?? ''}
                  onChange={v => handleChange(edge.id, 'friction', v, d)}
                />
                <EditableCell
                  data-testid={`cell-segments-${edge.id}`}
                  type="number"
                  value={isDummy ? '' : (d?.numSegments ?? '')}
                  readOnly={isDummy}
                  onChange={v => handleChange(edge.id, 'numSegments', v, d)}
                />
                <EditableCell
                  data-testid={`cell-comment-${edge.id}`}
                  value={d?.comment ?? ''}
                  onChange={v => handleChange(edge.id, 'comment', v, d)}
                  className="min-w-[160px]"
                />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NodesTable({ unit }: { unit: UnitSystem }) {
  const { nodes, updateNodeData, selectElement } = useNetworkStore();

  const handleChange = useCallback(
    (id: string, field: string, rawStr: string, currentData: any) => {
      const textFields = new Set(['label', 'comment', 'mode', 'type']);
      const isNumericField = !textFields.has(field);
      const numericValue = isNumericField
        ? (rawStr.trim() === '' ? rawStr : (parseFloat(rawStr) || 0))
        : rawStr;

      const update: any = { [field]: numericValue };

      if (typeof numericValue === 'number' && CACHEABLE_FIELDS.has(field)) {
        const existingCache: Record<string, any> = (currentData?._unitCache as any) || {};
        const currentUnit = (currentData?.unit as UnitSystem) || unit;
        update._unitCache = buildCacheUpdate(existingCache, currentUnit, field, numericValue);
      }

      updateNodeData(id, update);
    },
    [unit, updateNodeData]
  );

  const elevUnit = unit === 'FPS' ? 'ft' : 'm';
  const velUnit = unit === 'FPS' ? 'ft/s' : 'm/s';

  const nodeTypeLabel: Record<string, string> = {
    reservoir: 'Reservoir',
    node: 'Node',
    junction: 'Junction',
    surgeTank: 'Surge Tank',
    flowBoundary: 'Flow BC',
  };

  const nodeTypeBadge: Record<string, string> = {
    reservoir: 'bg-blue-100 text-blue-700',
    node: 'bg-slate-100 text-slate-600',
    junction: 'bg-red-100 text-red-700',
    surgeTank: 'bg-orange-100 text-orange-700',
    flowBoundary: 'bg-green-100 text-green-700',
  };

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        No nodes in the network.
      </div>
    );
  }

  return (
    <div className="overflow-auto flex-1 border border-slate-200 rounded">
      <table className="min-w-max w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#1a73e8] text-white">
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-8">#</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-28">Type</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-32">Label / ID</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-20">Node #</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-28">Elevation ({elevUnit})</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-32">Res. Elev. ({elevUnit})</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-28">Tank Top ({elevUnit})</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-28">Tank Bot. ({elevUnit})</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-28">Diameter ({elevUnit})</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-28">Wave Spd ({velUnit})</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-24">Friction</th>
            <th className="border-r border-blue-400 px-2 py-2 text-left font-semibold w-24">Sched #</th>
            <th className="px-2 py-2 text-left font-semibold min-w-[160px]">Comment</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node, idx) => {
            const d = node.data as any;
            const t: string = d?.type || (node.type as string) || 'node';
            const isEven = idx % 2 === 0;

            const isRes = t === 'reservoir';
            const isNodeOrJunc = t === 'node' || t === 'junction';
            const isSurge = t === 'surgeTank';
            const isFlow = t === 'flowBoundary';

            return (
              <tr
                key={node.id}
                data-testid={`row-node-${node.id}`}
                className={cn(
                  'border-b border-slate-100 hover:bg-blue-50/50 transition-colors cursor-pointer',
                  isEven ? 'bg-white' : 'bg-slate-50/60'
                )}
                onClick={() => selectElement(node.id, 'node')}
              >
                <td className="border-r border-slate-200 px-2 py-1 text-slate-500 text-center">{idx + 1}</td>
                <td className="border-r border-slate-200 px-2 py-1">
                  <span className={cn(
                    'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap',
                    nodeTypeBadge[t] || 'bg-slate-100 text-slate-600'
                  )}>
                    {nodeTypeLabel[t] || t}
                  </span>
                </td>
                <EditableCell
                  data-testid={`cell-label-${node.id}`}
                  value={d?.label ?? ''}
                  onChange={v => handleChange(node.id, 'label', v, d)}
                />
                <EditableCell
                  data-testid={`cell-nodenum-${node.id}`}
                  type="number"
                  value={d?.nodeNumber ?? ''}
                  onChange={v => handleChange(node.id, 'nodeNumber', v, d)}
                />
                <EditableCell
                  data-testid={`cell-elevation-${node.id}`}
                  type="number"
                  value={!isFlow ? (d?.elevation ?? '') : ''}
                  readOnly={isFlow}
                  onChange={v => handleChange(node.id, 'elevation', v, d)}
                />
                <EditableCell
                  data-testid={`cell-reselev-${node.id}`}
                  type="number"
                  value={isRes ? (d?.reservoirElevation ?? '') : ''}
                  readOnly={!isRes}
                  onChange={v => handleChange(node.id, 'reservoirElevation', v, d)}
                />
                <EditableCell
                  data-testid={`cell-tanktop-${node.id}`}
                  type="number"
                  value={isSurge ? (d?.tankTop ?? '') : ''}
                  readOnly={!isSurge}
                  onChange={v => handleChange(node.id, 'tankTop', v, d)}
                />
                <EditableCell
                  data-testid={`cell-tankbot-${node.id}`}
                  type="number"
                  value={isSurge ? (d?.tankBottom ?? '') : ''}
                  readOnly={!isSurge}
                  onChange={v => handleChange(node.id, 'tankBottom', v, d)}
                />
                <EditableCell
                  data-testid={`cell-diameter-${node.id}`}
                  type="number"
                  value={isSurge ? (d?.diameter ?? '') : ''}
                  readOnly={!isSurge}
                  onChange={v => handleChange(node.id, 'diameter', v, d)}
                />
                <EditableCell
                  data-testid={`cell-celerity-${node.id}`}
                  type="number"
                  value={isSurge ? (d?.celerity ?? '') : ''}
                  readOnly={!isSurge}
                  onChange={v => handleChange(node.id, 'celerity', v, d)}
                />
                <EditableCell
                  data-testid={`cell-friction-${node.id}`}
                  type="number"
                  value={isSurge ? (d?.friction ?? '') : ''}
                  readOnly={!isSurge}
                  onChange={v => handleChange(node.id, 'friction', v, d)}
                />
                <EditableCell
                  data-testid={`cell-sched-${node.id}`}
                  type="number"
                  value={
                    isFlow
                      ? (d?.scheduleNumber ?? '')
                      : isRes
                        ? (d?.hScheduleNumber ?? '')
                        : ''
                  }
                  readOnly={!(isFlow || isRes)}
                  onChange={v =>
                    handleChange(
                      node.id,
                      isFlow ? 'scheduleNumber' : 'hScheduleNumber',
                      v,
                      d
                    )
                  }
                />
                <EditableCell
                  data-testid={`cell-comment-${node.id}`}
                  value={d?.comment ?? ''}
                  onChange={v => handleChange(node.id, 'comment', v, d)}
                  className="min-w-[160px]"
                />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function FlexTable({ open, onClose }: FlexTableProps) {
  const { nodes, edges, globalUnit, setGlobalUnit } = useNetworkStore();

  const totalPipes = edges.length;
  const totalNodes = nodes.length;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0 gap-0"
        data-testid="flextable-dialog"
        hideCloseButton
      >
        <DialogHeader className="px-4 py-3 border-b bg-white flex-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-base font-semibold text-slate-800">
                Flex Table
              </DialogTitle>
              <span className="text-xs text-slate-400">
                {totalNodes} node{totalNodes !== 1 ? 's' : ''} · {totalPipes} pipe{totalPipes !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-200 rounded overflow-hidden text-xs">
                <button
                  data-testid="flextable-unit-si"
                  className={cn(
                    'px-3 py-1 font-medium transition-colors',
                    globalUnit === 'SI'
                      ? 'bg-[#1a73e8] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                  onClick={() => setGlobalUnit('SI')}
                >
                  SI
                </button>
                <button
                  data-testid="flextable-unit-fps"
                  className={cn(
                    'px-3 py-1 font-medium transition-colors',
                    globalUnit === 'FPS'
                      ? 'bg-[#1a73e8] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                  onClick={() => setGlobalUnit('FPS')}
                >
                  FPS
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClose}
                data-testid="flextable-close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-4 gap-3 bg-slate-50">
          <Tabs defaultValue="pipes" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="flex-none w-fit bg-white border border-slate-200 rounded p-0 h-auto">
              <TabsTrigger
                value="pipes"
                data-testid="flextable-tab-pipes"
                className="text-xs px-4 py-1.5 rounded-none data-[state=active]:bg-[#1a73e8] data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                Pipes ({totalPipes})
              </TabsTrigger>
              <TabsTrigger
                value="nodes"
                data-testid="flextable-tab-nodes"
                className="text-xs px-4 py-1.5 rounded-none data-[state=active]:bg-[#1a73e8] data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                Nodes ({totalNodes})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pipes" className="flex-1 overflow-hidden flex flex-col mt-2">
              <PipesTable unit={globalUnit} />
            </TabsContent>

            <TabsContent value="nodes" className="flex-1 overflow-hidden flex flex-col mt-2">
              <NodesTable unit={globalUnit} />
            </TabsContent>
          </Tabs>

          <p className="text-[10px] text-slate-400 flex-none">
            Click any cell to edit · Changes sync in real time with the properties panel · SI/FPS toggle applies globally
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
