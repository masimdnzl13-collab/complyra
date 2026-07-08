"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { brandColors } from "@/config/site";

export function MrrTrendChart({ data }: { data: { date: string; mrr: number }[] }) {
  if (data.length < 2) {
    return <p className="text-sm text-navy-500">Not enough history yet — trend data started collecting {data[0]?.date ?? "recently"}.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={brandColors.navy[100]} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
        <Tooltip formatter={(v) => [`€${Number(v).toFixed(0)}`, "MRR"]} />
        <Line type="monotone" dataKey="mrr" stroke={brandColors.accent.DEFAULT} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = [brandColors.navy[200], brandColors.accent[400], brandColors.accent.DEFAULT, brandColors.accent[700]];

export function PlanBreakdownPie({ data }: { data: { name: string; value: number }[] }) {
  const nonZero = data.filter((d) => d.value > 0);
  if (nonZero.length === 0) {
    return <p className="text-sm text-navy-500">No paying organizations yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={nonZero} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
          {nonZero.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
