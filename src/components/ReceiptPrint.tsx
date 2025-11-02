import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas"; 
export interface ReceiptItem {
  code?: string;
  description?: string;
  qty?: number | string;
  price?: number | string;
  subtotal?: number | string;
  vat?: string;
  total?: number | string;
}

export interface ReceiptPayload {
  issuer_name?: string;
  issuer_afm?: string;
  issuer_profession?: string;
  issuer_doy?: string;
  issuer_address?: string;
  receipt_series?: string;
  receipt_number?: string;
  receipt_date?: string;
  payment_method?: string;
  mark_code?: string;
  customer_afm?: string;
  customer_name?: string;
  customer_address?: string;
  items?: ReceiptItem[];
  total_amount?: number | string;
  notes?: string;
}

/** Utility: format number/currency for el-GR */
function formatCurrency(n: unknown): string {
  if (n == null) return "0,00";
  const num = typeof n === "string" ? Number(n) : (n as number);
  if (Number.isNaN(num)) return "0,00";
  return num.toLocaleString("el-GR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Build the printable HTML string (embedded CSS) */
function buildReceiptHtml(data: Partial<ReceiptPayload>): string {
  const items = data.items ?? [];
  const itemsRows = items
    .map(
      (it) => `
      <tr>
        <td class="code">${it.code ?? ""}</td>
        <td class="desc">${it.description ?? ""}</td>
        <td class="qty">${it.qty ?? ""}</td>
        <td class="price">${formatCurrency(it.price)}</td>
        <td class="subtotal">${formatCurrency(it.subtotal)}</td>
        <td class="vat">${it.vat ?? ""}</td>
        <td class="total">${formatCurrency(it.total)}</td>
      </tr>
    `
    )
    .join("");

  const html = `<!doctype html>
  <html lang="el">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>ΑΠΥ - Απόδειξη Παροχής Υπηρεσιών</title>
    <style>
      :root{
        --accent:#0b5fff;
        --muted:#666;
        --border:#ddd;
        --bg:#ffffff;
        --paper-width:210mm;
      }
      html,body{margin:0;padding:0;background:var(--bg);font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#111}
      .page{width:calc(var(--paper-width) - 40px); margin:20px auto; padding:20px; box-shadow:0 2px 12px rgba(10,10,10,0.08); border-radius:8px}
      header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid var(--accent);padding-bottom:12px;margin-bottom:18px}
      .brand{font-size:18px;font-weight:700;color:var(--accent)}
      .meta{font-size:12px;color:var(--muted);text-align:right}
      .section{margin-bottom:14px}
      table{width:100%;border-collapse:collapse}
      th,td{padding:8px;border:1px solid var(--border);font-size:13px}
      th{background:#fafbff;text-align:left;font-weight:600}
      td.right{text-align:right}
      tbody tr:nth-child(even){background:#fbfbfb}
      .totals{display:flex;justify-content:flex-end;margin-top:12px}
      .totals .box{min-width:260px}
      .totals .label{display:flex;justify-content:space-between;padding:6px 10px}
      .totals .label strong{font-size:14px}
      .small{font-size:12px;color:var(--muted)}
      .footer{margin-top:26px;text-align:center;font-size:12px;color:var(--muted)}
      @media print{
        body{background:transparent}
        .page{box-shadow:none;border-radius:0;margin:0;width:100%}
        header{border-bottom:1px solid #ccc}
        .no-print{display:none}
      }
      td.code{width:8%}
      td.qty{width:8%;text-align:center}
      td.price, td.subtotal, td.total, td.vat{width:12%;text-align:right}
      td.desc{width:40%}
    </style>
  </head>
  <body>
    <div class="page">
      <header>
        <div>
          <div class="brand">${data.issuer_name ?? ""}</div>
          <div class="small">${data.issuer_profession ?? ""} • ${data.issuer_doy ?? ""}</div>
          <div class="small">${data.issuer_address ?? ""}</div>
          <div class="small">Α.Φ.Μ.: ${data.issuer_afm ?? ""}</div>
        </div>
        <div class="meta">
          <div><strong>ΑΠΥ</strong></div>
          <div>Σειρά: ${data.receipt_series ?? ""}</div>
          <div>Α.Α.: ${data.receipt_number ?? ""}</div>
          <div>Ημερομηνία: ${data.receipt_date ?? ""}</div>
          <div>Τρόπος Πληρωμής: ${data.payment_method ?? ""}</div>
        </div>
      </header>

      <section class="section">
        <strong>Στοιχεία Πελάτη</strong>
        <div class="small">Α.Φ.Μ.: ${data.customer_afm ?? ""}</div>
        <div>${data.customer_name ?? ""}</div>
        <div class="small">${data.customer_address ?? ""}</div>
      </section>

      <section class="section">
        <table>
          <thead>
            <tr>
              <th>Κωδ.</th>
              <th>Περιγραφή</th>
              <th>Ποσότητα</th>
              <th>Τιμή (€)</th>
              <th>Αξία (€)</th>
              <th>ΦΠΑ</th>
              <th>Τελ. Αξία (€)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </section>

      <div class="totals">
        <div class="box">
          <div class="label"><span class="small">Πληρωτέο (€)</span><strong>${formatCurrency(data.total_amount)}</strong></div>
          <div class="label"><span class="small">MARK</span><span>${data.mark_code ?? ""}</span></div>
        </div>
      </div>

      <div class="footer">
        Παρατηρήσεις: ${data.notes ?? ""} <br>
        Σελίδα 1 από 1
      </div>
    </div>
  </body>
  </html>`;

  return html;
}

/**
 * Opens a new window with the receipt HTML and triggers print().
 * Safe-guards included for SSR and popup blocking.
 */
// optional, if you want HTML to PDF

export async function printReceipt(data?: Partial<ReceiptPayload>): Promise<void> {
  if (typeof window === "undefined") return;

  const html = buildReceiptHtml(data ?? {});

  // Create a hidden div to render the HTML
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Receipt_${data?.receipt_number || Date.now()}.pdf`);
  } catch (err) {
    console.error("Failed to generate PDF", err);
    alert("Failed to generate receipt. Try again.");
  } finally {
    // Cleanup
    document.body.removeChild(container);
  }
}


/** React preview component (in-app preview + optional print button) */
const ReceiptPrint: React.FC<{ data?: Partial<ReceiptPayload>; showPrintButton?: boolean }> = ({
  data = {},
  showPrintButton = true,
}) => {
  const items = data.items ?? [];
  return (
    <div style={{ maxWidth: 900, margin: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>ΑΠΥ — Απόδειξη Παροχής Υπηρεσιών</h2>
        {showPrintButton && (
          <div>
            <button
              onClick={() => printReceipt(data)}
              style={{ background: "#0b5fff", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 6, cursor: "pointer" }}
            >
              Εκτύπωση / Print
            </button>
          </div>
        )}
      </div>

      <div style={{ border: "1px solid #e6e9ef", padding: 18, borderRadius: 8, background: "#fff" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e6e9ef", paddingBottom: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, color: "#0b5fff" }}>{data.issuer_name}</div>
            <div style={{ color: "#666", fontSize: 13 }}>{data.issuer_profession} • {data.issuer_doy}</div>
            <div style={{ color: "#666", fontSize: 13 }}>{data.issuer_address}</div>
            <div style={{ color: "#666", fontSize: 13 }}>Α.Φ.Μ.: {data.issuer_afm}</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 13, color: "#333" }}>
            <div style={{ fontWeight: 700 }}>ΑΠΥ</div>
            <div>Σειρά: {data.receipt_series}</div>
            <div>Α.Α.: {data.receipt_number}</div>
            <div>Ημερομηνία: {data.receipt_date}</div>
            <div>Τρόπος Πληρωμής: {data.payment_method}</div>
          </div>
        </header>

        <section style={{ marginBottom: 12 }}>
          <strong>Στοιχεία Πελάτη</strong>
          <div style={{ color: "#666", fontSize: 13 }}>Α.Φ.Μ.: {data.customer_afm}</div>
          <div>{data.customer_name}</div>
          <div style={{ color: "#666", fontSize: 13 }}>{data.customer_address}</div>
        </section>

        <section>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafbff" }}>
                <th style={{ padding: 8, border: "1px solid #eee", textAlign: "left" }}>Κωδ.</th>
                <th style={{ padding: 8, border: "1px solid #eee", textAlign: "left" }}>Περιγραφή</th>
                <th style={{ padding: 8, border: "1px solid #eee", textAlign: "center" }}>Ποσότητα</th>
                <th style={{ padding: 8, border: "1px solid #eee", textAlign: "right" }}>Τιμή (€)</th>
                <th style={{ padding: 8, border: "1px solid #eee", textAlign: "right" }}>Αξία (€)</th>
                <th style={{ padding: 8, border: "1px solid #eee", textAlign: "right" }}>ΦΠΑ</th>
                <th style={{ padding: 8, border: "1px solid #eee", textAlign: "right" }}>Τελ. Αξία (€)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} style={{ background: idx % 2 ? "#fbfbfb" : "transparent" }}>
                  <td style={{ padding: 8, border: "1px solid #f0f0f0", width: "8%" }}>{it.code}</td>
                  <td style={{ padding: 8, border: "1px solid #f0f0f0" }}>{it.description}</td>
                  <td style={{ padding: 8, border: "1px solid #f0f0f0", textAlign: "center", width: "8%" }}>{it.qty}</td>
                  <td style={{ padding: 8, border: "1px solid #f0f0f0", textAlign: "right", width: "12%" }}>{formatCurrency(it.price)}</td>
                  <td style={{ padding: 8, border: "1px solid #f0f0f0", textAlign: "right", width: "12%" }}>{formatCurrency(it.subtotal)}</td>
                  <td style={{ padding: 8, border: "1px solid #f0f0f0", textAlign: "right", width: "12%" }}>{it.vat}</td>
                  <td style={{ padding: 8, border: "1px solid #f0f0f0", textAlign: "right", width: "12%" }}>{formatCurrency(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <div style={{ minWidth: 260, borderTop: "1px dashed #eee", paddingTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 4px" }}>
              <div style={{ color: "#666" }}>Πληρωτέο (€)</div>
              <div style={{ fontWeight: 700 }}>{formatCurrency(data.total_amount)}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 4px" }}>
              <div style={{ color: "#666" }}>MARK</div>
              <div>{data.mark_code}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, color: "#666", fontSize: 13, textAlign: "center" }}>
          Παρατηρήσεις: {data.notes ?? "-"}<br />Σελίδα 1 από 1
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrint;
