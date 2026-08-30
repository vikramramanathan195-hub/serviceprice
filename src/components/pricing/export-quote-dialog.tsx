import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/serverprice/api";
import { SEGMENT_LABELS } from "@/lib/serverprice/data";
import { currency } from "@/lib/serverprice/discount";
import type { DiscountQuote, ServerProduct } from "@/lib/serverprice/types";

export function ExportQuoteDialog({
  open,
  onOpenChange,
  quote,
  product,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  quote: DiscountQuote;
  product: ServerProduct;
}) {
  const [reference, setReference] = useState("");
  const [touched, setTouched] = useState(false);

  const error =
    reference.trim().length === 0
      ? "An opportunity ID is required — exports are logged against the CRM record."
      : !/^OPP-\d{4,6}$/i.test(reference.trim())
        ? "Format must be OPP- followed by 4–6 digits (e.g. OPP-10428)."
        : null;

  const mutation = useMutation({
    mutationFn: api.exportQuote,
    onSuccess: (res) => {
      toast.success(`Quote ${res.id} finalized`, {
        description: `${quote.discountPercent}% on ${product.sku} · locked to ${reference.toUpperCase()} for 30 days.`,
      });
      onOpenChange(false);
      setReference("");
      setTouched(false);
    },
  });

  const confirm = () => {
    setTouched(true);
    if (error) return;
    mutation.mutate({ quote, reference: reference.trim().toUpperCase() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="space-y-0 border-b border-border px-6 py-5 text-left">
          <DialogTitle className="text-[1.0625rem] font-semibold tracking-tight">
            Finalize and export quote
          </DialogTitle>
          <DialogDescription className="mt-1 text-[0.8125rem]">
            This locks the pricing for 30 days and writes an audit entry to the pricing desk log.
            It cannot be edited afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <dl className="divide-y divide-border/70 rounded-lg border border-border bg-surface-muted/60">
            <SummaryRow label="Product" value={`${product.name} · ${product.sku}`} />
            <SummaryRow label="Segment" value={SEGMENT_LABELS[quote.segment]} />
            <SummaryRow
              label="Configuration"
              value={`${quote.units} units · ${quote.termMonths}-month term`}
            />
            <SummaryRow label="Discount" value={`${quote.discountPercent}% off list`} />
            <SummaryRow label="Contract value" value={currency(quote.netTotal)} strong />
          </dl>

          {quote.requiresApproval && (
            <div className="flex gap-2.5 rounded-md border border-warning/40 bg-warning/10 px-3.5 py-3">
              <AlertTriangle className="mt-px size-4 shrink-0 text-warning" />
              <p className="text-[0.8125rem] leading-5 text-foreground">
                This quote exceeds rep authority. Exporting routes it to{" "}
                <span className="font-medium">VP Sales</span> for countersignature before it can be
                sent to the customer.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="opp-ref" className="text-[0.75rem] font-medium text-foreground">
              Opportunity ID
            </Label>
            <Input
              id="opp-ref"
              placeholder="OPP-10428"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              onBlur={() => setTouched(true)}
              className="mt-1.5 h-9 text-[0.8125rem]"
              aria-invalid={Boolean(touched && error)}
            />
            {touched && error && (
              <p className="mt-1.5 text-[0.75rem] font-medium text-destructive">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border bg-surface-muted/60 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-9 text-[0.8125rem]"
          >
            Cancel
          </Button>
          <Button
            onClick={confirm}
            disabled={mutation.isPending}
            className="h-9 gap-2 text-[0.8125rem] transition-all active:scale-[0.99]"
          >
            {mutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileText className="size-3.5" />
            )}
            {mutation.isPending ? "Finalizing…" : "Confirm & export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-3.5 py-2.5">
      <dt className="text-[0.75rem] text-muted-foreground">{label}</dt>
      <dd
        className={
          strong
            ? "tabular text-[0.9375rem] font-semibold text-foreground"
            : "tabular text-[0.8125rem] font-medium text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}
