"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Calendar,
  Download,
  FileSpreadsheet,
  FileType,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, formatPrice, formatDate } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: typeof FileText;
  lastGenerated: string;
}

const REPORT_TYPES: ReportType[] = [
  {
    id: "sales",
    name: "Sales Report",
    description: "Daily, weekly, monthly sales breakdown by product and category",
    icon: TrendingUp,
    lastGenerated: "5 hours ago",
  },
  {
    id: "revenue",
    name: "Revenue Report",
    description: "Gross/net revenue with refunds, fees, and tax breakdown",
    icon: FileText,
    lastGenerated: "1 day ago",
  },
  {
    id: "customer",
    name: "Customer Report",
    description: "New vs returning customers, LTV, cohort analysis",
    icon: FileText,
    lastGenerated: "3 hours ago",
  },
  {
    id: "product",
    name: "Product Report",
    description: "Best/worst sellers, inventory, sales velocity",
    icon: FileText,
    lastGenerated: "12 hours ago",
  },
  {
    id: "iptv",
    name: "IPTV Usage Report",
    description: "Channel views, server load, viewer retention",
    icon: FileText,
    lastGenerated: "1 day ago",
  },
  {
    id: "subscription",
    name: "Subscription Report",
    description: "MRR, ARR, churn, retention, plan distribution",
    icon: FileText,
    lastGenerated: "2 days ago",
  },
  {
    id: "affiliate",
    name: "Affiliate Report",
    description: "Affiliate performance, conversions, payouts",
    icon: FileText,
    lastGenerated: "1 week ago",
  },
  {
    id: "tax",
    name: "Tax Report",
    description: "VAT, GST, sales tax collected by region",
    icon: FileText,
    lastGenerated: "4 hours ago",
  },
  {
    id: "refund",
    name: "Refund Report",
    description: "Refunds issued, reasons, chargeback analysis",
    icon: FileText,
    lastGenerated: "2 hours ago",
  },
];

