import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddBomItemDialog } from "./add-bom-item-dialog";
import { api, queryKeys } from "@/lib/serverprice/api";
import { currency } from "@/lib/serverprice/discount";
import { SEGMENT_LABELS } from "@/lib/serverprice/data";
import type { BomLineItem, Deal } from "@/lib/serverprice/types";
import { useDialogTrigger } from "@/hooks/use-dialog-trigger";

export function BomLedger({ deal }: { deal: Deal }) {
  const addDialog = useDialogTrigger();
  const queryClient = useQueryClient();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => api.removeBomItem(deal.id, itemId),
    onMutate: (itemId) => setRemovingId(itemId),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.deal(deal.id), updated);
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
    onSettled: () => setRemovingId(null),
  });

  const total = deal.bom.reduce((s, i) => s + i.lineTotal, 0);
  const listTotal = deal.bom.reduce((s, i) => s + i.unitListPrice * i.quantity * i.termMonths, 0);

  return (
    <section className="surface-card overflow-hidden" aria-labelledby="bom-heading">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 id="bom-heading" className="text-section-title text-foreground">
            Bill of materials
          </h2>
          <p className="text-meta">
            {deal.bom.length} line item{deal.bom.length === 1 ? "" : "s"}
          </p>
        </div>
        {deal.bomLocked ? (
          <span className="status-pill text-muted-foreground border-border-strong bg-secondary/60">
            <Lock className="size-3" strokeWidth={2.5} />
            Locked
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-[0.75rem]"
            onClick={() => addDialog.setOpen(true)}
          >
            <Plus className="size-3.5" />
            Add item
          </Button>
        )}
      </div>

      {deal.bomLocked && deal.bomLockReason && (
        <div className="flex items-start gap-2 border-b border-border bg-secondary/20 px-5 py-2.5 text-[0.75rem] text-muted-foreground">
          <Lock className="mt-0.5 size-3 shrink-0" strokeWidth={2.5} />
          {deal.bomLockReason}
        </div>
      )}

      {deal.bom.length === 0 ? (
        <div className="px-5 py-14 text-center text-sm text-muted-foreground">
          No line items yet — add a SKU to start building this BOM.
        </div>
      ) : (
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[0.8125rem]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-2.5 font-medium text-muted-foreground">SKU</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Qty</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Term</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                  List / mo
                </th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                  Discount
                </th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                  Net total
                </th>
                <th className="w-10 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deal.bom.map((item, rowIndex) => (
                <LedgerRow
                  key={item.id}
                  item={item}
                  rowIndex={rowIndex}
                  removing={removingId === item.id}
                  locked={deal.bomLocked}
                  onRemove={() => removeMutation.mutate(item.id)}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border-strong bg-surface-muted">
                <td
                  className="px-5 py-3 text-[0.75rem] font-medium text-muted-foreground"
                  colSpan={3}
                >
                  List total {currency(listTotal)}
                </td>
                <td
                  className="px-3 py-3 text-right text-[0.75rem] text-muted-foreground"
                  colSpan={2}
                >
                  BOM total
                </td>
                <td className="tabular px-3 py-3 text-right text-[1.0625rem] font-bold text-accent">
                  {currency(total)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <AddBomItemDialog
        dealId={deal.id}
        open={addDialog.open}
        onOpenChange={addDialog.onOpenChange}
      />
    </section>
  );
}

function LedgerRow({
  item,
  rowIndex,
  removing,
  locked,
  onRemove,
}: {
  item: BomLineItem;
  rowIndex: number;
  removing: boolean;
  locked: boolean;
  onRemove: () => void;
}) {
  return (
    <tr
      style={{ animationDelay: `${Math.min(rowIndex * 30, 300)}ms` }}
      className="row-enter group transition-colors hover:bg-surface-muted"
    >
      <td className="px-5 py-3">
        <div className="font-medium text-foreground">{item.productName}</div>
        <div className="text-[0.75rem] text-muted-foreground">
          {item.sku} · {SEGMENT_LABELS[item.segment]}
        </div>
      </td>
      <td className="tabular px-3 py-3 text-right text-foreground">{item.quantity}</td>
      <td className="tabular px-3 py-3 text-right text-muted-foreground">{item.termMonths}mo</td>
      <td className="tabular px-3 py-3 text-right text-muted-foreground">
        {currency(item.unitListPrice)}
      </td>
      <td className="tabular px-3 py-3 text-right text-success">
        {item.discountPercent > 0 ? `−${item.discountPercent.toFixed(1)}%` : "—"}
      </td>
      <td className="tabular px-3 py-3 text-right font-semibold text-foreground">
        {currency(item.lineTotal)}
      </td>
      <td className="px-3 py-3 text-right">
        {!locked && (
          <button
            type="button"
            onClick={onRemove}
            disabled={removing}
            aria-label={`Remove ${item.productName}`}
            className="focus-ring rounded-md p-1.5 text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-100"
          >
            {removing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </button>
        )}
      </td>
    </tr>
  );
}
