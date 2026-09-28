"use client";

import React, { useState } from "react";
import { DatabaseRepository } from "@/core/storage/database";
import { useI18n } from "@/lib/i18n/context";
import { Users, Building2, Phone, Mail, MapPin } from "lucide-react";

export default function CustomersPage() {
  const { t } = useI18n();
  const customers = DatabaseRepository.getCustomers();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          {t.navigation.customers}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Enterprise accounts, primary technical contacts, and account manager assignments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded">
                  {c.industrySegment}
                </span>
                <span className="text-[11px] font-mono text-slate-400">{c.sirenOrVat}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{c.companyName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Commercial Owner: {c.accountManagerName}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <p className="font-bold text-slate-900 dark:text-slate-100">{c.primaryContact.name}</p>
              <p className="text-[11px] text-slate-500">{c.primaryContact.position}</p>
              <div className="flex items-center gap-2 pt-1">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>{c.primaryContact.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                <span>{c.primaryContact.phone}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
