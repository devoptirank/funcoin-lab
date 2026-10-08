/**
 * Legal document templates for FunCoin Lab.
 *
 * IMPORTANT: These are starting-point templates written in plain English.
 * They are NOT legal advice and must be reviewed and adapted by a qualified
 * lawyer for your jurisdiction and business before public launch.
 *
 * Tokens: "{{CONTACT_EMAIL}}" is substituted by the page at render time.
 */

export type LegalSection = { heading: string; paragraphs: string[]; bullets?: string[] }

export type LegalDoc = {
  slug: "terms" | "privacy" | "disclaimer"
  title: string
  description: string
  updated: string
  summary: string
  sections: LegalSection[]
}

const UPDATED = "2026-10-01"

const terms: LegalDoc = {
  slug: "terms",
  title: "Terms of Service",
  description:
    "The rules for using FunCoin Lab, a creative tool for generating meme brand concepts, names, lore and website prototypes.",
  updated: UPDATED,
  summary:
    "FunCoin Lab is a creative tool for making meme brand concepts, and by using it you agree to use it responsibly, take responsibility for how you use the output, and understand that we offer no financial services.",
  sections: [
    {
      heading: "1. Accepting these terms",
      paragraphs: [
        "These Terms of Service (\"Terms\") are an agreement between you and FunCoin Lab (\"FunCoin Lab\", \"we\", \"us\"). By accessing or using the FunCoin Lab website and app (the \"Service\"), you agree to these Terms and to our Privacy Policy and Disclaimer. If you do not agree, please do not use the Service.",
      ],
    },
    {
      heading: "2. What the Service is",
      paragraphs: [
        "FunCoin Lab is an AI-powered creative tool that generates meme brand concepts, including names, ticker-style tags, .fun domain ideas, lore, slogans, logo concepts, social bios, meme captions and previewable landing page mockups.",
        "The Service is for entertainment, creative experimentation, branding and website prototyping only. FunCoin Lab does not create, issue, deploy, list, sell or trade tokens, does not provide wallets or custody of any funds or assets, and does not provide financial, investment, legal or tax advice.",
      ],
    },
    {
      heading: "3. Eligibility",
      paragraphs: [
        "You must be at least 13 years old to use the Service, or older if required by the law where you live. If you are under the age of legal majority in your country, you may only use the Service with the involvement and consent of a parent or guardian. You may not use the Service if you are barred from doing so under applicable law.",
      ],
    },
    {
      heading: "4. Accounts",
      paragraphs: [
        "Your account is your Solana wallet. You sign in by signing a message with your wallet, which does not send a transaction or cost anything. We never ask for, and you must never share, your seed phrase or private key.",
        "You are responsible for keeping your wallet secure and for activity under your account. Anyone who controls your wallet can sign in as you. Tell us promptly at {{CONTACT_EMAIL}} if you believe your wallet has been compromised.",
      ],
    },
    {
      heading: "5. Acceptable use",
      paragraphs: [
        "We want FunCoin Lab to stay fun and safe. When using the Service or anything it generates, you agree not to:",
      ],
      bullets: [
        "Impersonate any real person, company, brand, project or public figure, or create content suggesting an endorsement or affiliation that does not exist.",
        "Use generated concepts, names or websites to run scams, phishing, fraud, \"rug pulls\" or any deceptive scheme.",
        "Present generated concepts in misleading financial promotions, including claims of profit, returns, price increases, guaranteed value or investment opportunity.",
        "Create or share hateful, harassing, violent, sexually explicit or discriminatory content, or content that targets individuals or groups.",
        "Infringe anyone's intellectual property, privacy or other rights.",
        "Break any applicable law or regulation, including securities, consumer protection and advertising laws.",
        "Attempt to disrupt, overload, reverse engineer, scrape at scale or gain unauthorized access to the Service or its systems.",
        "Use automated means to abuse generation limits or resell access to the Service without our permission.",
      ],
    },
    {
      heading: "6. Your content and generated content",
      paragraphs: [
        "You keep any rights you have in the prompts and other content you submit (\"Your Content\"). You give FunCoin Lab a limited license to store, process and transmit Your Content as needed to run and improve the Service, including sending prompts to AI providers to produce results.",
        "Subject to these Terms and to any rights of third parties, you may use the output generated for you (\"Generated Content\") for personal and commercial purposes. To the extent we have any rights in Generated Content, we assign them to you. Because AI systems may produce similar output for different users, Generated Content may not be unique, and we cannot grant you exclusive rights to it.",
        "You are responsible for how you use Generated Content, including making sure it is lawful, accurate and does not infringe anyone else's rights.",
      ],
    },
    {
      heading: "7. Limitations of AI output",
      paragraphs: [
        "Generated Content is produced automatically by AI models and may be inaccurate, incomplete, offensive, repetitive or similar to existing names, logos, brands or works. It is not reviewed by a human before you see it. Always review output carefully before relying on or publishing it.",
      ],
    },
    {
      heading: "8. No financial services",
      paragraphs: [
        "FunCoin Lab is not a broker, exchange, wallet provider, token launch platform, investment adviser or financial institution. Nothing in the Service is an offer, solicitation or recommendation to buy, sell or hold any asset. Any \"token concept\" information shown, such as network \"Not selected\" or supply \"Customizable\", is an illustrative placeholder only.",
        "If you choose to launch any real project, token or website based on Generated Content, you do so entirely at your own risk and are solely responsible for complying with all laws that apply to you. See our Disclaimer for more detail.",
      ],
    },
    {
      heading: "9. Credits, payments and refunds",
      paragraphs: [
        "Some features, such as AI image generation, use credits. You buy credits with cryptocurrency, either directly from your Solana wallet (SOL or USDC) or through our payment processor NOWPayments. Prices are shown in US dollars before you pay; SOL amounts are converted at the quoted rate, which is locked for a limited time.",
        "Credits are a prepaid balance for FunCoin Lab features only. They are not a token, are not transferable, cannot be withdrawn or exchanged for money or crypto, and have no cash value. Credits are tied to the wallet you signed in with.",
        "Blockchain payments are final once confirmed, so refunds are generally not available. If an AI image fails to generate, the credits it used are returned automatically. If you were charged incorrectly, contact us at {{CONTACT_EMAIL}} with your wallet address or transaction id and we will review it.",
        "You are responsible for sending the correct amount to the correct address from a wallet you control, and for any network fees.",
      ],
    },
    {
      heading: "10. Third-party services",
      paragraphs: [
        "The Service relies on third-party providers, which may include Supabase for data storage, AI model providers for content generation and, where connected, domain registrars or registrar APIs. Your use of these services may also be subject to their own terms and privacy policies.",
        "Domain suggestions are ideas only. Unless a registrar integration is connected and clearly indicated, we do not check availability, and even then availability and pricing must be confirmed with the registrar before purchase. We are not responsible for third-party services, websites or content.",
      ],
    },
    {
      heading: "11. Intellectual property and trademarks",
      paragraphs: [
        "The Service itself, including its software, design, branding and content we provide (other than Your Content and Generated Content), belongs to FunCoin Lab or its licensors and is protected by law. You may not copy or reuse it except as these Terms allow.",
        "You are solely responsible for clearing any name, ticker-style tag, domain, logo or other Generated Content before using it publicly or commercially, including searching for existing brands and checking trademark databases in the relevant countries. If you believe content on the Service infringes your rights, contact us at {{CONTACT_EMAIL}}.",
      ],
    },
    {
      heading: "12. Suspension and termination",
      paragraphs: [
        "You can stop using the Service at any time and may request deletion of your account. We may suspend or terminate access if you break these Terms, if required by law, or to protect the Service, other users or third parties. Sections that by their nature should survive termination (such as ownership, disclaimers and limitation of liability) will continue to apply.",
      ],
    },
    {
      heading: "13. Disclaimers and limitation of liability",
      paragraphs: [
        "The Service and all Generated Content are provided \"as is\" and \"as available\", without warranties of any kind, express or implied, including warranties of accuracy, fitness for a particular purpose, non-infringement or uninterrupted availability.",
        "To the maximum extent permitted by law, FunCoin Lab will not be liable for any indirect, incidental, special, consequential or punitive damages, or for any loss of profits, data, funds, goodwill or business, arising from your use of the Service or Generated Content. Our total liability for any claim relating to the Service is limited to the greater of the amount you paid us in the 12 months before the claim or 50 US dollars. Some jurisdictions do not allow certain limitations, so some of these may not apply to you.",
        "You agree to indemnify FunCoin Lab against claims arising from your misuse of the Service, your violation of these Terms or your use of Generated Content, including any real-world project you launch.",
      ],
    },
    {
      heading: "14. Changes to these terms",
      paragraphs: [
        "We may update these Terms from time to time. When we make material changes we will update the date at the top of this page and, where appropriate, notify you in the app. Continuing to use the Service after changes take effect means you accept the updated Terms.",
      ],
    },
    {
      heading: "15. Contact",
      paragraphs: [
        "Questions about these Terms? Contact FunCoin Lab at {{CONTACT_EMAIL}}.",
      ],
    },
  ],
}

