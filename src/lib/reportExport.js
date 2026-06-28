import jsPDF from "jspdf";
import { format } from "date-fns";
import { getActiveSections, getClaimOverview } from "./reportContent";

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
  const sections = getActiveSections(review);
  const overview = getClaimOverview(review);

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const tocItems = [];
  if (overview.length > 0) tocItems.push({ title: "Claim Overview", page: 0 });
  sections.forEach((s) => tocItems.push({ title: s.title, page: 0 }));
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
  doc.rect(0, 0, pageWidth, 95, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("ClaimIntel", margin, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Claims Intelligence Report", margin, 60);
  doc.setFillColor(245, 166, 35);
  doc.rect(margin, 70, 40, 2.5, "F");

  y = 130;

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
  if (review.confidence_level) meta.push(`Confidence Level: ${review.confidence_level}`);
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
  sections.forEach((s, idx) => {
    const tocIdx = overview.length > 0 ? idx + 1 : idx;
    if (hasTOC) tocItems[tocIdx].page = doc.internal.getNumberOfPages();
    addHeading(s.title);
    addBodyText(s.content);
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
  const sections = getActiveSections(review);
  const overview = getClaimOverview(review);

  const overviewRows = overview
    .map((f) => `<tr><td class="lbl">${f.label}</td><td>${f.value}</td></tr>`)
    .join("");

  const tocItems = [];
  if (overview.length > 0) tocItems.push("Claim Overview");
  sections.forEach((s) => tocItems.push(s.title));
  const tocHtml = tocItems.length > 3
    ? `<h2>Table of Contents</h2><ol>${tocItems.map((t) => `<li>${t}</li>`).join("")}</ol>`
    : "";

  const sectionHtml = sections
    .map((s) => `<h2>${s.title}</h2>${markdownToHtml(s.content)}`)
    .join("");

  const metaLines = [
    `<p><strong>Claim Number:</strong> ${review.claim_number || "N/A"}</p>`,
    `<p><strong>Date of Loss:</strong> ${review.date_of_loss || "N/A"}</p>`,
    `<p><strong>Jurisdiction:</strong> ${review.jurisdiction || "N/A"}</p>`,
    `<p><strong>Line of Business:</strong> ${review.line_of_business || "N/A"}</p>`,
    `<p><strong>Report Generated:</strong> ${nowFormatted()}</p>`,
    `<p><strong>Prepared by:</strong> ClaimIntel AI</p>`,
  ];
  if (review.confidence_level) metaLines.push(`<p><strong>Confidence Level:</strong> ${review.confidence_level}</p>`);
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
  const sections = getActiveSections(review);
  const overview = getClaimOverview(review);
  const sep = "=".repeat(60);

  let text = `${sep}\n`;
  text += "CLAIMINTEL — CLAIMS INTELLIGENCE REPORT\n";
  text += `${sep}\n\n`;
  text += `Claim Name: ${review.claim_name || "N/A"}\n`;
  text += `Claim Number: ${review.claim_number || "N/A"}\n`;
  text += `Date of Loss: ${review.date_of_loss || "N/A"}\n`;
  text += `Jurisdiction: ${review.jurisdiction || "N/A"}\n`;
  text += `Line of Business: ${review.line_of_business || "N/A"}\n`;
  text += `Report Generated: ${nowFormatted()}\n`;
  text += `Prepared by: ClaimIntel AI\n`;
  if (review.confidence_level) text += `Confidence Level: ${review.confidence_level}\n`;
  if (review.venue_risk_level) text += `Venue Risk Level: ${review.venue_risk_level}\n`;
  if (review.liability_allocation_summary) text += `Liability Allocation: ${review.liability_allocation_summary}\n`;
  text += `\nGenerated with ClaimIntel Beta\n`;

  if (overview.length > 0) {
    text += `\n${sep}\nCLAIM OVERVIEW\n${sep}\n\n`;
    overview.forEach((f) => {
      text += `  ${f.label}: ${f.value}\n`;
    });
  }

  if (sections.length > 3) {
    text += `\n${sep}\nTABLE OF CONTENTS\n${sep}\n\n`;
    let num = 1;
    if (overview.length > 0) text += `  ${num++}. Claim Overview\n`;
    sections.forEach((s) => {
      text += `  ${num++}. ${s.title}\n`;
    });
  }

  sections.forEach((s) => {
    text += `\n${sep}\n${s.title.toUpperCase()}\n${sep}\n\n`;
    text += `${stripMarkdown(s.content)}\n`;
  });

  text += `\n${sep}\n`;
  text += "DISCLAIMER: This report was generated by ClaimIntel Beta for educational and portfolio purposes only. Analysis is based solely on information contained within the uploaded claim file and supporting documents. It is not legal advice and should not be used for actual claims handling decisions.\n";

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ClaimIntel_Report_${review.claim_number || "report"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}