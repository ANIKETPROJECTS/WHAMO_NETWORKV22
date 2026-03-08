import { useNetworkStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckSquare, XSquare } from 'lucide-react';

export function NodeSelectionPanel() {
  const { nodes, nodeSelectionSet, toggleNodeSelection, setAllNodesSelected } = useNetworkStore();
  
  const nodesList = nodes
    .filter(n => n.type === 'node' || n.type === 'junction' || n.type === 'reservoir' || n.type === 'surgeTank' || n.type === 'flowBoundary')
    .map(n => ({
      id: n.data.nodeNumber?.toString() || n.id,
      label: n.data.label,
      elevation: n.data.elevation || n.data.reservoirElevation || 0,
    }))
    .sort((a, b) => {
      const numA = parseInt(a.id);
      const numB = parseInt(b.id);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.id.localeCompare(b.id);
    });

  const allSelected = nodeSelectionSet.size === 0 || nodesList.every(n => nodeSelectionSet.has(n.id));
  const anySelected = nodeSelectionSet.size > 0;

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      <div className="flex items-center gap-2 justify-between">
        <h3 className="text-sm font-semibold">Node Selection</h3>
        <div className="text-xs text-muted-foreground">
          {nodeSelectionSet.size === 0 ? 'All' : nodeSelectionSet.size}/{nodesList.length}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={allSelected ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs flex-1 gap-1"
          onClick={() => setAllNodesSelected(true)}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Select All
        </Button>
        <Button
          variant={anySelected ? "destructive" : "outline"}
          size="sm"
          className="h-8 text-xs flex-1 gap-1"
          onClick={() => setAllNodesSelected(false)}
        >
          <XSquare className="w-3.5 h-3.5" />
          Clear All
        </Button>
      </div>

      <div className="text-xs text-muted-foreground border-t pt-2">
        When empty or all selected, all nodes are exported. Unselect nodes to exclude them.
      </div>

      <ScrollArea className="flex-1 border rounded-md">
        <div className="space-y-1 p-2">
          {nodesList.map(node => {
            const isSelected = nodeSelectionSet.size === 0 || nodeSelectionSet.has(node.id);
            return (
              <div
                key={node.id}
                className="flex items-center gap-2 p-2 hover:bg-accent rounded transition-colors"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleNodeSelection(node.id)}
                  className="h-4 w-4 cursor-pointer"
                />
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => toggleNodeSelection(node.id)}
                >
                  <div className="text-xs font-medium">Node {node.id}</div>
                  <div className="text-xs text-muted-foreground truncate">{node.label} - Elev: {node.elevation}</div>
                </div>
              </div>
            );
          })}
          {nodesList.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4">
              No nodes in network
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
