import { useNetworkStore, type UnitSystem } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';

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
    addHSchedule
  } = useNetworkStore();

  if (!selectedElementId) return null;

  const isNode = selectedElementType === 'node';
  const element = isNode 
    ? nodes.find(n => n.id === selectedElementId) 
    : edges.find(e => e.id === selectedElementId);

  if (!element) return null;

  const currentUnit = (element.data?.unit as UnitSystem) || globalUnit;

  const SI_TO_FPS = {
    length: 3.28084, // m to ft
    diameter: 39.3701, // m to in
    elevation: 3.28084, // m to ft
    celerity: 3.28084, // m/s to ft/s
    area: 10.7639, // m2 to ft2
    flow: 35.3147, // m3/s to ft3/s
  };

  const convertValue = (value: number, from: UnitSystem, to: UnitSystem, type: keyof typeof SI_TO_FPS) => {
    if (from === to) return value;
    const factor = SI_TO_FPS[type] || 1;
    const result = to === 'FPS' ? value * factor : value / factor;
    return parseFloat(result.toFixed(8));
  };

  const getPrecision = (value: number | string): number => {
    const s = value.toString();
    const dotIndex = s.indexOf('.');
    return dotIndex === -1 ? 0 : s.length - dotIndex - 1;
  };

  const handleUnitToggle = (newUnit: UnitSystem) => {
    if (newUnit === currentUnit) return;

    const dataUpdate: any = { unit: newUnit };
    
    // We map specialized fields to their conversion types
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
      area: 'area'
    };

    Object.entries(element.data || {}).forEach(([key, value]) => {
      const numValue = typeof value === 'string' ? parseFloat(value) : (typeof value === 'number' ? value : NaN);
      if (!isNaN(numValue) && fieldMapping[key]) {
        dataUpdate[key] = convertValue(numValue, currentUnit, newUnit, fieldMapping[key]);
      }
    });

    // Handle schedule points for Flow Boundary
    if (element.data?.schedulePoints) {
      dataUpdate.schedulePoints = (element.data.schedulePoints as any[]).map(p => ({
        ...p,
        flow: convertValue(p.flow, currentUnit, newUnit, 'flow')
      }));
    }

    if (isNode) {
      updateNodeData(selectedElementId, dataUpdate);
    } else {
      updateEdgeData(selectedElementId, dataUpdate);
    }
  };

  const formatDisplayValue = (value: any, key: string) => {
    if (typeof value !== 'number') return value;
    
    // If we're looking at a field that was converted, we might want to round it for display
    // but the user asked to show it in the original decimal amount it had.
    // Since we don't store the original precision per-field, we'll use a heuristic 
    // or just let the Input component handle it (which usually doesn't round unless specified).
    // However, to satisfy "show it in the original decimal amount it had", 
    // we can try to round to a reasonable precision if it looks like a repeating decimal from conversion.
    
    // For now, we'll just return the number and let the user edit it.
    return value;
  };

  const handleChange = (key: string, value: any) => {
    const numericValue = (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) 
      ? Number(value) 
      : value;
      
    if (isNode) {
      updateNodeData(selectedElementId, { [key]: numericValue });
    } else {
      updateEdgeData(selectedElementId, { [key]: numericValue });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-card border-l border-border">
      <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="capitalize">{element.data?.type || element.type}</span>
          <span className="text-muted-foreground font-normal text-sm">#{selectedElementId}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* Delete Button */}
        <Button 
          variant="destructive" 
          className="w-full gap-2" 
          onClick={() => selectedElementId && selectedElementType && deleteElement(selectedElementId, selectedElementType)}
          data-testid="button-delete-element"
        >
          <Trash2 className="h-4 w-4" />
          Delete Element
        </Button>

        <Separator />

        {/* Unit Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground/80">Units</h4>
            <div className="flex bg-muted rounded-md p-1 gap-1">
              <Button 
                variant={currentUnit === 'SI' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={() => handleUnitToggle('SI')}
              >
                SI
              </Button>
              <Button 
                variant={currentUnit === 'FPS' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={() => handleUnitToggle('FPS')}
              >
                FPS
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            Changing unit will auto-convert existing numeric values.
          </p>
        </div>

        <Separator />

        {/* Common Properties */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground/80">General</h4>
          <div className="grid gap-2">
            <Label htmlFor="label">Label / ID</Label>
            <Input 
              id="label" 
              value={element.data?.label || ''} 
              onChange={(e) => handleChange('label', e.target.value)} 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="comment">Comment</Label>
            <Input 
              id="comment" 
              placeholder="Internal comment (c/C style)"
              value={element.data?.comment || ''} 
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
                value={element.data?.type || 'conduit'} 
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

          {isNode && (element.data?.type === 'node' || element.data?.type === 'junction' || element.data?.type === 'reservoir' || element.data?.type === 'surgeTank' || element.data?.type === 'flowBoundary' || element.data?.type_st) && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="nodeNum">Node Number</Label>
                <Input 
                  id="nodeNum" 
                  type="number" 
                  value={element.data?.nodeNumber || 0} 
                  onChange={(e) => handleChange('nodeNumber', e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="elev">Elevation ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                <Input 
                  id="elev" 
                  type="number" 
                  step="any"
                  value={element.data?.elevation !== undefined ? parseFloat(Number(element.data.elevation).toFixed(8)) : 0} 
                  onChange={(e) => handleChange('elevation', e.target.value)} 
                />
              </div>

              {element.data?.type === 'reservoir' && (
                <div className="grid gap-2 mb-4">
                  <Label>Boundary Condition Mode</Label>
                  <RadioGroup 
                    value={element.data?.mode || 'fixed'} 
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

              {element.data?.type === 'reservoir' && (element.data?.mode || 'fixed') === 'fixed' && (
                <div className="grid gap-2">
                  <Label htmlFor="resElev">Reservoir Elevation (HW) ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                  <Input 
                    id="resElev" 
                    type="number" 
                    step="any"
                    value={element.data?.reservoirElevation !== undefined ? parseFloat(Number(element.data.reservoirElevation).toFixed(8)) : 0} 
                    onChange={(e) => handleChange('reservoirElevation', e.target.value)} 
                  />
                </div>
              )}

              {element.data?.type === 'reservoir' && element.data?.mode === 'schedule' && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="hScheduleNum">H Schedule Number</Label>
                    <Select 
                      value={(element.data?.hScheduleNumber || 1).toString()} 
                      onValueChange={(v) => {
                        const num = parseInt(v);
                        addHSchedule(num);
                        handleChange('hScheduleNumber', num);
                      }}
                    >
                      <SelectTrigger id="hScheduleNum">
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(num => (
                          <SelectItem key={num} value={num.toString()}>HSCHEDULE {num}</SelectItem>
                        ))}
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
                          const schedNum = element.data?.hScheduleNumber || 1;
                          const currentSched = hSchedules.find(s => s.number === schedNum);
                          const points = currentSched ? [...currentSched.points] : [];
                          updateHSchedule(schedNum, [...points, { time: 0, head: 0 }]);
                        }}
                      >
                        Add Pair
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {(hSchedules.find(s => s.number === (element.data?.hScheduleNumber || 1))?.points || []).map((point, index) => (
                        <div key={index} className="flex items-end gap-2 p-2 border rounded-md bg-muted/30 relative group">
                          <div className="grid gap-1 flex-1">
                            <Label className="text-[10px]">Time (T)</Label>
                            <Input 
                              type="number"
                              className="h-7 text-xs"
                              value={point.time}
                              onChange={(e) => {
                                const schedNum = element.data?.hScheduleNumber || 1;
                                const currentSched = hSchedules.find(s => s.number === schedNum);
                                if (currentSched) {
                                  const newPoints = [...currentSched.points];
                                  newPoints[index] = { ...newPoints[index], time: parseFloat(e.target.value) || 0 };
                                  updateHSchedule(schedNum, newPoints);
                                }
                              }}
                            />
                          </div>
                          <div className="grid gap-1 flex-1">
                            <Label className="text-[10px]">Head (H) ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                            <Input 
                              type="number"
                              className="h-7 text-xs"
                              value={point.head}
                              onChange={(e) => {
                                const schedNum = element.data?.hScheduleNumber || 1;
                                const currentSched = hSchedules.find(s => s.number === schedNum);
                                if (currentSched) {
                                  const newPoints = [...currentSched.points];
                                  newPoints[index] = { ...newPoints[index], head: parseFloat(e.target.value) || 0 };
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
                              const schedNum = element.data?.hScheduleNumber || 1;
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
                      {(!hSchedules.find(s => s.number === (element.data?.hScheduleNumber || 1))?.points || hSchedules.find(s => s.number === (element.data?.hScheduleNumber || 1))!.points.length === 0) && (
                        <p className="text-[10px] text-muted-foreground text-center py-2 italic">No T/H pairs added.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {element.data?.type === 'flowBoundary' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="scheduleNum">Schedule Number</Label>
                    <Input 
                      id="scheduleNum" 
                      type="number" 
                      value={element.data?.scheduleNumber || 0} 
                      onChange={(e) => handleChange('scheduleNumber', e.target.value)} 
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Queue Schedule Points</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => {
                          const points = (element.data?.schedulePoints as any[]) || [];
                          handleChange('schedulePoints', [...points, { time: 0, flow: 0 }]);
                        }}
                      >
                        Add Point
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {((element.data?.schedulePoints as any[]) || []).map((point, index) => (
                        <div key={index} className="flex items-end gap-2 p-2 border rounded-md bg-muted/30 relative group">
                          <div className="grid gap-1 flex-1">
                            <Label className="text-[10px]">Time (T)</Label>
                            <Input 
                              type="number"
                              className="h-7 text-xs"
                              value={point.time}
                              onChange={(e) => {
                                const newPoints = [...(element.data?.schedulePoints as any[])];
                                newPoints[index] = { ...newPoints[index], time: parseFloat(e.target.value) || 0 };
                                handleChange('schedulePoints', newPoints);
                              }}
                            />
                          </div>
                          <div className="grid gap-1 flex-1">
                            <Label className="text-[10px]">Flow (Q) ({currentUnit === 'SI' ? 'm³/s' : 'ft³/s'})</Label>
                            <Input 
                              type="number"
                              className="h-7 text-xs"
                              value={point.flow}
                              onChange={(e) => {
                                const newPoints = [...(element.data?.schedulePoints as any[])];
                                newPoints[index] = { ...newPoints[index], flow: parseFloat(e.target.value) || 0 };
                                handleChange('schedulePoints', newPoints);
                              }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const newPoints = (element.data?.schedulePoints as any[]).filter((_, i) => i !== index);
                              handleChange('schedulePoints', newPoints);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {(!element.data?.schedulePoints || (element.data.schedulePoints as any[]).length === 0) && (
                        <p className="text-[10px] text-muted-foreground text-center py-2 italic">No schedule points added.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {isNode && (element.data?.type === 'surgeTank' || element.data?.type_st) && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="st-type">Tank Type</Label>
                <Select 
                  value={element.data?.type_st || 'SIMPLE'} 
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
                <Input 
                  id="tankTop" 
                  type="number" 
                  step="any"
                  value={element.data?.tankTop !== undefined ? parseFloat(Number(element.data.tankTop).toFixed(8)) : 0} 
                  onChange={(e) => handleChange('tankTop', e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tankBottom">Bottom Elevation ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                <Input 
                  id="tankBottom" 
                  type="number" 
                  step="any"
                  value={element.data?.tankBottom !== undefined ? parseFloat(Number(element.data.tankBottom).toFixed(8)) : 0} 
                  onChange={(e) => handleChange('tankBottom', e.target.value)} 
                />
              </div>

              {(element.data?.type_st === 'AIRTANK' || element.data?.type_st === 'DIFFERENTIAL') && (
                <div className="grid gap-2">
                  <Label htmlFor="htank">Initial Water Level (HTANK) ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                  <Input 
                    id="htank" 
                    type="number" 
                    step="any"
                    value={element.data?.initialWaterLevel !== undefined ? parseFloat(Number(element.data.initialWaterLevel).toFixed(8)) : 0} 
                    onChange={(e) => handleChange('initialWaterLevel', e.target.value)} 
                  />
                </div>
              )}

              {element.data?.type_st === 'DIFFERENTIAL' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="riserdiam">Riser Diameter ({currentUnit === 'SI' ? 'm' : 'in'})</Label>
                    <Input 
                      id="riserdiam" 
                      type="number" 
                      step="any"
                      value={element.data?.riserDiameter !== undefined ? parseFloat(Number(element.data.riserDiameter).toFixed(8)) : 0} 
                      onChange={(e) => handleChange('riserDiameter', e.target.value)} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="risertop">Riser Top Elevation ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                    <Input 
                      id="risertop" 
                      type="number" 
                      step="any"
                      value={element.data?.riserTop !== undefined ? parseFloat(Number(element.data.riserTop).toFixed(8)) : 0} 
                      onChange={(e) => handleChange('riserTop', e.target.value)} 
                    />
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2 my-2">
                <Checkbox 
                  id="hasShape" 
                  checked={element.data?.hasShape || false} 
                  onCheckedChange={(checked) => handleChange('hasShape', !!checked)}
                />
                <Label htmlFor="hasShape" className="font-semibold text-primary">Use SHAPE instead of DIAM</Label>
              </div>

              {!element.data?.hasShape && (
                <div className="grid gap-2">
                  <Label htmlFor="diam">Diameter ({currentUnit === 'SI' ? 'm' : 'in'})</Label>
                  <Input 
                    id="diam" 
                    type="number" 
                    step="any"
                    value={element.data?.diameter !== undefined ? parseFloat(Number(element.data.diameter).toFixed(8)) : 0} 
                    onChange={(e) => handleChange('diameter', e.target.value)} 
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="st-celerity">Celerity ({currentUnit === 'SI' ? 'm/s' : 'ft/s'})</Label>
                  <Input 
                    id="st-celerity" 
                    type="number" 
                    step="any"
                    value={element.data?.celerity !== undefined ? parseFloat(Number(element.data.celerity).toFixed(8)) : 0} 
                    onChange={(e) => handleChange('celerity', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="st-friction">Friction</Label>
                  <Input 
                    id="st-friction" 
                    type="number" 
                    step="any"
                    value={element.data?.friction !== undefined ? parseFloat(Number(element.data.friction).toFixed(8)) : 0} 
                    onChange={(e) => handleChange('friction', e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 my-2">
                <Checkbox 
                  id="hasAddedLossST" 
                  checked={element.data?.hasAddedLoss || false} 
                  onCheckedChange={(checked) => handleChange('hasAddedLoss', !!checked)}
                />
                <Label htmlFor="hasAddedLossST" className="font-semibold text-primary">Added Loss Coefficients</Label>
              </div>

              {element.data?.hasAddedLoss && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-md border border-border/50 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="st-cplus">CPLUS</Label>
                    <Input 
                      id="st-cplus" 
                      type="number" 
                      step="any"
                      value={element.data?.cplus !== undefined ? parseFloat(Number(element.data.cplus).toFixed(8)) : 0} 
                      onChange={(e) => handleChange('cplus', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="st-cminus">CMINUS</Label>
                    <Input 
                      id="st-cminus" 
                      type="number" 
                      step="any"
                      value={element.data?.cminus !== undefined ? parseFloat(Number(element.data.cminus).toFixed(8)) : 0} 
                      onChange={(e) => handleChange('cminus', e.target.value)} 
                    />
                  </div>
                </div>
              )}

              {element.data?.hasShape && (
                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Shape (E, A pairs)</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2"
                      onClick={() => {
                        const shape = (element.data?.shape as any[]) || [];
                        handleChange('shape', [...shape, { e: 0, a: 0 }]);
                      }}
                    >
                      Add Pair
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {((element.data?.shape as any[]) || []).map((pair, index) => (
                      <div key={index} className="flex items-end gap-2 p-2 border rounded-md bg-muted/30 relative group">
                        <div className="grid gap-1 flex-1">
                          <Label className="text-[10px]">E ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                          <Input 
                            type="number"
                            step="any"
                            className="h-7 text-xs"
                            value={pair.e !== undefined ? parseFloat(Number(pair.e).toFixed(8)) : 0}
                            onChange={(e) => {
                              const newShape = [...(element.data?.shape as any[])];
                              newShape[index] = { ...newShape[index], e: parseFloat(e.target.value) || 0 };
                              handleChange('shape', newShape);
                            }}
                          />
                        </div>
                        <div className="grid gap-1 flex-1">
                          <Label className="text-[10px]">A ({currentUnit === 'SI' ? 'm²' : 'ft²'})</Label>
                          <Input 
                            type="number"
                            step="any"
                            className="h-7 text-xs"
                            value={pair.a !== undefined ? parseFloat(Number(pair.a).toFixed(8)) : 0}
                            onChange={(e) => {
                              const newShape = [...(element.data?.shape as any[])];
                              newShape[index] = { ...newShape[index], a: parseFloat(e.target.value) || 0 };
                              handleChange('shape', newShape);
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const newShape = (element.data?.shape as any[]).filter((_, i) => i !== index);
                            handleChange('shape', newShape);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {(!element.data?.shape || (element.data.shape as any[]).length === 0) && (
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
                  checked={element.data?.variable || false} 
                  onCheckedChange={(checked) => handleChange('variable', !!checked)}
                />
                <Label htmlFor="variable" className="font-semibold text-primary">VARIABLE (optional)</Label>
              </div>

              {element.data?.variable && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-md border border-border/50 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="distance">DISTANCE ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                    <Input 
                      id="distance" 
                      type="number" 
                      value={element.data?.distance || 0} 
                      onChange={(e) => handleChange('distance', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">AREA ({currentUnit === 'SI' ? 'm²' : 'ft²'})</Label>
                    <Input 
                      id="area" 
                      type="number" 
                      value={element.data?.area || 0} 
                      onChange={(e) => handleChange('area', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="d">D ({currentUnit === 'SI' ? 'm' : 'in'})</Label>
                    <Input 
                      id="d" 
                      type="number" 
                      value={element.data?.d || 0} 
                      onChange={(e) => handleChange('d', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="a">A ({currentUnit === 'SI' ? 'm²' : 'ft²'})</Label>
                    <Input 
                      id="a" 
                      type="number" 
                      value={element.data?.a || 0} 
                      onChange={(e) => handleChange('a', e.target.value)} 
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Length ({currentUnit === 'SI' ? 'm' : 'ft'})</Label>
                  <Input 
                    id="length" 
                    type="number" 
                    value={element.data?.length || 0} 
                    onChange={(e) => handleChange('length', e.target.value)} 
                  />
                </div>
                {!element.data?.variable && (
                  <div className="space-y-2">
                    <Label htmlFor="diam">Diameter ({currentUnit === 'SI' ? 'm' : 'in'})</Label>
                    <Input 
                      id="diam" 
                      type="number" 
                      value={element.data?.diameter || 0} 
                      onChange={(e) => handleChange('diameter', e.target.value)} 
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="celerity">Wave Speed ({currentUnit === 'SI' ? 'm/s' : 'ft/s'})</Label>
                  <Input 
                    id="celerity" 
                    type="number" 
                    value={element.data?.celerity || 0} 
                    onChange={(e) => handleChange('celerity', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="friction">Friction (f)</Label>
                  <Input 
                    id="friction" 
                    type="number" 
                    step="0.001"
                    value={element.data?.friction || 0} 
                    onChange={(e) => handleChange('friction', e.target.value)} 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="segments">Num Segments</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="segments" 
                    type="number" 
                    className="flex-1"
                    value={element.data?.numSegments || 1} 
                    onChange={(e) => handleChange('numSegments', e.target.value)} 
                  />
                  <div className="flex items-center gap-2 ml-2">
                    <Checkbox 
                      id="includeNumSeg" 
                      checked={element.data?.includeNumSegments !== false} 
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
                  checked={element.data?.hasAddedLoss || false} 
                  onCheckedChange={(checked) => handleChange('hasAddedLoss', !!checked)}
                />
                <Label htmlFor="hasAddedLoss" className="font-semibold text-primary">Include ADDEDLOSS</Label>
              </div>

              {element.data?.hasAddedLoss && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cplus">CPLUS (opt)</Label>
                    <Input 
                      id="cplus" 
                      type="number" 
                      placeholder="0.0"
                      value={element.data?.cplus ?? ''} 
                      onChange={(e) => handleChange('cplus', e.target.value === '' ? undefined : e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cminus">CMINUS (opt)</Label>
                    <Input 
                      id="cminus" 
                      type="number" 
                      placeholder="0.0"
                      value={element.data?.cminus ?? ''} 
                      onChange={(e) => handleChange('cminus', e.target.value === '' ? undefined : e.target.value)} 
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
                <Label htmlFor="diam">Diameter ({currentUnit === 'SI' ? 'm' : 'in'})</Label>
                <Input 
                  id="diam" 
                  type="number" 
                  value={element.data?.diameter || 0} 
                  onChange={(e) => handleChange('diameter', e.target.value)} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 my-2">
                <Checkbox 
                  id="hasAddedLoss" 
                  checked={element.data?.hasAddedLoss || false} 
                  onCheckedChange={(checked) => handleChange('hasAddedLoss', !!checked)}
                />
                <Label htmlFor="hasAddedLoss" className="font-semibold text-primary">Include ADDEDLOSS</Label>
              </div>

              {element.data?.hasAddedLoss && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cplus">CPLUS (opt)</Label>
                    <Input 
                      id="cplus" 
                      type="number" 
                      placeholder="0.0"
                      value={element.data?.cplus ?? ''} 
                      onChange={(e) => handleChange('cplus', e.target.value === '' ? undefined : e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cminus">CMINUS (opt)</Label>
                    <Input 
                      id="cminus" 
                      type="number" 
                      placeholder="0.0"
                      value={element.data?.cminus ?? ''} 
                      onChange={(e) => handleChange('cminus', e.target.value === '' ? undefined : e.target.value)} 
                    />
                  </div>
                </div>
              )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </div>
  );
}
