import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all templates
    const templates = await base44.asServiceRole.entities.TemplateLibrary.list();
    
    const updates = [];
    const categoryDefaults = {
      checklists: `PRE-RENTAL INSPECTION CHECKLIST

☐ PROPERTY CONDITION
  • Walls, floors, ceilings (check for cracks, stains, damage)
  • Windows and doors (functionality, locks, seals)
  • Lighting fixtures and electrical outlets
  • Plumbing (faucets, drains, water pressure)

☐ KITCHEN
  • Appliances (refrigerator, stove, oven - test all)
  • Cabinets and countertops
  • Sink and garbage disposal

☐ BATHROOM
  • Toilet, sink, shower/bathtub
  • Water heater functionality
  • Ventilation

☐ SAFETY & SECURITY
  • Smoke detectors and fire extinguishers
  • Door locks and window security
  • Emergency exits

☐ DOCUMENTATION
  • Take photos/videos of all rooms
  • Note existing damage
  • Get landlord signature on condition report

Date: _________________
Tenant Signature: _________________
Landlord Signature: _________________`,

      pre_signing: `LEASE AGREEMENT PRE-SIGNING CHECKLIST

Before signing your rental agreement, verify:

1. LEASE TERMS
   □ Monthly rent amount: ___________
   □ Security deposit: ___________
   □ Lease duration: Start _______ End _______
   □ Notice period for termination: _______ days

2. PAYMENT TERMS
   □ Payment due date each month
   □ Late payment penalties clearly stated
   □ Accepted payment methods

3. MAINTENANCE & REPAIRS
   □ Landlord responsibilities clearly defined
   □ Tenant responsibilities clearly defined
   □ Emergency contact information

4. PROPERTY CONDITION
   □ Move-in inspection report attached
   □ Existing damage documented
   □ Photo/video evidence collected

5. RESTRICTIONS & RULES
   □ Pet policy
   □ Subletting policy
   □ Modification restrictions

6. DEPOSIT RETURN CONDITIONS
   □ Deduction terms specified
   □ Timeline for return
   □ Walk-through inspection process

REVIEW CAREFULLY BEFORE SIGNING
Seek legal advice if needed.`,

      initial_resolution: `[LANDLORD NAME]
[LANDLORD ADDRESS]
[CITY, POSTAL CODE]

Date: [DATE]

Subject: Request for Resolution - Security Deposit Return

Dear [LANDLORD NAME],

I am writing regarding my tenancy at [PROPERTY ADDRESS], which ended on [MOVE-OUT DATE].

ISSUE:
According to our lease agreement, my security deposit of [AMOUNT] THB was to be returned within [X] days of move-out. As of today, [X] days have passed and I have not received the deposit or any explanation for deductions.

LEASE TERMS:
- Security deposit paid: [AMOUNT] THB on [DATE]
- Lease end date: [DATE]
- Expected return date: [DATE]

PROPERTY CONDITION:
The property was left in good condition, as documented in:
- Move-out inspection photos (attached)
- Cleaning receipts (attached)
- Final utility readings

REQUEST:
I respectfully request the full return of my security deposit of [AMOUNT] THB within 7 days of receipt of this letter.

If any deductions are claimed, please provide:
1. Itemized list of deductions
2. Receipts or invoices for repairs
3. Photos showing damage beyond normal wear and tear

Please contact me at:
Phone: [YOUR PHONE]
Email: [YOUR EMAIL]

I hope to resolve this matter amicably.

Sincerely,
[YOUR NAME]
[YOUR SIGNATURE]`,

      professional: `[YOUR NAME]
[YOUR ADDRESS]
[CITY, POSTAL CODE]
[YOUR PHONE]
[YOUR EMAIL]

[DATE]

[LANDLORD NAME]
[LANDLORD ADDRESS]
[CITY, POSTAL CODE]

RE: FORMAL DEMAND FOR SECURITY DEPOSIT RETURN
Property Address: [PROPERTY ADDRESS]
Lease Period: [START DATE] to [END DATE]

Dear [LANDLORD NAME],

This letter serves as formal notice of my demand for the return of my security deposit.

BACKGROUND:
I was a tenant at the above property from [START DATE] to [END DATE]. Upon vacating, I fulfilled all lease obligations including:
- Proper notice given on [DATE]
- Property cleaned and inspected
- Keys returned on [DATE]
- All utilities transferred/closed

DEPOSIT DETAILS:
Amount paid: [AMOUNT] THB
Date paid: [DATE]
Expected return date: [DATE]
Days overdue: [X] days

LEGAL BASIS:
Under Thai Civil and Commercial Code Section 538, security deposits must be returned promptly unless legitimate deductions apply. No itemized deductions have been provided.

DOCUMENTATION:
Enclosed:
1. Copy of lease agreement
2. Deposit payment receipt
3. Move-out inspection photos
4. Communication records

DEMAND:
I demand immediate return of [AMOUNT] THB within 7 days of receipt of this letter.

Failure to comply will result in:
- Filing complaint with Consumer Protection Office
- Legal action to recover deposit plus damages
- Negative reporting to rental authorities

Please remit payment to:
[BANK ACCOUNT] or [PAYMENT METHOD]

Contact me immediately to arrange payment.

Sincerely,

[YOUR SIGNATURE]
[YOUR PRINTED NAME]

Enclosures: [LIST]
CC: [RENTAL AGENCY, if applicable]`,

      final: `[YOUR NAME]
[YOUR ADDRESS]
[YOUR PHONE] | [YOUR EMAIL]

[DATE]

SENT VIA REGISTERED MAIL

[LANDLORD NAME]
[LANDLORD ADDRESS]

RE: FINAL NOTICE - SECURITY DEPOSIT RETURN
PROPERTY: [PROPERTY ADDRESS]

Dear [LANDLORD NAME],

This is my FINAL NOTICE before pursuing legal action.

PREVIOUS CORRESPONDENCE:
- Initial request: [DATE]
- Follow-up letter: [DATE]
- No response received

AMOUNT DUE: [AMOUNT] THB
DAYS OVERDUE: [X] days

LEGAL ACTION TIMELINE:
If full payment is not received within 5 business days (by [DATE]), I will immediately:

1. File formal complaint with:
   • Consumer Protection Board
   • Office of the Consumer Protection Board (OCPB)
   • Rental dispute resolution services

2. Pursue civil litigation for:
   • Full deposit amount: [AMOUNT] THB
   • Statutory interest
   • Legal fees and court costs
   • Damages for unlawful retention

3. Report to credit bureaus and rental screening services

SETTLEMENT OFFER:
To avoid litigation, pay [AMOUNT] THB by [DATE].

Payment methods:
Bank transfer: [ACCOUNT]
Or contact me to arrange alternative payment.

This is your last opportunity to resolve this matter without legal intervention.

DEADLINE: [DATE] at 5:00 PM

Sincerely,

[YOUR SIGNATURE]
[YOUR NAME]

CC: 
- Consumer Protection Board
- [Legal counsel name, if applicable]
- File copy

PROOF OF SERVICE:
Sent via registered mail #[TRACKING]`
    };

    for (const template of templates) {
      const updateData = {};
      
      // Migrate existing content to preview_content if not already set
      if (!template.preview_content) {
        updateData.preview_content = template.preview_en || template.preview_th || template.content || 'Preview content pending';
      }

      // Set document_content based on category if not already set
      if (!template.document_content) {
        const category = template.category || 'professional';
        if (categoryDefaults[category]) {
          updateData.document_content = categoryDefaults[category];
        } else {
          updateData.document_content = '[DRAFT REQUIRED] Replace this document content in TemplateLibrary admin panel';
        }
      }

      if (Object.keys(updateData).length > 0) {
        await base44.asServiceRole.entities.TemplateLibrary.update(template.id, updateData);
        updates.push({
          id: template.id,
          template_key: template.template_key,
          updated: updateData
        });
      }
    }

    return Response.json({
      success: true,
      message: `Migrated ${updates.length} templates`,
      updates
    });

  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});