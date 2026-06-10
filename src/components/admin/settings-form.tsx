"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createBackup } from "@/actions/backup";
import { updateSetting } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { STORE_INFO } from "@/lib/utils";
import type { Setting } from "@/types/database";

function getSettingValue(settings: Setting[], key: string, fallback = ""): string {
  const setting = settings.find((s) => s.key === key);
  if (!setting?.value) return fallback;
  if (typeof setting.value === "string") return setting.value;
  if (typeof setting.value === "object" && setting.value !== null && "value" in setting.value) {
    return String((setting.value as { value: unknown }).value);
  }
  return String(setting.value);
}

interface SettingsFormProps {
  settings: Setting[];
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  const [storeName, setStoreName] = useState(
    getSettingValue(settings, "store_name", STORE_INFO.name)
  );
  const [storePhone, setStorePhone] = useState(
    getSettingValue(settings, "store_phone", STORE_INFO.phone)
  );
  const [storeAddress, setStoreAddress] = useState(
    getSettingValue(settings, "store_address", STORE_INFO.address)
  );
  const [storeHours, setStoreHours] = useState(
    getSettingValue(settings, "store_hours", STORE_INFO.hours)
  );
  const [logoUrl, setLogoUrl] = useState(getSettingValue(settings, "logo_url"));
  const [theme, setTheme] = useState(getSettingValue(settings, "theme", "dark"));
  const [taxRate, setTaxRate] = useState(getSettingValue(settings, "tax_rate", "18"));
  const [barcodeType, setBarcodeType] = useState(
    getSettingValue(settings, "barcode_type", "code128")
  );
  const [invoicePrefix, setInvoicePrefix] = useState(
    getSettingValue(settings, "invoice_prefix", "INV")
  );
  const [invoiceFooter, setInvoiceFooter] = useState(
    getSettingValue(settings, "invoice_footer", "Thank you for shopping at SHOE MAFIA!")
  );
  const [backupSchedule, setBackupSchedule] = useState(
    getSettingValue(settings, "backup_schedule", "weekly")
  );

  async function saveSetting(key: string, value: string) {
    return updateSetting(key, { value });
  }

  async function handleSaveStore() {
    setSaving(true);
    const results = await Promise.all([
      saveSetting("store_name", storeName),
      saveSetting("store_phone", storePhone),
      saveSetting("store_address", storeAddress),
      saveSetting("store_hours", storeHours),
    ]);
    if (results.every((r) => r.success)) {
      toast.success("Store info saved");
      router.refresh();
    } else {
      toast.error("Failed to save some settings");
    }
    setSaving(false);
  }

  async function handleSaveSection(key: string, value: string, label: string) {
    setSaving(true);
    const result = await saveSetting(key, value);
    if (result.success) {
      toast.success(`${label} saved`);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to save");
    }
    setSaving(false);
  }

  async function handleBackup() {
    setBackingUp(true);
    const result = await createBackup();
    if (result.success) {
      toast.success("Backup created successfully");
    } else {
      toast.error(result.error || "Backup failed");
    }
    setBackingUp(false);
  }

  return (
    <Tabs defaultValue="store" className="space-y-6">
      <TabsList className="flex flex-wrap bg-zinc-900">
        <TabsTrigger value="store">Store Info</TabsTrigger>
        <TabsTrigger value="logo">Logo</TabsTrigger>
        <TabsTrigger value="theme">Theme</TabsTrigger>
        <TabsTrigger value="tax">Tax</TabsTrigger>
        <TabsTrigger value="barcode">Barcode</TabsTrigger>
        <TabsTrigger value="invoice">Invoice</TabsTrigger>
        <TabsTrigger value="backup">Backup</TabsTrigger>
      </TabsList>

      <TabsContent value="store">
        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="text-zinc-100">Store Information</CardTitle>
            <CardDescription className="text-zinc-400">
              Basic store details shown on the website and invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-300">Store Name</Label>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="border-zinc-700 bg-zinc-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Phone</Label>
                <Input
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="border-zinc-700 bg-zinc-800 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Address</Label>
              <Textarea
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Hours</Label>
              <Input
                value={storeHours}
                onChange={(e) => setStoreHours(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
            <Button
              className="bg-[#16A34A] hover:bg-[#16A34A]/90"
              disabled={saving}
              onClick={handleSaveStore}
            >
              Save Store Info
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="logo">
        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="text-zinc-100">Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Logo URL</Label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
            {logoUrl && (
              <img src={logoUrl} alt="Logo preview" className="h-16 object-contain" />
            )}
            <Button
              className="bg-[#16A34A] hover:bg-[#16A34A]/90"
              disabled={saving}
              onClick={() => handleSaveSection("logo_url", logoUrl, "Logo")}
            >
              Save Logo
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="theme">
        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="text-zinc-100">Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Default Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="bg-[#16A34A] hover:bg-[#16A34A]/90"
              disabled={saving}
              onClick={() => handleSaveSection("theme", theme, "Theme")}
            >
              Save Theme
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tax">
        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="text-zinc-100">Tax Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">GST Rate (%)</Label>
              <Input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
            <Button
              className="bg-[#16A34A] hover:bg-[#16A34A]/90"
              disabled={saving}
              onClick={() => handleSaveSection("tax_rate", taxRate, "Tax rate")}
            >
              Save Tax Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="barcode">
        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="text-zinc-100">Barcode Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Default Barcode Type</Label>
              <Select value={barcodeType} onValueChange={setBarcodeType}>
                <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="code128">Code 128</SelectItem>
                  <SelectItem value="ean13">EAN-13</SelectItem>
                  <SelectItem value="qrcode">QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="bg-[#16A34A] hover:bg-[#16A34A]/90"
              disabled={saving}
              onClick={() => handleSaveSection("barcode_type", barcodeType, "Barcode settings")}
            >
              Save Barcode Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="invoice">
        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="text-zinc-100">Invoice Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Invoice Prefix</Label>
              <Input
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Invoice Footer</Label>
              <Textarea
                value={invoiceFooter}
                onChange={(e) => setInvoiceFooter(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
            <Button
              className="bg-[#16A34A] hover:bg-[#16A34A]/90"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                const results = await Promise.all([
                  saveSetting("invoice_prefix", invoicePrefix),
                  saveSetting("invoice_footer", invoiceFooter),
                ]);
                if (results.every((r) => r.success)) {
                  toast.success("Invoice settings saved");
                } else {
                  toast.error("Failed to save");
                }
                setSaving(false);
              }}
            >
              Save Invoice Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="backup">
        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="text-zinc-100">Backup Settings</CardTitle>
            <CardDescription className="text-zinc-400">
              Configure backup schedule and create manual backups
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Backup Schedule</Label>
              <Select value={backupSchedule} onValueChange={setBackupSchedule}>
                <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button
                className="bg-[#16A34A] hover:bg-[#16A34A]/90"
                disabled={saving}
                onClick={() =>
                  handleSaveSection("backup_schedule", backupSchedule, "Backup schedule")
                }
              >
                Save Schedule
              </Button>
              <Button
                variant="outline"
                className="border-zinc-700"
                disabled={backingUp}
                onClick={handleBackup}
              >
                {backingUp ? "Creating..." : "Create Backup Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
