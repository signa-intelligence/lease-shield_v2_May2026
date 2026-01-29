import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, TableOfContents, BorderStyle, Table, TableRow, TableCell, WidthType } from 'npm:docx@8.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const language = user.language || 'en';

    // Document sections
    const sections = [];

    // Helper functions
    const heading1 = (text) => new Paragraph({
      text,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      style: "Heading1"
    });

    const heading2 = (text) => new Paragraph({
      text,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 150 },
      style: "Heading2"
    });

    const heading3 = (text) => new Paragraph({
      text,
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 100 },
      style: "Heading3"
    });

    const bodyText = (text) => new Paragraph({
      text,
      spacing: { after: 120 }
    });

    const bulletPoint = (text) => new Paragraph({
      text,
      bullet: { level: 0 },
      spacing: { after: 60 }
    });

    const numberedPoint = (text, level = 0) => new Paragraph({
      text,
      numbering: { reference: "default-numbering", level },
      spacing: { after: 60 }
    });

    const tipBox = (text) => new Paragraph({
      children: [
        new TextRun({ text: "💡 TIP: ", bold: true }),
        new TextRun({ text })
      ],
      spacing: { before: 120, after: 120 },
      shading: { fill: "FFF9E6" },
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: "C7A338" } }
    });

    const warningBox = (text) => new Paragraph({
      children: [
        new TextRun({ text: "⚠️ IMPORTANT: ", bold: true, color: "DC2626" }),
        new TextRun({ text })
      ],
      spacing: { before: 120, after: 120 },
      shading: { fill: "FEF2F2" },
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: "EF4444" } }
    });

    const pageBreak = () => new Paragraph({ pageBreakBefore: true });

    // COVER PAGE
    sections.push(
      new Paragraph({
        text: "LEASE SHIELD",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { before: 2000, after: 400 }
      }),
      new Paragraph({
        text: "USER MANUAL",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: "Complete Guide to Protecting Your Rental Rights",
        alignment: AlignmentType.CENTER,
        spacing: { after: 1000 },
        italics: true
      }),
      new Paragraph({
        text: "Version 1.0 | January 2026",
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: "Fair • Transparent • Protected",
        alignment: AlignmentType.CENTER,
        spacing: { after: 2000 },
        bold: true
      }),
      pageBreak()
    );

    // TABLE OF CONTENTS
    sections.push(
      new Paragraph({
        text: "TABLE OF CONTENTS",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 }
      }),
      new TableOfContents("Table of Contents", {
        hyperlink: true,
        headingStyleRange: "1-3"
      }),
      pageBreak()
    );

    // 1. WELCOME TO LEASE SHIELD
    sections.push(
      heading1("1. WELCOME TO LEASE SHIELD"),
      bodyText("Thank you for choosing Lease Shield to protect your rental rights. This manual will guide you through all features and help you get the most value from the platform."),
      
      heading2("1.1 What is Lease Shield?"),
      bodyText("Lease Shield is Thailand's first AI-powered rental protection platform designed specifically for tenants. We help you:"),
      bulletPoint("Understand your lease agreement with automated risk analysis"),
      bulletPoint("Track important dates and deadlines"),
      bulletPoint("Document evidence for potential disputes"),
      bulletPoint("Resolve deposit and tenancy disputes professionally"),
      bulletPoint("Access legal letter templates in multiple languages"),
      
      heading2("1.2 Who is Lease Shield for?"),
      bodyText("Lease Shield serves tenants in Thailand, including:"),
      bulletPoint("Expats renting condos or apartments"),
      bulletPoint("Thai nationals seeking rental protection"),
      bulletPoint("Digital nomads on long-term stays"),
      bulletPoint("Anyone who wants to understand their lease better"),
      bulletPoint("Renters concerned about deposit return"),
      
      heading2("1.3 How Lease Shield Protects You"),
      bodyText("We provide three layers of protection:"),
      bodyText("Layer 1: PREVENTION - Scan your lease before signing to identify risky clauses and unfair terms."),
      bodyText("Layer 2: TRACKING - Monitor deposits, rent payments, and important deadlines with automated reminders."),
      bodyText("Layer 3: RESOLUTION - Access professional dispute resolution services and legal letter templates when issues arise."),
      
      warningBox("Lease Shield is NOT a law firm and does not provide legal advice. We provide tools, guidance, and templates to help you navigate rental situations. For specific legal questions, consult a qualified Thai property lawyer."),
      
      heading2("1.4 Key Features Overview"),
      bulletPoint("Lease Scanner - AI analysis of your rental agreement"),
      bulletPoint("Deposit Tracker - Monitor your security deposit"),
      bulletPoint("Property Tracker - Manage rent and property details"),
      bulletPoint("Timeline & Calendar - Never miss important dates"),
      bulletPoint("Evidence Vault - Securely store photos and documents"),
      bulletPoint("Maintenance Tracker - Report and track repair requests"),
      bulletPoint("Case Management - Professional dispute resolution"),
      bulletPoint("Lisa AI Assistant - 24/7 help in multiple languages"),
      bulletPoint("Letter Templates - Professional correspondence in EN/TH"),
      
      pageBreak()
    );

    // 2. GETTING STARTED
    sections.push(
      heading1("2. GETTING STARTED"),
      
      heading2("2.1 Creating Your Account"),
      bodyText("To get started with Lease Shield:"),
      numberedPoint("Visit app.leaseshield.asia"),
      numberedPoint("Click 'Sign Up' or 'Get Started'"),
      numberedPoint("Enter your email address"),
      numberedPoint("Create a secure password (minimum 8 characters)"),
      numberedPoint("Verify your email address"),
      numberedPoint("Complete your profile (name, language preference)"),
      
      tipBox("Use a password manager to create and store a strong, unique password for your Lease Shield account."),
      
      heading2("2.2 Choosing Your Plan"),
      bodyText("Lease Shield offers four plan tiers to match your needs:"),
      bodyText("FREE TIER:"),
      bulletPoint("1 lease scan (lifetime)"),
      bulletPoint("Basic deposit tracking"),
      bulletPoint("Lisa AI assistant"),
      bulletPoint("Read-only access to features"),
      bodyText("LITE PLAN (฿158/month, ฿1,575/year):"),
      bulletPoint("6 lease scans per year"),
      bulletPoint("Full deposit and rent tracking"),
      bulletPoint("Timeline and calendar"),
      bulletPoint("Evidence vault (unlimited storage)"),
      bulletPoint("1 free Resolve case"),
      bodyText("PROTECT PLAN (฿325/month, ฿3,234/year):"),
      bulletPoint("12 lease scans per year"),
      bulletPoint("All Lite features"),
      bulletPoint("Maintenance request tracking"),
      bulletPoint("Priority Lisa support"),
      bulletPoint("5 letter credits/month"),
      bulletPoint("Discounted Resolve pricing (฿3,500 vs ฿5,000)"),
      bodyText("SECURE PLAN (฿825/month, ฿8,208/year):"),
      bulletPoint("Unlimited lease scans"),
      bulletPoint("All Protect features"),
      bulletPoint("20 letter credits/month"),
      bulletPoint("Priority case handling"),
      bulletPoint("Fast-track dispute resolution"),
      bulletPoint("Dedicated case officer"),
      
      tipBox("Annual plans save you 17% compared to monthly billing. Recommended for long-term renters."),
      
      heading2("2.3 Dashboard Overview"),
      bodyText("After logging in, you'll see your Dashboard with:"),
      bulletPoint("Protection Score - Your overall rental protection level"),
      bulletPoint("Quick Actions - Upload lease, track deposit, create case"),
      bulletPoint("Upcoming Events - Important dates and deadlines"),
      bulletPoint("Recent Activity - Your latest scans and actions"),
      bulletPoint("Notifications - Alerts and reminders"),
      
      heading2("2.4 Quick Guide Walkthrough"),
      bodyText("First-time users will see an interactive Quick Guide covering:"),
      numberedPoint("How to scan your first lease"),
      numberedPoint("Setting up deposit tracking"),
      numberedPoint("Enabling notifications"),
      numberedPoint("Chatting with Lisa"),
      bodyText("You can reopen the Quick Guide anytime by clicking the info icon (ℹ️) in the top navigation."),
      
      heading2("2.5 Setting Language Preference"),
      bodyText("To change your language:"),
      numberedPoint("Click the Menu icon (≡) in top right"),
      numberedPoint("Select 'Language'"),
      numberedPoint("Choose your preferred language"),
      numberedPoint("Interface updates immediately"),
      bodyText("Supported languages: English, Thai, Chinese, Japanese, Korean, Russian"),
      
      pageBreak()
    );

    // 3. UPLOADING & SCANNING YOUR LEASE
    sections.push(
      heading1("3. UPLOADING & SCANNING YOUR LEASE"),
      bodyText("Your lease is the foundation of your rental relationship. Lease Shield's AI scanner analyzes it to identify risky clauses, missing protections, and important dates."),
      
      heading2("3.1 How to Upload a Lease"),
      numberedPoint("Tap the 'Scan' tab in bottom navigation"),
      numberedPoint("Read and accept the Lease Scan Disclaimer"),
      numberedPoint("Click 'Upload & Scan' button"),
      numberedPoint("Select your lease document (PDF or photos)"),
      numberedPoint("Wait 20-30 seconds for AI analysis"),
      numberedPoint("Review your scan results"),
      
      tipBox("If your lease is in paper format, use your phone camera to photograph each page clearly. Make sure all text is readable before uploading."),
      
      heading2("3.2 Supported File Formats"),
      bodyText("Lease Shield accepts:"),
      bulletPoint("PDF files (recommended for best accuracy)"),
      bulletPoint("PNG images"),
      bulletPoint("JPG/JPEG images"),
      bulletPoint("Multiple images (for multi-page leases)"),
      warningBox("Maximum file size: 10MB per file. For files larger than 10MB, split into multiple pages or reduce image quality."),
      
      heading2("3.3 Understanding Your Risk Score"),
      bodyText("After scanning, you'll see a Risk Score from 0-100:"),
      bulletPoint("0-24: Low Risk (Green) - Well-balanced lease with good tenant protections"),
      bulletPoint("25-49: Medium Risk (Yellow) - Some concerning clauses, review recommended"),
      bulletPoint("50-74: High Risk (Orange) - Multiple problematic areas, consider negotiation"),
      bulletPoint("75-100: Critical Risk (Red) - Severely tenant-unfavorable, seek legal advice"),
      
      heading2("3.4 Reading Flagged Clauses"),
      bodyText("Lease Shield identifies issues in your lease and categorizes them by severity:"),
      bodyText("CRITICAL FLAGS (Red):"),
      bulletPoint("Terms that could result in significant financial loss"),
      bulletPoint("Clauses that waive essential tenant rights"),
      bulletPoint("Illegal or unenforceable provisions under Thai law"),
      bodyText("HIGH FLAGS (Orange):"),
      bulletPoint("Very one-sided terms favoring the landlord"),
      bulletPoint("Unusual penalties or restrictions"),
      bulletPoint("Vague language that could be misinterpreted"),
      bodyText("MEDIUM FLAGS (Yellow):"),
      bulletPoint("Terms that may be negotiable"),
      bulletPoint("Missing standard protections"),
      bodyText("LOW FLAGS (Blue):"),
      bulletPoint("Minor suggestions for clarity"),
      bulletPoint("Best practice recommendations"),
      
      heading2("3.5 What to Do with High-Risk Findings"),
      bodyText("If your lease has high or critical risk flags:"),
      numberedPoint("Review each flagged clause carefully"),
      numberedPoint("Use Lease Shield's recommendations as negotiation points"),
      numberedPoint("Request amendments from your landlord BEFORE signing"),
      numberedPoint("Consider consulting a Thai property lawyer for critical issues"),
      numberedPoint("Document all communications about lease amendments"),
      warningBox("Never sign a lease you don't understand or that makes you uncomfortable. It's easier to negotiate before signing than to dispute after."),
      
      heading2("3.6 Re-Scanning a Lease"),
      bodyText("You can re-scan a lease if:"),
      bulletPoint("You received an updated version from landlord"),
      bulletPoint("The initial scan had errors"),
      bulletPoint("You added missing pages"),
      bodyText("Note: Re-scans count toward your monthly/annual scan limit."),
      
      pageBreak()
    );

    // 4. TRACKING YOUR DEPOSIT
    sections.push(
      heading1("4. TRACKING YOUR DEPOSIT"),
      bodyText("Security deposits in Thailand typically range from 1-3 months rent. Lease Shield helps ensure yours is returned on time and in full."),
      
      heading2("4.1 Adding Deposit Information"),
      bodyText("To manually add a deposit:"),
      numberedPoint("Go to Property Tracker page"),
      numberedPoint("Click 'Track Deposit' button"),
      numberedPoint("Enter deposit amount (in THB)"),
      numberedPoint("Enter date you paid the deposit"),
      numberedPoint("Set expected return date (usually lease end + 7-30 days)"),
      numberedPoint("Add property address"),
      numberedPoint("Click 'Save'"),
      tipBox("If you scanned your lease first, Lease Shield automatically creates your deposit tracker with information extracted from the lease. Just verify it's correct!"),
      
      heading2("4.2 Automatic Reminders"),
      bodyText("Lease Shield sends automated reminders:"),
      bulletPoint("30 days before expected return - 'Deposit return coming up'"),
      bulletPoint("7 days before expected return - 'Prepare for move-out inspection'"),
      bulletPoint("3 days before expected return - 'Reminder: deposit return in 3 days'"),
      bulletPoint("On expected return date - 'Deposit should be returned today'"),
      bulletPoint("7 days after (if overdue) - 'Deposit overdue - consider action'"),
      
      heading2("4.3 Deposit Statuses"),
      bodyText("Your deposit can have these statuses:"),
      bodyText("TRACKING - Active monitoring, return date upcoming"),
      bodyText("RETURNED - Deposit successfully received back"),
      bodyText("DISPUTED - Issues with return, case may be open"),
      bodyText("ARCHIVED - Closed/historical deposit"),
      
      heading2("4.4 What If Deposit Isn't Returned?"),
      bodyText("If your deposit isn't returned within 7 days after expected date:"),
      numberedPoint("Document the timeline in Evidence Vault"),
      numberedPoint("Send a formal request letter (use Letter Templates)"),
      numberedPoint("Wait 7-14 days for landlord response"),
      numberedPoint("If no response, open a Case for professional help"),
      numberedPoint("Lease Shield's Resolve service can help recover your deposit"),
      warningBox("Under Thai Civil and Commercial Code Section 572, landlords must return deposits within a reasonable timeframe (typically 7-30 days). Unreasonable delays may constitute breach of contract."),
      
      pageBreak()
    );

    // 5. PROPERTY TRACKER
    sections.push(
      heading1("5. PROPERTY TRACKER"),
      bodyText("The Property Tracker is your central hub for managing all rental-related information for each property you rent."),
      
      heading2("5.1 Adding a Property"),
      bodyText("Properties are usually added automatically when you scan a lease, but you can add manually:"),
      numberedPoint("Navigate to Property tab"),
      numberedPoint("Click 'Add Property'"),
      numberedPoint("Enter property address"),
      numberedPoint("Add monthly rent amount"),
      numberedPoint("Set rent due day (1-31)"),
      numberedPoint("Link to your lease (if scanned)"),
      numberedPoint("Save"),
      
      heading2("5.2 Rent Payment Reminders"),
      bodyText("Never miss rent payment:"),
      numberedPoint("Set your rent due day (e.g., 1st of each month)"),
      numberedPoint("Enable rent alerts in property settings"),
      numberedPoint("Choose reminder timing (3 days before recommended)"),
      numberedPoint("Receive alerts via email and LINE"),
      tipBox("Even if you pay rent via bank auto-transfer, reminders help you verify the transfer went through."),
      
      heading2("5.3 Managing Multiple Properties"),
      bodyText("If you rent multiple units or have roommates with separate leases:"),
      bulletPoint("Each property appears as a separate card"),
      bulletPoint("Toggle between active and archived properties"),
      bulletPoint("Each property has its own deposit and timeline"),
      bulletPoint("Use property address as the unique identifier"),
      
      pageBreak()
    );

    // 6. TIMELINE & CALENDAR
    sections.push(
      heading1("6. TIMELINE & CALENDAR"),
      bodyText("Your Timeline is a chronological view of all rental-related events - past, present, and future."),
      
      heading2("6.1 Understanding Your Timeline"),
      bodyText("The Timeline automatically captures:"),
      bulletPoint("Lease scan dates"),
      bulletPoint("Lease start and end dates"),
      bulletPoint("Deposit payment and expected return dates"),
      bulletPoint("Rent due dates (recurring monthly)"),
      bulletPoint("Notice period deadlines"),
      bulletPoint("Maintenance requests and resolutions"),
      bulletPoint("Case creation and milestones"),
      bulletPoint("Notification reminders sent"),
      
      heading2("6.2 Timeline Views"),
      bodyText("CALENDAR VIEW:"),
      bulletPoint("Visual month-by-month calendar"),
      bulletPoint("Events shown on specific dates"),
      bulletPoint("Click a date to see details in popover"),
      bulletPoint("Navigate between months with arrow buttons"),
      bodyText("LIST VIEW:"),
      bulletPoint("Chronological list of all events"),
      bulletPoint("Sorted by date (newest or oldest first)"),
      bulletPoint("Filter by event type"),
      bulletPoint("Expandable event cards for details"),
      bodyText("UPCOMING VIEW:"),
      bulletPoint("Shows only future events"),
      bulletPoint("Highlights urgent items"),
      bulletPoint("Countdown to important deadlines"),
      
      heading2("6.3 Event Types and Filters"),
      bodyText("Filter timeline by:"),
      bulletPoint("Lease events - scans, start, end dates"),
      bulletPoint("Deposit events - payments, returns"),
      bulletPoint("Rent events - monthly due dates"),
      bulletPoint("Maintenance events - requests and resolutions"),
      bulletPoint("Case events - creation, updates, closures"),
      bulletPoint("Notification events - reminders sent"),
      
      tipBox("Use filters to focus on specific topics. For example, filter by 'Deposit' to see your full deposit history at a glance."),
      
      pageBreak()
    );

    // 7. EVIDENCE VAULT
    sections.push(
      heading1("7. EVIDENCE VAULT"),
      bodyText("Documentation is critical if disputes arise. The Evidence Vault helps you organize and securely store all rental-related files."),
      
      heading2("7.1 Why Evidence Matters"),
      bodyText("In Thai rental disputes, evidence determines outcomes. Strong evidence includes:"),
      bulletPoint("Photos of property condition at move-in"),
      bulletPoint("Photos of damages or maintenance issues"),
      bulletPoint("Receipts for deposit and rent payments"),
      bulletPoint("Chat logs with landlord"),
      bulletPoint("Email correspondence"),
      bulletPoint("Repair invoices"),
      
      heading2("7.2 What to Document"),
      bodyText("MOVE-IN (Critical!):"),
      bulletPoint("Every room from multiple angles"),
      bulletPoint("Existing damages, scratches, stains"),
      bulletPoint("Condition of appliances and fixtures"),
      bulletPoint("Meter readings (water, electricity)"),
      bodyText("DURING TENANCY:"),
      bulletPoint("Maintenance issues as they arise"),
      bulletPoint("Any new damages (accidental or otherwise)"),
      bulletPoint("Communications with landlord about issues"),
      bodyText("MOVE-OUT:"),
      bulletPoint("Cleaned condition before inspection"),
      bulletPoint("Meter readings at departure"),
      bulletPoint("Signed inspection report"),
      bulletPoint("Proof of keys returned"),
      
      heading2("7.3 Uploading Evidence"),
      numberedPoint("Navigate to Evidence tab"),
      numberedPoint("Click 'Upload' button"),
      numberedPoint("Select file type (photo, receipt, chat, etc.)"),
      numberedPoint("Choose files from device or take photo"),
      numberedPoint("Add descriptive label"),
      numberedPoint("Optionally link to lease or case"),
      numberedPoint("Save"),
      
      tipBox("Add labels like 'Move-in condition - bedroom 1' or 'Water damage - bathroom ceiling - 15 Jan 2026' to make evidence easy to find later."),
      
      heading2("7.4 Organizing Evidence"),
      bulletPoint("Filter by type (photos, receipts, chats, etc.)"),
      bulletPoint("Search by label or date"),
      bulletPoint("Link evidence to specific cases"),
      bulletPoint("Download all evidence as ZIP file"),
      
      warningBox("Never delete original evidence files from your device until your lease ends and deposit is fully returned. Keep backups in cloud storage (Google Drive, iCloud, etc.)."),
      
      pageBreak()
    );

    // 8. MAINTENANCE REQUESTS
    sections.push(
      heading1("8. MAINTENANCE REQUESTS"),
      bodyText("Track and document all maintenance issues to protect yourself from unfair damage claims."),
      
      heading2("8.1 Reporting Maintenance Issues"),
      numberedPoint("Go to Property tab or Timeline"),
      numberedPoint("Click 'Report Maintenance'"),
      numberedPoint("Select issue category (plumbing, electrical, etc.)"),
      numberedPoint("Add title and detailed description"),
      numberedPoint("Upload photos or videos showing the issue"),
      numberedPoint("Set priority level"),
      numberedPoint("Submit"),
      
      heading2("8.2 Maintenance Categories"),
      bulletPoint("Plumbing - Leaks, clogs, water pressure"),
      bulletPoint("Electrical - Wiring, outlets, circuit breakers"),
      bulletPoint("Structural - Walls, floors, ceiling damage"),
      bulletPoint("Appliances - AC, fridge, water heater"),
      bulletPoint("HVAC - Air conditioning, ventilation"),
      bulletPoint("Pest - Insects, rodents"),
      bulletPoint("Other - Anything not listed above"),
      
      heading2("8.3 Tracking Repair Status"),
      bodyText("Maintenance requests progress through these stages:"),
      bulletPoint("REPORTED - You submitted the issue"),
      bulletPoint("ACKNOWLEDGED - Landlord confirmed receipt"),
      bulletPoint("IN PROGRESS - Repair work underway"),
      bulletPoint("COMPLETED - Landlord marked as fixed"),
      bulletPoint("REJECTED - Landlord denied responsibility"),
      
      heading2("8.4 Communicating with Landlord"),
      bodyText("Use the built-in communication log to:"),
      bulletPoint("Send messages to landlord"),
      bulletPoint("Track all conversations"),
      bulletPoint("Add follow-up comments"),
      bulletPoint("Upload completion photos"),
      tipBox("Always communicate through Lease Shield for maintenance issues - it creates a timestamped record you can use if disputes arise."),
      
      heading2("8.5 Escalating Issues"),
      bodyText("If maintenance isn't addressed within reasonable time (7-14 days for non-urgent issues):"),
      numberedPoint("Send formal letter using Letter Templates"),
      numberedPoint("Document landlord's lack of response"),
      numberedPoint("If health/safety issue, open a Case for legal guidance"),
      numberedPoint("For serious breaches, consult a lawyer"),
      
      pageBreak()
    );

    // 9. CASES & DISPUTE RESOLUTION
    sections.push(
      heading1("9. CASES & DISPUTE RESOLUTION"),
      bodyText("When friendly resolution fails, Lease Shield's Resolve service provides professional dispute resolution support."),
      
      heading2("9.1 When to Open a Case"),
      bodyText("Consider opening a case if:"),
      bulletPoint("Landlord won't return your deposit after 14+ days"),
      bulletPoint("You're being charged for pre-existing damages"),
      bulletPoint("Landlord demands payment for unreasonable repairs"),
      bulletPoint("You need to terminate lease early due to landlord breach"),
      bulletPoint("Serious maintenance issues are ignored"),
      
      heading2("9.2 Types of Cases"),
      bodyText("DEPOSIT RETURN:"),
      bulletPoint("Most common case type"),
      bulletPoint("For withheld or partially returned deposits"),
      bulletPoint("Success rate: ~85% when evidence is strong"),
      bodyText("DAMAGES DISPUTE:"),
      bulletPoint("Landlord claims excessive damages"),
      bulletPoint("Requires move-in/move-out photo evidence"),
      bodyText("EARLY TERMINATION:"),
      bulletPoint("Breaking lease due to landlord breach"),
      bulletPoint("Uninhabitable conditions or safety issues"),
      bodyText("OTHER:"),
      bulletPoint("Unusual disputes not covered above"),
      
      heading2("9.3 Resolve Service Pricing"),
      bodyText("MEMBER RATES (Lite, Protect, Secure plans):"),
      bulletPoint("฿3,500 all-inclusive"),
      bulletPoint("Includes letter drafting, case management, and guidance"),
      bulletPoint("Lite plan members: 1 free case per year"),
      bulletPoint("No hidden fees or success commissions"),
      bodyText("PUBLIC RATES (Free tier or non-members):"),
      bulletPoint("฿5,000 per case"),
      bulletPoint("Same service quality as members"),
      warningBox("All Resolve payments are final and non-refundable. We work hard to help you, but cannot guarantee specific outcomes as results depend on your evidence, landlord cooperation, and legal circumstances."),
      
      heading2("9.4 Case Process Timeline"),
      bodyText("Here's what happens after you create a case:"),
      numberedPoint("PAYMENT - Pay Resolve fee via Stripe checkout"),
      numberedPoint("INTAKE (0-24 hours) - Case officer reviews your submission"),
      numberedPoint("EVIDENCE REVIEW (1-3 days) - Officer assesses your evidence strength"),
      numberedPoint("LETTER DRAFTING (2-5 days) - Professional legal letters prepared"),
      numberedPoint("CLIENT REVIEW - You approve letters before sending"),
      numberedPoint("LETTER SENT - Letters delivered to landlord via email"),
      numberedPoint("LANDLORD RESPONSE - Wait 14 days for landlord reply"),
      numberedPoint("NEGOTIATION - Officer guides you through settlement discussions"),
      numberedPoint("RESOLUTION - Case closed when settled or escalated to lawyer"),
      bodyText("Typical duration: 14-30 days depending on landlord responsiveness"),
      
      heading2("9.5 Evidence Requirements"),
      bodyText("Strong cases require:"),
      bulletPoint("MUST HAVE: Original lease agreement"),
      bulletPoint("MUST HAVE: Proof of deposit payment (bank transfer, receipt)"),
      bulletPoint("MUST HAVE: Move-in condition photos"),
      bulletPoint("RECOMMENDED: Chat logs with landlord"),
      bulletPoint("RECOMMENDED: Move-out condition photos"),
      bulletPoint("RECOMMENDED: Inspection reports (if any)"),
      warningBox("Cases without move-in photos are significantly weaker. Always document property condition on day one of your tenancy."),
      
      heading2("9.6 Letter Escalation Process"),
      bodyText("Lease Shield uses a professional escalation strategy:"),
      bodyText("LETTER 1 - Friendly Request:"),
      bulletPoint("Polite tone, assumes good faith"),
      bulletPoint("Requests deposit return with deadline"),
      bulletPoint("References lease terms and Thai law"),
      bodyText("LETTER 2 - Formal Demand (if no response):"),
      bulletPoint("More assertive tone"),
      bulletPoint("Cites specific legal provisions"),
      bulletPoint("Mentions potential legal action"),
      bodyText("LETTER 3 - Final Notice (if still no response):"),
      bulletPoint("Strong legal language"),
      bulletPoint("Notice of intent to pursue legal remedies"),
      bulletPoint("Prepared for potential lawyer handoff"),
      
      tipBox("Most cases resolve after Letter 1 or 2. Professional, legally-sound letters show landlords you're serious and informed."),
      
      pageBreak()
    );

    // 10. LISA AI ASSISTANT
    sections.push(
      heading1("10. LISA - YOUR AI ASSISTANT"),
      bodyText("Lisa is Lease Shield's AI-powered assistant, available 24/7 to answer questions and guide you through rental situations."),
      
      heading2("10.1 What Lisa Can Help With"),
      bulletPoint("Explaining features and how to use Lease Shield"),
      bulletPoint("Clarifying flagged clauses in your lease scan"),
      bulletPoint("General information about Thai rental law"),
      bulletPoint("Guidance on what evidence to collect"),
      bulletPoint("Suggestions for handling landlord disputes"),
      bulletPoint("Step-by-step instructions for any feature"),
      
      heading2("10.2 What Lisa Cannot Do"),
      bulletPoint("Provide specific legal advice for your situation"),
      bulletPoint("Predict outcomes of disputes or cases"),
      bulletPoint("Directly contact your landlord"),
      bulletPoint("Make decisions for you"),
      bulletPoint("Access private lawyer consultations"),
      warningBox("Lisa is an AI assistant, not a lawyer. For specific legal questions about your case, consult a qualified Thai property lawyer or open a Resolve case."),
      
      heading2("10.3 How to Get Best Results"),
      bodyText("For accurate and helpful answers:"),
      bulletPoint("Be specific - 'My landlord won't fix the AC' vs 'I have a problem'"),
      bulletPoint("Provide context - mention your plan tier, lease details"),
      bulletPoint("Ask one question at a time"),
      bulletPoint("Use your preferred language - Lisa speaks EN, TH, ZH, JA, KO, RU"),
      
      heading2("10.4 Conversation History"),
      bodyText("Lisa remembers your conversation within each session:"),
      bulletPoint("Chat history saved automatically"),
      bulletPoint("Continue conversations across sessions"),
      bulletPoint("Maximum 100 messages per conversation"),
      bulletPoint("Start new conversation anytime for fresh context"),
      
      heading2("10.5 Accessing Lisa"),
      bodyText("Lisa is always one tap away:"),
      bulletPoint("Click the floating chat bubble icon (bottom right)"),
      bulletPoint("Type your question in the chat window"),
      bulletPoint("Receive instant responses"),
      bulletPoint("Follow up with clarifying questions"),
      
      pageBreak()
    );

    // 11. LETTER TEMPLATES
    sections.push(
      heading1("11. LETTER TEMPLATES"),
      bodyText("Professional letter templates help you communicate formally with landlords, building management, and authorities."),
      
      heading2("11.1 Accessing Template Library"),
      bodyText("From Dashboard or Cases page:"),
      numberedPoint("Click 'Templates' or navigate to Letters section"),
      numberedPoint("Browse templates by category"),
      numberedPoint("Click template to preview"),
      numberedPoint("Generate letter (costs 1 letter credit)"),
      
      heading2("11.2 Types of Letters Available"),
      bodyText("CHECKLISTS:"),
      bulletPoint("Move-in inspection checklist"),
      bulletPoint("Move-out inspection checklist"),
      bodyText("PRE-SIGNING:"),
      bulletPoint("Request for lease amendments"),
      bulletPoint("Clarification questions for landlord"),
      bodyText("INITIAL RESOLUTION:"),
      bulletPoint("Deposit return request"),
      bulletPoint("Maintenance request formal notice"),
      bodyText("PROFESSIONAL:"),
      bulletPoint("Formal complaint letter"),
      bulletPoint("Breach of contract notice"),
      bodyText("FINAL:"),
      bulletPoint("Legal demand letter"),
      bulletPoint("Notice before legal action"),
      
      heading2("11.3 Letter Credits System"),
      bodyText("Letters cost 1 credit per generation (all languages included):"),
      bulletPoint("Free tier: Purchase credits individually (฿99 for 3 credits)"),
      bulletPoint("Lite plan: No monthly credits (purchase as needed)"),
      bulletPoint("Protect plan: 5 credits/month included"),
      bulletPoint("Secure plan: 20 credits/month included"),
      bulletPoint("Unused credits roll over month-to-month"),
      
      heading2("11.4 Generating a Letter"),
      numberedPoint("Select template from library"),
      numberedPoint("Preview template content"),
      numberedPoint("Click 'Generate Letter'"),
      numberedPoint("System auto-fills your information (name, address, etc.)"),
      numberedPoint("Review and edit as needed"),
      numberedPoint("Download as Word document"),
      numberedPoint("Print or send to landlord"),
      
      tipBox("Letters are generated in both English and Thai automatically. Use the Thai version for landlords who prefer Thai, English for international landlords."),
      
      heading2("11.5 Customizing Letters"),
      bodyText("After generation, you can:"),
      bulletPoint("Edit text directly in the document"),
      bulletPoint("Add specific details about your situation"),
      bulletPoint("Attach additional documents or evidence"),
      bulletPoint("Translate to other languages if needed"),
      warningBox("Letters are templates for guidance. Always review and customize to match your specific situation before sending."),
      
      pageBreak()
    );

    // 12. NOTIFICATIONS
    sections.push(
      heading1("12. NOTIFICATIONS"),
      bodyText("Stay informed with automated notifications via email and LINE messaging."),
      
      heading2("12.1 Email Notifications"),
      bodyText("Lease Shield sends email alerts for:"),
      bulletPoint("Upcoming deposit return dates"),
      bulletPoint("Rent payment reminders"),
      bulletPoint("Lease end notice period deadlines"),
      bulletPoint("Case status updates"),
      bulletPoint("Maintenance request responses"),
      bulletPoint("Important platform updates"),
      bodyText("Emails are sent to your registered email address."),
      
      heading2("12.2 LINE Notifications"),
      bodyText("LINE is Thailand's most popular messaging app. Connect your LINE account for instant notifications:"),
      numberedPoint("Open Account settings"),
      numberedPoint("Find 'LINE Connection' section"),
      numberedPoint("Click 'Connect LINE'"),
      numberedPoint("Scan QR code or click link on mobile"),
      numberedPoint("Allow Lease Shield to send messages"),
      numberedPoint("Receive confirmation message"),
      
      heading2("12.3 Setting Up Landlord LINE Connection"),
      bodyText("Optional but recommended - notify your landlord via LINE:"),
      numberedPoint("Add landlord's LINE account info in property settings"),
      numberedPoint("Landlord receives maintenance updates automatically"),
      numberedPoint("Faster response times for repair requests"),
      tipBox("This feature requires landlord cooperation. If landlord prefers email, notifications still work via traditional email."),
      
      heading2("12.4 Notification Preferences"),
      bodyText("Customize what notifications you receive:"),
      numberedPoint("Go to Account → Notification Settings"),
      numberedPoint("Toggle notification types on/off"),
      numberedPoint("Choose delivery channel (email, LINE, or both)"),
      numberedPoint("Set reminder timing (3, 7, or 14 days before)"),
      numberedPoint("Save preferences"),
      
      heading2("12.5 Managing Notification Frequency"),
      bodyText("To reduce notification volume:"),
      bulletPoint("Disable specific event types you don't need"),
      bulletPoint("Choose 'Weekly Digest' instead of instant alerts"),
      bulletPoint("Turn off notifications for archived properties"),
      bulletPoint("Mute during vacations (pause all reminders)"),
      
      pageBreak()
    );

    // 13. SUBSCRIPTION MANAGEMENT
    sections.push(
      heading1("13. SUBSCRIPTION MANAGEMENT"),
      
      heading2("13.1 Plan Comparison"),
      bodyText("Choose the plan that matches your rental situation:"),
      bodyText("LITE (฿158/month) - Best for:"),
      bulletPoint("Short-term renters (1-2 year lease)"),
      bulletPoint("Single property rental"),
      bulletPoint("Basic protection needs"),
      bodyText("PROTECT (฿325/month) - Best for:"),
      bulletPoint("Long-term renters (2+ years)"),
      bulletPoint("Frequent maintenance issues"),
      bulletPoint("Users who need regular letter templates"),
      bodyText("SECURE (฿825/month) - Best for:"),
      bulletPoint("Multiple properties or frequent moves"),
      bulletPoint("Users managing rentals for family/friends"),
      bulletPoint("Those wanting unlimited scans and priority support"),
      
      heading2("13.2 Upgrading Your Plan"),
      numberedPoint("Navigate to Account page"),
      numberedPoint("Scroll to 'Subscription' section"),
      numberedPoint("Click 'Upgrade' or 'Change Plan'"),
      numberedPoint("Select new plan tier"),
      numberedPoint("Choose monthly or annual billing"),
      numberedPoint("Complete payment via Stripe"),
      numberedPoint("Plan activates immediately"),
      
      tipBox("Upgrading mid-cycle: You're charged prorated amount for remaining days. Your new benefits start immediately."),
      
      heading2("13.3 Annual vs Monthly Billing"),
      bodyText("Annual plans offer significant savings:"),
      bulletPoint("Lite: ฿1,896/year → ฿1,575/year (save ฿321)"),
      bulletPoint("Protect: ฿3,900/year → ฿3,234/year (save ฿666)"),
      bulletPoint("Secure: ฿9,900/year → ฿8,208/year (save ฿1,692)"),
      bulletPoint("17% discount on all annual plans"),
      bulletPoint("Billed once per year"),
      
      heading2("13.4 Canceling Your Subscription"),
      bodyText("To cancel (available anytime, no penalties):"),
      numberedPoint("Go to Account → Subscription"),
      numberedPoint("Click 'Cancel Subscription'"),
      numberedPoint("Confirm cancellation"),
      numberedPoint("Access continues until current period ends"),
      numberedPoint("No partial refunds for unused time"),
      warningBox("Canceling is immediate but access continues until your paid period ends. For example, if you cancel on Jan 15 with monthly billing through Jan 31, you keep access until Jan 31."),
      
      heading2("13.5 Billing Questions"),
      bodyText("For billing issues:"),
      bulletPoint("Check Account page → Billing History"),
      bulletPoint("Download invoices as PDF"),
      bulletPoint("Email billing@leaseshield.asia for disputes"),
      bulletPoint("Refunds only for verified billing errors"),
      
      pageBreak()
    );

    // 14. ACCOUNT SETTINGS
    sections.push(
      heading1("14. ACCOUNT SETTINGS"),
      bodyText("Manage your profile, preferences, and privacy from the Account page."),
      
      heading2("14.1 Updating Profile Information"),
      numberedPoint("Navigate to Account page"),
      numberedPoint("Click 'Edit Profile'"),
      numberedPoint("Update name, email, or phone number"),
      numberedPoint("Save changes"),
      warningBox("Changing your email requires email verification. You'll receive a confirmation link at the new address."),
      
      heading2("14.2 Language Settings"),
      bodyText("Switch between 6 supported languages:"),
      bulletPoint("English (EN) - Default"),
      bulletPoint("Thai (TH)"),
      bulletPoint("Chinese (ZH)"),
      bulletPoint("Japanese (JA)"),
      bulletPoint("Korean (KO)"),
      bulletPoint("Russian (RU)"),
      bodyText("Interface, notifications, and Lisa all adapt to your chosen language."),
      
      heading2("14.3 Dark Mode"),
      bodyText("Reduce eye strain with dark mode:"),
      numberedPoint("Account → Display Settings"),
      numberedPoint("Toggle 'Dark Mode' switch"),
      numberedPoint("Interface immediately switches to dark theme"),
      tipBox("Dark mode saves battery on OLED screens and is easier on eyes at night."),
      
      heading2("14.4 Privacy Settings & PDPA Compliance"),
      bodyText("Lease Shield complies with Thailand's Personal Data Protection Act (PDPA):"),
      bulletPoint("Export all your data - Account → Export Data"),
      bulletPoint("Request account deletion - Account → Delete Account"),
      bulletPoint("Review privacy policy - Account → Privacy Policy"),
      bulletPoint("Data encrypted in transit and at rest"),
      bulletPoint("No data sold to third parties"),
      
      heading2("14.5 Exporting Your Data"),
      bodyText("Under PDPA, you have the right to receive all your data:"),
      numberedPoint("Account → Export My Data"),
      numberedPoint("Receive download link via email (within 24 hours)"),
      numberedPoint("ZIP file includes all leases, scans, evidence, cases"),
      numberedPoint("Data provided in JSON and PDF formats"),
      
      heading2("14.6 Deleting Your Account"),
      warningBox("Account deletion is PERMANENT and IRREVERSIBLE. All data will be deleted within 30 days."),
      bodyText("To delete your account:"),
      numberedPoint("Account → Delete Account"),
      numberedPoint("Review consequences warning"),
      numberedPoint("Type 'DELETE' to confirm"),
      numberedPoint("Receive confirmation email"),
      numberedPoint("Data deleted within 30 days per PDPA"),
      
      pageBreak()
    );

    // 15. REFERRAL PROGRAM
    sections.push(
      heading1("15. REFERRAL PROGRAM"),
      bodyText("Earn credits by referring friends to Lease Shield."),
      
      heading2("15.1 How Referrals Work"),
      numberedPoint("Share your unique referral link"),
      numberedPoint("Friend signs up using your link"),
      numberedPoint("Friend subscribes to any paid plan"),
      numberedPoint("You receive ฿200 credit"),
      numberedPoint("Friend gets 10% off first month"),
      
      heading2("15.2 Sharing Your Referral Link"),
      numberedPoint("Account → Referrals"),
      numberedPoint("Copy your unique link"),
      numberedPoint("Share via LINE, email, social media"),
      numberedPoint("Track referrals in dashboard"),
      
      heading2("15.3 Earning Referral Credits"),
      bodyText("Credit rules:"),
      bulletPoint("฿200 THB credit per successful referral"),
      bulletPoint("Credits awarded when friend makes first payment"),
      bulletPoint("Both referrer and friend must be active"),
      bulletPoint("No limit to number of referrals"),
      bulletPoint("Credits can be used for letters, case fees, or subscriptions"),
      
      heading2("15.4 Using Referral Credits"),
      bodyText("Apply credits to:"),
      bulletPoint("Letter template purchases"),
      bulletPoint("Case/Resolve service fees"),
      bulletPoint("Subscription payments (partial payment)"),
      bulletPoint("Credits never expire"),
      
      pageBreak()
    );

    // 16. TROUBLESHOOTING
    sections.push(
      heading1("16. TROUBLESHOOTING"),
      
      heading2("16.1 Login Issues"),
      bodyText("Can't log in?"),
      bulletPoint("Check email and password are correct"),
      bulletPoint("Click 'Forgot Password' to reset"),
      bulletPoint("Clear browser cache and cookies"),
      bulletPoint("Try different browser (Chrome recommended)"),
      bulletPoint("Check email for verification link (new accounts)"),
      
      heading2("16.2 File Upload Problems"),
      bodyText("Upload failing?"),
      bulletPoint("Check file size (max 10MB per file)"),
      bulletPoint("Verify file format (PDF, PNG, JPG only)"),
      bulletPoint("Try uploading one page at a time"),
      bulletPoint("On Android + Google Drive: Download file to device first"),
      bulletPoint("Check internet connection stability"),
      
      heading2("16.3 Notifications Not Received"),
      bodyText("Missing notifications?"),
      bulletPoint("Check spam/junk folder for emails"),
      bulletPoint("Verify email address in Account settings"),
      bulletPoint("Confirm LINE connection is active"),
      bulletPoint("Check notification preferences are enabled"),
      bulletPoint("Add noreply@leaseshield.asia to contacts"),
      
      heading2("16.4 Can't Find My Lease/Deposit/Case"),
      bulletPoint("Check 'Archived' or 'Deleted' filters"),
      bulletPoint("Use Search function (top right)"),
      bulletPoint("Verify you're logged into correct account"),
      bulletPoint("Check Timeline for historical events"),
      
      heading2("16.5 Lisa Not Responding"),
      bulletPoint("Refresh the page"),
      bulletPoint("Close and reopen chat window"),
      bulletPoint("Check internet connection"),
      bulletPoint("Clear browser cache"),
      bulletPoint("Try different browser if issue persists"),
      
      heading2("16.6 Payment Issues"),
      bulletPoint("Verify card has sufficient funds"),
      bulletPoint("Check if card supports international payments"),
      bulletPoint("Try different payment method"),
      bulletPoint("Contact your bank if payment repeatedly fails"),
      bulletPoint("Email billing@leaseshield.asia for help"),
      
      heading2("16.7 App Running Slow"),
      bulletPoint("Close unused browser tabs"),
      bulletPoint("Clear browser cache (Settings → Privacy)"),
      bulletPoint("Check device storage (low space slows apps)"),
      bulletPoint("Update browser to latest version"),
      bulletPoint("Try desktop version for complex tasks"),
      
      pageBreak()
    );

    // 17. FAQ
    sections.push(
      heading1("17. FREQUENTLY ASKED QUESTIONS"),
      
      heading2("General"),
      bodyText("Q: Is Lease Shield a law firm?"),
      bodyText("A: No. We provide tools and guidance but not legal advice. See Section 1.3."),
      bodyText(""),
      bodyText("Q: What languages are supported?"),
      bodyText("A: English, Thai, Chinese, Japanese, Korean, Russian. See Section 2.5."),
      bodyText(""),
      bodyText("Q: Can I use Lease Shield for commercial leases?"),
      bodyText("A: Lease Shield is designed for residential rentals only."),
      
      heading2("Scanning & Analysis"),
      bodyText("Q: How long does a lease scan take?"),
      bodyText("A: 20-30 seconds for most leases. See Section 3.1."),
      bodyText(""),
      bodyText("Q: What if my lease is in Thai?"),
      bodyText("A: Lease Shield supports Thai language leases. Analysis accuracy is the same as English."),
      bodyText(""),
      bodyText("Q: Can I scan a lease after I've already signed it?"),
      bodyText("A: Yes! While it's best to scan before signing, post-signature scans help you understand what you agreed to."),
      
      heading2("Deposits & Tracking"),
      bodyText("Q: When should my deposit be returned?"),
      bodyText("A: Typically 7-30 days after lease ends and property is inspected. See Section 4.4."),
      bodyText(""),
      bodyText("Q: Can landlords deduct for normal wear and tear?"),
      bodyText("A: No. Only actual damages beyond normal use. See Section 4.4."),
      
      heading2("Cases & Disputes"),
      bodyText("Q: How much does Resolve service cost?"),
      bodyText("A: ฿3,500 for members, ฿5,000 for non-members. See Section 9.3."),
      bodyText(""),
      bodyText("Q: What's the success rate?"),
      bodyText("A: ~85% when clients have strong evidence. See Section 9.2."),
      bodyText(""),
      bodyText("Q: Do you represent clients in court?"),
      bodyText("A: No. Resolve helps with pre-legal resolution. For court cases, we refer to partner lawyers."),
      
      heading2("Billing & Subscriptions"),
      bodyText("Q: Can I get a refund if I cancel?"),
      bodyText("A: No partial refunds. Access continues until end of paid period. See Section 13.4."),
      bodyText(""),
      bodyText("Q: What payment methods do you accept?"),
      bodyText("A: Credit/debit cards via Stripe. Thai bank transfers coming soon."),
      
      pageBreak()
    );

    // 18. GETTING HELP
    sections.push(
      heading1("18. GETTING HELP"),
      
      heading2("18.1 Built-in Help Resources"),
      bulletPoint("Quick Guide - Interactive tutorial (click ℹ️ icon)"),
      bulletPoint("Lisa AI Assistant - 24/7 instant help"),
      bulletPoint("This user manual - Comprehensive reference"),
      bulletPoint("FAQ page - Quick answers to common questions"),
      
      heading2("18.2 Contacting Support"),
      bodyText("For issues Lisa can't resolve:"),
      bulletPoint("Email: support@leaseshield.asia"),
      bulletPoint("Response time: 24-48 hours (business days)"),
      bulletPoint("Include: Account email, issue description, screenshots"),
      bulletPoint("For urgent billing issues: billing@leaseshield.asia"),
      
      heading2("18.3 For Legal Disputes"),
      warningBox("For active disputes with landlords, open a Case instead of emailing support. Cases receive faster, specialized attention from case officers."),
      
      heading2("18.4 Providing Feedback"),
      bodyText("Help us improve:"),
      bulletPoint("Rate your experience after case resolution"),
      bulletPoint("Report bugs or issues via support email"),
      bulletPoint("Suggest features on our roadmap page"),
      bulletPoint("Review us on Google or Facebook"),
      
      pageBreak()
    );

    // 19. LEGAL & PRIVACY
    sections.push(
      heading1("19. LEGAL & PRIVACY"),
      
      heading2("19.1 What Lease Shield Can and Cannot Do"),
      bodyText("✅ LEASE SHIELD CAN:"),
      bulletPoint("Analyze lease documents for common risks"),
      bulletPoint("Provide general guidance on Thai rental law"),
      bulletPoint("Help you organize evidence and documentation"),
      bulletPoint("Draft professional letters to landlords"),
      bulletPoint("Guide you through dispute resolution process"),
      bulletPoint("Connect you with partner lawyers if needed"),
      
      bodyText("❌ LEASE SHIELD CANNOT:"),
      bulletPoint("Provide specific legal advice for your situation"),
      bulletPoint("Represent you in court or legal proceedings"),
      bulletPoint("Guarantee outcomes of disputes"),
      bulletPoint("Force landlords to return deposits"),
      bulletPoint("Replace qualified legal counsel"),
      
      heading2("19.2 Privacy Policy Summary"),
      bulletPoint("Your data is encrypted and securely stored"),
      bulletPoint("No data sold or shared with third parties"),
      bulletPoint("Minimal data collection (only what's necessary)"),
      bulletPoint("PDPA compliant (Thai data protection law)"),
      bulletPoint("You can export or delete data anytime"),
      bulletPoint("Full privacy policy: leaseshield.asia/privacy"),
      
      heading2("19.3 Refund Policy"),
      bodyText("All payments are final and non-refundable except:"),
      bulletPoint("Verified billing errors (duplicate charges, etc.)"),
      bulletPoint("Service not delivered due to platform fault"),
      bulletPoint("Refund requests must be made within 7 days"),
      bulletPoint("Email billing@leaseshield.asia with evidence"),
      bodyText("Full refund policy: leaseshield.asia/refunds"),
      
      heading2("19.4 When to Consult a Lawyer"),
      bodyText("Seek qualified legal counsel if:"),
      bulletPoint("Dispute involves amounts over ฿100,000"),
      bulletPoint("Landlord threatens legal action against you"),
      bulletPoint("You're considering suing landlord"),
      bulletPoint("Criminal matters (fraud, harassment)"),
      bulletPoint("Complex property law questions"),
      bulletPoint("Lease Shield Resolve service hasn't achieved resolution"),
      
      pageBreak()
    );

    // 20. APPENDICES
    sections.push(
      heading1("20. APPENDICES"),
      
      heading2("Appendix A: Plan Comparison Table"),
      bodyText("Feature comparison across all tiers:"),
      bodyText("[See Account page for interactive comparison table]"),
      bodyText(""),
      
      heading2("Appendix B: Common Thai Rental Terms"),
      bodyText("English → Thai"),
      bulletPoint("Lease / Rental Agreement → สัญญาเช่า (sǎn-yaa-châo)"),
      bulletPoint("Security Deposit → เงินประกัน (ngern-bprà-gan)"),
      bulletPoint("Monthly Rent → ค่าเช่ารายเดือน (kâa-châo-raai-deuuan)"),
      bulletPoint("Landlord → เจ้าของบ้าน (jâo-kǒng-bâan)"),
      bulletPoint("Tenant → ผู้เช่า (pôo-châo)"),
      bulletPoint("Utilities → ค่าสาธารณูปโภค (kâa-sǎa-taa-rá-ná-bpòhk)"),
      bulletPoint("Notice Period → ระยะเวลาแจ้งล่วงหน้า (rá-yá-way-laa-jɛ̂ɛng-lûuang-nâa)"),
      bulletPoint("Termination → การบอกเลิก (gaan-bòhk-lêrk)"),
      
      heading2("Appendix C: Tenant Rights Checklist"),
      bodyText("Under Thai law, tenants have the right to:"),
      bulletPoint("Peaceful enjoyment of the property"),
      bulletPoint("Habitable and safe living conditions"),
      bulletPoint("Reasonable notice before landlord entry"),
      bulletPoint("Return of deposit (minus legitimate damages)"),
      bulletPoint("Repairs for landlord-responsibility issues"),
      bulletPoint("Privacy and security"),
      bulletPoint("Protection from discrimination"),
      bulletPoint("Receipts for all payments made"),
      
      heading2("Appendix D: Move-In/Move-Out Documentation Checklist"),
      bodyText("MOVE-IN CHECKLIST:"),
      bulletPoint("✓ Photo every room from multiple angles"),
      bulletPoint("✓ Document existing damages, scratches, stains"),
      bulletPoint("✓ Test all appliances and fixtures"),
      bulletPoint("✓ Record meter readings (water, electricity)"),
      bulletPoint("✓ Check locks and keys work properly"),
      bulletPoint("✓ Verify internet and TV connections"),
      bulletPoint("✓ Note any missing items (remotes, furniture)"),
      bulletPoint("✓ Sign inspection report with landlord"),
      bulletPoint("✓ Upload all photos to Evidence Vault immediately"),
      
      bodyText("MOVE-OUT CHECKLIST:"),
      bulletPoint("✓ Clean property thoroughly"),
      bulletPoint("✓ Repair any damage you caused"),
      bulletPoint("✓ Photo cleaned condition (same angles as move-in)"),
      bulletPoint("✓ Record final meter readings"),
      bulletPoint("✓ Remove all personal belongings"),
      bulletPoint("✓ Return all keys and access cards"),
      bulletPoint("✓ Attend final inspection with landlord"),
      bulletPoint("✓ Get signed inspection report"),
      bulletPoint("✓ Request deposit return timeline in writing"),
      bulletPoint("✓ Provide bank details for deposit transfer"),
      
      new Paragraph({ text: "" }),
      new Paragraph({ text: "" }),
      new Paragraph({
        text: "═══════════════════════════════════════════════════",
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        text: "NEED MORE HELP?",
        alignment: AlignmentType.CENTER,
        bold: true
      }),
      new Paragraph({
        text: "Chat with Lisa 24/7 or email support@leaseshield.asia",
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        text: "We're here to help you protect your rental rights.",
        alignment: AlignmentType.CENTER,
        italics: true
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        text: "© 2026 Lease Shield. All rights reserved.",
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 }
      })
    );

    // Create document
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,  // 1 inch = 1440 twentieths of a point
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        headers: {
          default: new Paragraph({
            children: [
              new TextRun({ text: "Lease Shield User Manual", color: "0F4229" })
            ],
            alignment: AlignmentType.LEFT
          })
        },
        footers: {
          default: new Paragraph({
            text: "© 2026 Lease Shield. All rights reserved.",
            alignment: AlignmentType.CENTER
          })
        },
        children: sections
      }],
      styles: {
        paragraphStyles: [
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            run: {
              size: 32,
              bold: true,
              color: "0F4229",
              font: "Arial"
            },
            paragraph: {
              spacing: { before: 400, after: 200 }
            }
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            run: {
              size: 28,
              bold: true,
              color: "1A1D1F",
              font: "Arial"
            },
            paragraph: {
              spacing: { before: 300, after: 150 }
            }
          },
          {
            id: "Heading3",
            name: "Heading 3",
            basedOn: "Normal",
            next: "Normal",
            run: {
              size: 24,
              bold: true,
              color: "1A1D1F",
              font: "Arial"
            },
            paragraph: {
              spacing: { before: 200, after: 100 }
            }
          }
        ]
      },
      numbering: {
        config: [
          {
            reference: "default-numbering",
            levels: [
              {
                level: 0,
                format: "decimal",
                text: "%1.",
                alignment: AlignmentType.LEFT
              }
            ]
          }
        ]
      }
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="LeaseShield_User_Manual_v1.0.docx"'
      }
    });

  } catch (error) {
    console.error('[GENERATE_MANUAL_ERROR]', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});