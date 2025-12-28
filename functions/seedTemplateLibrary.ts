import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TEMPLATE_SEEDS = {
  pre_signing_negotiation: {
    preview_content: `PRE-SIGNING LEASE NEGOTIATION LETTER
Professional letter to request amendments to draft lease terms before signing.

Sections:
• Reference to draft lease and agent
• Requested changes: rent, deposit, term, early termination clause, maintenance SLA, inventory report, utilities, entry notice, pets/smoking, paint/cleaning, key fees, deduction standards, move-out timeline, dispute resolution
• Request confirmation or alternatives by deadline
• Signature block with contact details`,

    document_content: `[Tenant Name]
[Tenant Address]
[Tenant City, Postal Code]
[Tenant Phone]
[Tenant Email]

[Date]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: Request to Amend Lease Terms Before Signing
Property: [Property Address]

Dear [Landlord Name],

Thank you for providing the draft lease agreement dated [Draft Lease Date] for the property at [Property Address], facilitated by [Agent Name/Agency Name]. I am very interested in proceeding with this tenancy and would like to request the following amendments before signing:

REQUESTED AMENDMENTS:

1. Monthly Rent: [Current Rent] THB → Proposed: [Proposed Rent] THB
2. Security Deposit: [Current Deposit] months → Proposed: [Proposed Deposit] months
3. Lease Term: [Current Term] months → Proposed: [Proposed Term] months
4. Early Termination Clause: Add provision for [Notice Period]-day notice with [Penalty Terms]
5. Maintenance Response Times: [Specify SLA - e.g., urgent repairs within 24 hours, non-urgent within 5 days]
6. Inventory & Condition Report: Request joint inspection and signed condition report with photos before move-in
7. Utilities Responsibility: Clarify which utilities are tenant vs. landlord responsibility
8. Access & Entry Notice: Require [Notice Period]-hour written notice for landlord entry except emergencies
9. Pets / Smoking: [Request permission OR confirm prohibition]
10. Cleaning & Painting: Clarify standards for move-out (professional cleaning required? Repainting?)
11. Key Replacement Fees: Set maximum fee of [Amount] THB per key
12. Deduction Standards: Define "normal wear and tear" vs. tenant damage
13. Move-Out Inspection: Confirm joint final inspection at least [Days] days before move-out
14. Return of Deposit Timeline: [Timeline - e.g., within 14 days] of move-out with itemised deductions if any
15. Dispute Resolution: Agree to [Mediation/Arbitration] channel before legal action

JUSTIFICATION:
[Brief explanation - e.g., "These amendments reflect standard market practices and align with my [X]-month commitment as a reliable tenant."]

Please confirm acceptance of these amendments or propose alternatives by [Deadline Date]. I am available to discuss at [Phone] or [Email].

I look forward to a positive landlord-tenant relationship.

Sincerely,

[Tenant Signature]
[Tenant Name]`
  },

  notice_to_vacate: {
    preview_content: `NOTICE OF INTENT TO VACATE
Formal notice to landlord of intention to vacate property.

Key Fields:
• Current lease reference (start date, notice period)
• Intended move-out date
• Request for final inspection scheduling
• Request deposit return timeline
• Forwarding address and bank details for refund
• Request written confirmation

Professional tone, clear dates, signature block.`,

    document_content: `[Tenant Name]
[Current Property Address]
[City, Postal Code]
[Tenant Phone]
[Tenant Email]

[Date]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: Notice of Intent to Vacate
Property: [Property Address]
Lease Start Date: [Lease Start Date]

Dear [Landlord Name],

This letter serves as my formal [Notice Period]-day notice of intent to vacate the property at [Property Address], as required under our lease agreement dated [Lease Start Date].

MOVE-OUT DETAILS:
• Intended Move-Out Date: [Move-Out Date]
• Final Rent Paid Through: [Final Rent Date]
• Notice Period: [Notice Period] days (as per lease agreement)

REQUEST FOR FINAL INSPECTION:
I respectfully request a joint final inspection to be scheduled at least [Days] days before move-out. Please confirm available dates and times. I will ensure the property is clean and in good condition per lease terms.

SECURITY DEPOSIT RETURN:
• Deposit Amount Paid: [Deposit Amount] THB (paid [Deposit Payment Date])
• Expected Return Date: [Expected Date] (within [Timeline] of move-out)
• Forwarding Address: [New Address], [New City, Postal Code]
• Bank Account for Deposit: [Bank Name], Account Number: [Account Number], Account Name: [Account Name]

If any deductions are necessary, please provide an itemised breakdown with supporting evidence (photos, invoices, receipts) as required by law.

KEY & ACCESS RETURN:
All keys, access cards, and parking remotes will be returned during the final inspection or on [Move-Out Date].

Please confirm receipt of this notice in writing and provide the final inspection schedule at your earliest convenience.

Thank you for your cooperation.

Sincerely,

[Tenant Signature]
[Tenant Name]
[Contact Phone]
[Contact Email]`
  },

  deposit_return_request: {
    preview_content: `SECURITY DEPOSIT RETURN REQUEST
Formal demand for return of security deposit after move-out.

Sections:
• Deposit details (amount, payment date, receipts)
• Move-out date and handover confirmation
• Request return by specific deadline
• Request itemised deductions with evidence if applicable
• Bank account details for refund
• Polite escalation note (complaint/mediation if not resolved)

Professional, firm tone with clear deadline.`,

    document_content: `[Tenant Name]
[New Address]
[City, Postal Code]
[Tenant Phone]
[Tenant Email]

[Date]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: Formal Request for Security Deposit Return
Property: [Property Address]
Move-Out Date: [Move-Out Date]

Dear [Landlord Name],

I am writing to formally request the immediate return of my security deposit for the property at [Property Address].

DEPOSIT DETAILS:
• Amount Paid: [Deposit Amount] THB
• Payment Date: [Deposit Payment Date]
• Receipt Number: [Receipt Number]
• Lease Period: [Lease Start Date] to [Lease End Date]

MOVE-OUT CONFIRMATION:
• Vacated On: [Move-Out Date]
• Keys Returned: [Handover Date]
• Property Condition: Clean and in good condition per lease agreement
• Final Inspection: [Completed / Requested but not scheduled]

DEPOSIT RETURN REQUEST:
Under Thai rental law and our lease agreement, I request the full return of [Deposit Amount] THB by [Deadline Date].

If you believe any deductions are warranted, please provide:
1. Itemised list of deductions with specific reasons
2. Supporting evidence: photos of alleged damage, invoices, repair quotes, cleaning receipts
3. Comparison to move-in condition report
4. Calculation showing [Deposit Amount] THB minus deductions = balance due

REFUND DETAILS:
• Bank Name: [Bank Name]
• Account Number: [Account Number]
• Account Name: [Account Name]
• Preferred Transfer Date: By [Deadline Date]

LEGAL REFERENCE:
Please note that unjustified withholding of deposits may be subject to complaint with the Consumer Protection Board or dispute resolution channels. I hope to resolve this amicably and promptly.

I am available to discuss this matter at [Phone] or [Email].

I look forward to receiving my deposit by [Deadline Date].

Sincerely,

[Tenant Signature]
[Tenant Name]`
  },

  pre_move_out_inspection_request: {
    preview_content: `PRE MOVE-OUT INSPECTION REQUEST
Request for joint inspection before move-out to agree on property condition.

Sections:
• Propose 3 specific date/time options for inspection
• Request landlord/agent attendance with checklist
• Request written confirmation that inspection notes will form basis for any deductions
• Ask for guidance on handover procedures (keys, meters, utilities)
• Confirm forwarding address and contact details

Professional, cooperative tone.`,

    document_content: `[Tenant Name]
[Current Property Address]
[City, Postal Code]
[Tenant Phone]
[Tenant Email]

[Date]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: Request for Pre Move-Out Inspection
Property: [Property Address]
Move-Out Date: [Move-Out Date]

Dear [Landlord Name],

As I prepare to vacate the property at [Property Address] on [Move-Out Date], I would like to request a joint pre move-out inspection to ensure we are aligned on the property condition before final handover.

PROPOSED INSPECTION DATES:
Please confirm your availability for one of the following:
• Option 1: [Date 1] at [Time 1]
• Option 2: [Date 2] at [Time 2]
• Option 3: [Date 3] at [Time 3]

If none of these work, please suggest alternative dates at least [Days] days before move-out.

INSPECTION CHECKLIST:
I request that we conduct the inspection using a joint checklist covering:
• All rooms (walls, floors, ceilings, fixtures)
• Kitchen (appliances, cabinets, sink, counters)
• Bathrooms (toilet, shower, tiles, plumbing)
• Windows, doors, locks
• Electrical and plumbing systems
• Cleanliness standards
• Any repairs or maintenance needed

WRITTEN CONFIRMATION:
Please confirm in writing that:
1. The inspection notes will form the basis for any security deposit deductions
2. Items not noted during inspection will not be grounds for deductions
3. I will have opportunity to address any issues identified before final move-out

HANDOVER PROCEDURES:
Please also advise on:
• Key return process (quantity: [Number])
• Utility meter readings (electric, water, gas)
• Utility account closure or transfer
• Final inspection date if different from pre-inspection
• Deposit return timeline and method

FORWARDING ADDRESS:
[New Address]
[New City, Postal Code]
[Contact Phone]
[Contact Email]

I look forward to your confirmation and to conducting this inspection together.

Sincerely,

[Tenant Signature]
[Tenant Name]`
  },

  deposit_itemised_deductions: {
    preview_content: `REQUEST FOR ITEMISED DEDUCTIONS
Request for detailed breakdown when landlord indicates deposit deductions.

Sections:
• Reference to landlord's notification of deductions
• Request itemised table: item, reason, evidence, invoice/quote, amount, date
• Request return of undisputed balance immediately
• Set deadline for receiving breakdown
• Signature and contact details

Firm but professional tone.`,

    document_content: `[Tenant Name]
[New Address]
[City, Postal Code]
[Tenant Phone]
[Tenant Email]

[Date]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: Request for Itemised Security Deposit Deductions
Property: [Property Address]

Dear [Landlord Name],

Thank you for your communication dated [Communication Date] indicating that deductions will be made from my security deposit of [Deposit Amount] THB. However, I have not yet received a detailed itemised breakdown as required by law.

REQUIRED INFORMATION:
Please provide a complete itemised breakdown in the following format:

| Item/Area | Reason for Deduction | Evidence | Invoice/Quote | Amount (THB) | Date |
|-----------|---------------------|----------|---------------|--------------|------|
| [Example: Kitchen cabinet] | [Example: Broken hinge] | [Example: Photos attached] | [Example: Repair invoice] | [Example: 500] | [Example: Date] |

For each deduction, please include:
1. Specific item or area of property
2. Detailed reason for deduction (damage beyond normal wear and tear)
3. Supporting evidence: photos showing alleged damage
4. Copy of actual invoice, receipt, or written quote from contractor
5. Amount charged (must match invoice/quote)
6. Date work was completed or quote obtained

NORMAL WEAR AND TEAR:
Please note that the following are NOT deductible:
• Minor scuffs or marks from regular use
• Paint fading due to age or sunlight
• Carpet wear in normal traffic areas
• Minor scratches on floors from furniture
• Worn caulking or seals due to age

UNDISPUTED BALANCE:
If certain deductions are documented but others are not, please immediately return the undisputed portion of the deposit to:
• Bank Name: [Bank Name]
• Account Number: [Account Number]
• Account Name: [Account Name]

DEADLINE:
Please provide the complete itemised breakdown by [Deadline Date]. If I do not receive this information by the deadline, I will assume no valid deductions exist and will request full deposit return.

I am available to discuss at [Phone] or [Email].

Sincerely,

[Tenant Signature]
[Tenant Name]`
  },

  property_condition_dispute: {
    preview_content: `PROPERTY CONDITION DISPUTE LETTER
Dispute landlord's allegations of damage or poor condition.

Sections:
• State disagreement with condition/damage claims
• Reference move-in evidence (photos, report, witness)
• List each disputed item with counter-evidence
• Offer resolution: joint re-inspection, independent assessment, or quote comparison
• Request pause on deposit withholding until resolved
• Signature and contact

Assertive but professional tone.`,

    document_content: `[Tenant Name]
[New Address]
[City, Postal Code]
[Tenant Phone]
[Tenant Email]

[Date]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: Dispute of Property Condition Allegations
Property: [Property Address]

Dear [Landlord Name],

I am writing in response to your claims dated [Claim Date] regarding the condition of the property at [Property Address]. I respectfully but firmly disagree with your allegations and dispute the proposed deductions.

MOVE-IN CONDITION EVIDENCE:
At move-in on [Move-In Date], I documented the property's condition with:
• Signed condition report with [Landlord/Agent Name] dated [Report Date]
• Comprehensive photos and videos taken [Move-In Date]
• Witness present: [Witness Name] (if applicable)

This evidence clearly shows that many of the items you claim as "damage" were pre-existing conditions.

DISPUTED ITEMS:

1. [Item/Area 1 - e.g., "Living room wall scuff"]
   • Your Claim: [Landlord's claim - e.g., "Tenant damage requiring repainting"]
   • My Position: Pre-existing condition, documented in move-in photos dated [Date]
   • Evidence: Photo #[Number] from move-in inspection

2. [Item/Area 2 - e.g., "Kitchen cabinet hinge"]
   • Your Claim: [Landlord's claim]
   • My Position: Normal wear and tear / pre-existing / not tenant-caused
   • Evidence: [Description of counter-evidence]

3. [Item/Area 3]
   • Your Claim: [Landlord's claim]
   • My Position: [Your position]
   • Evidence: [Your evidence]

[Add additional disputed items as needed]

PROPOSED RESOLUTION:
To resolve this dispute fairly, I propose:
• Option 1: Joint re-inspection with neutral third party present
• Option 2: Independent property assessment by mutually agreed assessor
• Option 3: Compare your quotes with competitive quotes I obtain
• Option 4: Review and compare move-in vs. move-out evidence together

I am willing to pay for legitimate damage I caused, but I will not accept deductions for:
• Pre-existing conditions documented at move-in
• Normal wear and tear from reasonable use
• Damage not caused by me
• Costs unsupported by evidence or inflated quotes

REQUEST:
Please pause any withholding of my security deposit until we resolve these disputes through one of the above methods. I am available to meet within [Timeframe] to review evidence together.

Please respond by [Deadline Date] with your preferred resolution method.

I remain open to reasonable discussion but will defend my position if necessary.

Sincerely,

[Tenant Signature]
[Tenant Name]

Enclosures:
• Move-in condition report
• Move-in photos (USB drive / cloud link)
• Move-out photos for comparison`
  },

  request_for_evidence: {
    preview_content: `REQUEST FOR EVIDENCE LETTER
Formal request for landlord to provide supporting evidence for claims or deductions.

Sections:
• Specify evidence types requested: signed reports, photos (move-in and move-out), invoices, quotes, receipts (cleaning, repairs, keys), meter readings, written communications
• Provide deadline for delivery
• Specify preferred delivery method (email, LINE, mail)
• Signature and contact details

Clear, organized format listing each evidence type.`,

    document_content: `[Tenant Name]
[New Address]
[City, Postal Code]
[Tenant Phone]
[Tenant Email]

[Date]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: Formal Request for Evidence
Property: [Property Address]
Deposit in Dispute: [Deposit Amount] THB

Dear [Landlord Name],

Further to your claims regarding deductions from my security deposit, I formally request that you provide complete supporting evidence for all allegations and charges.

EVIDENCE REQUESTED:

1. PROPERTY CONDITION DOCUMENTATION:
   ☐ Signed move-in condition report (jointly completed)
   ☐ Move-in photos/videos (dated [Move-In Date])
   ☐ Move-out photos/videos (dated [Move-Out Date])
   ☐ Photos showing specific damage alleged to be tenant-caused
   ☐ Move-in inventory list (if applicable)
   ☐ Move-out inventory comparison

2. REPAIR & MAINTENANCE DOCUMENTATION:
   ☐ Actual invoices from contractors (not estimates)
   ☐ Receipts for completed repair work with dates
   ☐ Written quotes or estimates obtained
   ☐ Proof of payment to service providers
   ☐ Before/after photos of repairs
   ☐ Itemised breakdown of labour and materials

3. CLEANING DOCUMENTATION:
   ☐ Professional cleaning receipts/invoices
   ☐ Photos showing alleged uncleanliness
   ☐ Cleaning standards from lease agreement
   ☐ Evidence of professional cleaning requirement

4. KEY & ACCESS DOCUMENTATION:
   ☐ Key replacement receipts/invoices
   ☐ Proof of key cost and replacement
   ☐ Record of keys not returned (if claimed)

5. UTILITY & METER DOCUMENTATION:
   ☐ Move-in meter readings (electric, water, gas) with dates
   ☐ Move-out meter readings with dates
   ☐ Outstanding utility bills (if claimed)

6. WRITTEN COMMUNICATIONS:
   ☐ All email correspondence during tenancy
   ☐ All LINE/SMS messages during tenancy
   ☐ Maintenance request records
   ☐ Previous notices or warnings (if any)
   ☐ Lease agreement copy

7. FINANCIAL RECORDS:
   ☐ Deposit payment receipt dated [Deposit Date]
   ☐ Rent payment history
   ☐ Any other financial transactions

DELIVERY REQUIREMENTS:
Please provide ALL requested evidence by [Deadline Date] via:
• Preferred: Email to [Email]
• Alternative: LINE to [LINE ID]
• Alternative: Registered mail to [New Address]

For digital files, please ensure:
• Photos are high resolution with visible dates
• Documents are clear and legible (PDF or image format)
• All pages of multi-page documents are included

DEADLINE & CONSEQUENCES:
If complete evidence is not provided by [Deadline Date], I will assume:
• No valid basis exists for the claimed deductions
• My security deposit should be returned in full
• I may proceed with formal complaint or dispute resolution

PARTIAL EVIDENCE:
If you can only provide evidence for some deductions, please immediately return the portion of my deposit for which you have NO supporting evidence.

I am available to discuss this matter at [Phone] or [Email]. I hope we can resolve this by you providing transparent, complete documentation.

Sincerely,

[Tenant Signature]
[Tenant Name]

CC: [Property Management Company, if applicable]`
  },

  deposit_withholding_dispute_formal: {
    preview_content: `FORMAL DEPOSIT WITHHOLDING DISPUTE (FINAL NOTICE)
Strong final notice before escalation when deposit wrongfully withheld.

Sections:
• Recap timeline: move-out date, notice dates, prior requests
• Summary of unfulfilled obligations (no itemisation, no evidence, no response)
• Set final deadline for return OR full evidence pack
• State next steps: formal complaint, mediation, independent advice (keep general)
• Signature with date and contact

Firm, formal tone with clear escalation path.`,

    document_content: `[Tenant Name]
[New Address]
[City, Postal Code]
[Tenant Phone]
[Tenant Email]

[Date]

SENT VIA: [Registered Mail / Email / Both]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: FINAL NOTICE - Security Deposit Withholding Dispute
Property: [Property Address]
Deposit Amount: [Deposit Amount] THB

Dear [Landlord Name],

This is my FINAL NOTICE regarding the unlawful withholding of my security deposit. Despite multiple requests, you have failed to return my deposit or provide adequate justification for withholding it.

TIMELINE OF EVENTS:
• Lease End Date: [Lease End Date]
• Move-Out Date: [Move-Out Date]
• Keys Returned: [Handover Date]
• First Deposit Return Request: [First Request Date]
• Second Request: [Second Request Date]
• Request for Itemised Deductions: [Request Date]
• Request for Evidence: [Request Date]
• Days Since Move-Out: [Number] days

YOUR UNFULFILLED OBLIGATIONS:
Despite legal requirements and my repeated requests, you have failed to:
☐ Return my security deposit of [Deposit Amount] THB
☐ Provide itemised breakdown of any claimed deductions
☐ Provide supporting evidence (photos, invoices, receipts)
☐ Respond to my written requests in a timely manner
☐ Demonstrate legitimate basis for withholding funds

LEGAL BASIS FOR RETURN:
Under Thai Civil and Commercial Code Section 538 and standard tenancy practices:
• Security deposits must be returned promptly after lease termination
• Deductions require itemised justification with supporting evidence
• Landlords cannot withhold deposits for normal wear and tear
• Unjustified withholding may constitute breach of contract

PROPERTY CONDITION:
I vacated the property in clean, good condition as evidenced by:
• Joint final inspection conducted [Date] with [Person Name]
• Comprehensive move-out photos dated [Date]
• Professional cleaning receipt dated [Date]
• All keys and access items returned
• No damage beyond normal wear and tear

FINAL DEMAND:
By [Final Deadline Date] (within [Days] days), you must:

OPTION 1 - FULL RETURN:
Return the complete deposit amount of [Deposit Amount] THB to:
• Bank Name: [Bank Name]
• Account Number: [Account Number]
• Account Name: [Account Name]

OR

OPTION 2 - JUSTIFIED DEDUCTIONS:
Provide complete evidence pack including:
1. Itemised table of ALL deductions with amounts
2. Photos showing damage (with move-in comparison)
3. Actual invoices/receipts (not estimates) for all charges
4. Explanation of why each item exceeds normal wear and tear
5. Immediate return of any undocumented/unjustified portions

ESCALATION - NEXT STEPS:
If I do not receive either full deposit return OR complete evidence pack by [Final Deadline Date], I will immediately proceed with:

1. FORMAL COMPLAINT:
   • File complaint with Consumer Protection Board
   • Submit report to relevant rental dispute authority
   • Document this matter with housing ombudsman (if applicable)

2. ALTERNATIVE DISPUTE RESOLUTION:
   • Request mediation through [Mediation Service]
   • Seek independent assessment of deposit dispute
   • Engage tenancy advisory services for formal review

3. INDEPENDENT ADVICE:
   • Consult with consumer protection advisors regarding next steps
   • Seek guidance on small claims procedures
   • Explore all available legal remedies for recovery

4. REPORTING:
   • Report this matter to relevant landlord rating/review platforms
   • Document for future tenant reference checks
   • Notify property management associations (if applicable)

SETTLEMENT OFFER - VALID UNTIL [DEADLINE]:
To avoid escalation, I will accept:
• Full return of [Deposit Amount] THB by [Deadline Date], OR
• Documented deductions with evidence + immediate return of remainder

CONSEQUENCES OF NON-COMPLIANCE:
Continued withholding without justification may result in:
• Formal investigation by consumer protection authorities
• Requirement to pay administrative costs of dispute resolution
• Negative impact on landlord reputation and future rentals
• Potential liability for tenant costs incurred in recovery process

THIS IS MY FINAL ATTEMPT TO RESOLVE AMICABLY.

I am available for immediate discussion at [Phone] or [Email] until [Deadline Date]. After this deadline, all communication will be through formal dispute channels.

I trust you will act appropriately and promptly to avoid unnecessary escalation.

Sincerely,

[Tenant Signature]
[Tenant Name]
Date: [Date]

CC: [Property Management Company]
CC: [Consumer Protection Board - if applicable]

Enclosures:
• Timeline of all correspondence
• Copy of lease agreement
• Deposit payment receipt
• Move-in and move-out condition evidence
• All previous requests for return

PROOF OF DELIVERY:
• Registered Mail Tracking: [Tracking Number]
• Email Sent: [Date/Time]
• Recipient Confirmation: [If applicable]`
  },

  pre_signing_checklist: {
    preview_content: `PRE-SIGNING LEASE CHECKLIST
Quick checklist to review before signing any rental agreement.

Includes:
• Lease terms verification (rent, deposit, duration)
• Payment terms and late fees
• Maintenance responsibilities
• Property condition documentation
• Restrictions and rules review
• Deposit return conditions

Placeholders: Property details, dates, amounts`,
    
    document_content: `PRE-SIGNING LEASE CHECKLIST

Property Address: [Property Address]
Landlord: [Landlord Name]
Tenant: [Tenant Name]
Review Date: [Date]

═══════════════════════════════════════════════════════════════

BEFORE SIGNING YOUR RENTAL AGREEMENT, VERIFY:

1. LEASE TERMS
   ☐ Monthly rent amount: [Rent Amount] THB
   ☐ Security deposit: [Deposit Amount] THB
   ☐ Lease duration: Start [Start Date] End [End Date]
   ☐ Notice period for termination: [Notice Period] days
   ☐ Renewal terms clearly stated

2. PAYMENT TERMS
   ☐ Payment due date: [Due Date] of each month
   ☐ Late payment penalties clearly stated
   ☐ Accepted payment methods documented
   ☐ Receipt process confirmed
   ☐ Utility payment responsibility defined

3. MAINTENANCE & REPAIRS
   ☐ Landlord responsibilities clearly defined
   ☐ Tenant responsibilities clearly defined
   ☐ Emergency contact information: [Emergency Contact]
   ☐ Response time commitments stated
   ☐ Repair cost threshold documented

4. PROPERTY CONDITION
   ☐ Move-in inspection report attached
   ☐ Existing damage documented with photos
   ☐ Photo/video evidence collected and dated
   ☐ Furniture and fixtures inventory completed
   ☐ Working condition of all appliances verified

5. RESTRICTIONS & RULES
   ☐ Pet policy: [Pet Policy]
   ☐ Subletting policy: [Subletting Policy]
   ☐ Modification/decoration restrictions
   ☐ Noise and conduct rules
   ☐ Guest policy documented

6. DEPOSIT RETURN CONDITIONS
   ☐ Deduction terms clearly specified
   ☐ Timeline for return: [Return Timeline]
   ☐ Walk-through inspection process outlined
   ☐ Dispute resolution process documented
   ☐ Normal wear and tear definition provided

7. INSURANCE & LIABILITY
   ☐ Landlord's insurance coverage confirmed
   ☐ Tenant insurance requirements stated
   ☐ Liability for damages clarified
   ☐ Natural disaster provisions reviewed

8. LEGAL COMPLIANCE
   ☐ Lease complies with Thai rental laws
   ☐ All terms written in clear language
   ☐ No unreasonable or illegal clauses
   ☐ All parties' full names and signatures required
   ☐ Copy of landlord's ID/ownership proof requested

═══════════════════════════════════════════════════════════════

REVIEW CAREFULLY BEFORE SIGNING
Seek legal advice if needed. Do not sign under pressure.

Tenant Signature: _________________ Date: _________
Landlord Signature: _________________ Date: _________`
  },

  move_in_condition_checklist: {
    preview_content: `MOVE-IN CONDITION INSPECTION CHECKLIST
Comprehensive room-by-room inspection form for documenting property condition.

Includes:
• Living room, kitchen, bathrooms inspection
• Bedroom and storage areas
• Electrical, plumbing, safety systems
• Photo/video documentation checklist
• Signature acknowledgement

Placeholders: Property details, room conditions, dates`,

    document_content: `MOVE-IN CONDITION INSPECTION CHECKLIST

Property Address: [Property Address]
Unit Number: [Unit Number]
Tenant Name: [Tenant Name]
Landlord/Agent: [Landlord Name]
Inspection Date: [Inspection Date]
Lease Start Date: [Lease Start Date]

═══════════════════════════════════════════════════════════════

Instructions: Inspect each item carefully. Mark condition as:
✓ Good | ⚠ Minor Issue | ✗ Major Damage | N/A Not Applicable

LIVING ROOM / COMMON AREAS
☐ Walls (paint, cracks, stains): _____________
☐ Ceiling (condition, water stains): _____________
☐ Flooring (tiles, wood, carpet): _____________
☐ Windows (glass, frames, locks): _____________
☐ Window screens (intact, tears): _____________
☐ Curtains/blinds (operation, cleanliness): _____________
☐ Doors (operation, locks, hinges): _____________
☐ Light fixtures (working, bulbs): _____________
☐ Electrical outlets (working, loose): _____________
☐ Air conditioning unit (working, clean): _____________
☐ Furniture (if furnished): _____________
Notes: _________________________________________________

KITCHEN
☐ Cabinets (doors, handles, shelves): _____________
☐ Countertops (chips, stains, cracks): _____________
☐ Sink (drainage, fixtures, leaks): _____________
☐ Faucet (working, hot/cold water): _____________
☐ Refrigerator (working, clean, ice): _____________
☐ Stove/oven (working, clean, burners): _____________
☐ Microwave (working, clean): _____________
☐ Exhaust fan/hood (working, clean): _____________
☐ Dishwasher (if present): _____________
☐ Garbage disposal (working): _____________
☐ Flooring (condition, cleanliness): _____________
Notes: _________________________________________________

BEDROOM(S) - Room #: [Room Number]
☐ Walls (paint, holes, marks): _____________
☐ Ceiling (condition, fan if present): _____________
☐ Flooring (condition, stains): _____________
☐ Closets (doors, rods, shelves): _____________
☐ Windows (operation, locks, screens): _____________
☐ Electrical outlets (working): _____________
☐ Light fixtures (working): _____________
☐ Air conditioning (working): _____________
☐ Furniture (if furnished): _____________
Notes: _________________________________________________

BATHROOM(S) - Bathroom #: [Bathroom Number]
☐ Toilet (flushing, leaks, seat): _____________
☐ Sink (drainage, fixtures, countertop): _____________
☐ Shower/bathtub (drainage, fixtures, tiles): _____________
☐ Water pressure (hot and cold): _____________
☐ Exhaust fan (working, noise): _____________
☐ Mirror (condition, mounting): _____________
☐ Cabinets/storage (condition): _____________
☐ Walls/tiles (cracks, grout, mold): _____________
☐ Flooring (tiles, drainage): _____________
Notes: _________________________________________________

BALCONY / OUTDOOR AREAS
☐ Flooring (condition, drainage): _____________
☐ Railings (secure, rust): _____________
☐ Door/access (locks, seals): _____________
☐ Exterior walls (condition): _____________
Notes: _________________________________________________

UTILITIES & SYSTEMS
☐ Water heater (working, temperature): _____________
☐ Electrical panel (accessible, labeled): _____________
☐ Plumbing (no leaks visible): _____________
☐ Internet/cable connections: _____________
☐ Intercom/doorbell (working): _____________
☐ Mailbox (accessible, key provided): _____________
Notes: _________________________________________________

SAFETY & SECURITY
☐ Smoke detector (present, tested): _____________
☐ Fire extinguisher (present, accessible): _____________
☐ Entry door lock (working, key provided): _____________
☐ Window locks (all working): _____________
☐ Emergency exits (clear, accessible): _____________
Notes: _________________________________________________

KEYS & ACCESS
☐ Main door key(s) - Quantity: [Number]
☐ Mailbox key - Quantity: [Number]
☐ Building access card/key - Quantity: [Number]
☐ Parking remote/card - Quantity: [Number]
☐ Other: _____________

METER READINGS (for utility billing)
☐ Electric meter: [Reading] (Photo taken: Yes/No)
☐ Water meter: [Reading] (Photo taken: Yes/No)
☐ Gas meter: [Reading] (Photo taken: Yes/No)

PHOTO/VIDEO DOCUMENTATION
☐ All rooms photographed with date stamp
☐ All existing damage documented with close-up photos
☐ Meter readings photographed
☐ Serial numbers of appliances recorded
☐ Photos saved to: [Storage Location]

═══════════════════════════════════════════════════════════════

TENANT ACKNOWLEDGEMENT:
I have inspected the premises and the above conditions accurately reflect 
the property's state at move-in. I have taken photos/videos for my records.

Tenant Signature: _________________ Date: _________
Print Name: [Tenant Name]

LANDLORD/AGENT ACKNOWLEDGEMENT:
The property has been inspected jointly with the tenant. The documented 
conditions are accurate as of the inspection date.

Landlord/Agent Signature: _________________ Date: _________
Print Name: [Landlord Name]

Copies provided to: ☐ Tenant ☐ Landlord ☐ Property Management`
  },

  move_out_preparation_checklist: {
    preview_content: `MOVE-OUT PREPARATION CHECKLIST
Step-by-step checklist to prepare for move-out and maximize deposit return.

Includes:
• Deep cleaning requirements (room by room)
• Repairs and maintenance items
• Documentation and inspection scheduling
• Deposit return preparation
• Final walkthrough checklist

Placeholders: Property details, tasks, dates`,

    document_content: `MOVE-OUT PREPARATION CHECKLIST

Property Address: [Property Address]
Tenant Name: [Tenant Name]
Move-Out Date: [Move-Out Date]
Final Inspection Date: [Inspection Date]

═══════════════════════════════════════════════════════════════

PREPARATION TIMELINE: Start 30 days before move-out

30 DAYS BEFORE MOVE-OUT
☐ Review lease for move-out requirements and deposit terms
☐ Give written notice to landlord per lease terms
☐ Schedule final inspection with landlord: [Inspection Date]
☐ Review move-in condition report and photos
☐ Plan repairs for damage beyond normal wear and tear
☐ Gather all maintenance/repair receipts

14 DAYS BEFORE MOVE-OUT
☐ Complete all necessary repairs
☐ Deep clean entire unit (or schedule professional cleaning)
☐ Fix any holes in walls from picture hanging
☐ Replace any broken/missing items
☐ Service all appliances (clean, defrost, check function)
☐ Order cleaning supplies or professional service

7 DAYS BEFORE MOVE-OUT
☐ Notify utility companies of move-out date
☐ Schedule final meter readings: [Date/Time]
☐ Forward mail to new address
☐ Clean carpets if required by lease
☐ Final deep cleaning of all rooms

CLEANING CHECKLIST (Complete ALL items)

KITCHEN
☐ Clean inside/outside refrigerator, freezer defrosted
☐ Clean oven, stove, burners, drip pans
☐ Clean microwave inside and out
☐ Wipe down all cabinet exteriors and interiors
☐ Clean countertops and backsplash
☐ Clean and sanitize sink and faucet
☐ Scrub floor and baseboards
☐ Clean exhaust fan and filter
☐ Empty and clean all drawers

BATHROOMS
☐ Scrub toilet inside and out, including base
☐ Clean shower/tub, remove soap scum and mold
☐ Clean sink, faucet, and countertops
☐ Clean mirrors (no streaks)
☐ Scrub tile and grout
☐ Clean cabinet interiors and exteriors
☐ Scrub floor and baseboards
☐ Clean exhaust fan cover

LIVING ROOM / BEDROOMS
☐ Dust all surfaces, ceiling fans, light fixtures
☐ Clean windows inside (and outside if accessible)
☐ Wipe down window sills and frames
☐ Clean closet shelves and rods
☐ Vacuum/mop all floors thoroughly
☐ Clean baseboards and corners
☐ Remove all nails/hooks from walls
☐ Fill and touch up any holes with spackle
☐ Wipe down doors and door frames
☐ Clean light switches and outlet covers

GENERAL / THROUGHOUT UNIT
☐ Clean all air conditioning filters
☐ Test and clean all smoke detectors
☐ Replace any burnt-out light bulbs
☐ Remove all personal items from unit
☐ Remove all items from storage areas
☐ Sweep balcony/patio
☐ Clean entry door and hardware
☐ Take trash to disposal area

REPAIRS & MAINTENANCE
☐ Fix any holes in walls (spackle and paint)
☐ Touch up paint on scuffed/marked walls (if required)
☐ Replace any broken/cracked tiles
☐ Fix any loose cabinet handles or hinges
☐ Repair any plumbing leaks
☐ Replace burnt-out bulbs with same wattage
☐ Tighten any loose doorknobs or hardware

DOCUMENTATION PREPARATION
☐ Take dated photos of ALL rooms (matching move-in photos)
☐ Take close-up photos of all cleaned areas
☐ Photograph meter readings
☐ Document any pre-existing damage that hasn't been repaired
☐ Gather all repair receipts and documentation
☐ Prepare list of items needing landlord attention
☐ Make copies of all lease documents and correspondence

FINAL WALKTHROUGH DAY
☐ Meet landlord at scheduled time: [Time]
☐ Walk through each room together
☐ Discuss any issues or concerns
☐ Take joint photos if needed
☐ Get landlord acknowledgement of condition
☐ Turn in all keys: Main [#], Mailbox [#], Access card
☐ Provide forwarding address: [New Address]
☐ Confirm deposit return amount: [Amount] THB
☐ Confirm deposit return timeline: [Timeline]
☐ Get written move-out inspection report
☐ Request itemized deductions if applicable

UTILITIES & SERVICES
☐ Final electric meter reading: [Reading]
☐ Final water meter reading: [Reading]
☐ Cancel/transfer internet service
☐ Cancel/transfer cable/TV service
☐ Return any building access cards
☐ Return parking remote/card
☐ Clear mailbox

DEPOSIT RETURN FOLLOW-UP
☐ Record condition of deposit return promise
☐ Set reminder to follow up if not received by: [Follow-up Date]
☐ Keep all documentation for 2 years minimum

═══════════════════════════════════════════════════════════════

DEPOSIT RETURN INFORMATION
Expected Return Amount: [Deposit Amount] THB
Expected Return Date: [Return Date]
Payment Method: [Payment Method]
Forwarding Address: [New Address]
Contact Phone: [Phone Number]
Contact Email: [Email]

Checklist Completed By: [Tenant Name]
Date Completed: [Date]
Signature: _________________`
  },

  pre_signing_lease_negotiation_letter: {
    preview_content: `PRE-SIGNING LEASE NEGOTIATION LETTER
Professional letter template for proposing lease modifications before signing.

Includes:
• Formal introduction and intent to rent
• Specific terms to negotiate (rent, deposit, duration, repairs)
• Proposed alternatives
• Professional closing requesting discussion

Placeholders: Names, property details, proposed terms`,

    document_content: `[Your Name]
[Your Address]
[City, Postal Code]
[Your Phone]
[Your Email]

[Date]

[Landlord Name]
[Landlord Address]
[City, Postal Code]

Re: Lease Negotiation - [Property Address]

Dear [Landlord Name],

Thank you for offering me the opportunity to rent the property located at [Property Address]. I am very interested in establishing a tenancy and believe this property would be an excellent fit for my needs.

After carefully reviewing the proposed lease agreement dated [Lease Date], I would like to discuss several terms before signing. I believe these adjustments would be mutually beneficial and help establish a positive, long-term landlord-tenant relationship.

PROPOSED LEASE MODIFICATIONS:

1. Monthly Rent
   Current proposal: [Current Rent] THB
   Requested: [Proposed Rent] THB
   Justification: [Reason - e.g., market comparison, property condition, long-term commitment]

2. Security Deposit
   Current proposal: [Current Deposit] THB ([Number] months)
   Requested: [Proposed Deposit] THB ([Number] months)
   Justification: [Reason - e.g., excellent credit history, employment stability, references]

3. Lease Duration
   Current proposal: [Current Duration] months
   Requested: [Proposed Duration] months
   Justification: [Reason - e.g., job stability, prefer longer commitment for lower rent]

4. Maintenance & Repairs
   Request: Prior to move-in, please complete the following repairs:
   • [Repair Item 1 - e.g., Fix leaking faucet in bathroom]
   • [Repair Item 2 - e.g., Repair cracked tile in kitchen]
   • [Repair Item 3 - e.g., Service air conditioning unit]
   • [Additional items as needed]

5. Property Modifications
   Request: Permission to make the following minor, reversible modifications:
   • [Modification 1 - e.g., Install curtain rods]
   • [Modification 2 - e.g., Paint accent wall (restore on move-out)]
   • [Additional items as needed]

6. Additional Terms
   • [Term 1 - e.g., Early termination clause with 2 months notice]
   • [Term 2 - e.g., Option to renew at fixed rate]
   • [Additional terms as needed]

TENANT QUALIFICATIONS:
To support these requests, I would like to highlight my qualifications:
• Employment: [Employer Name], Position: [Job Title], Duration: [Years]
• Monthly Income: [Income] THB
• Previous Landlord References: Available upon request
• Rental History: [Years] years of on-time rent payments
• Credit History: [Excellent/Good]
• [Additional positive attributes]

PROPOSED TIMELINE:
I am prepared to move forward quickly if we can reach agreement:
• Target move-in date: [Desired Move-In Date]
• Available for property walkthrough: [Available Dates]
• Ready to sign modified lease: Within [Number] days of agreement

I believe these adjustments are reasonable and reflect current market conditions. I am committed to being a responsible, long-term tenant who maintains the property well and pays rent consistently.

I would appreciate the opportunity to discuss these points with you at your earliest convenience. I am available for a meeting or phone call:
• Preferred times: [Available Days/Times]
• Phone: [Your Phone]
• Email: [Your Email]

If you prefer, I am happy to provide additional documentation such as:
• Employment verification letter
• Bank statements
• Previous landlord references
• Personal references
• [Other supporting documents]

I look forward to working with you to finalize a lease agreement that meets both our needs. Thank you for your consideration, and I hope to hear from you soon.

Sincerely,

[Your Signature]
[Your Printed Name]

Enclosures:
☐ Copy of ID
☐ Employment letter
☐ Salary slips (last 3 months)
☐ Bank statement
☐ Previous landlord reference
☐ [Other documents]`
  },

  request_pre_move_out_inspection: {
    preview_content: `PRE MOVE-OUT INSPECTION REQUEST LETTER
Formal request to schedule joint inspection before move-out to identify issues.

Includes:
• Official move-out notice
• Inspection scheduling request
• List of areas to inspect together
• Deposit return discussion preparation

Placeholders: Names, dates, property details`,

    document_content: `[Your Name]
[Your Current Address]
[City, Postal Code]
[Your Phone]
[Your Email]

[Date]

[Landlord Name]
[Landlord Address]
[City, Postal Code]

Re: Request for Pre Move-Out Inspection
Property Address: [Property Address]
Lease End Date: [Lease End Date]

Dear [Landlord Name],

This letter serves as formal notification that I will be vacating the property located at [Property Address] on [Move-Out Date], in accordance with our lease agreement dated [Lease Start Date].

As per Thai rental law and best practices, I respectfully request a pre move-out inspection to be conducted jointly at least [Number] days before my final move-out date. This walkthrough will allow us to:

1. Identify any repairs or cleaning needed before final move-out
2. Discuss property condition and normal wear and tear
3. Address any concerns regarding security deposit deductions
4. Ensure the property is returned to acceptable condition
5. Schedule any necessary repairs with adequate time

PROPOSED INSPECTION DETAILS:

Preferred Inspection Date: [Proposed Date 1] or [Proposed Date 2]
Preferred Time: [Proposed Time]
Alternative dates: [Alternative Date 1], [Alternative Date 2]

I am flexible with scheduling and can adjust to your availability. Please confirm a convenient date and time at your earliest convenience.

PROPERTY CONDITION SUMMARY:

I have maintained the property in good condition throughout my tenancy. At the inspection, we will review:

☐ All rooms and living spaces (walls, floors, ceilings)
☐ Kitchen (appliances, cabinets, countertops)
☐ Bathrooms (fixtures, tiles, plumbing)
☐ Windows, doors, and locks
☐ Electrical outlets and lighting
☐ Air conditioning units and filters
☐ Balcony/outdoor areas
☐ Any furniture or fixtures included with property
☐ Overall cleanliness standards

KNOWN ISSUES / PRE-EXISTING CONDITIONS:

Please note the following conditions that existed at move-in or occurred during tenancy with your knowledge:
• [Issue 1 - e.g., Small crack in bathroom tile (pre-existing, documented in move-in report)]
• [Issue 2 - e.g., Slight wear on kitchen cabinet handles]
• [Issue 3 - if applicable]
• [Additional items as needed]

I have documented these items with photographs dated [Date] and [Date], which match my original move-in inspection report from [Move-In Date].

CLEANING & REPAIRS PLAN:

Prior to final move-out, I plan to complete the following:
☐ Professional deep cleaning of entire unit
☐ Repair any damage beyond normal wear and tear
☐ Replace any burnt-out light bulbs
☐ Clean all appliances thoroughly
☐ Remove all personal belongings
☐ Return property to move-in condition
☐ [Additional items per lease agreement]

If you identify any issues during the pre-inspection that require attention, I will have time to address them before final move-out, which should help ensure full security deposit return.

SECURITY DEPOSIT INFORMATION:

Deposit Amount Paid: [Deposit Amount] THB
Date Paid: [Deposit Date]
Expected Return: [Expected Return Amount] THB
Forwarding Address for Deposit: [New Address]
Preferred Return Method: [Bank Transfer / Check / Cash]
Bank Account (if transfer): [Account Number]

FINAL MOVE-OUT DETAILS:

Final Move-Out Date: [Move-Out Date]
Final Move-Out Time: [Time]
Key Return: Will return all keys during final walkthrough
Utility Meter Readings: Will photograph all meters on move-out day
Forwarding Address: [New Address]
Phone (after move-out): [Phone Number]
Email: [Email Address]

I have truly enjoyed living at [Property Address] and appreciate your professionalism as a landlord. I want to ensure a smooth transition and the property is returned in excellent condition.

Please contact me at your earliest convenience to schedule the pre move-out inspection:
Phone: [Your Phone]
Email: [Your Email]
Available Days/Times: [Your Availability]

I look forward to conducting this inspection together and ensuring a positive conclusion to our landlord-tenant relationship.

Thank you for your prompt attention to this matter.

Sincerely,

[Your Signature]
[Your Printed Name]

CC: [Property Management Company, if applicable]
Attachments:
☐ Original move-in inspection report with photos
☐ Lease agreement copy
☐ Maintenance request history
☐ [Other relevant documentation]`
  },

  lease_amendment_request: {
    preview_content: `LEASE AMENDMENT REQUEST LETTER
Professional request to modify existing lease terms during tenancy.

Includes:
• Current lease reference
• Specific amendment requested (terms, rent, duration, pet policy, etc.)
• Justification and supporting reasons
• Proposed implementation timeline

Placeholders: Names, current terms, proposed changes, dates`,

    document_content: `[Your Name]
[Property Address]
[City, Postal Code]
[Your Phone]
[Your Email]

[Date]

[Landlord Name]
[Landlord Address]
[City, Postal Code]

Re: Request for Lease Amendment
Property: [Property Address]
Current Lease: [Lease Start Date] to [Lease End Date]

Dear [Landlord Name],

I am writing to formally request an amendment to our current lease agreement for the property located at [Property Address]. I have been a tenant since [Lease Start Date] and have greatly appreciated our positive landlord-tenant relationship.

CURRENT LEASE TERMS:
• Lease Period: [Start Date] to [End Date]
• Monthly Rent: [Current Rent] THB
• Security Deposit: [Deposit Amount] THB
• [Other relevant current terms]

REQUESTED AMENDMENT:

Type of Amendment: [Lease Extension / Rent Adjustment / Pet Permission / Early Termination / Other]

Specific Request:
[Detailed description of the amendment requested. Examples below - use only relevant one:]

OPTION 1 - LEASE EXTENSION:
Current End Date: [Current End Date]
Requested New End Date: [New End Date]
Additional Period: [Number] months
Proposed Rent for Extension: [Amount] THB per month

OPTION 2 - RENT ADJUSTMENT:
Current Monthly Rent: [Current Amount] THB
Requested New Rent: [New Amount] THB
Effective Date: [Start Date]
Reason: [Market adjustment / Financial circumstances / Property condition]

OPTION 3 - PET PERMISSION:
Current Policy: No pets allowed
Request: Permission to keep [Type of Pet]
Pet Details: [Breed], [Age], [Weight], [Trained/Certified]
Additional Deposit Offered: [Amount] THB (if applicable)
Pet Insurance: [Yes/No, Policy Number if yes]

OPTION 4 - EARLY TERMINATION:
Current Lease End: [End Date]
Requested Termination Date: [Early Date]
Reason: [Job relocation / Family circumstances / Financial hardship]
Notice Period: [Number] days (per lease requirement)
Proposed Settlement: [Forfeit deposit / Pay penalty / Find replacement tenant]

OPTION 5 - SUBLETTING PERMISSION:
Request: Permission to sublet [Part/All] of property
Period: [Start Date] to [End Date]
Sublessee: [Name and brief background]
Rent: [Amount] (same as current rent)
Liability: I will remain fully responsible for all lease obligations

OPTION 6 - ADDITIONAL OCCUPANT:
Current Occupants: [Names]
Request: Add occupant: [New Occupant Name]
Relationship: [Family member / Roommate]
Income Verification: Available upon request
No change to rent or deposit requested

JUSTIFICATION FOR REQUEST:

[Provide detailed, honest explanation. Examples:]

• Employment: [Explanation if job-related - transfer, promotion, loss]
• Family: [Explanation if family-related - marriage, baby, divorce, care for relative]
• Financial: [Explanation if financial - income change, medical bills]
• Property: [Explanation if property-related - maintenance issues, noise, safety]
• Personal: [Other compelling personal circumstances]

I have been a reliable tenant who:
• Pays rent on time consistently (payment history: [X] months, zero late payments)
• Maintains the property in excellent condition
• Respects neighbors and building rules
• Communicates promptly about any issues
• [Other positive tenant behaviors]

PROPOSED TERMS & CONDITIONS:

To facilitate this amendment, I propose the following:

1. Timeline:
   • Amendment effective date: [Date]
   • Duration of amendment: [Period]
   • New lease end date (if applicable): [Date]

2. Financial Terms:
   • [Adjusted rent / Additional deposit / Penalty waiver / etc.]
   • Payment schedule: [Details]

3. Conditions:
   • [Any conditions specific to the amendment]
   • [Continued obligations under original lease]
   • [New responsibilities if applicable]

4. Documentation:
   • Written amendment to be signed by both parties
   • [Any supporting documents - employment letter, financials, etc.]
   • Original lease remains in effect for all other terms

BENEFIT TO LANDLORD:

This amendment would benefit you by:
• [Reason 1 - e.g., Ensures continued occupancy without vacancy period]
• [Reason 2 - e.g., Maintains stable, reliable tenant relationship]
• [Reason 3 - e.g., Avoids costs of finding new tenant]
• [Reason 4 - if applicable]

ALTERNATIVE PROPOSALS:

If my primary request is not acceptable, I would be open to discussing:
• [Alternative 1]
• [Alternative 2]
• [Other compromises]

TIMELINE & NEXT STEPS:

I would appreciate a response by [Date] so that I can make necessary arrangements. I am available to meet in person or discuss by phone at your convenience:

Availability: [Days and times you're available]
Phone: [Your Phone]
Email: [Your Email]

SUPPORTING DOCUMENTATION:

Enclosed/Available upon request:
☐ [Employment letter / Verification]
☐ [Income documentation]
☐ [Personal references]
☐ [Pet vaccination records and training certificates]
☐ [Proposed sublessee information and background]
☐ [Financial statements]
☐ [Other relevant documents]

I value our landlord-tenant relationship and hope we can work together to accommodate this request. I am committed to maintaining the property and fulfilling all my obligations under the lease.

Thank you for considering my request. I look forward to discussing this matter with you and reaching a mutually agreeable solution.

Sincerely,

[Your Signature]
[Your Printed Name]

Enclosures: [List attached documents]
CC: [Property Manager, if applicable]`
  },

  security_deposit_return_request: {
    preview_content: `SECURITY DEPOSIT RETURN REQUEST LETTER
Initial formal request for prompt return of security deposit after move-out.

Includes:
• Tenancy details and deposit amount
• Property condition at move-out
• Legal timeline requirements
• Request for full return or itemized deductions

Placeholders: Names, dates, amounts, forwarding address`,

    document_content: `[Your Name]
[Your New Address]
[City, Postal Code]
[Your Phone]
[Your Email]

[Date]

[Landlord Name]
[Landlord Address]
[City, Postal Code]

Re: Request for Security Deposit Return
Former Property Address: [Property Address]
Lease Period: [Lease Start Date] to [Lease End Date]

Dear [Landlord Name],

I am writing to formally request the return of my security deposit for the property located at [Property Address], which I vacated on [Move-Out Date].

TENANCY DETAILS:

Property Address: [Property Address]
Lease Start Date: [Lease Start Date]
Lease End Date: [Lease End Date]
Actual Move-Out Date: [Move-Out Date]
Security Deposit Paid: [Deposit Amount] THB
Date Deposit Paid: [Deposit Payment Date]
Receipt Number (if applicable): [Receipt Number]

LEASE OBLIGATIONS FULFILLED:

I have fulfilled all obligations under our lease agreement, including:

✓ Provided proper notice of [Number] days on [Notice Date]
✓ Paid all rent through final day of tenancy
✓ Returned property in clean, good condition
✓ Completed professional deep cleaning on [Cleaning Date]
✓ Attended final walkthrough inspection on [Inspection Date]
✓ Returned all keys and access devices on [Date]:
  • Main door keys: [Number] keys
  • Mailbox key: [Number] key
  • Building access card: [Number] card
  • Parking remote/card: [Number] item
  • Other: [List]
✓ Provided forwarding address for security deposit return
✓ All utility accounts closed/transferred as of [Date]

PROPERTY CONDITION AT MOVE-OUT:

The property was returned in excellent condition, consistent with normal wear and tear:

• All rooms thoroughly cleaned, including floors, walls, windows
• Kitchen: All appliances cleaned and in working order
• Bathrooms: Deep cleaned, no damage
• Walls: Free of holes (any nail holes properly filled and painted)
• Flooring: Vacuumed/mopped, no damage beyond normal wear
• All fixtures and fittings: Working condition, cleaned
• No pet damage (property was/was not pet-free)
• All personal property removed

Move-out inspection was conducted jointly with [Landlord Name / Property Manager / Agent Name] on [Inspection Date]. No concerns or issues were raised during the inspection regarding property condition or cleanliness.

DOCUMENTATION:

I have comprehensive documentation of the property's condition:
• Move-out photos/videos taken on [Move-Out Date] (available upon request)
• Move-in condition report dated [Move-In Date] for comparison
• Cleaning receipts dated [Cleaning Date]
• Final utility meter readings:
  - Electric: [Reading]
  - Water: [Reading]
  - Gas: [Reading] (if applicable)
• Photos of all meter readings taken on [Date]

LEGAL REQUIREMENTS:

Under Thai Civil and Commercial Code Section 538 and standard rental practices, security deposits must be returned within a reasonable time after lease termination, typically [Number - e.g., 30] days, unless legitimate deductions apply.

As of today's date, [Number] days have passed since move-out, and I have not received:
☐ The security deposit
☐ Partial refund with itemization
☐ Written explanation of any deductions

REQUEST FOR FULL RETURN:

Based on the above, I respectfully request the FULL return of my security deposit in the amount of [Deposit Amount] THB.

Please remit payment within 7 days of receipt of this letter to:

Preferred Payment Method: [Bank Transfer / Check / Cash]
Bank Account: [Bank Name], Account Number: [Account Number]
Account Name: [Your Name]

Or mail check to:
[Your New Address]
[City, Postal Code]

Alternative: I am also available to collect payment in person if you prefer.

ITEMIZED DEDUCTIONS (IF APPLICABLE):

If you believe any portion of the deposit should be withheld, Thai law requires that you provide:

1. Itemized list of all deductions with specific amounts
2. Receipts or invoices for repairs/cleaning
3. Photos showing damage beyond normal wear and tear
4. Comparison to move-in condition (from move-in report)
5. Explanation of how deduction amounts were calculated

Please note that normal wear and tear is NOT deductible and includes:
• Minor scuffs on walls or floors from regular use
• Fading of paint or wallpaper due to sunlight
• Minor carpet wear in high-traffic areas
• Loose grout or minor tile wear
• Worn enamel on bathtubs or sinks
• Normal deterioration of seals, caulking, or weather-stripping

CONTACT INFORMATION:

Please contact me promptly if you have any questions or need additional information:

Phone: [Your Phone]
Email: [Your Email]
Best times to reach me: [Available Days/Times]

Current Mailing Address:
[Your New Address]
[City, Postal Code]

TIMELINE FOR RESPONSE:

I request your response by [Date - 7 days from letter date] with either:
• Full deposit refund, OR
• Partial refund with detailed itemized deductions and supporting documentation

If I do not receive the deposit or a satisfactory explanation by [Date - 7-10 days from letter], I will have no choice but to pursue further action, which may include:
• Filing a complaint with the Consumer Protection Board
• Pursuing legal remedies through small claims court
• Reporting the matter to rental dispute resolution services

I hope this will not be necessary, as I have appreciated our landlord-tenant relationship and would prefer to resolve this matter amicably.

Thank you for your prompt attention to this request. I look forward to receiving my full security deposit return within the timeframe specified.

Sincerely,

[Your Signature]
[Your Printed Name]

Enclosures:
☐ Copy of original lease agreement
☐ Copy of security deposit receipt
☐ Move-in condition report
☐ Move-out photos (USB drive / link to cloud storage)
☐ Cleaning receipts
☐ Final utility bills/statements
☐ Keys return receipt (if applicable)

CC: [Property Management Company, if applicable]
File Copy Retained`
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.access_level !== 'admin' && user.access_level !== 'super_admin')) {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { force = false } = await req.json().catch(() => ({}));

    const templates = await base44.asServiceRole.entities.TemplateLibrary.list();
    
    let updated = 0;
    let skipped = 0;
    const missingKeys = [];
    const updatedList = [];

    for (const template of templates) {
      const seed = TEMPLATE_SEEDS[template.template_key];
      
      if (!seed) {
        missingKeys.push(template.template_key);
        continue;
      }

      const hasExistingContent = template.document_content && 
                                  template.document_content.trim().length > 50 && 
                                  !template.document_content.includes('[DRAFT REQUIRED]');

      if (hasExistingContent && !force) {
        skipped++;
        continue;
      }

      await base44.asServiceRole.entities.TemplateLibrary.update(template.id, {
        preview_content: seed.preview_content,
        document_content: seed.document_content,
        content: seed.document_content, // Legacy fallback
        preview_text: seed.preview_content // Legacy fallback
      });

      updated++;
      updatedList.push(template.template_key);
    }

    return Response.json({
      success: true,
      summary: {
        total_templates: templates.length,
        updated_count: updated,
        skipped_count: skipped,
        missing_keys_count: missingKeys.length
      },
      updated_templates: updatedList,
      missing_keys: missingKeys,
      message: `Successfully seeded ${updated} templates. ${skipped} skipped (already had content). ${missingKeys.length} templates found without seed data.`
    });

  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});