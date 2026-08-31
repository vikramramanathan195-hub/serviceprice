import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
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
import type { ServerProduct } from "@/lib/serverprice/types";

export function ExportCatalogDialog({
  open,
  onOpenChange,
  products,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  products: ServerProduct[];
}) {
  const [pending, setPending] = useState(false);

  const regions = new Set(products.map((p) => p.region)).size;
  const categories = new Set(products.map((p) => p.category)).size;

  const confirm = async () => {
    setPending(true);
    await new Promise((r) => setTimeout(r, 650));
    setPending(false);
    onOpenChange(false);
    toast.success("Catalog export queued", {
      description: `${products.length} SKUs · CSV will be emailed to you when ready.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="space-y-0 border-b border-border px-6 py-5 text-left">
          <DialogTitle className="text-[1.0625rem] font-semibold tracking-tight">
            Export catalog as CSV
          </DialogTitle>
          <DialogDescription className="mt-1 text-[0.8125rem]">
            Export {products.length} SKUs from the Q3 FY26 rate card as CSV?
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          <dl className="divide-y divide-border/70 rounded-lg border border-border bg-surface-muted/60">
            <Row label="Rows" value={`${products.length} SKUs`} />
            <Row label="Coverage" value={`${regions} regions · ${categories} categories`} />
            <Row
              label="Columns"
              value="SKU, name, category, region, list price, tiers, availability"
            />
            <Row label="Format" value="CSV (UTF-8, comma-delimited)" />
          </dl>
          <p className="mt-3 text-[0.75rem] leading-5 text-muted-foreground">
            List pricing only — customer-specific discounts are not included in this export.
          </p>
        </div>

        <DialogFooter className="gap-2 border-t border-border bg-surface-muted/60 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-9 text-[0.8125rem]"
          >
            Cancel
          </Button>
          <Button onClick={confirm} disabled={pending} className="h-9 gap-2 text-[0.8125rem]">
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-3.5" aria-hidden="true" />
            )}
            {pending ? "Preparing…" : "Confirm export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 px-3.5 py-2.5">
      <dt className="shrink-0 text-[0.75rem] text-muted-foreground">{label}</dt>
      <dd className="text-right text-[0.8125rem] font-medium text-foreground">{value}</dd>
    </div>
  );
}
