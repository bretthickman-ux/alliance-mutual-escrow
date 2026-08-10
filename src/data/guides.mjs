/* The guide library (Phase 2). One data module drives the guide pages, the
   /guides index, and the build-time PDF generator, so copy lives in exactly one
   place. Plain .mjs so Node build scripts and Astro both import it.

   Copy rules (HANDOFF section 2): fresh wording, 8th grade reading level, short
   sentences, no em dashes, statewide California framing, and strict neutrality:
   escrow verifies, funds, records, and closes the file; the agent hands over
   the keys. Fees quoted only from the published schedule. */

export const guides = [
  {
    slug: 'what-escrow-does',
    kicker: 'Escrow basics',
    title: 'What escrow is, and what it does',
    description: 'Escrow explained in plain English: a licensed neutral party that holds money and documents until every condition of the sale is met.',
    lead: 'Escrow is a neutral middle. A licensed company holds the money and documents while both sides finish what they promised. Nothing is released until every condition in the signed instructions is met.',
    sections: [
      {
        h: 'Why a neutral party at all',
        ps: [
          'A home sale asks two strangers to trade a deed and hundreds of thousands of dollars at the same moment. Neither side wants to go first. Escrow solves that: both sides hand their part to a neutral company, and the trade happens only when everything checks out.',
          'We are not the agent and not the lender. We answer to the signed instructions, not to either side of the deal.',
        ],
      },
      {
        h: 'What the escrow officer actually does',
        ps: [
          'Your officer opens the file, receipts the deposit, orders the title search, collects demands and disclosures, balances the numbers, coordinates signing, confirms funds, and records the deed with the county. Then the file closes and your agent hands over the keys.',
          'In California, independent escrow companies are licensed and audited under the Department of Financial Protection and Innovation (DFPI).',
        ],
      },
      {
        h: 'What escrow costs',
        ps: [
          'Our sale escrow fee is published: $300 plus $2.15 per $1,000 of the sale price, for each side. On a $1,000,000 home that is $2,450 per side. Our calculator itemizes the rest, including flat add-ons.',
        ],
      },
    ],
    faq: [
      { q: 'Who chooses the escrow company?', a: 'The buyer and seller agree on it in the purchase contract. In California you have the right to choose, and it is negotiable like other terms.' },
      { q: 'Is my deposit safe in escrow?', a: 'Deposits sit in a trust account, separate from company money. Funds move only on signed instructions from both sides.' },
      { q: 'Does escrow work for the buyer or the seller?', a: 'Neither. Escrow is neutral. We follow the instructions both sides signed, exactly as written.' },
      { q: 'Who hands over the keys at the end?', a: 'Your real estate agent. Escrow verifies, funds, records, and closes the file; the agent handles the keys.' },
    ],
  },
  {
    slug: 'escrow-timeline',
    kicker: 'The 30 days',
    title: 'The 30 day escrow timeline',
    description: 'What happens in a standard 30 day California escrow, day by day, and what can move the dates.',
    lead: 'A standard California escrow runs about 30 days. The first week opens the file, the middle clears title and conditions, and the last week signs, funds, and records.',
    sections: [
      {
        h: 'The shape of it',
        ps: [
          'Day 1: escrow opens and your deposit is receipted. Day 3: earnest money is verified. Day 5: the title search is ordered. Around day 12: HOA documents and payoff demands arrive and get reviewed. Day 21: loan documents are signed. Day 27: the lender confirms funds. Day 30: the deed records with the county, the file closes, and your agent hands over the keys.',
        ],
      },
      {
        h: 'What can stretch the timeline',
        ps: [
          'Slow HOA document orders, unpaid liens found in the title search, loan conditions that arrive late, and signatures scheduled at the last minute. Most delays are born in the quiet middle weeks, which is why we chase documents early.',
          'A cash purchase can close faster because there is no lender. The title and recording steps still take real days.',
        ],
      },
      {
        h: 'Your part',
        ps: [
          'Respond to document requests the day they arrive, schedule your signing early, and never wire money without calling your officer first at a number you found yourself.',
        ],
      },
    ],
    faq: [
      { q: 'Can escrow close early?', a: 'Yes, if both sides finish their conditions early and the lender is ready. The instructions control the date.' },
      { q: 'What happens on the last day?', a: 'The county records the deed. Once recording is confirmed, the sale is done and the file closes.' },
      { q: 'Who sets the 30 days?', a: 'The purchase contract. Thirty days is common in California, but the parties can agree on more or less.' },
    ],
  },
  {
    slug: 'wire-fraud-safety',
    kicker: 'Protect your money',
    title: 'Wire fraud safety in escrow',
    description: 'Wire fraud targets real estate closings. One phone call defeats most of it. How to send funds safely during escrow.',
    lead: 'Criminals target home closings with fake wire instructions sent by email. The defense is simple: never wire money based on an email alone. Call your escrow officer at a number you found yourself, confirm the instructions by phone, then send.',
    sections: [
      {
        h: 'How the scam works',
        ps: [
          'Fraudsters watch real estate email chains. Near closing, they send a message that looks like it came from your agent or escrow, with new wire instructions. The account is theirs. Wired money moves fast and is very hard to recover.',
        ],
      },
      {
        h: 'The rules that keep you safe',
        ps: [
          'Treat any change to wire instructions as a red flag; real instructions almost never change. Get the phone number from this website or your opening documents, not from the email itself. Confirm the account details by phone before sending, and verify receipt by phone after.',
          'We verify wires by phone on every file, using independently confirmed numbers. That is policy, not a courtesy.',
        ],
      },
      {
        h: 'If something feels wrong',
        ps: [
          'Stop. Call your officer. If money already moved, call your bank immediately and ask for a recall, then report it to the FBI at ic3.gov. Speed matters most in the first hours.',
        ],
      },
    ],
    faq: [
      { q: 'Will Alliance Mutual ever email me new wire instructions?', a: 'No. If you receive changed instructions by email, treat it as fraud and call your officer.' },
      { q: 'Is a cashier’s check safer than a wire?', a: 'Different, not safer. Large closings usually require wires. The phone verification habit is what keeps either safe.' },
      { q: 'Who do I call to verify?', a: 'Your escrow officer, at the number on this site or your opening package: (714) 544-6525.' },
    ],
  },
  {
    slug: 'buyer-guide',
    kicker: 'For buyers',
    title: 'The home buyer’s guide to escrow',
    description: 'What California home buyers do during escrow: deposits, disclosures, loan documents, closing costs, and the final day.',
    lead: 'As the buyer, your escrow job is four things: deposit on time, respond to disclosures quickly, sign your loan documents, and wire your closing funds safely. Your officer coordinates the rest.',
    sections: [
      {
        h: 'Your money in the process',
        ps: [
          'Your earnest money deposit goes into a trust account within days of opening and is receipted in writing. Near closing you wire the balance of your down payment and closing costs. Every dollar is accounted for on your closing statement, line by line.',
        ],
      },
      {
        h: 'What you will sign',
        ps: [
          'Escrow instructions, disclosures, title documents, and if you have a loan, the lender package with a notary. Signing usually happens about a week before closing. Bring government photo ID, and plan for the notary appointment to take about an hour.',
        ],
      },
      {
        h: 'Your closing costs',
        ps: [
          'Our escrow fee is $300 plus $2.15 per $1,000 of the price, your side. With a loan, add $500 loan processing and a notary estimate around $250. Title insurance, lender fees, and recording charges come from third parties and are itemized on your statement. The calculator on this site shows your side in seconds.',
        ],
      },
    ],
    faq: [
      { q: 'When do I get the keys?', a: 'After the deed records and the file closes, your agent hands over the keys. Recording day is key day in most files.' },
      { q: 'Can I lose my deposit?', a: 'Your contract controls that. Contingencies protect you while they are active. Ask your agent before removing any of them.' },
      { q: 'What ID do I need at signing?', a: 'A current government photo ID that matches your name on the file. The notary is strict about this by law.' },
    ],
  },
  {
    slug: 'seller-guide',
    kicker: 'For sellers',
    title: 'The home seller’s guide to escrow',
    description: 'What California home sellers do during escrow: disclosures, payoffs, the grant deed, and how proceeds arrive.',
    lead: 'As the seller, escrow mostly needs three things from you: complete disclosures early, sign the grant deed with a notary, and tell us how you want your proceeds. We order your loan payoffs and clear the file for closing.',
    sections: [
      {
        h: 'Payoffs and demands',
        ps: [
          'Any loan or line of credit on the property gets paid off through escrow. We order payoff demands early, verify them line by line, and update them before closing so there are no surprises. Demand processing is a published $30 per payoff.',
        ],
      },
      {
        h: 'Documents you will sign',
        ps: [
          'The grant deed transfers title and must be notarized. You will also sign escrow instructions and any HOA or disclosure paperwork the sale requires. Document prep is a published $50 per document.',
        ],
      },
      {
        h: 'Your proceeds',
        ps: [
          'After recording, your net proceeds go out by wire, usually the same day or the next business day. Your closing statement shows every line: price, payoffs, fees, prorations, and the net to you.',
        ],
      },
    ],
    faq: [
      { q: 'When is the sale final?', a: 'When the deed records with the county. Escrow confirms recording, closes the file, and releases proceeds.' },
      { q: 'Do I attend the closing?', a: 'California closings do not have a closing table. You sign with a notary days earlier, and recording day happens at the county.' },
      { q: 'What does escrow cost the seller?', a: 'The same published formula as the buyer: $300 plus $2.15 per $1,000, your side, plus small flat items your file actually uses.' },
    ],
  },
  {
    slug: 'refinance-guide',
    kicker: 'For refinances',
    title: 'The refinance escrow guide',
    description: 'How a refinance escrow works in California: flat fee tiers, payoffs, signing, funding, and the three day right to cancel.',
    lead: 'A refinance escrow swaps your old loan for a new one. There is no buyer and no seller, so it is faster and flat-priced: $650 up to a $750,000 loan, $850 to $1,000,000, $1,200 to $2,000,000, quoted above that, plus $200 processing.',
    sections: [
      {
        h: 'The short timeline',
        ps: [
          'Your lender sends loan documents, you sign with a notary, the old loan is paid off, and the new deed of trust records. On a primary home, federal law gives you three business days after signing to cancel; funding happens after that window passes.',
        ],
      },
      {
        h: 'What we handle',
        ps: [
          'Payoff demands ordered at open and verified. Conditions tracked in the open with your loan officer. Signing scheduled around your documents. Funding confirmed the day it lands, and recording confirmed to everyone the same day.',
        ],
      },
      {
        h: 'Multi-family and commercial',
        ps: [
          'Larger property refinances run $95 base plus $0.95 per $1,000 with a $500,000 loan minimum. Subordinations are a published $50, and HELOC or second-only escrows are $250.',
        ],
      },
    ],
    faq: [
      { q: 'Why does my old loan payoff look high?', a: 'Payoffs include interest through the payoff date plus any fees your old lender charges. We verify every line before funding.' },
      { q: 'When does my new payment start?', a: 'Your new lender sets that in your loan documents, usually the first of the month after funding. Ask your loan officer.' },
      { q: 'Do I need title insurance again?', a: 'Your new lender requires a new lender’s policy. It is a third-party cost, itemized on your statement.' },
    ],
  },
  {
    slug: '1031-exchange',
    kicker: 'Specialty escrow',
    title: '1031 exchange escrow',
    description: 'How escrow supports a 1031 exchange: the 45 and 180 day deadlines, the accommodator, and published processing.',
    lead: 'A 1031 exchange lets an investor sell one property and buy another while deferring capital gains tax. The deadlines are hard law: 45 days to identify the replacement, 180 days to close it. Escrow builds the calendar backward from those dates.',
    sections: [
      {
        h: 'The two clocks',
        ps: [
          'Both clocks start the day your sale closes. Day 45 is the last day to identify replacement property in writing. Day 180 is the last day to close on it. There are no extensions and no grace periods, so nothing in the file is allowed to drift.',
        ],
      },
      {
        h: 'The accommodator',
        ps: [
          'A qualified intermediary, often called an accommodator, holds your proceeds between the sale and the purchase so you never touch the money. We coordinate directly with your accommodator from day one: wiring, documents, and dates.',
        ],
      },
      {
        h: 'What it costs at escrow',
        ps: [
          '1031 processing is a published $250 on top of standard sale escrow fees. Your accommodator charges separately for the exchange itself. Talk to your tax advisor about whether an exchange fits your situation; that part is their lane, not ours.',
        ],
      },
    ],
    faq: [
      { q: 'Can escrow be my accommodator?', a: 'No. The intermediary must be a separate qualified party. We work alongside yours, and your tax advisor can help you choose one.' },
      { q: 'What happens if I miss day 45?', a: 'The exchange fails for any property not identified in time, and the tax deferral is lost. This is why the calendar runs backward from the deadlines.' },
      { q: 'Do you handle reverse exchanges?', a: 'We handle the escrow side of complex exchanges routinely. Bring your accommodator into the conversation early and we will build the timeline together.' },
    ],
  },
  {
    slug: 'bulk-sale',
    kicker: 'Specialty escrow',
    title: 'Bulk sale escrow for business transfers',
    description: 'What a bulk sale escrow does when a business changes hands: notices, creditor claims, and a clean transfer.',
    lead: 'When a business sells its inventory and assets, California’s bulk sale rules protect the buyer and the seller’s creditors. A bulk sale escrow publishes the required notice, holds the funds through the claim period, and pays valid claims before the seller is paid.',
    sections: [
      {
        h: 'Why the law requires notice',
        ps: [
          'Creditors of the selling business get a public heads-up that the assets are changing hands. That notice window lets them file claims against the sale proceeds instead of chasing the new owner later. Handled correctly, the buyer takes the business clean.',
        ],
      },
      {
        h: 'What escrow does in a bulk sale',
        ps: [
          'We publish and record the notice, collect claims during the statutory period, verify them, pay valid claims from the proceeds at closing, and release the balance to the seller. Licenses, leases, and equipment lists ride along in the file.',
          'Our officers run bulk sales as regular work, not exceptions. Timelines are set by statute, so opening early matters.',
        ],
      },
    ],
    faq: [
      { q: 'Does every business sale need a bulk sale escrow?', a: 'Not every one; it depends on the assets and the deal. Your attorney or broker can confirm. When the rules apply, skipping them exposes the buyer.' },
      { q: 'How long does it take?', a: 'Longer than a home escrow, because the notice and claim periods are set by law. We map the dates at opening so both sides can plan.' },
      { q: 'Who pays the claims?', a: 'Valid creditor claims are paid from the seller’s proceeds through escrow before the seller receives the balance.' },
    ],
  },
  {
    slug: 'probate',
    kicker: 'Specialty escrow',
    title: 'Probate and court supervised sale escrow',
    description: 'How escrow works when a court supervises the sale: confirmation, required notices, and documentation the court accepts.',
    lead: 'When a property is sold from an estate or under court supervision, the escrow follows the court’s rules as well as the contract. The file needs the right documents, in the right order, accepted the first time.',
    sections: [
      {
        h: 'What makes probate different',
        ps: [
          'The seller is an estate, a trust, or a conservatorship, represented by a personal representative or trustee. Depending on the case, the sale may need court confirmation before it can close, and notice requirements may apply. The court’s calendar becomes part of the escrow calendar.',
        ],
      },
      {
        h: 'How we run it',
        ps: [
          'We confirm early what authority the representative holds and what the court requires. Then we build the timeline around confirmation dates, collect certified documents, and prepare a file the court and the title company will both accept without a second pass.',
          'Your attorney drives the legal strategy. Our job is a clean, on-time file that never makes the estate wait.',
        ],
      },
    ],
    faq: [
      { q: 'How long does a probate escrow take?', a: 'It depends on whether the sale needs court confirmation. Files with full authority can run close to a normal timeline; confirmed sales follow the court date.' },
      { q: 'Can a probate sale be overbid?', a: 'In court-confirmed sales, yes: other buyers can bid at the hearing. Your agent and attorney can walk you through how overbids work.' },
      { q: 'Who signs for the seller?', a: 'The personal representative, trustee, or conservator, with documents proving their authority. We verify that authority at opening.' },
    ],
  },
  {
    slug: 'mobile-home',
    kicker: 'Specialty escrow',
    title: 'Mobile and manufactured home escrow',
    description: 'How escrow handles mobile and manufactured home sales in California: title, registration, taxes, and park approval.',
    lead: 'Mobile and manufactured homes close through a different system than houses. Depending on the home, title transfers through the state housing department rather than the county recorder, and the buyer usually needs park approval before closing.',
    sections: [
      {
        h: 'What changes from a normal sale',
        ps: [
          'Many manufactured homes are registered with California’s Department of Housing and Community Development (HCD) instead of being recorded like real property. The escrow verifies registration, clears liens and taxes, and processes the transfer through the right agency for that home.',
        ],
      },
      {
        h: 'The park’s role',
        ps: [
          'If the home sits in a park, the buyer typically must be approved by park management and sign the park’s rental or lease agreement before closing. We time the file so approval, payoff, and transfer land together.',
        ],
      },
    ],
    faq: [
      { q: 'Is a mobile home sale faster than a house?', a: 'Often, but the steps are different, not fewer. Registration, taxes, and park approval each have their own clock.' },
      { q: 'Do mobile home sales use title insurance?', a: 'It depends on how the home is titled. Homes converted to real property close more like houses. We confirm the home’s status at opening.' },
      { q: 'Who handles the HCD paperwork?', a: 'We do, as part of the escrow. The transfer is not done until the state records the new owner.' },
    ],
  },
  {
    slug: 'fsbo',
    kicker: 'Specialty escrow',
    title: 'For sale by owner (FSBO) escrow',
    description: 'Selling without an agent in California: what escrow does and does not do in a FSBO sale, and how both sides stay protected.',
    lead: 'You can sell or buy a home without agents. Escrow works exactly the same: a licensed neutral party holds the money, follows signed instructions, and records the deed. What escrow cannot do is negotiate for you or give legal advice.',
    sections: [
      {
        h: 'What escrow covers in a FSBO',
        ps: [
          'Everything procedural: deposit receipting, title search, payoff demands, prorations, document coordination, notarized signing, funding, and recording. The file runs on the same rails as an agented sale, with the same published fees.',
        ],
      },
      {
        h: 'What stays on your plate',
        ps: [
          'Price negotiation, contract terms, and disclosure decisions belong to the buyer and seller. California requires sellers to disclose known material facts; the state’s standard disclosure forms are a good starting point, and a real estate attorney is a smart call for contract questions.',
          'We stay neutral. We can explain what a form does procedurally, but we cannot advise either side what to agree to.',
        ],
      },
    ],
    faq: [
      { q: 'Can escrow give us the purchase contract?', a: 'No. The contract comes from the parties, often with an attorney’s help. Once both sides sign, we open the file from it.' },
      { q: 'Does FSBO escrow cost less?', a: 'The escrow fee is the same published formula. What FSBO saves is commission, which is outside escrow.' },
      { q: 'Who holds the deposit in a FSBO?', a: 'Escrow does, in trust, receipted in writing. Never hand a deposit directly to the other party.' },
    ],
  },
  {
    slug: 'holding-escrow',
    kicker: 'Specialty escrow',
    title: 'Holding escrows',
    description: 'What a holding escrow is: a licensed neutral account that holds funds or documents under signed instructions until conditions are met.',
    lead: 'A holding escrow is the simplest form of what we do: money or documents parked with a licensed neutral party under signed instructions, released only when the agreed conditions are met. No sale required.',
    sections: [
      {
        h: 'When people use one',
        ps: [
          'Repairs promised after a closing, funds waiting on a permit or a release, disputed amounts held while parties work something out, or documents that should only be delivered when a condition is satisfied. If two parties need a trusted middle, a holding escrow fits.',
        ],
      },
      {
        h: 'How it works',
        ps: [
          'Both parties sign instructions that spell out exactly what is held, what conditions trigger release, and to whom the release goes. We hold the funds in trust and act only on those instructions. Changes require both signatures, which is the point.',
        ],
      },
    ],
    faq: [
      { q: 'How long can a holding escrow stay open?', a: 'As long as the instructions allow. Good instructions include an end date and what happens if the condition is never met.' },
      { q: 'What does it cost?', a: 'It depends on what is held and for how long. Call with the details and we will quote it plainly: (714) 544-6525.' },
      { q: 'Can one side change the terms?', a: 'No. The instructions are a two-party agreement. We act only on what both sides signed.' },
    ],
  },
];

/** Slugs list, used by the PDF build and the regression suite. */
export const guideSlugs = guides.map((g) => g.slug);
