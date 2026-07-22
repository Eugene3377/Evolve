"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { SpendByCategory, SpendByMonth } from "@/lib/data/reports";

const TICK_STYLE = { fontSize: 12, fill: "#3c4a75" };

export function CategoryBarChart({ data }: { data: SpendByCategory[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3dfd3" horizontal={false} />
        <XAxis type="number" tick={TICK_STYLE} tickFormatter={(v) => formatCurrency(v)} />
        <YAxis type="category" dataKey="name" width={110} tick={TICK_STYLE} />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        <Bar dataKey="total" fill="#b8902f" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyTrendChart({ data }: { data: SpendByMonth[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: 8, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3dfd3" />
        <XAxis dataKey="month" tick={TICK_STYLE} />
        <YAxis tick={TICK_STYLE} tickFormatter={(v) => formatCurrency(v)} />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#0b1220"
          strokeWidth={2}
          dot={{ r: 3, fill: "#0b1220" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
