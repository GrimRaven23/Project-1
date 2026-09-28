import React from "react";
import { cn } from "@/lib/utils";
import { TelecomDomain, CaseLifecycleState, QualificationStatus, PriorityLevel } from "@/core/domain/types";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  domain?: TelecomDomain;
  status?: CaseLifecycleState | QualificationStatus;
  priority?: PriorityLevel;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  domain,
  status,
  priority,
  children,
  ...props
}) => {
  let customClass = "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300";

  if (domain === "TELEPHONY") customClass = "badge-telephony";
  else if (domain === "NETWORK_SDWAN") customClass = "badge-network";
  else if (domain === "WIFI") customClass = "badge-wifi";
  else if (domain === "CYBERSECURITY_FIREWALL") customClass = "badge-security";
  else if (domain === "SOLUTIONS_ARCHITECT") customClass = "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300";

  if (status === "AVAILABLE" || status === "APPROVED" || status === "WON" || status === "QUALIFICATION_COMPLETE") {
    customClass = "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300";
  } else if (status === "REQUIRES_EXPERT_VALIDATION" || status === "EXPERT_REVIEW_REQUIRED" || status === "EXPERT_REVIEW_IN_PROGRESS") {
    customClass = "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse";
  } else if (status === "REPLACEMENT_RECOMMENDED" || status === "RENEWAL_REQUIRED") {
    customClass = "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300";
  } else if (status === "INCOMPATIBLE" || status === "LOST" || status === "CANCELLED") {
    customClass = "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300";
  }

  if (priority === "URGENT") customClass = "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 font-bold";
  else if (priority === "HIGH") customClass = "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-2xs transition-colors",
        customClass,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
