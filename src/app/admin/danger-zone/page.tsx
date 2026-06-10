"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  deleteAllProducts,
  deleteInventory,
  deleteOrders,
  factoryReset,
} from "@/actions/danger-zone";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DangerAction = "products" | "inventory" | "orders" | "factory";

const ACTIONS: {
  id: DangerAction;
  title: string;
  description: string;
  action: (password: string) => Promise<{ success: boolean; error?: string }>;
}[] = [
  {
    id: "products",
    title: "Delete All Products",
    description: "Permanently remove all products, images, barcodes, and inventory records.",
    action: deleteAllProducts,
  },
  {
    id: "inventory",
    title: "Clear All Inventory",
    description: "Reset all stock quantities to zero and clear inventory logs.",
    action: deleteInventory,
  },
  {
    id: "orders",
    title: "Delete All Orders",
    description: "Remove all orders, order items, and associated invoices.",
    action: deleteOrders,
  },
  {
    id: "factory",
    title: "Factory Reset",
    description:
      "Delete everything: products, inventory, orders, reviews, imports, and barcodes.",
    action: factoryReset,
  },
];

export default function DangerZonePage() {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [activeAction, setActiveAction] = useState<DangerAction | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!activeAction) return;
    if (confirmText !== "DELETE") {
      toast.error('Type "DELETE" to confirm');
      return;
    }
    if (!password) {
      toast.error("Enter your admin password");
      return;
    }

    const actionConfig = ACTIONS.find((a) => a.id === activeAction);
    if (!actionConfig) return;

    setLoading(true);
    const result = await actionConfig.action(password);
    if (result.success) {
      toast.success("Action completed");
      setPassword("");
      setConfirmText("");
      setActiveAction(null);
    } else {
      toast.error(result.error || "Action failed");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-[#16A34A]">
          <AlertTriangle className="h-8 w-8" />
          Danger Zone
        </h1>
        <p className="mt-1 text-zinc-400">
          Irreversible actions. Proceed with extreme caution.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ACTIONS.map((action) => (
          <Card
            key={action.id}
            className="border-red-900/50 bg-zinc-900/80"
          >
            <CardHeader>
              <CardTitle className="text-red-400">{action.title}</CardTitle>
              <CardDescription className="text-zinc-400">
                {action.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="bg-[#16A34A] hover:bg-[#16A34A]/90"
                onClick={() => setActiveAction(action.id)}
              >
                {action.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!activeAction} onOpenChange={() => setActiveAction(null)}>
        <AlertDialogContent className="border-red-900/50 bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">
              Confirm Destructive Action
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. Enter your admin password and type{" "}
              <strong className="text-white">DELETE</strong> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Admin Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Type DELETE to confirm</Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#16A34A] hover:bg-[#16A34A]/90"
              disabled={loading || confirmText !== "DELETE"}
              onClick={handleConfirm}
            >
              {loading ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
