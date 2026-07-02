const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CLMS User Manual</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',Arial,sans-serif;color:#1a1a2e;background:#fff;font-size:11pt;line-height:1.6}

  /* ── COVER ── */
  .cover{width:100%;height:100vh;background:linear-gradient(135deg,#0f3460 0%,#16213e 50%,#1a1a2e 100%);
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    color:#fff;text-align:center;page-break-after:always}
  .cover-logo{width:80px;height:80px;background:linear-gradient(135deg,#e94560,#0f3460);
    border-radius:20px;display:flex;align-items:center;justify-content:center;
    font-size:36px;margin:0 auto 24px;box-shadow:0 8px 32px rgba(233,69,96,.4)}
  .cover h1{font-size:42pt;font-weight:700;letter-spacing:-1px;margin-bottom:8px}
  .cover h2{font-size:16pt;font-weight:300;opacity:.8;margin-bottom:32px}
  .cover-badge{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);
    border-radius:50px;padding:8px 24px;font-size:10pt;opacity:.9;margin-bottom:16px}
  .cover-version{font-size:9pt;opacity:.5;margin-top:40px}
  .cover-lines{position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none}
  .cover-line{position:absolute;height:1px;background:rgba(255,255,255,.06);width:100%}

  /* ── TOC ── */
  .toc-page{padding:60px 80px;page-break-after:always;min-height:100vh}
  .toc-title{font-size:24pt;font-weight:700;color:#0f3460;border-bottom:3px solid #e94560;
    padding-bottom:12px;margin-bottom:32px}
  .toc-section{margin-bottom:4px}
  .toc-section a{display:flex;align-items:center;justify-content:space-between;
    padding:8px 12px;border-radius:8px;text-decoration:none;color:#1a1a2e;
    transition:background .2s}
  .toc-section a:hover{background:#f0f4ff}
  .toc-number{font-weight:700;color:#e94560;min-width:32px}
  .toc-name{flex:1;font-weight:500}
  .toc-dots{flex:1;border-bottom:1px dotted #ccc;margin:0 8px;height:12px}
  .toc-page-num{color:#666;font-size:10pt}
  .toc-group{font-size:9pt;font-weight:600;color:#888;text-transform:uppercase;
    letter-spacing:1px;margin:20px 0 6px;padding:0 12px}

  /* ── CHAPTER ── */
  .chapter{padding:50px 70px;page-break-before:always;min-height:100vh}
  .chapter-header{background:linear-gradient(135deg,#0f3460,#16213e);color:#fff;
    border-radius:16px;padding:28px 32px;margin-bottom:32px;position:relative;overflow:hidden}
  .chapter-header::after{content:'';position:absolute;right:-20px;top:-20px;
    width:120px;height:120px;background:rgba(233,69,96,.15);border-radius:50%}
  .chapter-num{font-size:10pt;font-weight:600;color:rgba(233,69,96,1);
    text-transform:uppercase;letter-spacing:2px;margin-bottom:6px}
  .chapter-title{font-size:22pt;font-weight:700;margin-bottom:6px}
  .chapter-desc{font-size:11pt;opacity:.8;font-weight:300}
  .chapter-badge{display:inline-block;background:rgba(233,69,96,.2);
    border:1px solid rgba(233,69,96,.4);color:#ff7c91;border-radius:20px;
    padding:2px 12px;font-size:9pt;margin-top:8px}

  /* ── SECTIONS ── */
  h3{font-size:14pt;font-weight:700;color:#0f3460;margin:28px 0 12px;
    display:flex;align-items:center;gap:8px}
  h3::before{content:'';display:inline-block;width:4px;height:18px;
    background:#e94560;border-radius:2px;flex-shrink:0}
  h4{font-size:11pt;font-weight:600;color:#333;margin:16px 0 8px}
  p{margin-bottom:10px;color:#333}

  /* ── UI MOCKUP ── */
  .mockup{background:#f8f9fc;border:1px solid #e2e8f0;border-radius:12px;
    overflow:hidden;margin:20px 0;box-shadow:0 2px 12px rgba(0,0,0,.06)}
  .mockup-bar{background:#fff;border-bottom:1px solid #e2e8f0;padding:10px 16px;
    display:flex;align-items:center;gap:8px}
  .mockup-dot{width:10px;height:10px;border-radius:50%}
  .mockup-title{font-size:9pt;color:#888;margin-left:8px;font-weight:500}
  .mockup-body{padding:16px 20px}

  /* ── TABLE ── */
  .data-table{width:100%;border-collapse:collapse;margin:16px 0;font-size:9.5pt}
  .data-table th{background:#0f3460;color:#fff;padding:8px 12px;text-align:left;font-weight:600;font-size:9pt}
  .data-table td{padding:7px 12px;border-bottom:1px solid #eef0f5;color:#444}
  .data-table tr:nth-child(even) td{background:#f8f9fc}
  .data-table tr:last-child td{border-bottom:none}

  /* ── TAGS / BADGES ── */
  .tag{display:inline-block;padding:2px 10px;border-radius:20px;font-size:8.5pt;
    font-weight:600;margin:1px}
  .tag-blue{background:#e6f4ff;color:#1677ff;border:1px solid #91caff}
  .tag-green{background:#f6ffed;color:#389e0d;border:1px solid #b7eb8f}
  .tag-orange{background:#fff7e6;color:#d46b08;border:1px solid #ffd591}
  .tag-red{background:#fff2f0;color:#cf1322;border:1px solid #ffb8b8}
  .tag-purple{background:#f9f0ff;color:#722ed1;border:1px solid #d3adf7}
  .tag-cyan{background:#e6fffb;color:#08979c;border:1px solid #87e8de}
  .tag-gold{background:#fffbe6;color:#d48806;border:1px solid #ffe58f}

  /* ── INFO BOXES ── */
  .info-box{border-left:4px solid #1677ff;background:#e6f4ff;border-radius:0 8px 8px 0;
    padding:12px 16px;margin:16px 0;font-size:10pt}
  .tip-box{border-left:4px solid #52c41a;background:#f6ffed;border-radius:0 8px 8px 0;
    padding:12px 16px;margin:16px 0;font-size:10pt}
  .warn-box{border-left:4px solid #faad14;background:#fffbe6;border-radius:0 8px 8px 0;
    padding:12px 16px;margin:16px 0;font-size:10pt}

  /* ── FEATURE GRID ── */
  .feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:16px 0}
  .feature-card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;
    padding:16px;box-shadow:0 1px 4px rgba(0,0,0,.04)}
  .feature-icon{font-size:20px;margin-bottom:8px}
  .feature-title{font-size:10pt;font-weight:700;color:#0f3460;margin-bottom:4px}
  .feature-desc{font-size:9pt;color:#666}

  /* ── STATUS FLOW ── */
  .flow{display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin:12px 0}
  .flow-step{background:#0f3460;color:#fff;padding:5px 14px;border-radius:20px;
    font-size:9pt;font-weight:600;white-space:nowrap}
  .flow-arrow{color:#e94560;font-size:12pt;font-weight:700}

  /* ── LIST ── */
  ul,ol{padding-left:20px;margin:8px 0}
  li{margin-bottom:4px;color:#444;font-size:10.5pt}
  li strong{color:#1a1a2e}

  /* ── FIELD ROW ── */
  .field-row{display:flex;align-items:flex-start;padding:7px 0;
    border-bottom:1px solid #f0f0f0;gap:16px;font-size:10pt}
  .field-name{font-weight:600;color:#0f3460;min-width:160px}
  .field-desc{color:#555;flex:1}
  .field-req{color:#e94560;font-size:9pt;font-weight:700;min-width:56px;text-align:right}

  /* ── SCREEN MOCKUP ── */
  .screen{background:#fff;border:2px solid #e2e8f0;border-radius:12px;overflow:hidden;
    margin:16px 0;font-size:9pt}
  .screen-topbar{background:#0f3460;color:#fff;padding:10px 16px;
    display:flex;align-items:center;justify-content:space-between}
  .screen-topbar-title{font-weight:600;font-size:10pt}
  .screen-topbar-actions{display:flex;gap:8px}
  .screen-btn{background:rgba(255,255,255,.15);border:none;color:#fff;
    padding:4px 12px;border-radius:6px;font-size:8.5pt;cursor:pointer}
  .screen-btn-primary{background:#e94560}
  .screen-content{padding:16px}
  .screen-filter-bar{background:#f8f9fc;border:1px solid #eee;border-radius:8px;
    padding:10px 14px;display:flex;gap:10px;margin-bottom:12px;align-items:center}
  .screen-input{border:1px solid #ddd;border-radius:6px;padding:4px 10px;
    font-size:9pt;color:#666;background:#fff;width:200px}
  .screen-select{border:1px solid #ddd;border-radius:6px;padding:4px 10px;
    font-size:9pt;color:#666;background:#fff}

  /* Sidebar nav mockup */
  .layout-mock{display:flex;border:2px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:16px 0}
  .sidebar-mock{background:#001529;width:140px;flex-shrink:0;padding:12px 0}
  .sidebar-item{padding:8px 16px;color:rgba(255,255,255,.65);font-size:8.5pt;
    display:flex;align-items:center;gap:8px}
  .sidebar-item.active{background:rgba(22,119,255,.15);color:#4096ff;border-right:3px solid #4096ff}
  .sidebar-section{padding:4px 16px;color:rgba(255,255,255,.3);font-size:7.5pt;
    text-transform:uppercase;letter-spacing:1px;margin-top:8px}
  .main-content-mock{flex:1;background:#f5f7fa;padding:16px}

  /* ── PAGE BREAKS ── */
  @media print{
    .chapter{page-break-before:always}
    .cover,.toc-page{page-break-after:always}
    .no-break{page-break-inside:avoid}
  }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════
     COVER PAGE
═══════════════════════════════════════════════════ -->
<div class="cover">
  <!-- Cortex AI Technologies logo -->
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
    <div style="width:6px;height:52px;background:#e94560;border-radius:2px;flex-shrink:0"></div>
    <div>
      <div style="font-size:30pt;font-weight:900;color:#fff;letter-spacing:2px;line-height:1">CORTEX</div>
      <div style="background:#1a1a1a;color:#fff;font-size:8pt;font-weight:700;letter-spacing:3px;padding:3px 10px;text-align:center;margin-top:3px">AI&nbsp;&nbsp;TECHNOLOGIES</div>
    </div>
  </div>

  <!-- CortexCLMS product logo -->
  <div style="margin:18px 0 6px;font-size:48pt;font-weight:900;letter-spacing:-1px;line-height:1">
    <span style="color:#fff">Cortex</span><span style="color:#00BFFF">CLMS</span>
  </div>

  <div class="cover-badge" style="margin-top:12px">Calibration Laboratory Management System</div>
  <h2 style="margin-top:10px">Complete User Manual</h2>
  <p style="opacity:.6;font-size:10pt;margin-top:8px">
    Covering all modules · Step-by-step guides · Role-based access · Admin configuration
  </p>

  <!-- Contact details -->
  <div style="margin-top:40px;display:flex;flex-direction:column;gap:6px;font-size:10pt;opacity:.85">
    <div>📞 &nbsp;+91 8329925318</div>
    <div>✉ &nbsp;cortexaitechnologies@zohomail.in</div>
    <div>📍 &nbsp;Pune, Maharashtra, India 411034</div>
  </div>

  <div class="cover-version" style="margin-top:30px">Version 1.0 &nbsp;|&nbsp; 2026 &nbsp;|&nbsp; All Rights Reserved</div>
</div>

<!-- ═══════════════════════════════════════════════════
     TABLE OF CONTENTS
═══════════════════════════════════════════════════ -->
<div class="toc-page">
  <div class="toc-title">Table of Contents</div>

  <div class="toc-group">Getting Started</div>
  <div class="toc-section"><a href="#ch1"><span class="toc-number">01</span><span class="toc-name">System Overview &amp; Login</span><span class="toc-dots"></span><span class="toc-page-num">4</span></a></div>
  <div class="toc-section"><a href="#ch2"><span class="toc-number">02</span><span class="toc-name">Dashboard</span><span class="toc-dots"></span><span class="toc-page-num">6</span></a></div>

  <div class="toc-group">Calibration Operations</div>
  <div class="toc-section"><a href="#ch3"><span class="toc-number">03</span><span class="toc-name">Jobs — Calibration Work Orders</span><span class="toc-dots"></span><span class="toc-page-num">8</span></a></div>
  <div class="toc-section"><a href="#ch4"><span class="toc-number">04</span><span class="toc-name">Certificates</span><span class="toc-dots"></span><span class="toc-page-num">12</span></a></div>
  <div class="toc-section"><a href="#ch5"><span class="toc-number">05</span><span class="toc-name">Instruments</span><span class="toc-dots"></span><span class="toc-page-num">14</span></a></div>
  <div class="toc-section"><a href="#ch6"><span class="toc-number">06</span><span class="toc-name">Reference Standards</span><span class="toc-dots"></span><span class="toc-page-num">15</span></a></div>
  <div class="toc-section"><a href="#ch7"><span class="toc-number">07</span><span class="toc-name">Calibration Masters</span><span class="toc-dots"></span><span class="toc-page-num">16</span></a></div>
  <div class="toc-section"><a href="#ch8"><span class="toc-number">08</span><span class="toc-name">Environmental Monitoring</span><span class="toc-dots"></span><span class="toc-page-num">17</span></a></div>

  <div class="toc-group">CRM &amp; Billing</div>
  <div class="toc-section"><a href="#ch9"><span class="toc-number">09</span><span class="toc-name">Customers</span><span class="toc-dots"></span><span class="toc-page-num">18</span></a></div>
  <div class="toc-section"><a href="#ch10"><span class="toc-number">10</span><span class="toc-name">Leads &amp; Sales Pipeline</span><span class="toc-dots"></span><span class="toc-page-num">20</span></a></div>
  <div class="toc-section"><a href="#ch11"><span class="toc-number">11</span><span class="toc-name">CRM Activities</span><span class="toc-dots"></span><span class="toc-page-num">21</span></a></div>
  <div class="toc-section"><a href="#ch12"><span class="toc-number">12</span><span class="toc-name">Quotations</span><span class="toc-dots"></span><span class="toc-page-num">22</span></a></div>
  <div class="toc-section"><a href="#ch13"><span class="toc-number">13</span><span class="toc-name">Invoices</span><span class="toc-dots"></span><span class="toc-page-num">23</span></a></div>
  <div class="toc-section"><a href="#ch14"><span class="toc-number">14</span><span class="toc-name">Purchase Orders</span><span class="toc-dots"></span><span class="toc-page-num">24</span></a></div>
  <div class="toc-section"><a href="#ch15"><span class="toc-number">15</span><span class="toc-name">Delivery Challans</span><span class="toc-dots"></span><span class="toc-page-num">25</span></a></div>

  <div class="toc-group">Quality &amp; Compliance</div>
  <div class="toc-section"><a href="#ch16"><span class="toc-number">16</span><span class="toc-name">NCR / CAPA (Quality)</span><span class="toc-dots"></span><span class="toc-page-num">26</span></a></div>
  <div class="toc-section"><a href="#ch17"><span class="toc-number">17</span><span class="toc-name">Complaints &amp; Feedback</span><span class="toc-dots"></span><span class="toc-page-num">27</span></a></div>
  <div class="toc-section"><a href="#ch18"><span class="toc-number">18</span><span class="toc-name">Lab Documents</span><span class="toc-dots"></span><span class="toc-page-num">28</span></a></div>
  <div class="toc-section"><a href="#ch19"><span class="toc-number">19</span><span class="toc-name">Internal Audit</span><span class="toc-dots"></span><span class="toc-page-num">29</span></a></div>

  <div class="toc-group">Administration</div>
  <div class="toc-section"><a href="#ch20"><span class="toc-number">20</span><span class="toc-name">Tasks</span><span class="toc-dots"></span><span class="toc-page-num">30</span></a></div>
  <div class="toc-section"><a href="#ch21"><span class="toc-number">21</span><span class="toc-name">Engineers</span><span class="toc-dots"></span><span class="toc-page-num">31</span></a></div>
  <div class="toc-section"><a href="#ch22"><span class="toc-number">22</span><span class="toc-name">Users &amp; Role Permissions</span><span class="toc-dots"></span><span class="toc-page-num">32</span></a></div>
  <div class="toc-section"><a href="#ch23"><span class="toc-number">23</span><span class="toc-name">Inventory</span><span class="toc-dots"></span><span class="toc-page-num">34</span></a></div>
  <div class="toc-section"><a href="#ch24"><span class="toc-number">24</span><span class="toc-name">Reports</span><span class="toc-dots"></span><span class="toc-page-num">35</span></a></div>
  <div class="toc-section"><a href="#ch25"><span class="toc-number">25</span><span class="toc-name">Notifications</span><span class="toc-dots"></span><span class="toc-page-num">36</span></a></div>
  <div class="toc-section"><a href="#ch26"><span class="toc-number">26</span><span class="toc-name">Admin Settings</span><span class="toc-dots"></span><span class="toc-page-num">37</span></a></div>
  <div class="toc-section"><a href="#ch27"><span class="toc-number">27</span><span class="toc-name">Customer Portal</span><span class="toc-dots"></span><span class="toc-page-num">40</span></a></div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 1 — SYSTEM OVERVIEW & LOGIN
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch1">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 01</div>
    <div class="chapter-title">System Overview &amp; Login</div>
    <div class="chapter-desc">Understanding CLMS architecture, roles, and first-time access</div>
  </div>

  <h3>What is CLMS?</h3>
  <p>CLMS (Calibration Laboratory Management System) is an integrated web-based platform designed for calibration laboratories. It covers the complete lifecycle — from receiving an instrument for calibration, assigning engineers, issuing certificates, billing customers, managing quality documents, and providing a self-service customer portal.</p>

  <div class="feature-grid">
    <div class="feature-card">
      <div class="feature-icon">🔬</div>
      <div class="feature-title">Calibration Operations</div>
      <div class="feature-desc">End-to-end job management, engineer assignment, datasheet capture, certificate generation</div>
    </div>
    <div class="feature-card">
      <div class="feature-icon">💼</div>
      <div class="feature-title">CRM &amp; Billing</div>
      <div class="feature-desc">Leads pipeline, quotations, invoices, purchase orders, delivery challans</div>
    </div>
    <div class="feature-card">
      <div class="feature-icon">✅</div>
      <div class="feature-title">Quality &amp; Compliance</div>
      <div class="feature-desc">NCR/CAPA tracking, complaints, document control, internal audits</div>
    </div>
    <div class="feature-card">
      <div class="feature-icon">🌐</div>
      <div class="feature-title">Customer Portal</div>
      <div class="feature-desc">Customers can view jobs, download certificates, and raise complaints online</div>
    </div>
  </div>

  <h3>Login Screen</h3>
  <div class="screen">
    <div class="screen-topbar">
      <span class="screen-topbar-title">🔬 CLMS — Calibration Laboratory Management System</span>
    </div>
    <div class="screen-content" style="display:flex;align-items:center;justify-content:center;padding:40px;background:#f5f7fa;min-height:200px">
      <div style="background:#fff;border-radius:16px;padding:32px 40px;width:360px;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:28px;margin-bottom:8px">🔬</div>
          <div style="font-size:13pt;font-weight:700;color:#0f3460">Sign In to CLMS</div>
          <div style="font-size:9pt;color:#888;margin-top:4px">Enter your credentials to continue</div>
        </div>
        <div style="margin-bottom:12px">
          <div style="font-size:9pt;font-weight:600;margin-bottom:4px;color:#333">Email Address</div>
          <div style="border:1px solid #d9d9d9;border-radius:8px;padding:8px 12px;font-size:9pt;color:#bbb">admin@lab.com</div>
        </div>
        <div style="margin-bottom:20px">
          <div style="font-size:9pt;font-weight:600;margin-bottom:4px;color:#333">Password</div>
          <div style="border:1px solid #d9d9d9;border-radius:8px;padding:8px 12px;font-size:9pt;color:#bbb">••••••••</div>
        </div>
        <div style="background:#0f3460;color:#fff;border-radius:8px;padding:10px;text-align:center;font-size:10pt;font-weight:600">Sign In</div>
        <div style="text-align:center;margin-top:14px;font-size:9pt;color:#888">
          Customer? <span style="color:#1677ff">Use the Customer Portal →</span>
        </div>
      </div>
    </div>
  </div>

  <h3>User Roles</h3>
  <p>Every user is assigned one of the following roles. Roles control which modules are visible and what actions are permitted.</p>
  <table class="data-table">
    <tr><th>Role</th><th>Description</th><th>Key Access</th></tr>
    <tr><td><span class="tag tag-red">LAB_ADMIN</span></td><td>Full system administrator</td><td>All modules, settings, user management</td></tr>
    <tr><td><span class="tag tag-blue">TECHNICAL_MANAGER</span></td><td>Technical head</td><td>Jobs, certificates, engineers, reports</td></tr>
    <tr><td><span class="tag tag-orange">QUALITY_MANAGER</span></td><td>Quality &amp; compliance head</td><td>NCR/CAPA, complaints, audits, documents</td></tr>
    <tr><td><span class="tag tag-purple">CALIBRATION_ENGINEER</span></td><td>Performs calibrations</td><td>Assigned jobs, datasheets, certificates</td></tr>
    <tr><td><span class="tag tag-cyan">SERVICE_ENGINEER</span></td><td>Field/onsite engineer</td><td>Onsite jobs, instruments</td></tr>
    <tr><td><span class="tag tag-green">DATA_ENTRY_OPERATOR</span></td><td>Data entry staff</td><td>Customers, instruments, basic data</td></tr>
  </table>

  <div class="info-box"><strong>Note:</strong> The LAB_ADMIN sets up the lab during initial registration and cannot be deleted. Additional users are created from <em>Administration → Users</em>.</div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 2 — DASHBOARD
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch2">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 02</div>
    <div class="chapter-title">Dashboard</div>
    <div class="chapter-desc">At-a-glance KPIs, alerts, and quick navigation</div>
  </div>

  <h3>Dashboard Overview</h3>
  <p>The Dashboard is the first screen after login. It shows real-time KPIs, upcoming due dates, overdue items, and recent activity so the lab manager can take immediate action without navigating through menus.</p>

  <div class="screen">
    <div class="screen-topbar">
      <span class="screen-topbar-title">📊 Dashboard</span>
      <div class="screen-topbar-actions">
        <span class="screen-btn">🔔 Notifications</span>
        <span class="screen-btn">👤 Admin</span>
      </div>
    </div>
    <div class="screen-content" style="background:#f5f7fa;padding:16px">
      <!-- KPI Row -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
        ${['🗂️ Active Jobs<br><b style="font-size:20pt;color:#1677ff">42</b><br><span style="font-size:8pt;color:#52c41a">↑ 8 this week</span>',
          '📋 Pending Review<br><b style="font-size:20pt;color:#faad14">7</b><br><span style="font-size:8pt;color:#888">Awaiting approval</span>',
          '✅ Certs Issued<br><b style="font-size:20pt;color:#52c41a">128</b><br><span style="font-size:8pt;color:#888">This month</span>',
          '⚠️ Overdue<br><b style="font-size:20pt;color:#ff4d4f">3</b><br><span style="font-size:8pt;color:#888">Require action</span>'].map(t =>
          `<div style="background:#fff;border-radius:10px;padding:14px;border:1px solid #eee;font-size:9pt;text-align:center">${t}</div>`
        ).join('')}
      </div>
      <!-- Chart placeholder + recent -->
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px">
        <div style="background:#fff;border-radius:10px;border:1px solid #eee;padding:16px">
          <div style="font-size:9.5pt;font-weight:700;color:#0f3460;margin-bottom:12px">Jobs by Status (This Month)</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${[['IN_CALIBRATION','#1677ff',65],['PENDING_REVIEW','#faad14',20],['APPROVED','#52c41a',15],['CLOSED','#d9d9d9',80]].map(([label,color,pct])=>
              `<div style="display:flex;align-items:center;gap:8px;font-size:8.5pt">
                <span style="width:110px;color:#555">${label}</span>
                <div style="flex:1;background:#f0f0f0;border-radius:4px;height:10px">
                  <div style="width:${pct}%;background:${color};height:10px;border-radius:4px"></div>
                </div>
                <span style="width:24px;color:#888;text-align:right">${pct}%</span>
              </div>`
            ).join('')}
          </div>
        </div>
        <div style="background:#fff;border-radius:10px;border:1px solid #eee;padding:14px">
          <div style="font-size:9.5pt;font-weight:700;color:#0f3460;margin-bottom:10px">⚡ Recent Activity</div>
          ${[['JOB-2026-00041','RECEIVED','2m ago'],['JOB-2026-00040','APPROVED','1h ago'],['CERT-001','Issued','2h ago']].map(([n,s,t])=>
            `<div style="padding:5px 0;border-bottom:1px solid #f5f5f5;font-size:8pt">
              <b>${n}</b> → <span style="color:#1677ff">${s}</span><br>
              <span style="color:#aaa">${t}</span>
            </div>`
          ).join('')}
        </div>
      </div>
    </div>
  </div>

  <h3>Dashboard Widgets</h3>
  <table class="data-table">
    <tr><th>Widget</th><th>What it Shows</th><th>Who Sees It</th></tr>
    <tr><td>Active Jobs</td><td>Count of jobs not in CLOSED/DELIVERED state</td><td>All roles</td></tr>
    <tr><td>Pending Review</td><td>Jobs in PENDING_REVIEW status awaiting Technical Manager</td><td>Admin, Tech Mgr</td></tr>
    <tr><td>Certificates Issued</td><td>Certificates generated this calendar month</td><td>All roles</td></tr>
    <tr><td>Overdue Jobs</td><td>Jobs past expected delivery date</td><td>Admin, Tech Mgr</td></tr>
    <tr><td>Status Bar Chart</td><td>Job count grouped by current status</td><td>Admin, Tech Mgr</td></tr>
    <tr><td>Recent Activity Feed</td><td>Last 10 events across all modules</td><td>All roles</td></tr>
    <tr><td>Upcoming Calibrations</td><td>Instruments due for re-calibration in next 30 days</td><td>Admin, Tech Mgr</td></tr>
    <tr><td>Environmental Alerts</td><td>Temperature/humidity readings outside acceptable range</td><td>Admin, Quality Mgr</td></tr>
  </table>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 3 — JOBS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch3">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 03</div>
    <div class="chapter-title">Jobs — Calibration Work Orders</div>
    <div class="chapter-desc">Creating, tracking, and managing calibration work orders from intake to delivery</div>
    <div class="chapter-badge">Core Module</div>
  </div>

  <h3>Job Lifecycle</h3>
  <p>Every calibration request becomes a <strong>Job</strong>. A job tracks an instrument through the complete calibration process. Status transitions are strictly controlled to enforce quality workflow.</p>

  <div class="flow">
    <span class="flow-step">RECEIVED</span><span class="flow-arrow">→</span>
    <span class="flow-step">WAITING</span><span class="flow-arrow">→</span>
    <span class="flow-step">ASSIGNED</span><span class="flow-arrow">→</span>
    <span class="flow-step">IN_CALIBRATION</span><span class="flow-arrow">→</span>
    <span class="flow-step">PENDING_REVIEW</span><span class="flow-arrow">→</span>
    <span class="flow-step">APPROVED</span><span class="flow-arrow">→</span>
    <span class="flow-step">CERT_GENERATED</span><span class="flow-arrow">→</span>
    <span class="flow-step">DELIVERED</span><span class="flow-arrow">→</span>
    <span class="flow-step">CLOSED</span>
  </div>
  <div class="warn-box">If corrections are needed after review, the status moves to <strong>CORRECTION_REQUIRED</strong>, and the engineer fixes the datasheet before resubmitting.</div>

  <h3>Jobs List Screen</h3>
  <div class="screen">
    <div class="screen-topbar">
      <span class="screen-topbar-title">📋 Calibration Jobs</span>
      <div class="screen-topbar-actions">
        <span class="screen-btn">+ New Job</span>
        <span class="screen-btn screen-btn-primary">+ Bulk Intake</span>
      </div>
    </div>
    <div class="screen-content">
      <div class="screen-filter-bar">
        <input class="screen-input" placeholder="🔍 Search by job number, customer..." readonly/>
        <select class="screen-select"><option>All Statuses</option></select>
        <select class="screen-select"><option>All Engineers</option></select>
      </div>
      <table class="data-table" style="font-size:8.5pt">
        <tr><th>Job No.</th><th>Customer / Instrument</th><th>Engineer</th><th>Status</th><th>Actions</th></tr>
        <tr>
          <td><b style="color:#1677ff">JOB-2026-00041</b></td>
          <td><b>Acme Labs</b><br><span style="color:#888;font-size:8pt">Digital Multimeter</span></td>
          <td><span class="tag tag-blue">Ravi K.</span></td>
          <td><span class="tag tag-orange">IN_CALIBRATION</span></td>
          <td>⚡ 👤 ✏️ 🗑️</td>
        </tr>
        <tr>
          <td><b style="color:#1677ff">JOB-2026-00040</b></td>
          <td><b>Metro Pharma</b><br><span style="color:#888;font-size:8pt">Weighing Scale</span></td>
          <td><span class="tag tag-blue">Sanjay M.</span></td>
          <td><span class="tag tag-green">APPROVED</span></td>
          <td>⚡ 👤 ✏️ 🗑️</td>
        </tr>
        <tr>
          <td><b style="color:#1677ff">JOB-2026-00039</b> <span class="tag tag-purple" style="font-size:7pt">BATCH</span></td>
          <td><b>Tech Solutions</b><br><span style="color:#888;font-size:8pt">Vernier Caliper <span class="tag tag-blue" style="font-size:7pt">Onsite</span></span></td>
          <td><span class="tag">Unassigned</span></td>
          <td><span class="tag tag-blue">RECEIVED</span></td>
          <td>⚡ 👤 ✏️ 🗑️</td>
        </tr>
      </table>
    </div>
  </div>

  <h3>Creating a New Job</h3>
  <p>Click <strong>+ New Job</strong> in the top-right. Fill the form:</p>
  <div class="field-row"><span class="field-name">Customer</span><span class="field-desc">Select the customer from the dropdown (must be added in Customers first)</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Instrument</span><span class="field-desc">Select the customer's instrument registered in the system</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Calibration Procedure</span><span class="field-desc">Choose from the grouped procedure library (discipline → sub-category → procedure)</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Certificate Type</span><span class="field-desc">NABL (accredited) or Non-NABL (in-house). Determines certificate template used</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Range / Unit</span><span class="field-desc">Auto-filled from procedure; can be overridden per job</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Is Onsite?</span><span class="field-desc">Toggle if calibration is performed at the customer's premises</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Visit Date</span><span class="field-desc">Required when Is Onsite is enabled</span><span class="field-req">Conditional</span></div>
  <div class="field-row"><span class="field-name">PO Number / Challan No.</span><span class="field-desc">Customer's purchase order / inward challan reference</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Condition of Item</span><span class="field-desc">Describe the item's physical condition at intake</span><span class="field-req"></span></div>

  <h3>Bulk Job Intake</h3>
  <p>Click <strong>+ Bulk Intake</strong> to create multiple jobs under a single batch number for one customer. Select the customer, then multi-select instruments. A single batch covers all jobs created together, making it easy to track related instruments.</p>

  <h3>Job Actions</h3>
  <table class="data-table">
    <tr><th>Action Button</th><th>What it Does</th><th>Who Can Use</th></tr>
    <tr><td>⚡ Open Job</td><td>Opens the Job Workspace (full detail, datasheets, certificate)</td><td>All</td></tr>
    <tr><td>👤 Assign Engineer</td><td>Opens dialog to assign/re-assign an engineer</td><td>Admin, Tech Mgr</td></tr>
    <tr><td>✏️ Update Status</td><td>Moves the job to the next valid status</td><td>Role-dependent</td></tr>
    <tr><td>🗑️ Delete Job</td><td>Permanently deletes the job (with confirmation)</td><td>Admin, Tech Mgr</td></tr>
  </table>

  <h3>Job Workspace</h3>
  <p>Click ⚡ on any job to open its full workspace. This screen has multiple sections:</p>
  <ul>
    <li><strong>Job Details</strong> — All metadata: customer, instrument, engineer, dates, remarks</li>
    <li><strong>Status Progress</strong> — Visual step-by-step pipeline showing current position</li>
    <li><strong>Datasheet</strong> — Engineers fill in actual calibration readings here</li>
    <li><strong>Certificate</strong> — Once approved, generate, preview, and download the certificate</li>
    <li><strong>Audit Trail</strong> — Every status change with timestamp and user</li>
  </ul>

  <div class="tip-box"><strong>Tip:</strong> Engineers can only update status for their own assigned jobs. The Technical Manager or Admin must approve jobs in PENDING_REVIEW status.</div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 4 — CERTIFICATES
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch4">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 04</div>
    <div class="chapter-title">Certificates</div>
    <div class="chapter-desc">Viewing, downloading, and verifying calibration certificates</div>
  </div>

  <h3>Certificates Module</h3>
  <p>The Certificates module provides a central registry of all issued calibration certificates. Certificates are automatically generated from approved jobs.</p>

  <div class="screen">
    <div class="screen-topbar">
      <span class="screen-topbar-title">🏅 Certificates</span>
    </div>
    <div class="screen-content">
      <div class="screen-filter-bar">
        <input class="screen-input" placeholder="🔍 Search certificate number..."/>
        <select class="screen-select"><option>All Types</option><option>NABL</option><option>Non-NABL</option></select>
        <select class="screen-select"><option>Date Range</option></select>
      </div>
      <table class="data-table" style="font-size:8.5pt">
        <tr><th>Cert No.</th><th>Job No.</th><th>Customer</th><th>Instrument</th><th>Type</th><th>Issued Date</th><th>Actions</th></tr>
        <tr>
          <td><b>CERT-2026-0041</b></td><td>JOB-2026-00041</td>
          <td>Acme Labs</td><td>Digital Multimeter</td>
          <td><span class="tag tag-blue">NABL</span></td>
          <td>25 Jun 2026</td>
          <td>📥 👁️</td>
        </tr>
      </table>
    </div>
  </div>

  <h3>Certificate Types</h3>
  <table class="data-table">
    <tr><th>Type</th><th>Template Used</th><th>NABL Logo</th><th>Use Case</th></tr>
    <tr><td><span class="tag tag-blue">NABL</span></td><td>NABL-accredited template</td><td>✅ Printed</td><td>When lab is NABL-accredited for that parameter</td></tr>
    <tr><td><span class="tag tag-orange">Non-NABL</span></td><td>In-house template</td><td>❌ Not printed</td><td>Parameters outside NABL scope or interim certs</td></tr>
  </table>

  <h3>Certificate Actions</h3>
  <ul>
    <li><strong>📥 Download</strong> — Downloads the certificate as PDF</li>
    <li><strong>👁️ Preview</strong> — Opens a print-ready view in a new browser tab</li>
    <li><strong>QR Verification</strong> — Each certificate has a unique QR code. Scanning opens the public verification page confirming authenticity</li>
  </ul>

  <h3>Public Certificate Verification</h3>
  <p>Anyone can verify a certificate's authenticity by visiting <code>/verify/:certNumber</code> — no login required. This page shows the certificate number, issue date, lab name, and instrument details.</p>

  <div class="info-box"><strong>Certificate Number Format:</strong> Automatically generated as <code>CERT-{YEAR}-{SEQUENCE}</code>. The format can be customized in Admin Settings → Certificate Settings.</div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 5 — INSTRUMENTS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch5">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 05</div>
    <div class="chapter-title">Instruments</div>
    <div class="chapter-desc">Managing customer instruments registered for calibration</div>
  </div>

  <h3>Instruments Registry</h3>
  <p>The Instruments module stores all customer equipment submitted to the lab for calibration. Each instrument belongs to a customer and has its own calibration history.</p>

  <h3>Instrument Fields</h3>
  <div class="field-row"><span class="field-name">Customer</span><span class="field-desc">The owner of this instrument</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Name</span><span class="field-desc">Instrument name (e.g., Digital Multimeter, Vernier Caliper)</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Make / Model</span><span class="field-desc">Manufacturer and model number</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Serial Number</span><span class="field-desc">Instrument's serial number for unique identification</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Range &amp; Unit</span><span class="field-desc">Measurement range and unit (e.g., 0–100°C)</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Due Date</span><span class="field-desc">Next calibration due date — triggers reminders on dashboard</span><span class="field-req"></span></div>

  <div class="tip-box"><strong>Bulk Import:</strong> Click <em>Import CSV</em> to upload multiple instruments at once using the downloadable template.</div>

  <h3>Calibration History</h3>
  <p>Click the History icon on any instrument to see all past jobs and certificates associated with that instrument.</p>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 6 — REFERENCE STANDARDS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch6">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 06</div>
    <div class="chapter-title">Reference Standards</div>
    <div class="chapter-desc">Lab's own reference / master equipment calibration tracking</div>
  </div>

  <h3>Reference Standards</h3>
  <p>Reference Standards are the lab's own calibrated equipment used as reference instruments during calibration. They must themselves be calibrated at regular intervals to maintain traceability.</p>

  <h3>Fields</h3>
  <div class="field-row"><span class="field-name">Name</span><span class="field-desc">Name of the reference standard (e.g., Precision Thermometer)</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">ID / Serial</span><span class="field-desc">Lab's internal ID and manufacturer serial</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Certificate No.</span><span class="field-desc">Calibration certificate number from external calibration</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Valid Until</span><span class="field-desc">Expiry date of its current calibration certificate</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Traceable To</span><span class="field-desc">National/international standard the calibration traces back to</span><span class="field-req"></span></div>

  <div class="warn-box"><strong>Alert:</strong> Reference standards expiring within 30 days appear highlighted on the Dashboard and in the Notifications panel.</div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 7 — CALIBRATION MASTERS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch7">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 07</div>
    <div class="chapter-title">Calibration Masters</div>
    <div class="chapter-desc">Standard procedure library and calibration parameter definitions</div>
  </div>

  <h3>Calibration Masters</h3>
  <p>The Calibration Masters module is the library of calibration procedures the lab follows. These define measurands, units, ranges, and uncertainty parameters used in datasheets and certificates.</p>

  <h3>Master Fields</h3>
  <div class="field-row"><span class="field-name">Discipline</span><span class="field-desc">e.g., Electrical, Mechanical, Thermal, Dimensional</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Measurand</span><span class="field-desc">The physical quantity being measured (e.g., DC Voltage)</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Range</span><span class="field-desc">Measurement range (e.g., 0–200 V)</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Unit</span><span class="field-desc">Unit of measurement (V, mA, °C, mm, etc.)</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Uncertainty</span><span class="field-desc">Calibration uncertainty value for this range</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Procedure Ref.</span><span class="field-desc">Internal/external procedure document reference number</span><span class="field-req"></span></div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 8 — ENVIRONMENTAL
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch8">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 08</div>
    <div class="chapter-title">Environmental Monitoring</div>
    <div class="chapter-desc">Recording temperature, humidity, and lab condition logs</div>
  </div>

  <h3>Environmental Monitoring</h3>
  <p>NABL-accredited labs must maintain environmental records for their calibration rooms. This module allows daily logging of temperature and humidity readings with timestamps.</p>

  <h3>Log Entry Fields</h3>
  <div class="field-row"><span class="field-name">Date &amp; Time</span><span class="field-desc">Timestamp of the reading (auto-filled with current time)</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Room / Location</span><span class="field-desc">Lab room or area where reading was taken</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Temperature (°C)</span><span class="field-desc">Dry-bulb temperature reading</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Humidity (%RH)</span><span class="field-desc">Relative humidity reading</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Recorded By</span><span class="field-desc">Staff member who took the reading</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Remarks</span><span class="field-desc">Any abnormalities observed</span><span class="field-req"></span></div>

  <div class="warn-box">Readings outside the acceptable range (typically 23 ± 2°C and 45–65% RH) are flagged in red and generate a dashboard alert.</div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 9 — CUSTOMERS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch9">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 09</div>
    <div class="chapter-title">Customers</div>
    <div class="chapter-desc">Customer database, portal access, and activity timeline</div>
  </div>

  <h3>Customer Management</h3>
  <p>The Customers module is the master directory of all clients. Customer records link to their instruments, jobs, quotations, invoices, and portal access.</p>

  <div class="screen">
    <div class="screen-topbar">
      <span class="screen-topbar-title">👥 Customers</span>
      <div class="screen-topbar-actions">
        <span class="screen-btn">Import CSV</span>
        <span class="screen-btn screen-btn-primary">+ New Customer</span>
      </div>
    </div>
    <div class="screen-content">
      <table class="data-table" style="font-size:8.5pt">
        <tr><th>Code</th><th>Name</th><th>GSTIN</th><th>Email</th><th>Phone</th><th>Actions</th></tr>
        <tr>
          <td><span class="tag tag-blue">CUST-001</span></td>
          <td><b>Acme Laboratories</b></td>
          <td>27AAAAA0000A1Z5</td>
          <td>contact@acme.com</td>
          <td>+91 9876543210</td>
          <td>⏱ 🔒 ✏️ 🗑️</td>
        </tr>
      </table>
    </div>
  </div>

  <h3>Customer Fields</h3>
  <div class="field-row"><span class="field-name">Customer Code</span><span class="field-desc">Unique code (e.g., CUST-001). Auto-generated or manually set. Cannot be changed after creation.</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Name</span><span class="field-desc">Company or individual name</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">GSTIN</span><span class="field-desc">GST identification number (used on invoices)</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Email</span><span class="field-desc">Primary email — also used for Customer Portal login</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Phone</span><span class="field-desc">Contact number</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Address</span><span class="field-desc">City, State</span><span class="field-req"></span></div>

  <h3>Customer Actions</h3>
  <table class="data-table">
    <tr><th>Button</th><th>Action</th></tr>
    <tr><td>⏱ Timeline</td><td>Opens a drawer showing the customer's full history: quotations received, jobs placed, invoices, payments, and complaints in chronological order</td></tr>
    <tr><td>🔒 Set Portal Password</td><td>Opens a dialog to set or reset the password the customer uses to log in to the Customer Portal. The customer uses their email + this password.</td></tr>
    <tr><td>✏️ Edit</td><td>Edit all customer fields (except Code)</td></tr>
    <tr><td>🗑️ Delete</td><td>Permanently delete the customer (blocked if active jobs/invoices exist)</td></tr>
  </table>

  <div class="tip-box"><strong>Bulk Import:</strong> Use <em>Import CSV</em> with the downloadable template to add many customers at once. Required columns: Customer Code, Name.</div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 10 — LEADS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch10">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 10</div>
    <div class="chapter-title">Leads &amp; Sales Pipeline</div>
    <div class="chapter-desc">Managing prospective customers from first contact to conversion</div>
  </div>

  <h3>Leads Module</h3>
  <p>Track potential customers through the sales pipeline before they become formal customers. Each lead moves through stages until won or lost.</p>

  <div class="flow">
    <span class="flow-step">NEW</span><span class="flow-arrow">→</span>
    <span class="flow-step">CONTACTED</span><span class="flow-arrow">→</span>
    <span class="flow-step">QUALIFIED</span><span class="flow-arrow">→</span>
    <span class="flow-step">PROPOSAL</span><span class="flow-arrow">→</span>
    <span class="flow-step">NEGOTIATION</span><span class="flow-arrow">→</span>
    <span class="flow-step">WON / LOST</span>
  </div>

  <h3>Lead Fields</h3>
  <div class="field-row"><span class="field-name">Company Name</span><span class="field-desc">Prospective company name</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Contact Person</span><span class="field-desc">Name of the decision maker</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Email / Phone</span><span class="field-desc">Contact details</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Stage</span><span class="field-desc">Current pipeline stage</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Source</span><span class="field-desc">Where the lead came from: Referral, Cold Call, Website, Exhibition, Other</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Value (₹)</span><span class="field-desc">Estimated deal value</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Expected Close</span><span class="field-desc">Target date to close the deal</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Notes</span><span class="field-desc">Free-text notes about the lead</span><span class="field-req"></span></div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 11 — CRM ACTIVITIES
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch11">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 11</div>
    <div class="chapter-title">CRM Activities</div>
    <div class="chapter-desc">Logging customer interactions and follow-ups</div>
  </div>

  <h3>CRM Activities</h3>
  <p>Log every customer-facing activity — calls, emails, meetings, and tasks — linked to a specific customer or lead. This creates a complete interaction history.</p>

  <h3>Activity Types</h3>
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">
    <span class="tag tag-blue">📞 CALL</span>
    <span class="tag tag-green">📧 EMAIL</span>
    <span class="tag tag-purple">🤝 MEETING</span>
    <span class="tag tag-orange">✅ TASK</span>
    <span class="tag tag-cyan">📝 NOTE</span>
    <span class="tag tag-gold">💬 WHATSAPP</span>
  </div>

  <h3>Fields</h3>
  <div class="field-row"><span class="field-name">Type</span><span class="field-desc">Activity type from the list above</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Customer / Lead</span><span class="field-desc">Link to a customer or lead record</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Date &amp; Time</span><span class="field-desc">When the activity occurred</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Subject</span><span class="field-desc">Brief title of the interaction</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Notes</span><span class="field-desc">Detailed notes from the interaction</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Follow-up Date</span><span class="field-desc">Next action date</span><span class="field-req"></span></div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 12 — QUOTATIONS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch12">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 12</div>
    <div class="chapter-title">Quotations</div>
    <div class="chapter-desc">Creating and managing calibration service quotations</div>
  </div>

  <h3>Quotations Module</h3>
  <p>Generate professional quotations for customers. A quotation can list multiple line items (instrument types and quantities) with rates and GST.</p>

  <h3>Quotation Fields</h3>
  <div class="field-row"><span class="field-name">Quotation No.</span><span class="field-desc">Auto-generated sequence number</span><span class="field-req">Auto</span></div>
  <div class="field-row"><span class="field-name">Customer</span><span class="field-desc">Select the customer to quote</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Valid Until</span><span class="field-desc">Expiry date of this quotation</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Line Items</span><span class="field-desc">Description, quantity, unit rate, GST% — multiple rows allowed</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Terms &amp; Conditions</span><span class="field-desc">Payment terms, delivery scope</span><span class="field-req"></span></div>

  <h3>Quotation Actions</h3>
  <ul>
    <li><strong>Preview / Print</strong> — Formatted A4 PDF with lab letterhead, logo, and signatory</li>
    <li><strong>Convert to Invoice</strong> — Once accepted, convert directly to an invoice</li>
    <li><strong>Edit / Delete</strong> — Full CRUD available</li>
  </ul>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 13 — INVOICES
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch13">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 13</div>
    <div class="chapter-title">Invoices</div>
    <div class="chapter-desc">Billing, GST invoices, and payment tracking</div>
  </div>

  <h3>Invoices Module</h3>
  <p>Generate GST-compliant tax invoices for calibration services. The system tracks payment status and outstanding dues.</p>

  <h3>Invoice Fields</h3>
  <div class="field-row"><span class="field-name">Invoice No.</span><span class="field-desc">Auto-generated (e.g., INV-2026-00041)</span><span class="field-req">Auto</span></div>
  <div class="field-row"><span class="field-name">Customer</span><span class="field-desc">Bill-to customer</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Invoice Date</span><span class="field-desc">Date of issue</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Due Date</span><span class="field-desc">Payment due date</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Line Items</span><span class="field-desc">Service description, quantity, rate, GST rate (0/5/12/18%)</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">CGST / SGST / IGST</span><span class="field-desc">Auto-calculated based on GST rate and whether customer is intra/inter-state</span><span class="field-req">Auto</span></div>
  <div class="field-row"><span class="field-name">Payment Status</span><span class="field-desc">UNPAID → PARTIAL → PAID</span><span class="field-req">Auto</span></div>

  <div class="tip-box">Bank account details (account number, IFSC, branch) configured in Admin Settings automatically appear on the invoice PDF.</div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 14 — PURCHASE ORDERS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch14">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 14</div>
    <div class="chapter-title">Purchase Orders</div>
    <div class="chapter-desc">Managing lab procurement and supplier POs</div>
  </div>

  <h3>Purchase Orders</h3>
  <p>Track all purchase orders raised by the lab for consumables, equipment, and services from suppliers.</p>

  <h3>PO Fields</h3>
  <div class="field-row"><span class="field-name">PO Number</span><span class="field-desc">Auto-generated PO reference number</span><span class="field-req">Auto</span></div>
  <div class="field-row"><span class="field-name">Supplier</span><span class="field-desc">Select the supplier from the customer/vendor directory</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">PO Date</span><span class="field-desc">Date the order was raised</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Expected Delivery</span><span class="field-desc">Target delivery date</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Line Items</span><span class="field-desc">Item description, quantity, unit price</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Status</span><span class="field-desc">DRAFT → SENT → PARTIAL_RECEIVED → RECEIVED → CANCELLED</span><span class="field-req"></span></div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 15 — DELIVERY CHALLANS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch15">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 15</div>
    <div class="chapter-title">Delivery Challans</div>
    <div class="chapter-desc">Outward and inward goods movement documentation</div>
  </div>

  <h3>Delivery Challans</h3>
  <p>A Delivery Challan (DC) documents the movement of instruments into and out of the lab. It serves as proof of receipt and delivery.</p>

  <h3>Challan Types</h3>
  <table class="data-table">
    <tr><th>Type</th><th>Direction</th><th>Use Case</th></tr>
    <tr><td><span class="tag tag-blue">INWARD</span></td><td>Customer → Lab</td><td>Customer sends instruments to lab for calibration</td></tr>
    <tr><td><span class="tag tag-green">OUTWARD</span></td><td>Lab → Customer</td><td>Lab returns calibrated instruments to customer</td></tr>
  </table>

  <h3>Challan Fields</h3>
  <div class="field-row"><span class="field-name">DC Number</span><span class="field-desc">Auto-generated reference number</span><span class="field-req">Auto</span></div>
  <div class="field-row"><span class="field-name">Type</span><span class="field-desc">INWARD or OUTWARD</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Customer</span><span class="field-desc">Customer from/to whom instruments are moving</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Date</span><span class="field-desc">Date of movement</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Items</span><span class="field-desc">List of instruments with serial numbers and condition</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Remarks</span><span class="field-desc">Any special instructions or observations</span><span class="field-req"></span></div>

  <div class="info-box">DC numbers are linked to jobs — the job form has a <em>Challan No.</em> field to reference the inward challan when creating a calibration job.</div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 16 — QUALITY / NCR-CAPA
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch16">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 16</div>
    <div class="chapter-title">NCR / CAPA — Quality Module</div>
    <div class="chapter-desc">Non-Conformance Reports and Corrective &amp; Preventive Actions</div>
    <div class="chapter-badge">ISO 17025 Compliance</div>
  </div>

  <h3>NCR / CAPA</h3>
  <p>The Quality module manages Non-Conformance Reports (NCR) and Corrective/Preventive Actions (CAPA) as required by ISO/IEC 17025. Any deviation from the defined quality system is documented here.</p>

  <div class="flow">
    <span class="flow-step">OPEN</span><span class="flow-arrow">→</span>
    <span class="flow-step">UNDER_INVESTIGATION</span><span class="flow-arrow">→</span>
    <span class="flow-step">CAPA_IN_PROGRESS</span><span class="flow-arrow">→</span>
    <span class="flow-step">EFFECTIVENESS_CHECK</span><span class="flow-arrow">→</span>
    <span class="flow-step">CLOSED</span>
  </div>

  <h3>NCR Fields</h3>
  <div class="field-row"><span class="field-name">NCR Number</span><span class="field-desc">Auto-generated (e.g., NCR-2026-0001)</span><span class="field-req">Auto</span></div>
  <div class="field-row"><span class="field-name">Title</span><span class="field-desc">Brief description of the non-conformance</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Category</span><span class="field-desc">e.g., Equipment, Method, Personnel, Environment</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Description</span><span class="field-desc">Detailed description of what went wrong</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Root Cause</span><span class="field-desc">Root cause analysis (filled during investigation)</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Corrective Action</span><span class="field-desc">Steps taken to correct the issue</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Preventive Action</span><span class="field-desc">Steps to prevent recurrence</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Target Date</span><span class="field-desc">Deadline for CAPA implementation</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Responsible Person</span><span class="field-desc">Staff member accountable for closure</span><span class="field-req"></span></div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 17 — COMPLAINTS & FEEDBACK
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch17">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 17</div>
    <div class="chapter-title">Complaints &amp; Customer Feedback</div>
    <div class="chapter-desc">Managing customer complaints and satisfaction feedback</div>
  </div>

  <h3>Complaints Module</h3>
  <p>All customer complaints — whether raised internally by lab staff or submitted by customers through the Customer Portal — appear here. Each complaint is tracked to closure.</p>

  <div class="flow">
    <span class="flow-step">OPEN</span><span class="flow-arrow">→</span>
    <span class="flow-step">IN_PROGRESS</span><span class="flow-arrow">→</span>
    <span class="flow-step">RESOLVED</span><span class="flow-arrow">→</span>
    <span class="flow-step">CLOSED</span>
  </div>

  <div class="info-box">Complaints submitted by customers from the Customer Portal automatically appear in this module with the prefix <code>PORTAL/</code> in the Complaint Number and <code>[Customer: Name]</code> in the description.</div>

  <h3>Complaint Fields</h3>
  <div class="field-row"><span class="field-name">Complaint No.</span><span class="field-desc">Auto-generated (lab: CMP-2026-001, portal: PORTAL/2026/XXXXXXXX)</span><span class="field-req">Auto</span></div>
  <div class="field-row"><span class="field-name">Customer</span><span class="field-desc">The customer raising the complaint</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Subject</span><span class="field-desc">Brief title of the complaint</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Description</span><span class="field-desc">Full details of the issue reported</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Status</span><span class="field-desc">Current resolution status</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Resolution Notes</span><span class="field-desc">How the complaint was resolved</span><span class="field-req"></span></div>

  <h3>Customer Feedback</h3>
  <p>Customers can rate their experience via the Customer Portal on four dimensions. Feedback records appear in this module for review by the Quality Manager.</p>
  <ul>
    <li>Turnaround Time Rating (1–5 stars)</li>
    <li>Certificate Quality Rating (1–5 stars)</li>
    <li>Staff Behaviour Rating (1–5 stars)</li>
    <li>Overall Satisfaction Rating (1–5 stars)</li>
    <li>Comments (free text)</li>
  </ul>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 18 — DOCUMENTS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch18">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 18</div>
    <div class="chapter-title">Lab Documents</div>
    <div class="chapter-desc">Document control system for quality manual, SOPs, and records</div>
    <div class="chapter-badge">ISO 17025 Compliance</div>
  </div>

  <h3>Document Control</h3>
  <p>Maintain the lab's quality document library: Quality Manual, Standard Operating Procedures (SOPs), work instructions, forms, and records. The system manages version numbers and review dates.</p>

  <h3>Document Fields</h3>
  <div class="field-row"><span class="field-name">Document No.</span><span class="field-desc">Unique document reference (e.g., QM-001, SOP-CAL-001)</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Title</span><span class="field-desc">Document title</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Category</span><span class="field-desc">Quality Manual / SOP / Work Instruction / Form / Record</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Version</span><span class="field-desc">Current version number (e.g., 1.0, 2.3)</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Revision Date</span><span class="field-desc">Date of last revision</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Next Review</span><span class="field-desc">Scheduled next review date — triggers notification when due</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">File Attachment</span><span class="field-desc">Upload the document file (PDF, DOCX)</span><span class="field-req"></span></div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 19 — INTERNAL AUDIT
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch19">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 19</div>
    <div class="chapter-title">Internal Audit</div>
    <div class="chapter-desc">Planning and recording internal quality system audits</div>
  </div>

  <h3>Internal Audit Module</h3>
  <p>Plan, execute, and record results of internal audits as required by ISO/IEC 17025. Link findings to NCR/CAPA records for follow-up.</p>

  <h3>Audit Fields</h3>
  <div class="field-row"><span class="field-name">Audit Reference</span><span class="field-desc">Unique audit identifier</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Audit Date</span><span class="field-desc">Date the audit was conducted</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Auditor</span><span class="field-desc">Name of the internal auditor</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Area Audited</span><span class="field-desc">Department or scope (e.g., Calibration Lab, Document Control)</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Findings</span><span class="field-desc">Observations, non-conformances found, and opportunities for improvement</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Status</span><span class="field-desc">PLANNED → IN_PROGRESS → COMPLETED → CLOSED</span><span class="field-req"></span></div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 20 — TASKS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch20">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 20</div>
    <div class="chapter-title">Tasks</div>
    <div class="chapter-desc">Internal task management and assignment</div>
  </div>

  <h3>Tasks Module</h3>
  <p>Create and assign internal tasks to lab staff. Tasks are independent of calibration jobs — they cover any lab activity: maintenance, procurement follow-up, training, etc.</p>

  <h3>Task Fields</h3>
  <div class="field-row"><span class="field-name">Title</span><span class="field-desc">Task title</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Description</span><span class="field-desc">Detailed description of what needs to be done</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Assigned To</span><span class="field-desc">Select a user from the system</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Priority</span><span class="field-desc">LOW / MEDIUM / HIGH / URGENT</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Due Date</span><span class="field-desc">Deadline for completion</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Status</span><span class="field-desc">TODO → IN_PROGRESS → DONE → CANCELLED</span><span class="field-req">Auto</span></div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 21 — ENGINEERS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch21">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 21</div>
    <div class="chapter-title">Engineers</div>
    <div class="chapter-desc">Managing calibration engineers and their competency records</div>
  </div>

  <h3>Engineers Module</h3>
  <p>The Engineers module tracks all calibration and service engineers, their competencies, and links to their user account for job assignment.</p>

  <h3>Engineer Fields</h3>
  <div class="field-row"><span class="field-name">Employee Code</span><span class="field-desc">Unique staff identifier (e.g., ENG-001)</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Linked User Account</span><span class="field-desc">The system user account for this engineer</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Disciplines</span><span class="field-desc">Calibration disciplines this engineer is qualified for (Electrical, Mechanical, etc.)</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Qualification</span><span class="field-desc">Educational and professional qualifications</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Joining Date</span><span class="field-desc">Date of joining the lab</span><span class="field-req"></span></div>

  <div class="info-box">Engineers must have a linked user account before they can be assigned to jobs. Create the user account first in Administration → Users.</div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 22 — USERS & PERMISSIONS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch22">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 22</div>
    <div class="chapter-title">Users &amp; Role Permissions</div>
    <div class="chapter-desc">Creating staff accounts and configuring module-level access control</div>
  </div>

  <h3>User Management</h3>
  <p>The LAB_ADMIN creates system users for all lab staff. Each user gets one of the six available roles.</p>

  <div class="screen">
    <div class="screen-topbar">
      <span class="screen-topbar-title">👤 Users — Administration</span>
      <div class="screen-topbar-actions">
        <span class="screen-btn screen-btn-primary">+ New User</span>
      </div>
    </div>
    <div class="screen-content">
      <table class="data-table" style="font-size:8.5pt">
        <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
        <tr>
          <td><b>Dr. Anjali Kumar</b></td>
          <td>anjali@lab.com</td>
          <td><span class="tag tag-blue">TECHNICAL_MANAGER</span></td>
          <td><span class="tag tag-green">Active</span></td>
          <td>✏️ 🔑 🗑️</td>
        </tr>
        <tr>
          <td><b>Ravi Sharma</b></td>
          <td>ravi@lab.com</td>
          <td><span class="tag tag-purple">CALIBRATION_ENGINEER</span></td>
          <td><span class="tag tag-green">Active</span></td>
          <td>✏️ 🔑 🗑️</td>
        </tr>
      </table>
    </div>
  </div>

  <h3>Creating a User</h3>
  <div class="field-row"><span class="field-name">Full Name</span><span class="field-desc">Staff member's full name</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Email</span><span class="field-desc">Login email address (must be unique)</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Role</span><span class="field-desc">One of: Technical Manager, Quality Manager, Calibration Engineer, Service Engineer, Data Entry Operator</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Password</span><span class="field-desc">Initial password (user should change on first login)</span><span class="field-req">Required</span></div>

  <h3>Role Permissions</h3>
  <p>Go to <strong>Administration → Role Permissions</strong> to configure which modules each role can access. This is a grid of roles vs. modules with read/write toggles.</p>

  <div class="screen">
    <div class="screen-topbar"><span class="screen-topbar-title">🔐 Role Permissions</span></div>
    <div class="screen-content">
      <table class="data-table" style="font-size:8pt">
        <tr>
          <th>Module</th>
          <th>Tech Mgr</th>
          <th>Quality Mgr</th>
          <th>Calib. Eng.</th>
          <th>Svc. Eng.</th>
          <th>Data Entry</th>
        </tr>
        <tr><td>Jobs</td><td>✅ Read/Write</td><td>👁 Read</td><td>✅ Read/Write</td><td>✅ Read/Write</td><td>👁 Read</td></tr>
        <tr><td>Certificates</td><td>✅ Read/Write</td><td>👁 Read</td><td>👁 Read</td><td>❌</td><td>❌</td></tr>
        <tr><td>Customers</td><td>✅ Read/Write</td><td>👁 Read</td><td>👁 Read</td><td>👁 Read</td><td>✅ Read/Write</td></tr>
        <tr><td>NCR / CAPA</td><td>👁 Read</td><td>✅ Read/Write</td><td>❌</td><td>❌</td><td>❌</td></tr>
        <tr><td>Complaints</td><td>👁 Read</td><td>✅ Read/Write</td><td>❌</td><td>❌</td><td>❌</td></tr>
      </table>
    </div>
  </div>

  <p style="margin-top:12px">Available modules in the permissions matrix:</p>
  <div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0">
    ${['Jobs','Certificates','Instruments','Reference Standards','Calibration Masters','Environmental','Tasks','Engineers','Customers','Quotations','Invoices','Purchase Orders','Delivery Challans','Leads / Pipeline','CRM Activities','NCR / CAPA','Complaints & Feedback','Lab Documents','Internal Audit','Reports','Inventory','Notifications'].map(m => `<span class="tag tag-blue">${m}</span>`).join('')}
  </div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 23 — INVENTORY
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch23">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 23</div>
    <div class="chapter-title">Inventory</div>
    <div class="chapter-desc">Managing lab consumables and equipment stock</div>
  </div>

  <h3>Inventory Module</h3>
  <p>Track quantities of consumables, chemicals, spare parts, and lab supplies. Set minimum stock levels to receive low-stock alerts.</p>

  <h3>Item Fields</h3>
  <div class="field-row"><span class="field-name">Item Name</span><span class="field-desc">Name of the consumable or item</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Category</span><span class="field-desc">Consumable / Chemical / Spare Part / Equipment / Other</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Unit</span><span class="field-desc">Unit of measure (pcs, litres, kg, rolls)</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Current Qty</span><span class="field-desc">Current stock quantity</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Min. Stock Level</span><span class="field-desc">Quantity below which a low-stock alert is triggered</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Location</span><span class="field-desc">Storage location in the lab</span><span class="field-req"></span></div>

  <div class="warn-box">Items at or below minimum stock level are highlighted in orange and appear on the dashboard alerts panel.</div>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 24 — REPORTS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch24">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 24</div>
    <div class="chapter-title">Reports</div>
    <div class="chapter-desc">Analytics, summaries, and exportable reports</div>
  </div>

  <h3>Reports Module</h3>
  <p>Generate and export reports across all modules. Use date range filters, customer filters, and engineer filters to narrow down data.</p>

  <h3>Available Reports</h3>
  <table class="data-table">
    <tr><th>Report</th><th>Description</th><th>Formats</th></tr>
    <tr><td>Jobs Summary</td><td>Count of jobs by status, engineer, customer for a period</td><td>Table / CSV</td></tr>
    <tr><td>Certificate Register</td><td>All certificates issued with validity dates</td><td>Table / CSV / PDF</td></tr>
    <tr><td>Engineer Productivity</td><td>Number of jobs completed per engineer</td><td>Chart / CSV</td></tr>
    <tr><td>Revenue Report</td><td>Invoice totals, GST collected, outstanding dues</td><td>Table / PDF</td></tr>
    <tr><td>Customer-wise Revenue</td><td>Revenue breakdown per customer</td><td>Chart / CSV</td></tr>
    <tr><td>NCR Summary</td><td>Non-conformances by category, status, and period</td><td>Table</td></tr>
    <tr><td>Environmental Log</td><td>Temperature/humidity trends over time</td><td>Chart / CSV</td></tr>
    <tr><td>Instrument Due List</td><td>Instruments with calibration due in a date range</td><td>Table / CSV</td></tr>
  </table>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 25 — NOTIFICATIONS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch25">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 25</div>
    <div class="chapter-title">Notifications</div>
    <div class="chapter-desc">System alerts and activity notifications</div>
  </div>

  <h3>Notifications Panel</h3>
  <p>The bell icon in the top navigation bar shows unread notification count. Click to view all notifications.</p>

  <h3>Notification Types</h3>
  <table class="data-table">
    <tr><th>Trigger</th><th>Who is Notified</th></tr>
    <tr><td>New job received</td><td>Technical Manager, Admin</td></tr>
    <tr><td>Job status changed</td><td>Assigned engineer, Technical Manager</td></tr>
    <tr><td>Job pending review</td><td>Technical Manager</td></tr>
    <tr><td>Certificate generated</td><td>Admin, customer (if email configured)</td></tr>
    <tr><td>Reference standard expiring</td><td>Technical Manager, Admin</td></tr>
    <tr><td>Instrument calibration due</td><td>Technical Manager, Admin</td></tr>
    <tr><td>Low inventory alert</td><td>Admin</td></tr>
    <tr><td>New complaint received</td><td>Quality Manager, Admin</td></tr>
    <tr><td>NCR assigned to user</td><td>Assigned user</td></tr>
    <tr><td>Internal audit due</td><td>Quality Manager, Admin</td></tr>
  </table>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 26 — ADMIN SETTINGS
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch26">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 26</div>
    <div class="chapter-title">Admin Settings</div>
    <div class="chapter-desc">Lab configuration, certificate templates, signatures, and data management</div>
    <div class="chapter-badge">LAB_ADMIN Only</div>
  </div>

  <h3>Accessing Settings</h3>
  <p>Navigate to <strong>Administration → Settings</strong>. This section is accessible only to LAB_ADMIN. It is organized into tabs:</p>

  <h3>Tab 1: Lab Details</h3>
  <p>Configure the lab's identity and contact information that appears on certificates, invoices, and quotations.</p>
  <div class="field-row"><span class="field-name">Lab Name</span><span class="field-desc">Official laboratory name</span><span class="field-req">Required</span></div>
  <div class="field-row"><span class="field-name">Accreditation No.</span><span class="field-desc">NABL accreditation number</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Address</span><span class="field-desc">Full registered address</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Phone / Email</span><span class="field-desc">Lab contact information</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">GSTIN / PAN</span><span class="field-desc">Tax registration numbers</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Logo</span><span class="field-desc">Click the logo box to upload. Appears on certificates and PDF documents. Accepted: PNG, JPG (max 2MB)</span><span class="field-req"></span></div>

  <h3>Tab 2: Bank Details</h3>
  <div class="field-row"><span class="field-name">Bank Name</span><span class="field-desc">Bank name (e.g., HDFC Bank)</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Branch</span><span class="field-desc">Branch name</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">Account Number</span><span class="field-desc">Lab's bank account number</span><span class="field-req"></span></div>
  <div class="field-row"><span class="field-name">IFSC Code</span><span class="field-desc">Bank IFSC code</span><span class="field-req"></span></div>

  <h3>Tab 3: Certificate Signature Block</h3>
  <p>Configure the two signatures that appear at the bottom of every calibration certificate.</p>

  <div class="screen">
    <div class="screen-topbar"><span class="screen-topbar-title">⚙️ Settings — Certificate Signature Block</span></div>
    <div class="screen-content">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:8px">
        <div>
          <div style="font-size:10pt;font-weight:700;color:#0f3460;margin-bottom:12px">Technical Signatory <span style="font-size:8pt;color:#888">(Calibration verifier)</span></div>
          <div style="margin-bottom:8px">
            <div style="font-size:8.5pt;color:#666;margin-bottom:4px">Technical Signatory Name</div>
            <div style="border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-size:8.5pt;color:#bbb">e.g. Dr. A. Kumar</div>
          </div>
          <div style="margin-bottom:8px">
            <div style="font-size:8.5pt;color:#666;margin-bottom:4px">Technical Signatory Designation</div>
            <div style="border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-size:8.5pt;color:#bbb">e.g. Technical Manager</div>
          </div>
          <div style="font-size:8.5pt;color:#666;margin-bottom:4px">Signature Image</div>
          <div style="width:100px;height:60px;border:1.5px dashed #ccc;border-radius:6px;background:#fafafa;display:flex;align-items:center;justify-content:center;font-size:8pt;color:#bbb;text-align:center;cursor:pointer">Click to upload signature</div>
        </div>
        <div>
          <div style="font-size:10pt;font-weight:700;color:#0f3460;margin-bottom:12px">Authorized Signatory <span style="font-size:8pt;color:#888">(Approver / Director)</span></div>
          <div style="margin-bottom:8px">
            <div style="font-size:8.5pt;color:#666;margin-bottom:4px">Authorized Signatory Name</div>
            <div style="border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-size:8.5pt;color:#bbb">e.g. Mr. R. Sharma</div>
          </div>
          <div style="margin-bottom:8px">
            <div style="font-size:8.5pt;color:#666;margin-bottom:4px">Authorized Signatory Designation</div>
            <div style="border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-size:8.5pt;color:#bbb">e.g. Director</div>
          </div>
          <div style="font-size:8.5pt;color:#666;margin-bottom:4px">Signature Image</div>
          <div style="width:100px;height:60px;border:1.5px dashed #ccc;border-radius:6px;background:#fafafa;display:flex;align-items:center;justify-content:center;font-size:8pt;color:#bbb;text-align:center;cursor:pointer">Click to upload signature</div>
        </div>
      </div>
    </div>
  </div>

  <div class="tip-box"><strong>Signature Upload:</strong> Click the dashed box to open a file picker. Select a PNG or JPG of the handwritten signature. The image is stored as a data URL and printed on all certificates. Click <em>Remove</em> below the preview to clear it.</div>

  <h3>Tab 4: Certificate Templates</h3>
  <p>View and preview the available certificate templates. Click the <strong>Preview</strong> button on any template to see how the certificate looks with your lab's data.</p>
  <table class="data-table">
    <tr><th>Template</th><th>Used For</th><th>Includes NABL Logo</th></tr>
    <tr><td>Template A — Standard NABL</td><td>Accredited calibrations</td><td>✅ Yes</td></tr>
    <tr><td>Template B — Non-NABL</td><td>In-house calibrations</td><td>❌ No</td></tr>
    <tr><td>Template C — Onsite</td><td>Onsite calibrations</td><td>Conditional</td></tr>
    <tr><td>Template D — Multi-point</td><td>Multi-range calibrations</td><td>✅ Yes</td></tr>
  </table>

  <h3>Tab 5: Data Management</h3>
  <p>Export data from all modules as CSV for external reporting or backup.</p>
  <ul>
    <li><strong>Load Sample Data</strong> — Populates the system with 5 records per module for demo/testing purposes</li>
    <li><strong>Export Customers</strong> — Download all customer records as CSV</li>
    <li><strong>Export Instruments</strong> — Download all instruments</li>
    <li><strong>Export Jobs</strong> — Download all jobs with status</li>
    <li><strong>Export Certificates</strong> — Certificate register as CSV</li>
    <li><strong>Export Invoices</strong> — All invoices with amounts</li>
    <li><strong>Export Leads</strong> — Sales pipeline export</li>
  </ul>
</div>

<!-- ═══════════════════════════════════════════════════
     CH 27 — CUSTOMER PORTAL
═══════════════════════════════════════════════════ -->
<div class="chapter" id="ch27">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 27</div>
    <div class="chapter-title">Customer Portal</div>
    <div class="chapter-desc">Self-service portal for customers to track jobs, download certificates, and raise complaints</div>
  </div>

  <h3>What is the Customer Portal?</h3>
  <p>The Customer Portal is a separate login interface available at <code>/portal</code>. Customers use it to independently check their calibration job status, download certificates, submit complaints, and give feedback — without contacting the lab directly.</p>

  <h3>Portal Login</h3>
  <div class="screen">
    <div class="screen-topbar"><span class="screen-topbar-title">🌐 Customer Portal — Login</span></div>
    <div class="screen-content" style="background:#f5f7fa;padding:40px;display:flex;justify-content:center">
      <div style="background:#fff;border-radius:16px;padding:32px;width:380px;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <div style="text-align:center;margin-bottom:20px">
          <div style="font-size:24px">🏭</div>
          <div style="font-size:12pt;font-weight:700;color:#0f3460">Customer Portal Login</div>
          <div style="font-size:9pt;color:#888;margin-top:4px">Track your calibration jobs</div>
        </div>
        <div style="margin-bottom:10px">
          <div style="font-size:9pt;font-weight:600;margin-bottom:4px">Lab Accreditation Code</div>
          <div style="border:1px solid #d9d9d9;border-radius:6px;padding:7px 11px;font-size:9pt;color:#bbb">Enter lab code (e.g. NABL-12345)</div>
        </div>
        <div style="margin-bottom:10px">
          <div style="font-size:9pt;font-weight:600;margin-bottom:4px">Email Address</div>
          <div style="border:1px solid #d9d9d9;border-radius:6px;padding:7px 11px;font-size:9pt;color:#bbb">your@email.com</div>
        </div>
        <div style="margin-bottom:16px">
          <div style="font-size:9pt;font-weight:600;margin-bottom:4px">Password</div>
          <div style="border:1px solid #d9d9d9;border-radius:6px;padding:7px 11px;font-size:9pt;color:#bbb">••••••••</div>
        </div>
        <div style="background:#1677ff;color:#fff;border-radius:8px;padding:9px;text-align:center;font-size:10pt;font-weight:600">Sign In</div>
      </div>
    </div>
  </div>

  <h3>Setting Up Portal Access for a Customer</h3>
  <ol>
    <li>Go to <strong>Customers</strong> module</li>
    <li>Find the customer and click the 🔒 (Lock) icon</li>
    <li>Enter a portal password and click <em>Set Password</em></li>
    <li>Share the customer's registered email, the new password, and your lab's accreditation code with them</li>
    <li>The customer logs in at <code>/portal</code></li>
  </ol>

  <h3>Portal Tabs</h3>
  <table class="data-table">
    <tr><th>Tab</th><th>What the Customer Sees / Can Do</th></tr>
    <tr>
      <td>📋 My Jobs</td>
      <td>View all calibration jobs for their instruments: job number, instrument name, current status, date received</td>
    </tr>
    <tr>
      <td>🏅 Certificates</td>
      <td>View all issued certificates. Click <em>Download</em> to get a PDF of the certificate with full datasheet</td>
    </tr>
    <tr>
      <td>🔧 My Instruments</td>
      <td>View all instruments registered under their account with calibration due dates</td>
    </tr>
    <tr>
      <td>⚠️ Raise Complaint</td>
      <td>Submit a complaint with a subject and description. It instantly appears in the lab's <em>Quality → Complaints</em> module</td>
    </tr>
    <tr>
      <td>⭐ Feedback</td>
      <td>Rate the lab on 4 dimensions (Turnaround Time, Certificate Quality, Staff Behaviour, Overall Satisfaction) and add comments</td>
    </tr>
  </table>

  <div class="tip-box"><strong>Portal Complaints:</strong> When a customer submits a complaint from the portal, it creates a record in the lab's Complaints module with the prefix <code>PORTAL/</code> and is immediately visible to the Quality Manager and Lab Admin.</div>

  <h3>Certificate Download (Portal)</h3>
  <p>When a customer clicks Download on a certificate in the portal, the system fetches the full certificate data and generates a formatted HTML certificate that opens in a new browser tab, which can then be printed or saved as PDF.</p>
</div>

<!-- ═══════════════════════════════════════════════════
     APPENDIX
═══════════════════════════════════════════════════ -->
<div class="chapter" style="page-break-before:always">
  <div class="chapter-header">
    <div class="chapter-num">Appendix</div>
    <div class="chapter-title">Quick Reference</div>
    <div class="chapter-desc">Keyboard shortcuts, status codes, and glossary</div>
  </div>

  <h3>Status Code Reference</h3>
  <table class="data-table">
    <tr><th>Code</th><th>Module</th><th>Meaning</th></tr>
    <tr><td>RECEIVED</td><td>Jobs</td><td>Instrument received at lab, job created</td></tr>
    <tr><td>WAITING</td><td>Jobs</td><td>Waiting for engineer availability or parts</td></tr>
    <tr><td>ASSIGNED</td><td>Jobs</td><td>Engineer has been assigned</td></tr>
    <tr><td>IN_CALIBRATION</td><td>Jobs</td><td>Calibration work in progress</td></tr>
    <tr><td>PENDING_REVIEW</td><td>Jobs</td><td>Engineer submitted; awaiting Technical Manager review</td></tr>
    <tr><td>CORRECTION_REQUIRED</td><td>Jobs</td><td>Technical Manager flagged issues; engineer must re-do</td></tr>
    <tr><td>APPROVED</td><td>Jobs</td><td>Technical Manager approved; ready for certificate</td></tr>
    <tr><td>CERTIFICATE_GENERATED</td><td>Jobs</td><td>Certificate issued and available for download</td></tr>
    <tr><td>DELIVERED</td><td>Jobs</td><td>Instrument returned to customer</td></tr>
    <tr><td>CLOSED</td><td>Jobs</td><td>Job fully complete, no further action</td></tr>
    <tr><td>NABL</td><td>Certificates</td><td>Issued under NABL accreditation scope</td></tr>
    <tr><td>Non-NABL</td><td>Certificates</td><td>Issued outside NABL accreditation scope</td></tr>
  </table>

  <h3>Glossary</h3>
  <table class="data-table">
    <tr><th>Term</th><th>Definition</th></tr>
    <tr><td>NABL</td><td>National Accreditation Board for Testing and Calibration Laboratories — India's accreditation body</td></tr>
    <tr><td>NCR</td><td>Non-Conformance Report — document describing a deviation from defined quality requirements</td></tr>
    <tr><td>CAPA</td><td>Corrective and Preventive Action — actions taken to eliminate root causes and prevent recurrence</td></tr>
    <tr><td>DC</td><td>Delivery Challan — goods movement document</td></tr>
    <tr><td>Measurand</td><td>The physical quantity being measured during calibration</td></tr>
    <tr><td>Traceability</td><td>Chain linking calibration results back to national/international measurement standards</td></tr>
    <tr><td>MUT</td><td>Measurement Under Test — the instrument being calibrated</td></tr>
    <tr><td>CMC</td><td>Calibration and Measurement Capability — the lab's best achievable uncertainty</td></tr>
    <tr><td>SOP</td><td>Standard Operating Procedure</td></tr>
    <tr><td>Portal</td><td>The customer-facing self-service web interface at /portal</td></tr>
  </table>

  <h3>Support</h3>
  <p>For technical support or feature requests, contact your system administrator or the CLMS support team.</p>

  <div style="margin-top:60px;padding:28px 32px;background:linear-gradient(135deg,#0f3460,#16213e);color:#fff;border-radius:16px;text-align:center">
    <!-- Logo row -->
    <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:5px;height:40px;background:#e94560;border-radius:2px"></div>
        <div style="text-align:left">
          <div style="font-size:18pt;font-weight:900;letter-spacing:2px;line-height:1">CORTEX</div>
          <div style="background:#1a1a1a;color:#fff;font-size:7pt;font-weight:700;letter-spacing:2px;padding:2px 8px;margin-top:2px">AI TECHNOLOGIES</div>
        </div>
      </div>
      <div style="width:1px;height:40px;background:rgba(255,255,255,.25);margin:0 12px"></div>
      <div style="font-size:24pt;font-weight:900;letter-spacing:-0.5px">
        <span style="color:#fff">Cortex</span><span style="color:#00BFFF">CLMS</span>
      </div>
    </div>
    <div style="font-size:10pt;opacity:.7;margin-bottom:14px">Complete User Manual · Version 1.0 · 2026</div>
    <div style="font-size:9pt;opacity:.5;margin-bottom:16px">This document covers all modules and functionality available in CLMS v1.0</div>
    <!-- Contact -->
    <div style="border-top:1px solid rgba(255,255,255,.2);padding-top:14px;display:flex;justify-content:center;gap:32px;font-size:9pt;opacity:.85;flex-wrap:wrap">
      <span>📞 +91 8329925318</span>
      <span>✉ cortexaitechnologies@zohomail.in</span>
      <span>📍 Pune, Maharashtra, India 411034</span>
    </div>
  </div>
</div>

</body>
</html>`;

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  // Give fonts/layout time to render
  await page.waitForTimeout(2000);
  await page.pdf({
    path: '/home/user/CLMS/CLMS-User-Manual.pdf',
    format: 'A4',
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    printBackground: true,
  });
  await browser.close();
  console.log('PDF generated successfully');
})();
