"use client";

import React, { useState } from "react";
import { BomItem, TelecomDomain } from "@/core/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { formatCurrency } from "@/lib/utils";
import { Download, Plus, Trash2, ShieldCheck, Sparkles, Filter } from "lucide-react";

interface BomTableProps {
  items: BomItem[];
  onAddItem?: (item: BomItem) => void;
  onDeleteItem?: (id: string) => void;
  readOnly?: boolean;
}

export const BomTable: React.FC<BomTableProps> = ({
  items,
  onAddItem,
  onDeleteItem,
  readOnly = false
}) => {
  const { t, language } = useI18n();
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");

  const filteredItems =
    selectedDomain === "ALL" ? items : items.filter((i) => i.domain === selectedDomain);

  const totalCapex = items.reduce((acc, curr) => acc + (curr.capexTotalEur || 0), 0);
  const totalMonthlyOpex = items.reduce((acc, curr) => acc + (curr.opexMonthlyTotalEur || 0), 0);

  const handleExportCsv = () => {
    const headers = ["Domain", "Category", "Product Code", "Designation", "Qty", "Unit Capex EUR", "Monthly Opex EUR", "Total Capex EUR", "Total Monthly Opex EUR", "Source"];
    const rows = items.map((i) => [
      i.domain,
      i.category,
      i.productCode,
      `"${i.productName.replace(/"/g, '""')}"`,
      i.quantity,
      i.capexUnitEur,
      i.opexMonthlyUnitEur,
      i.capexTotalEur,
      i.opexMonthlyTotalEur,
      i.source
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `telco_bom_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-5">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">
            Total Capex (Setup & Hardware)
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalCapex, language)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">One-time initial investment</p>
        </div>

        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-5">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
            Total Monthly Recurring (Opex)
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalMonthlyOpex, language)} <span className="text-sm font-normal text-slate-500">/mo</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Fiber access, SaaS & support contracts</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              BOM Items Count
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{items.length} Lines</p>
          </div>
          <div className="flex justify-end pt-2">
            <Button size="sm" variant="outline" onClick={handleExportCsv}>
              <Download className="w-3.5 h-3.5" />
              {t.common.exportCsv}
            </Button>
          </div>
        </div>
      </div>

      {/* Domain Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          {["ALL", "TELEPHONY", "NETWORK_SDWAN", "WIFI", "CYBERSECURITY_FIREWALL"].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDomain(d)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedDomain === d
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {d.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Structured Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Capex Unit</th>
                <th className="py-3 px-4 text-right">Monthly Opex</th>
                <th className="py-3 px-4 text-right">Total Capex</th>
                <th className="py-3 px-4 text-right">Total Opex</th>
                <th className="py-3 px-4 text-center">Origin</th>
                {!readOnly && <th className="py-3 px-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400">
                    {t.bom.emptyBom}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <Badge domain={item.domain}>{item.domain.replace("_", " ")}</Badge>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {item.productCode}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.productName}</p>
                      {item.ruleCitation && (
                        <span className="text-[10px] text-blue-600 dark:text-blue-400">
                          Auto-generated by {item.ruleCitation}
                        </span>
                      )}
                      {item.expertJustification && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                          {item.expertJustification}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(item.capexUnitEur, language)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(item.opexMonthlyUnitEur, language)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.capexTotalEur, language)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.opexMonthlyTotalEur, language)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        {item.source === "AUTO_QUALIFICATION" ? (
                          <>
                            <Sparkles className="w-3 h-3 text-blue-500" /> Auto
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Expert
                          </>
                        )}
                      </span>
                    </td>
                    {!readOnly && (
                      <td className="py-3 px-4 text-center">
                        {onDeleteItem && (
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
