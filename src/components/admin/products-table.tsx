"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteProduct, toggleProductStatus } from "@/actions/products";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { Category, Product } from "@/types/database";

interface ProductsTableProps {
  products: Product[];
  categories: Category[];
}

export function ProductsTable({ products, categories }: ProductsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q);
      const matchesCategory =
        categoryFilter === "all" || p.category_id === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.is_active) ||
        (statusFilter === "inactive" && !p.is_active);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  async function handleToggle(id: string) {
    setLoading(id);
    const result = await toggleProductStatus(id);
    if (result.success) {
      toast.success("Status updated");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update status");
    }
    setLoading(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setLoading(deleteId);
    const result = await deleteProduct(deleteId);
    if (result.success) {
      toast.success("Product deleted");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete");
    }
    setDeleteId(null);
    setLoading(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-zinc-700 bg-zinc-800 pl-10 text-white"
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 border-zinc-700 bg-zinc-800 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 border-zinc-700 bg-zinc-800 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild className="bg-[#16A34A] hover:bg-[#16A34A]/90">
            <Link href="/admin/products/new">
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Product</TableHead>
              <TableHead className="text-zinc-400">SKU</TableHead>
              <TableHead className="text-zinc-400">Price</TableHead>
              <TableHead className="text-zinc-400">Stock</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-right text-zinc-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-zinc-500">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => {
                const inventory = Array.isArray(product.inventory)
                  ? product.inventory[0]
                  : product.inventory;
                const qty = inventory?.quantity ?? 0;

                return (
                  <TableRow key={product.id} className="border-zinc-800">
                    <TableCell>
                      <div>
                        <p className="font-medium text-zinc-100">{product.name}</p>
                        <p className="text-xs text-zinc-500">{product.brand}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300">{product.sku}</TableCell>
                    <TableCell className="text-zinc-300">
                      {formatCurrency(product.selling_price)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={qty <= (inventory?.low_stock_threshold ?? 5) ? "destructive" : "secondary"}
                        className={qty <= (inventory?.low_stock_threshold ?? 5) ? "bg-[#16A34A]" : ""}
                      >
                        {qty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={product.is_active}
                        disabled={loading === product.id}
                        onCheckedChange={() => handleToggle(product.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="text-zinc-400 hover:text-white"
                        >
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-zinc-400 hover:text-[#16A34A]"
                          onClick={() => setDeleteId(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="border-zinc-800 bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Product?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. The product and its inventory will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#16A34A] hover:bg-[#16A34A]/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
