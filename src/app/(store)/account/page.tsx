"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  Heart,
  Loader2,
  MapPin,
  Package,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  deleteAddress,
  getCustomerAddresses,
  getCustomerInvoices,
  getCustomerOrders,
  getCustomerProfile,
  saveAddress,
  updateCustomerProfile,
} from "@/actions/customer";
import { getWishlist } from "@/actions/wishlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { Address, Customer, Invoice, Order, WishlistItem } from "@/types/database";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "orders", label: "Orders", icon: Package },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "bills", label: "Bills", icon: FileText },
];

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    is_default: false,
  });

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login?redirect=/account");
      return;
    }

    const [profileRes, ordersRes, wishlistRes, addressesRes, invoicesRes] =
      await Promise.all([
        getCustomerProfile(),
        getCustomerOrders(),
        getWishlist(),
        getCustomerAddresses(),
        getCustomerInvoices(),
      ]);

    if (profileRes.success && profileRes.data) {
      setProfile(profileRes.data);
      setProfileForm({
        full_name: profileRes.data.full_name ?? "",
        phone: profileRes.data.phone ?? "",
      });
    }

    if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data);
    if (wishlistRes.success && wishlistRes.data) setWishlist(wishlistRes.data);
    if (addressesRes.success && addressesRes.data) setAddresses(addressesRes.data);
    if (invoicesRes.success && invoicesRes.data) setInvoices(invoicesRes.data);

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveProfile = async () => {
    setSaving(true);
    const result = await updateCustomerProfile(profileForm);
    setSaving(false);

    if (result.success) {
      toast.success("Profile updated");
      loadData();
    } else {
      toast.error(result.error || "Failed to update");
    }
  };

  const handleSaveAddress = async () => {
    const result = await saveAddress(addressForm);
    if (result.success) {
      toast.success("Address saved");
      setShowAddressForm(false);
      loadData();
    } else {
      toast.error(result.error || "Failed to save address");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const result = await deleteAddress(id);
    if (result.success) {
      toast.success("Address deleted");
      loadData();
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-black">My Account</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name || "Customer"}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </motion.div>

      <Tabs value={activeTab} className="space-y-6">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted p-1">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="gap-2"
              onClick={() => router.push(`/account?tab=${tab.id}`)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile">
          <div className="max-w-lg rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={profileForm.full_name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, full_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-muted-foreground">No orders yet</p>
            ) : (
              orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {formatCurrency(order.grand_total)}
                      </p>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                        {order.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="wishlist">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.length === 0 ? (
              <p className="text-muted-foreground">Your wishlist is empty</p>
            ) : (
              wishlist.map((item) => (
                <Link
                  key={item.id}
                  href={`/shop/${item.product_id}`}
                  className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary"
                >
                  <p className="font-semibold">{item.product?.name}</p>
                  {item.product && (
                    <p className="mt-1 text-primary">
                      {formatCurrency(item.product.selling_price)}
                    </p>
                  )}
                </Link>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="addresses">
          <div className="space-y-4">
            <Button onClick={() => setShowAddressForm(!showAddressForm)}>
              {showAddressForm ? "Cancel" : "Add Address"}
            </Button>

            {showAddressForm && (
              <div className="grid max-w-lg gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
                <div>
                  <Label>Label</Label>
                  <Input
                    value={addressForm.label}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, label: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={addressForm.full_name}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, full_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, phone: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Address Line 1</Label>
                  <Input
                    value={addressForm.address_line1}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, address_line1: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={addressForm.state}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, state: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input
                    value={addressForm.pincode}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, pincode: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button onClick={handleSaveAddress}>Save Address</Button>
                </div>
              </div>
            )}

            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="flex items-start justify-between rounded-2xl border border-border bg-card p-5"
              >
                <div>
                  <p className="font-semibold">
                    {addr.label}
                    {addr.is_default && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {addr.full_name}, {addr.address_line1}, {addr.city},{" "}
                    {addr.state} - {addr.pincode}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDeleteAddress(addr.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bills">
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <p className="text-muted-foreground">No invoices yet</p>
            ) : (
              invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{invoice.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(invoice.created_at)}
                      </p>
                    </div>
                    <p className="font-bold text-primary">
                      {formatCurrency(invoice.grand_total)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
