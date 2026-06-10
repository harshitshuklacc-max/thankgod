"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartDataPoint } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/utils";

interface DashboardChartsProps {
  revenueData: ChartDataPoint[];
  ordersData: ChartDataPoint[];
  salesData: ChartDataPoint[];
  productsData: ChartDataPoint[];
}

const chartTooltipStyle = {
  backgroundColor: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: "8px",
  color: "#fafafa",
};

function formatLabel(label: string) {
  const d = new Date(label);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function DashboardCharts({
  revenueData,
  ordersData,
  salesData,
  productsData,
}: DashboardChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-zinc-100">Revenue (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="label" tickFormatter={formatLabel} stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                labelFormatter={formatLabel}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#16A34A"
                fill="url(#revenueGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-zinc-100">Orders (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ordersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="label" tickFormatter={formatLabel} stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={chartTooltipStyle} labelFormatter={formatLabel} />
              <Bar dataKey="value" fill="#16A34A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-zinc-100">Units Sold (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="label" tickFormatter={formatLabel} stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={chartTooltipStyle} labelFormatter={formatLabel} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#16A34A"
                strokeWidth={2}
                dot={{ fill: "#16A34A", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-zinc-100">New Products (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={productsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="label" tickFormatter={formatLabel} stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={chartTooltipStyle} labelFormatter={formatLabel} />
              <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
