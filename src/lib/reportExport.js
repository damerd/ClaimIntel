import jsPDF from "jspdf";
import { format } from "date-fns";
import { buildReportModel, buildReportText } from "./reportContent";

function nowFormatted() {
  return format(new Date(), "MMMM d, yyyy 'at' h:mm a");
}

function stripMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "  • ")
    .replace(/^---+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function markdownToHtml(text) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^# (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #ccc;margin:12px 0;">');
  html = html.replace(/^[-*] (.+)$/gm, '<div style="margin-left:20px;text-indent:-15px;">• $1</div>');
  html = html.replace(/^\d+\. (.+)$/gm, '<div style="margin-left:25px;text-indent:-20px;">$1</div>');
  html = html.replace(/\n\n/g, "</p><p>");
  html = html.replace(/\n/g, "<br>");
  return "<p>" + html + "</p>";
}

// ====================== PDF EXPORT ======================
export function exportAsPDF(review) {
  const reportModel = buildReportModel(review);
  const sections = reportModel.sections;
  const overview = reportModel.overview;

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Draw the ClaimIntel layered-C logo mark (three concentric C arcs)
  const drawLogoMark = (cx, cy, scale) => {
    const drawArc = (radius, r, g, b) => {
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(3 * scale);
      let prevX = null, prevY2 = null;
      for (let a = 315; a >= 45; a -= 2) {
        const rad = (a * Math.PI) / 180;
        const x = cx + radius * Math.cos(rad);
        const yy = cy + radius * Math.sin(rad);
        if (prevX !== null) doc.line(prevX, prevY2, x, yy);
        prevX = x;
        prevY2 = yy;
      }
    };
    drawArc(16 * scale, 255, 255, 255); // outer — white on navy
    drawArc(11 * scale, 148, 163, 184); // middle — slate
    drawArc(6 * scale, 13, 148, 136); // inner — teal
  };

  const readiness = reportModel.readiness;
  const hasReadiness = readiness != null;

  const renderItems = [];
  sections.forEach((s) => {
    renderItems.push({ type: "section", key: s.key, title: s.title, content: s.content });
    if (hasReadiness && s.key === "executive_summary") {
      renderItems.push({ type: "readiness", title: "Claim Readiness", data: readiness });
    }
  });

  const tocItems = [];
  if (overview.length > 0) tocItems.push({ title: "Claim Overview", page: 0 });
  renderItems.forEach((item) => tocItems.push({ title: item.title, page: 0 }));
  const hasTOC = tocItems.length > 3;

  const addFooter = () => {
    const pageNum = doc.internal.getNumberOfPages();
    // Watermark
    doc.saveGraphicsState();
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(40);
    doc.setFont("helvetica", "bold");
    doc.text("BETA", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 });
    doc.restoreGraphicsState();

    // Footer line + text
    doc.setDrawColor(210);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 32, pageWidth - margin, pageHeight - 32);
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.setFont("helvetica", "normal");
    doc.text("Generated with ClaimIntel Beta", margin, pageHeight - 20);
    doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 20, { align: "right" });
  };

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - margin - 32) {
      addFooter();
      doc.addPage();
      y = margin;
    }
  };

  const addHeading = (title) => {
    ensureSpace(44);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(26, 39, 68);
    doc.text(title, margin, y);
    y += 4;
    doc.setFillColor(245, 166, 35);
    doc.rect(margin, y, 30, 2, "F");
    y += 18;
  };

  const addBodyText = (text) => {
    const clean = stripMarkdown(text);
    const fontSize = 10;
    const lineHeight = fontSize * 1.5;
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(45);
    const paragraphs = clean.split("\n\n");
    for (const para of paragraphs) {
      const lines = doc.splitTextToSize(para, contentWidth);
      for (const line of lines) {
        ensureSpace(lineHeight);
        doc.text(line, margin, y);
        y += lineHeight;
      }
      y += 4;
    }
  };

  // === TITLE PAGE ===
  doc.setFillColor(26, 39, 68);
  doc.rect(0, 0, pageWidth, 100, "F");
  drawLogoMark(margin + 14, 45, 0.65);
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("ClaimIntel", margin + 36, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Claims Intelligence Report", margin + 36, 58);
  doc.setFontSize(8);
  doc.setTextColor(160);
  doc.text("Smarter Claims. Better Decisions.", margin + 36, 72);
  doc.setFillColor(245, 166, 35);
  doc.rect(margin + 36, 80, 40, 2.5, "F");

  y = 135;

  // Claim title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(26, 39, 68);
  doc.text(review.claim_name || "Untitled Claim", margin, y);
  y += 22;

  // Metadata
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(70);
  const meta = [
    `Claim Number: ${review.claim_number || "N/A"}`,
    `Date of Loss: ${review.date_of_loss || "N/A"}`,
    `Jurisdiction: ${review.jurisdiction || "N/A"}`,
    `Line of Business: ${review.line_of_business || "N/A"}`,
    `Report Generated: ${nowFormatted()}`,
    `Prepared by: ClaimIntel AI`,
  ];
  if (review.venue_risk_level) meta.push(`Venue Risk Level: ${review.venue_risk_level}`);
  if (review.liability_allocation_summary) meta.push(`Liability Allocation: ${review.liability_allocation_summary}`);
  meta.forEach((line) => {
    doc.text(line, margin, y);
    y += 15;
  });
  y += 16;

  // === TABLE OF CONTENTS ===
  let tocPage = 0;
  let tocY = 0;
  if (hasTOC) {
    tocPage = doc.internal.getNumberOfPages();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(26, 39, 68);
    doc.text("Table of Contents", margin, y);
    y += 4;
    doc.setFillColor(245, 166, 35);
    doc.rect(margin, y, 30, 2, "F");
    y += 20;
    tocY = y;
    y += tocItems.length * 16 + 16; // reserve space
  }

  // === CLAIM OVERVIEW TABLE ===
  if (overview.length > 0) {
    if (hasTOC) tocItems[0].page = doc.internal.getNumberOfPages();
    addHeading("Claim Overview");

    doc.setFontSize(9);
    for (let i = 0; i < overview.length; i++) {
      const field = overview[i];
      const valStr = String(field.value);
      const valLines = doc.splitTextToSize(valStr, contentWidth - 130);
      const rowH = Math.max(16, valLines.length * 12 + 6);

      ensureSpace(rowH);

      if (i % 2 === 0) {
        doc.setFillColor(248, 248, 250);
        doc.rect(margin, y - 11, contentWidth, rowH, "F");
      }
      doc.setDrawColor(220);
      doc.setLineWidth(0.5);
      doc.rect(margin, y - 11, contentWidth, rowH);
      doc.line(margin + 120, y - 11, margin + 120, y + rowH - 11);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(100);
      doc.text(field.label + ":", margin + 5, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(45);
      doc.text(valLines, margin + 128, y);
      y += rowH;
    }
    y += 16;
  }

  // === SECTIONS ===
  renderItems.forEach((item, idx) => {
    const tocIdx = overview.length > 0 ? idx + 1 : idx;
    if (hasTOC) tocItems[tocIdx].page = doc.internal.getNumberOfPages();
    addHeading(item.title);
    if (item.type === "readiness") {
      const r = item.data;
      addBodyText(`Overall Readiness: ${Math.round(r.score)}%`);
      if (r.categories && r.categories.length > 0) {
        addBodyText("Category Breakdown:");
        r.categories.forEach((cat) => {
          addBodyText(`  ${cat.category}: ${cat.status}`);
        });
      }
      if (r.missingRequirements && r.missingRequirements.length > 0) {
        addBodyText("Missing Requirements:");
        r.missingRequirements.forEach((req) => {
          addBodyText(`  \u2610 ${req}`);
        });
      }
      if (r.recommendation) {
        addBodyText("AI Recommendation:");
        addBodyText(r.recommendation);
      }
    } else {
      addBodyText(item.content);
    }
    y += 14;
  });

  // === FILL IN TOC PAGE NUMBERS ===
  if (hasTOC) {
    const lastPage = doc.internal.getNumberOfPages();
    doc.setPage(tocPage);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(70);
    tocItems.forEach((item, i) => {
      const itemY = tocY + i * 16;
      doc.text(item.title, margin, itemY);
      const titleWidth = doc.getTextWidth(item.title);
      const pageStr = String(item.page);
      const pageStrWidth = doc.getTextWidth(pageStr);
      const dotStart = margin + titleWidth + 5;
      const dotEnd = margin + contentWidth - pageStrWidth - 5;
      const dotCount = Math.max(0, Math.floor((dotEnd - dotStart) / 3));
      if (dotCount > 0) {
        doc.setTextColor(180);
        doc.text(".".repeat(dotCount), dotStart, itemY);
        doc.setTextColor(70);
      }
      doc.text(pageStr, margin + contentWidth, itemY, { align: "right" });
    });
    doc.setPage(lastPage);
  }

  addFooter();
  doc.save(`ClaimIntel_Report_${review.claim_number || "report"}.pdf`);
}

// ====================== WORD EXPORT ======================
export function exportAsWord(review) {
  const reportModel = buildReportModel(review);
  const sections = reportModel.sections;
  const overview = reportModel.overview;

  const overviewRows = overview
    .map((f) => `<tr><td class="lbl">${f.label}</td><td>${f.value}</td></tr>`)
    .join("");

  const readiness = reportModel.readiness;
  const hasReadiness = readiness != null;
  const tocItems = [];
  if (overview.length > 0) tocItems.push("Claim Overview");
  sections.forEach((s) => {
    tocItems.push(s.title);
    if (hasReadiness && s.key === "executive_summary") tocItems.push("Claim Readiness");
  });
  const tocHtml = tocItems.length > 3
    ? `<h2>Table of Contents</h2><ol>${tocItems.map((t) => `<li>${t}</li>`).join("")}</ol>`
    : "";

  const renderReadinessHtml = (r) => {
    let html = `<h2>Claim Readiness</h2>`;
    html += `<p><strong>Overall Readiness:</strong> ${Math.round(r.score)}%</p>`;
    if (r.categories && r.categories.length > 0) {
      html += `<p><strong>Category Breakdown:</strong></p>`;
      r.categories.forEach((cat) => {
        html += `<div style="margin-left:20px;">\u2022 ${cat.category}: ${cat.status}</div>`;
      });
    }
    if (r.missingRequirements && r.missingRequirements.length > 0) {
      html += `<p><strong>Missing Requirements:</strong></p>`;
      r.missingRequirements.forEach((req) => {
        html += `<div style="margin-left:20px;">\u2610 ${req}</div>`;
      });
    }
    if (r.recommendation) {
      html += `<p><strong>AI Recommendation:</strong> ${r.recommendation}</p>`;
    }
    return html;
  };

  const sectionHtml = sections
    .map((s) => {
      let html = `<h2>${s.title}</h2>${markdownToHtml(s.content)}`;
      if (hasReadiness && s.key === "executive_summary") {
        html += renderReadinessHtml(readiness);
      }
      return html;
    })
    .join("");

  const metaLines = [
    `<p><strong>Claim Number:</strong> ${review.claim_number || "N/A"}</p>`,
    `<p><strong>Date of Loss:</strong> ${review.date_of_loss || "N/A"}</p>`,
    `<p><strong>Jurisdiction:</strong> ${review.jurisdiction || "N/A"}</p>`,
    `<p><strong>Line of Business:</strong> ${review.line_of_business || "N/A"}</p>`,
    `<p><strong>Report Generated:</strong> ${nowFormatted()}</p>`,
    `<p><strong>Prepared by:</strong> ClaimIntel AI</p>`,
  ];
  if (review.venue_risk_level) metaLines.push(`<p><strong>Venue Risk Level:</strong> ${review.venue_risk_level}</p>`);
  if (review.liability_allocation_summary) metaLines.push(`<p><strong>Liability Allocation:</strong> ${review.liability_allocation_summary}</p>`);

  const html = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>ClaimIntel Report</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
@page Section1 { size: 8.5in 11in; margin: 1in; mso-footer-margin: .5in; }
div.Section1 { page: Section1; }
body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
.header { background-color: #1A2744; color: #fff; padding: 20px; margin-bottom: 4px; }
.header h1 { margin: 0; font-size: 22pt; }
.header .sub { font-size: 11pt; margin-top: 2px; color: #ccc; }
.header .accent { height: 3px; background-color: #F5A623; width: 40px; margin-top: 8px; }
.header .tagline { font-size: 9pt; margin-top: 4px; color: #0D9488; font-weight: 600; }
.meta { font-size: 10pt; color: #555; margin: 16px 0; }
.meta p { margin: 2px 0; }
h2 { color: #1A2744; font-size: 14pt; border-bottom: 2px solid #F5A623; padding-bottom: 4px; margin-top: 28px; }
h3 { color: #1A2744; font-size: 12pt; margin-top: 16px; }
table.ov { width: 100%; border-collapse: collapse; margin: 10px 0; }
table.ov td { padding: 6px 10px; border: 1px solid #ccc; font-size: 10pt; }
table.ov td.lbl { background-color: #f5f5f5; font-weight: bold; color: #666; width: 35%; }
ol { font-size: 11pt; color: #444; }
.watermark { position: fixed; top: 50%; left: 50%; margin-top: -100px; margin-left: -100px; font-size: 72pt; color: rgba(0,0,0,0.04); font-weight: bold; pointer-events: none; transform: rotate(-45deg); }
.footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 9pt; color: #999; text-align: center; }
</style>
</head>
<body>
<div class="Section1">
<div class="watermark">BETA</div>
<div class="header">
  <h1>ClaimIntel</h1>
  <div class="sub">Claims Intelligence Report</div>
  <div class="tagline">Smarter Claims. Better Decisions.</div>
  <div class="accent"></div>
</div>
<div class="meta">
  <p><strong>${review.claim_name || "Untitled Claim"}</strong></p>
  ${metaLines.join("")}
</div>
${tocHtml}
${overview.length > 0 ? `<h2>Claim Overview</h2><table class="ov">${overviewRows}</table>` : ""}
${sectionHtml}
<div class="footer">Generated with ClaimIntel Beta — This report is for educational and portfolio purposes only. Not legal advice.</div>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ClaimIntel_Report_${review.claim_number || "report"}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

// ====================== TEXT EXPORT ======================
export function exportAsText(review) {
  const text = buildReportText(review);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ClaimIntel_Report_${review.claim_number || "report"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}