/** Convert data to CSV and trigger download */
function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) {
    toast.error("No data to export");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val === null || val === undefined ? "" : String(val);
          // Escape quotes and wrap in quotes if contains comma/quote/newline
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Export to Excel-compatible format (HTML table with .xls extension) */
function exportToExcel(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) {
    toast.error("No data to export");
    return;
  }
  const headers = Object.keys(rows[0]);
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"></head>
    <body>
      <table border="1">
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${headers
                  .map((h) => `<td>${row[h] ?? ""}</td>`)
                  .join("")}</tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Export to PDF (opens print dialog) */
function exportToPDF(title: string, rows: Record<string, any>[]) {
  if (!rows.length) {
    toast.error("No data to export");
    return;
  }
  const headers = Object.keys(rows[0]);
  const win = window.open("", "_blank");
  if (!win) {
    toast.error("Popup blocked — allow popups to export PDF");
    return;
  }
  win.document.write(`
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1 { font-size: 20px; margin-bottom: 10px; }
      .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
      th { background: #f5f5f5; font-weight: bold; }
      tr:nth-child(even) { background: #fafafa; }
    </style>
    </head><body>
    <h1>PlayBeat Digital — ${title}</h1>
    <div class="meta">Generated: ${new Date().toLocaleString()}</div>
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows
          .map(
            (row) =>
              `<tr>${headers
                .map((h) => `<td>${row[h] ?? ""}</td>`)
                .join("")}</tr>`,
          )
          .join("")}
      </tbody>
    </table>
    </body></html>
  `);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

export function AdminReports() {
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [generating, setGenerating] = React.useState<string | null>(null);

  // Fetch real data for reports
  const { data: dash } = useQuery({
    queryKey: ["report-analytics"],
    queryFn: () => api.analytics(),
    staleTime: 60_000,
  });
  const { data: ordersData } = useQuery({
    queryKey: ["report-orders"],
    queryFn: () => api.adminOrders(),
    staleTime: 60_000,
  });
  const { data: usersData } = useQuery({
    queryKey: ["report-users"],
    queryFn: () => api.adminUsers(),
    staleTime: 60_000,
  });
  const { data: productsData } = useQuery({
    queryKey: ["report-products"],
    queryFn: () => api.products({ limit: 48 }),
    staleTime: 60_000,
  });

  const summary = dash?.summary;
  const orders = ordersData?.items || [];
  const users = usersData?.items || [];
  const products = productsData?.items || [];

  const generateReport = (reportId: string, format: "csv" | "excel" | "pdf") => {
    setGenerating(reportId);
    try {
      let rows: Record<string, any>[] = [];
      let filename = "";

      switch (reportId) {
        case "sales": {
          rows = orders.map((o) => ({
            OrderNumber: o.orderNumber,
            Date: formatDate(o.createdAt),
            Status: o.status,
            Subtotal: o.subtotal,
            Discount: o.discount,
            Total: o.total,
            Currency: "USD",
            Items: o.items.length,
            PaymentProvider: o.provider || "—",
          }));
          filename = "sales_report";
          break;
        }
        case "revenue": {
          rows = [
            {
              Metric: "Gross Revenue",
              Value: summary?.revenue || 0,
              Currency: "USD",
            },
            { Metric: "Total Orders", Value: summary?.orders || 0, Currency: "—" },
            {
              Metric: "Average Order Value",
              Value: summary?.aov || 0,
              Currency: "USD",
            },
            {
              Metric: "Conversion Rate",
              Value: `${summary?.conversionRate || 0}%`,
              Currency: "—",
            },
            {
              Metric: "Refunded",
              Value: orders
                .filter((o) => o.status === "REFUNDED")
                .reduce((s, o) => s + o.total, 0),
              Currency: "USD",
            },
            {
              Metric: "Net Revenue",
              Value:
                (summary?.revenue || 0) -
                orders
                  .filter((o) => o.status === "REFUNDED")
                  .reduce((s, o) => s + o.total, 0),
              Currency: "USD",
            },
          ];
          filename = "revenue_report";
          break;
        }
        case "customer": {
          rows = users.map((u) => ({
            Name: u.name,
            Email: u.email,
            Role: u.role,
            Verified: u.verified ? "Yes" : "No",
            Orders: u.orderCount,
            Reviews: u.reviewCount,
            Joined: formatDate(u.createdAt),
            Vendor: u.vendor?.storeName || "—",
            AffiliateCode: u.affiliate?.code || "—",
          }));
          filename = "customer_report";
          break;
        }
        case "product": {
          rows = products.map((p) => ({
            Title: p.title,
            Type: p.type,
            Price: p.priceFormatted || p.effectivePrice,
            Vendor: p.vendor?.storeName || "—",
            Rating: p.rating,
            Reviews: p.reviewCount,
            Sales: p.salesCount,
            Status: p.status,
          }));
          filename = "product_report";
          break;
        }
        case "iptv": {
          rows = [
            { Metric: "Total Channels", Value: 0, Note: "IPTV not configured" },
            { Metric: "Active Viewers", Value: 0, Note: "—" },
            { Metric: "Server Load", Value: "0%", Note: "—" },
            { Metric: "Avg Watch Time", Value: "0 min", Note: "—" },
          ];
          filename = "iptv_usage_report";
          break;
        }
        case "subscription": {
          rows = [
            { Metric: "MRR (Monthly Recurring Revenue)", Value: "—", Note: "No subscription data" },
            { Metric: "ARR (Annual Recurring Revenue)", Value: "—", Note: "—" },
            { Metric: "Active Subscriptions", Value: 0, Note: "—" },
            { Metric: "Churn Rate", Value: "0%", Note: "—" },
          ];
          filename = "subscription_report";
          break;
        }
        case "affiliate": {
          rows = [
            {
              Metric: "Total Affiliates",
              Value: users.filter((u) => u.affiliate).length,
            },
            {
              Metric: "Total Clicks",
              Value: 1840,
              Note: "From demo data",
            },
            {
              Metric: "Conversions",
              Value: 312,
              Note: "From demo data",
            },
            {
              Metric: "Total Earnings",
              Value: "$8,420.50",
              Note: "From demo data",
            },
          ];
          filename = "affiliate_report";
          break;
        }
        case "tax": {
          rows = orders.map((o) => ({
            OrderNumber: o.orderNumber,
            Date: formatDate(o.createdAt),
            Total: o.total,
            TaxRate: "0%",
            TaxCollected: 0,
            Region: "Pakistan",
            Currency: "PKR",
          }));
          filename = "tax_report";
          break;
        }
        case "refund": {
          rows = orders
            .filter((o) => o.status === "REFUNDED")
            .map((o) => ({
              OrderNumber: o.orderNumber,
              Date: formatDate(o.createdAt),
              RefundAmount: o.total,
              Reason: "Customer request",
              PaymentProvider: o.provider || "—",
            }));
          if (!rows.length) {
            rows = [{ Message: "No refunds issued" }];
          }
          filename = "refund_report";
          break;
        }
      }

      const reportName =
        REPORT_TYPES.find((r) => r.id === reportId)?.name || "Report";

      if (format === "csv") {
        exportToCSV(filename, rows);
      } else if (format === "excel") {
        exportToExcel(filename, rows);
      } else {
        exportToPDF(reportName, rows);
      }
      toast.success(`${reportName} exported as ${format.toUpperCase()}`);
    } catch (e) {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(null);
    }
  };

  const exportAll = () => {
    REPORT_TYPES.forEach((r, i) => {
      setTimeout(() => generateReport(r.id, "csv"), i * 300);
    });
    toast.success("Exporting all reports as CSV...");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
          <FileText className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate and export detailed business reports
          </p>
        </div>
        <Button variant="outline" className="border-white/10 bg-white/5" onClick={exportAll}>
          <Download className="size-4" /> Export All
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Reports Generated (30d)", value: "148", icon: FileText, color: "text-blue-400" },
          { label: "Scheduled", value: "12", icon: Calendar, color: "text-purple-400" },
          { label: "Scheduled Failed", value: "2", icon: RefreshCw, color: "text-red-400" },
          { label: "Total Exports", value: "384", icon: Download, color: "text-green-400" },
        ].map((s) => (
          <Card key={s.label} className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <s.icon className="size-3.5" /> {s.label}
              </div>
              <p className={cn("mt-1 text-2xl font-bold", s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom report config */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="size-4" /> Report Configuration
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Set date range and output format for batch exports
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-white/10 bg-white/5"
              />
            </div>
            <Button onClick={exportAll} className="gap-2">
              <Download className="size-4" /> Export All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {REPORT_TYPES.map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="group border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:border-blue-500/30">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 place-items-center rounded-lg bg-blue-500/10">
                      <report.icon className="size-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">{report.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {report.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Last generated */}
                <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="size-3" />
                  Last: {report.lastGenerated}
                </div>

                {/* Export buttons */}
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10"
                    disabled={generating === report.id}
                    onClick={() => generateReport(report.id, "pdf")}
                  >
                    <FileType className="size-3.5" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-green-500/20 bg-green-500/5 text-green-400 hover:bg-green-500/10"
                    disabled={generating === report.id}
                    onClick={() => generateReport(report.id, "excel")}
                  >
                    <FileSpreadsheet className="size-3.5" /> Excel
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10"
                    disabled={generating === report.id}
                    onClick={() => generateReport(report.id, "csv")}
                  >
                    <Download className="size-3.5" /> CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
