import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, queryKeys } from "@/lib/serverprice/api";
import { SEGMENT_LABELS } from "@/lib/serverprice/data";
import { productsQueryOptions } from "@/lib/serverprice/queries";
import type { CustomerSegment } from "@/lib/serverprice/types";

const TERMS = [12, 24, 36] as const;

export function AddBomItemDialog({
  dealId,
  open,
  onOpenChange,
}: {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery(productsQueryOptions());

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [termMonths, setTermMonths] = useState<12 | 24 | 36>(24);
  const [segment, setSegment] = useState<CustomerSegment | "">("");
  const [touched, setTouched] = useState(false);

  const product = products.find((p) => p.id === productId);
  const qty = Number(quantity);
  const qtyValid = quantity.trim() !== "" && /^\d+$/.test(quantity.trim()) && qty > 0;
  const isValid = Boolean(productId) && Boolean(segment) && qtyValid;

  const mutation = useMutation({
    mutationFn: () =>
      api.addBomItem(dealId, {
        productId,
        quantity: qty,
        termMonths,
        segment: segment as CustomerSegment,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.deal(dealId), updated);
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      onOpenChange(false);
      setProductId("");
      setQuantity("10");
      setSegment("");
      setTouched(false);
    },
  });

  const errors = useMemo(() => {
    const e: { product?: string; quantity?: string; segment?: string } = {};
    if (!productId) e.product = "Select a SKU to add to this BOM.";
    if (!qtyValid) e.quantity = "Quantity must be a whole number greater than 0.";
    if (!segment) e.segment = "Select the customer segment for this line.";
    return e;
  }, [productId, qtyValid, segment]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add BOM line item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Product SKU</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="h-9 text-[0.8125rem]">
                <SelectValue placeholder="Select a SKU…" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.sku}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {touched && errors.product && <p className="text-[0.75rem] text-destructive">{errors.product}</p>}
            {product && (
              <p className="text-meta">
                ${product.basePrice.toLocaleString()}/mo list · {product.availability}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputMode="numeric"
                className="h-9 text-[0.8125rem]"
              />
              {touched && errors.quantity && (
                <p className="text-[0.75rem] text-destructive">{errors.quantity}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Term</Label>
              <Select value={String(termMonths)} onValueChange={(v) => setTermMonths(Number(v) as 12 | 24 | 36)}>
                <SelectTrigger className="h-9 text-[0.8125rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((t) => (
                    <SelectItem key={t} value={String(t)}>
                      {t} months
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Customer segment</Label>
            <Select value={segment} onValueChange={(v) => setSegment(v as CustomerSegment)}>
              <SelectTrigger className="h-9 text-[0.8125rem]">
                <SelectValue placeholder="Select segment…" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEGMENT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {touched && errors.segment && <p className="text-[0.75rem] text-destructive">{errors.segment}</p>}
          </div>

          {mutation.isError && (
            <p className="text-[0.75rem] text-destructive">
              {mutation.error instanceof Error ? mutation.error.message : "Could not add this line item."}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              setTouched(true);
              if (Object.keys(errors).length === 0) mutation.mutate();
            }}
            disabled={mutation.isPending}
            className="gap-1.5"
          >
            {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
            Add to BOM
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
