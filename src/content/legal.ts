/**
 * Legal document templates for FunCoin Lab.
 *
 * IMPORTANT: These are starting-point templates written in plain English.
 * They are NOT legal advice and must be reviewed and adapted by a qualified
 * lawyer for your jurisdiction and business before public launch.
 *
 * Tokens: "{{CONTACT_EMAIL}}" is substituted by the page at render time.
 *
 * Owner details (operator, governing law and so on) come from src/lib/legal-config.ts. A section that
 * depends on a blank value is left out; nothing is invented. Terms and Privacy sections are numbered
 * automatically, so write their headings without a number.
 */
import { LEGAL as LEGAL_ENV, legalProviders, type LegalProviders } from "@/lib/legal-config"

export type LegalSection = {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export type LegalDoc = {
  slug: "terms" | "privacy" | "disclaimer"
  title: string
  description: string
  updated: string
  summary: string
  sections: LegalSection[]
}

const UPDATED = "2026-10-11"

const numbered = (sections: LegalSection[]): LegalSection[] => sections.map((s, i) => ({ ...s, heading: `${i + 1}. ${s.heading}` }))
const when = (condition: unknown, ...sections: LegalSection[]): LegalSection[] => (condition ? sections : [])

/**
 * The one sentence that keeps the "we don't do tokens" statements true: the tools don't, the team's
 * own token is separate. Worded to hold both before and after that token is live.
 */
const TEAM_TOKEN = "Separately from the tools, the FunCoin Lab team has, or plans to launch, its own meme token. It is described on the Token page (/token)."

/** Builds the three documents for a set of owner details. Tests pass their own; the site uses env. */
export function buildLegalDocs(LEGAL: typeof LEGAL_ENV, P: LegalProviders = legalProviders()): Record<LegalDoc["slug"], LegalDoc> {
  const operator = [LEGAL.entity, LEGAL.address, LEGAL.country].filter(Boolean).join(", ")

  const terms: LegalDoc = {
    slug: "terms",
    title: "Terms of Service",
    description: "The rules for using FunCoin Lab, a creative tool for generating meme brand concepts, names, lore and website prototypes.",
    updated: UPDATED,
    summary:
      "FunCoin Lab is a creative tool for making meme brand concepts and websites. By using it you agree to use it responsibly and to take responsibility for how you use the output. The tools do not create, issue, list, trade or hold tokens for you, and nothing here is financial advice. The team's own meme token is separate and is described on the Token page.",
    sections: numbered([
      {
        heading: "Accepting these terms",
        paragraphs: [
          'These Terms of Service ("Terms") are an agreement between you and FunCoin Lab ("FunCoin Lab", "we", "us"). By accessing or using the FunCoin Lab website and app (the "Service"), you agree to these Terms and to our Privacy Policy and Disclaimer. If you do not agree, please do not use the Service.',
        ],
      },
      ...when(LEGAL.entity, {
        heading: "Who operates the Service",
        paragraphs: [`The Service is operated by ${operator}.`],
      }),
      {
        heading: "What the Service is",
        paragraphs: [
          "FunCoin Lab is an AI-powered creative tool that generates meme brand concepts, including names, ticker-style tags, .fun domain ideas, lore, slogans, logos and other images, social bios, meme captions and landing pages that you can preview, export or publish at a FunCoin Lab address.",
          "The tools are for entertainment, creative experimentation, branding and website building. They do not create, issue, deploy, list, sell, trade or hold tokens for users. FunCoin Lab does not provide wallets or custody of any funds or assets, and does not provide financial, investment, legal or tax advice.",
          `${TEAM_TOKEN} Section "No financial services, and the team's own token" below says what that page shows.`,
        ],
      },
      {
        heading: "Eligibility",
        paragraphs: [
          "You must be at least 13 years old to use the Service, or older if required by the law where you live. If you are under the age of legal majority in your country, you may only use the Service with the involvement and consent of a parent or guardian. You may not use the Service if you are barred from doing so under applicable law.",
        ],
      },
      {
        heading: "Accounts",
        paragraphs: [
          "Your account is your Solana wallet. You sign in by signing a message with your wallet, which does not send a transaction or cost anything. We never ask for, and you must never share, your seed phrase or private key.",
          "You are responsible for keeping your wallet secure and for activity under your account. Anyone who controls your wallet can sign in as you. Tell us promptly at {{CONTACT_EMAIL}} if you believe your wallet has been compromised.",
        ],
      },
      {
        heading: "Acceptable use",
        paragraphs: ["We want FunCoin Lab to stay fun and safe. When using the Service or anything it generates, you agree not to:"],
        bullets: [
          "Impersonate any real person, company, brand, project or public figure, or create content suggesting an endorsement or affiliation that does not exist.",
          'Use generated concepts, names or websites to run scams, phishing, fraud, "rug pulls" or any deceptive scheme.',
          "Present generated concepts in misleading financial promotions, including claims of profit, returns, price increases, guaranteed value or investment opportunity.",
          "Create or share hateful, harassing, violent, sexually explicit or discriminatory content, or content that targets individuals or groups.",
          "Infringe anyone's intellectual property, privacy or other rights.",
          "Break any applicable law or regulation, including securities, consumer protection and advertising laws.",
          "Attempt to disrupt, overload, reverse engineer, scrape at scale or gain unauthorized access to the Service or its systems.",
          "Use automated means to abuse generation limits or resell access to the Service without our permission.",
        ],
      },
      {
        heading: "Your content and generated content",
        paragraphs: [
          'You keep any rights you have in the prompts and other content you submit ("Your Content"). You give FunCoin Lab a limited license to store, process and transmit Your Content as needed to run and improve the Service, including sending prompts to AI providers to produce results.',
          'Subject to these Terms and to any rights of third parties, you may use the output generated for you ("Generated Content") for personal and commercial purposes. To the extent we have any rights in Generated Content, we assign them to you. Because AI systems may produce similar output for different users, Generated Content may not be unique, and we cannot grant you exclusive rights to it.',
          "You are responsible for how you use Generated Content, including making sure it is lawful, accurate and does not infringe anyone else's rights.",
        ],
      },
      {
        heading: "Limitations of AI output",
        paragraphs: [
          "Generated Content is produced automatically by AI models and may be inaccurate, incomplete, offensive, repetitive or similar to existing names, logos, brands or works. It is not reviewed by a human before you see it. Always review output carefully before relying on or publishing it.",
        ],
      },
      {
        heading: "No financial services, and the team's own token",
        paragraphs: [
          "FunCoin Lab is not a broker, exchange, wallet provider, custodian, investment adviser or financial institution, and its tools are not a token launch platform: they do not create, issue, deploy, list, sell, trade or hold tokens for users. Nothing in the Service is an offer, solicitation or recommendation to buy, sell or hold any asset.",
          "Token details shown on a website made with the tools, such as a network, supply, contract address or a Buy link, are entered by the person who made that site. We do not verify them.",
          `${TEAM_TOKEN} Once it is live, that page and a strip shown across the site display its contract address, links to third-party sites where it can be bought or viewed, and market data such as price, market capitalisation, trading volume, a price chart and a holder count. That data comes from third parties (DexScreener, GeckoTerminal, Helius and the Solana blockchain). It can be delayed, incomplete or wrong, and it is shown for information only. Showing it is not advice and not a recommendation to buy. Any purchase happens on third-party sites that we do not operate.`,
          "If you choose to launch any real project, token or website based on Generated Content, you do so entirely at your own risk and are solely responsible for complying with all laws that apply to you. See our Disclaimer for more detail.",
        ],
      },
      {
        heading: "Credits, payments and refunds",
        paragraphs: [
          "Some features, such as AI image generation, use credits. You buy credits with cryptocurrency, either directly from your Solana wallet (SOL or USDC) or through our payment processor NOWPayments. Prices are shown in US dollars before you pay; SOL amounts are converted at the quoted rate, which is locked for a limited time.",
          "Credits are a prepaid balance for FunCoin Lab features only. They are not a token, are not transferable, cannot be withdrawn or exchanged for money or crypto, and have no cash value. Credits are tied to the wallet you signed in with.",
          "Blockchain payments are final once confirmed, so refunds are generally not available. If an AI image fails to generate, the credits it used are returned automatically. If you were charged incorrectly, contact us at {{CONTACT_EMAIL}} with your wallet address or transaction id and we will review it.",
          "You are responsible for sending the correct amount to the correct address from a wallet you control, and for any network fees.",
        ],
      },
      {
        heading: "Third-party services",
        paragraphs: [
          "The Service relies on third-party providers, which may include Supabase for data storage, AI model providers for content generation and, where connected, domain registrars or registrar APIs. Your use of these services may also be subject to their own terms and privacy policies.",
          "Domain suggestions are ideas only. Unless a registrar integration is connected and clearly indicated, we do not check availability, and even then availability and pricing must be confirmed with the registrar before purchase. We are not responsible for third-party services, websites or content.",
        ],
      },
      {
        heading: "Intellectual property and trademarks",
        paragraphs: [
          "The Service itself, including its software, design, branding and content we provide (other than Your Content and Generated Content), belongs to FunCoin Lab or its licensors and is protected by law. You may not copy or reuse it except as these Terms allow.",
          "You are solely responsible for clearing any name, ticker-style tag, domain, logo or other Generated Content before using it publicly or commercially, including searching for existing brands and checking trademark databases in the relevant countries. If you believe content on the Service infringes your rights, contact us at {{CONTACT_EMAIL}}.",
        ],
      },
      {
        heading: "Suspension and termination",
        paragraphs: [
          "You can stop using the Service at any time and may request deletion of your account. We may suspend or terminate access if you break these Terms, if required by law, or to protect the Service, other users or third parties. Sections that by their nature should survive termination (such as ownership, disclaimers and limitation of liability) will continue to apply.",
        ],
      },
      {
        heading: "Disclaimers and limitation of liability",
        paragraphs: [
          'The Service and all Generated Content are provided "as is" and "as available", without warranties of any kind, express or implied, including warranties of accuracy, fitness for a particular purpose, non-infringement or uninterrupted availability.',
          "To the maximum extent permitted by law, FunCoin Lab will not be liable for any indirect, incidental, special, consequential or punitive damages, or for any loss of profits, data, funds, goodwill or business, arising from your use of the Service or Generated Content. Our total liability for any claim relating to the Service is limited to the greater of the amount you paid us in the 12 months before the claim or 50 US dollars. Some jurisdictions do not allow certain limitations, so some of these may not apply to you.",
          "You agree to indemnify FunCoin Lab against claims arising from your misuse of the Service, your violation of these Terms or your use of Generated Content, including any real-world project you launch.",
        ],
      },
      {
        heading: "Changes to these terms",
        paragraphs: [
          "We may update these Terms from time to time. When we make material changes we will update the date at the top of this page and, where appropriate, notify you in the app. Continuing to use the Service after changes take effect means you accept the updated Terms.",
        ],
      },
      ...when(LEGAL.governingLaw, {
        heading: "Governing law and disputes",
        paragraphs: [
          `These Terms are governed by the laws of ${LEGAL.governingLaw}.${LEGAL.disputeVenue ? ` Disputes are to be brought before ${LEGAL.disputeVenue}.` : ""} Nothing in this section takes away consumer rights that the law where you live gives you and that cannot be waived by agreement.`,
        ],
      }),
      {
        heading: "Contact",
        paragraphs: ["Questions about these Terms? Contact FunCoin Lab at {{CONTACT_EMAIL}}."],
      },
    ]),
  }

  const privacyContact = LEGAL.privacyEmail || "{{CONTACT_EMAIL}}"
  const aiNames = P.ai.join(" and ")
  const processors = [
    "Vercel: hosts the website and app, and handles every request to them. Like any web host, it processes IP addresses and request logs.",
    'Supabase: our database and file storage. Everything listed in "Information we collect" that we store is stored there.',
    ...(P.ai.length ? [`${aiNames}: ${P.aiText && P.aiImages ? "generates text and images" : P.aiImages ? "generates images" : "generates text"} from the prompts you send.`] : []),
    ...(P.nowPayments
      ? ["NOWPayments: processes credit purchases paid in coins other than SOL or USDC from your own wallet. It receives the order amount and reference and handles the payment itself."]
      : []),
    ...(P.rpc ? [`${P.rpc}: the Solana network provider we use to read the blockchain, for example to confirm a payment. Requests your wallet app makes through our site also pass through it.`] : []),
    ...(P.walletConnect ? ["WalletConnect (Reown): if you choose to connect a phone wallet by QR code, the connection is relayed through its network."] : []),
    ...(P.registrar ? [`${P.registrar}: the domain registrar we ask whether a domain name is available. It receives the domain name, not your account details.`] : []),
    ...(P.analytics ? ['Google Analytics (Google): only if you accept analytics cookies. See "Cookies and similar technologies".'] : []),
  ]

  const privacy: LegalDoc = {
    slug: "privacy",
    title: "Privacy Policy",
    description: "How FunCoin Lab collects, uses and protects your information, including wallet addresses, saved projects, AI prompts and payments.",
    updated: UPDATED,
    summary:
      "We collect what we need to run FunCoin Lab: your public wallet address, the projects and images you make, your credit purchases, and the prompts you send for generation. We do not sell your data. Wallet addresses and transactions on a public blockchain are outside anyone's power to delete.",
    sections: numbered([
      {
        heading: "About this policy",
        paragraphs: [
          `This Privacy Policy explains how FunCoin Lab ("we", "us") handles personal information when you use the FunCoin Lab website and app (the "Service"). For any privacy question or request, contact us at ${privacyContact}.`,
        ],
      },
      ...when(LEGAL.entity, {
        heading: "Who we are",
        paragraphs: [`The Service is operated by ${operator}, which decides how and why your personal information is used (the "controller").`],
      }),
      {
        heading: "Information we collect",
        paragraphs: ["Depending on how you use the Service, we collect and store:"],
        bullets: [
          "Your account: your public Solana wallet address, which is your account id, when the account was created and when it was last active. We never receive your seed phrase or private keys.",
          "Sign-in records: a cookie that keeps you signed in, and a note that each single-use sign-in code has been used. That code is random, has an expiry time and is not stored with your wallet address.",
          "Projects and websites: the ideas, names, lore, captions, site content and settings you save, and whether a site is published and at which address.",
          "Generation history: the text you enter to generate ideas, memes, bios and other content, and the results.",
          "Generated images: the image files, the prompt used to make each one and the model that made it.",
          "Saved domains and bookmarks, including whether you joined the token waitlist and when.",
          "Credits and payments: your credit balance and history, and for each purchase the pack, price, payment method, amount, receiving address, status, time and blockchain transaction id, plus the payment notices our payment providers send us.",
          "Registrar link clicks: the domain, where on the site you clicked and your account id if you were signed in. We do not record your IP address for these.",
          "Reports: if you report a published site or an image, the item, the reason you chose and, if you were signed in, your account id.",
          "Moderation records: if we suspend, ban or restore an account or remove content, we keep the action, the reason and internal notes about the account.",
          "Messages you send us, for example by email or Telegram.",
        ],
      },
      {
        heading: "Information we use but do not keep in our database",
        paragraphs: [
          "Your IP address is used in memory, for a short time, to limit how many requests one connection can make. We do not write it to our database for ordinary visitors. Our hosting provider processes IP addresses, browser details and request logs in order to serve the site, as every web host does.",
          "For administrators only, we record the IP address and browser of each administrative action in an audit log. That log also records which account or content each action affected, and it cannot be edited or deleted.",
        ],
      },
      {
        heading: "Why we use it, and on what basis",
        paragraphs: ["Where data protection law requires a legal basis, we rely on the following:"],
        bullets: [
          "To provide the Service you asked for (performing our agreement with you): your account, sign-in, projects, generation, images, saved items, credits and purchases.",
          "Our legitimate interests in keeping the Service safe and working: rate limiting, preventing abuse and fraud, moderation, handling reports, the administrator audit log, fixing errors, and counting registrar link clicks.",
          "Legal obligations: keeping payment records for accounting and tax, and answering lawful requests.",
          'Your consent: analytics cookies. You can change your choice at any time with the "Cookie settings" link in the footer.',
        ],
      },
      {
        heading: "AI generation",
        paragraphs: [
          P.ai.length
            ? `${P.aiText ? "To generate text and images" : "Text is generated by our own templates and is not sent to an outside AI company. To generate images"}, we send your prompt and related context, such as the concept you are working on, to ${aiNames}. ${P.ai.length > 1 ? "They process" : "It processes"} that data to return a result, under ${P.ai.length > 1 ? "their" : "its"} own terms.`
            : "Content is generated by our own templates and is not sent to an outside AI company.",
          "Please do not put personal, confidential or sensitive information, or information about other people, in prompts.",
        ],
      },
      {
        heading: "Published sites",
        paragraphs: [
          "If you publish a site, its content is public at its FunCoin Lab address and may be listed in Discover. Anything you put on it, including a contract address or social links, is visible to everyone. Unpublishing removes it from our pages, but copies others have already made are outside our control.",
        ],
      },
      {
        heading: "Blockchain data cannot be deleted",
        paragraphs: [
          "Wallet addresses and transactions on the Solana blockchain are public and permanent by design. Nobody, including us, can change or delete them. Deleting data from FunCoin Lab removes what we hold, not what is on the blockchain.",
        ],
      },
      {
        heading: "Who we share it with",
        paragraphs: ["We do not sell your personal information and we do not share it for third-party advertising. These companies process data for us so the Service can run:"],
        bullets: processors,
      },
      {
        heading: "Other disclosures",
        paragraphs: [
          "We may also disclose information when the law requires it, to protect rights and safety, or as part of a business transfer such as a merger or sale, in which case this policy continues to apply to your information.",
          "The Token page shows market data fetched by our servers from DexScreener and GeckoTerminal. Those requests do not include any information about you. If you follow a link to a third-party site, such as a registrar, an exchange or a block explorer, that site's own privacy policy applies.",
        ],
      },
      {
        heading: "Transfers to other countries",
        paragraphs: [
          "The companies above operate in several countries, including the United States, so your information may be processed outside the country where you live. Where the law requires safeguards for such transfers, we rely on the safeguards those providers offer, such as standard contractual clauses.",
        ],
      },
      {
        heading: "How long we keep it",
        paragraphs: ["We keep information for as long as it is needed for the purpose it was collected for:"],
        bullets: [
          "Account, projects, generation history, images, saved domains and bookmarks: until you delete them or your account is deleted.",
          "Payment orders and the credit history: kept after an account is deleted, because we need them for accounting, tax and payment disputes.",
          "Moderation records and the administrator audit log: kept as a record of what was done and why.",
          "Copies held in our providers' backups are removed on those providers' schedules.",
        ],
      },
      {
        heading: "Security",
        paragraphs: [
          "We use reasonable technical and organizational measures to protect your information, including encrypted connections (HTTPS), access controls and a database that only our own servers can read or write. No online service can be perfectly secure, so we cannot guarantee absolute security. There are no passwords: your account is only as secure as the wallet you sign in with, so keep it safe.",
        ],
      },
      {
        heading: "Your rights and choices",
        paragraphs: [
          `Depending on where you live, you may have the right to access, correct, export or delete your personal information, to object to or restrict certain processing, and to withdraw consent. You can delete individual projects in the app. To ask for a copy of your data or for your account to be deleted, email ${privacyContact} from a channel we can reply to and tell us your wallet address. We will ask you to prove you control that wallet, for example by signing a message, before acting.`,
          "You also have the right to complain to the data protection authority where you live.",
        ],
      },
      {
        heading: "Cookies and similar technologies",
        paragraphs: ["We keep cookies and similar storage to a minimum:"],
        bullets: [
          "Sign-in cookie: keeps your wallet signed in and is shared between funcoinlab.com and app.funcoinlab.com. It is necessary for the app to work.",
          "Preferences: your theme, an idea you are working on, the wallet you last connected and notices you have dismissed are kept in your browser's local storage or a cookie. They stay on your device.",
          ...(P.analytics
            ? [
                "Cookie choice: a cookie that remembers whether you accepted or declined analytics.",
                'Analytics: Google Analytics is loaded only if you accept. It then sets its own cookies and tells us which pages are viewed, roughly where visitors are and what kind of device they use. Advertising signals are set to denied. If you decline, nothing is loaded and no analytics cookies are set. Change your choice at any time with "Cookie settings" in the footer.',
              ]
            : ["Analytics: we do not use analytics or advertising cookies."]),
        ],
      },
      {
        heading: "Children",
        paragraphs: [
          `The Service is for people aged ${LEGAL.minAge} or older. We do not knowingly collect personal information from anyone younger. If you believe someone under ${LEGAL.minAge} has given us personal information, contact us at ${privacyContact} and we will delete it.`,
        ],
      },
      {
        heading: "Changes and contact",
        paragraphs: [
          `We may update this Privacy Policy from time to time. We will update the date at the top of this page and, for material changes, tell you in the app. For any privacy question or request, contact FunCoin Lab at ${privacyContact}.`,
        ],
      },
    ]),
  }

  const disclaimer: LegalDoc = {
    slug: "disclaimer",
    title: "Disclaimer",
    description: "Important information about FunCoin Lab: generated meme coin concepts are creative and branding material, not financial advice.",
    updated: UPDATED,
    summary:
      "Everything FunCoin Lab generates is creative and branding material, not financial advice. The tools do not create, issue, list, trade or hold tokens for you, and if you launch anything real you are solely responsible. The team's own meme token is separate; the Token page describes it and shows third-party market data once it is live.",
    sections: [
      {
        heading: "Creative and branding use",
        paragraphs: [
          "All meme coin concepts, names, ticker-style tags, token concept information, lore, slogans, logos, captions, domain ideas and websites generated by FunCoin Lab are creative and branding material. Generating them does not create, issue or list any token.",
        ],
      },
      {
        heading: "Not financial, investment, legal or tax advice",
        paragraphs: [
          "Nothing on FunCoin Lab is financial, investment, legal or tax advice, and nothing should be read as a recommendation to buy, sell or hold any asset. We do not provide personalized investment recommendations of any kind.",
        ],
      },
      {
        heading: "The tools do not create or trade tokens for you",
        paragraphs: ["FunCoin Lab's tools do not, for any user:"],
        bullets: [
          "Create, issue, deploy or mint tokens or smart contracts.",
          "List, sell, buy, exchange or trade tokens or any other asset.",
          "Custody, hold or manage wallets, private keys, funds or assets.",
          "Act as a broker, exchange, launchpad or investment adviser.",
        ],
      },
      {
        heading: "The team's own token",
        paragraphs: [
          `${TEAM_TOKEN} It is not created by, or part of, the tools above.`,
          "Once it is live, the Token page and a strip shown across the site display its contract address, links to third-party sites where it can be bought or viewed, and market data: price, market capitalisation, trading volume, a price chart and a holder count. The data is supplied by third parties (DexScreener, GeckoTerminal, Helius and the Solana blockchain), can be delayed, incomplete or wrong, and is shown for information only. It is not advice and not a recommendation to buy, sell or hold.",
        ],
      },
      {
        heading: "No claim of value",
        paragraphs: [
          "We make no claim that any generated concept, any token named on a site made with the tools, or the team's own token has, or will ever have, any monetary value, popularity or success. Generating a concept does not create any asset. A price or market figure shown on the Token page is a report of past third-party trades, not a statement of what the token is worth or will be worth.",
        ],
      },
      {
        heading: "Token details on generated sites",
        paragraphs: [
          'Generated websites can show token details such as network, supply and a contract address, and, when a contract address is entered, a Buy button, market links and "How to buy" steps that point to third-party sites. All of this is entered or switched on by the site owner. It is not verified by FunCoin Lab and is not an offer or endorsement by us. Always verify a contract address through the project\'s official channels before interacting with it.',
        ],
      },
      {
        heading: "Domain suggestions are not availability guarantees",
        paragraphs: [
          "Domain names suggested by FunCoin Lab are ideas only. Unless a registrar integration is connected and clearly shown, we do not check availability, and a suggested domain may already be registered. Always confirm availability and pricing with a domain registrar before buying.",
        ],
      },
      {
        heading: "AI output may be inaccurate or resemble existing names",
        paragraphs: [
          "Content is generated by AI and may be inaccurate, inappropriate or similar to existing names, logos, brands or trademarks. You are responsible for reviewing all output and for checking trademarks and existing brands before using any name, logo or other content publicly or commercially.",
        ],
      },
      {
        heading: "If you launch anything real, you are responsible",
        paragraphs: [
          "If you decide to launch any real token, project, product or website, whether or not it is based on content from FunCoin Lab, you are solely responsible for it, including compliance with all laws and regulations in your jurisdiction and anywhere you operate. These may include securities and financial regulation, consumer protection, advertising and marketing rules, tax, and intellectual property law.",
          "You should consult qualified legal, financial and tax professionals before launching anything real. Do not use FunCoin Lab content to make financial promises or misleading claims to anyone.",
        ],
      },
      {
        heading: "Crypto assets are highly risky",
        paragraphs: [
          "Crypto assets, including meme tokens, are highly volatile and speculative. They can lose all of their value, may be poorly regulated and are frequently targeted by scams. Never risk money you cannot afford to lose.",
        ],
      },
      {
        heading: "Questions",
        paragraphs: ["If you have questions about this Disclaimer, contact FunCoin Lab at {{CONTACT_EMAIL}}."],
      },
    ],
  }

  return { terms, privacy, disclaimer }
}

export const legalDocs = buildLegalDocs(LEGAL_ENV)