const privacy: LegalDoc = {
  slug: "privacy",
  title: "Privacy Policy",
  description:
    "How FunCoin Lab collects, uses and protects your information, including wallet addresses, saved projects, AI prompts and payments.",
  updated: UPDATED,
  summary:
    "We collect only what we need to run FunCoin Lab, such as your wallet address, your saved projects and the prompts you send for generation, we never sell your data, and you can ask us to export or delete it at any time.",
  sections: [
    {
      heading: "1. Who we are",
      paragraphs: [
        "This Privacy Policy explains how FunCoin Lab (\"we\", \"us\") handles personal information when you use the FunCoin Lab website and app (the \"Service\"). If you have questions, contact us at {{CONTACT_EMAIL}}.",
      ],
    },
    {
      heading: "2. Information we collect",
      paragraphs: ["Depending on how you use the Service, we may collect:"],
      bullets: [
        "Wallet information: your public Solana wallet address and the signed sign-in message. Data is stored with our database provider, Supabase.",
        "Saved projects and generations: the concepts, names, lore, captions, logos, website previews and settings you choose to save to your account.",
        "Prompts and inputs: the text you enter to generate content, which is sent to AI providers to produce results.",
        "Technical and log data: basic information such as IP address, browser type, device type, pages visited, timestamps and error logs, used to keep the Service secure and working.",
        "Messages you send us: for example, support requests sent to {{CONTACT_EMAIL}}.",
      ],
    },
    {
      heading: "3. Wallet accounts",
      paragraphs: [
        "You sign in with a Solana wallet. We store your public wallet address and link your projects, saved domains, generated images and credits to it. A wallet address is public on the blockchain. We never receive your seed phrase or private keys.",
      ],
    },
    {
      heading: "4. How we use information",
      paragraphs: ["We use information to:"],
      bullets: [
        "Provide the Service, including generating content and saving your projects.",
        "Create and secure your account and keep you signed in.",
        "Prevent abuse, enforce our Terms and protect the Service and its users.",
        "Fix bugs, monitor performance and improve features.",
        "Respond to your questions and send important service notices.",
        "Meet legal obligations.",
      ],
    },
    {
      heading: "5. AI providers",
      paragraphs: [
        "To generate content, we send your prompts and related context (such as a saved concept you are editing) to third-party AI model providers. These providers process the data to return results to us and are bound by their own terms and data processing commitments. Where available, we choose settings that limit providers' use of your data for training their models.",
        "Please do not include personal, confidential or sensitive information in prompts.",
      ],
    },
    {
      heading: "6. Wallet sign-in and payments",
      paragraphs: [
        "If you connect a Solana wallet, we store your public wallet address, your credit balance and history, and the details of your payments (amount, method, status and transaction id). We never see or store your private keys or seed phrase, and signing in with your wallet never moves funds.",
        "Wallet addresses and transactions are public on the Solana blockchain by design. Payments made through NOWPayments are processed by NOWPayments under their own privacy policy; we receive the payment status and amount, not your card or exchange details.",
      ],
    },
    {
      heading: "7. Sharing and no selling of data",
      paragraphs: [
        "We do not sell your personal information, and we do not share it for third-party advertising. We share information only with service providers who help us run the Service (such as Supabase for storage, hosting providers and AI providers), when required by law, to protect rights and safety, or as part of a business transfer such as a merger, in which case this policy will continue to apply to your information.",
      ],
    },
    {
      heading: "8. Data retention",
      paragraphs: [
        "We keep account information and saved projects for as long as your account is active. If you delete a project or your account, we delete the related data from our active systems within a reasonable period, typically within 30 days, except where we must keep it for legal, security or fraud-prevention reasons. Log data is kept for a limited period and then deleted or anonymized. Backups are overwritten on a rolling schedule.",
      ],
    },
    {
      heading: "9. Security",
      paragraphs: [
        "We use reasonable technical and organizational measures to protect your information, including encrypted connections (HTTPS), access controls and row-level security on stored projects. No online service can be perfectly secure, so we cannot guarantee absolute security. Please use a strong, unique password or secure sign-in method.",
      ],
    },
    {
      heading: "10. Your rights and choices",
      paragraphs: [
        "Depending on where you live, you may have the right to access, correct, export or delete your personal information, to object to or restrict certain processing, and to withdraw consent. You can delete individual projects in the app, and you can request a copy of your data or deletion of your account by emailing {{CONTACT_EMAIL}}. We may need to verify your identity before acting on a request. You also have the right to complain to your local data protection authority.",
      ],
    },
    {
      heading: "11. Cookies and similar technologies",
      paragraphs: ["We keep cookies and similar storage to a minimum:"],
      bullets: [
        "Session cookie: an HttpOnly cookie that keeps your wallet signed in, shared between funcoinlab.com and app.funcoinlab.com. It is necessary for the app to work.",
        "Preferences: your theme choice (light or dark) and similar settings may be stored in a cookie or localStorage.",
      ],
    },
    {
      heading: "12. Children",
      paragraphs: [
        "The Service is not directed to children under 13, and we do not knowingly collect personal information from them. If you believe a child has given us personal information, contact us at {{CONTACT_EMAIL}} and we will delete it.",
      ],
    },
    {
      heading: "13. Changes and contact",
      paragraphs: [
        "We may update this Privacy Policy from time to time. We will update the date at the top of this page and, for material changes, notify you in the app. For any privacy question or request, contact FunCoin Lab at {{CONTACT_EMAIL}}.",
      ],
    },
  ],
}

const disclaimer: LegalDoc = {
  slug: "disclaimer",
  title: "Disclaimer",
  description:
    "Important information about FunCoin Lab: generated meme coin concepts are creative and branding material, not financial advice.",
  updated: UPDATED,
  summary:
    "Everything FunCoin Lab generates is creative and branding material; it is not financial advice, we do not create or trade tokens, and if you launch anything real you are solely responsible.",
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
      heading: "We do not create or trade tokens",
      paragraphs: ["FunCoin Lab does not:"],
      bullets: [
        "Create, issue, deploy or mint tokens or smart contracts.",
        "List, sell, buy, exchange or trade tokens or any other asset.",
        "Custody, hold or manage wallets, private keys, funds or assets.",
        "Operate as a broker, exchange, launchpad or investment adviser.",
      ],
    },
    {
      heading: "No claim of value",
      paragraphs: [
        "We make no claim that any generated concept has, or will ever have, any monetary value, popularity or success. Generated content does not represent any real asset or project.",
      ],
    },
    {
      heading: "Token details on generated sites",
      paragraphs: [
        "Generated websites can show token details such as network, supply and a contract address. These are entered by the site owner, not verified by FunCoin Lab, and are not an offer or endorsement. Always verify a contract address through the project's official channels before interacting with it.",
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

export const legalDocs: Record<LegalDoc["slug"], LegalDoc> = {
  terms,
  privacy,
  disclaimer,
}
