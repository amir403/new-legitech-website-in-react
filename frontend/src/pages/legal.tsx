type Notice = { title: string; description: string; intro: string; sections: [string, string][] }

// Copy updated from legacy-static/ because the form now sends enquiries to our database and email.
// TODO(owner): review before launch, and add a retention period and a contact address for data requests.
const privacy: Notice = {
  title: 'Privacy notice',
  description: 'How the LegiTech.io website handles the information you send through the contact and checkout forms.',
  intro: 'How this website handles the information you send us.',
  sections: [
    ['About this notice', 'This notice describes this website and its contact form. It does not describe data processing in a client project, which is covered by its own agreed documentation.'],
    ['What we collect', 'When you send the contact form we receive your name, email address, company (if given), the service you are interested in, your budget and timeline choices, and your project description.'],
    ['How we use it', 'We store your enquiry in our website database and email it to our team so we can reply and discuss your project. We do not sell it or use it for advertising.'],
    ['Online payments', 'When you buy a package, bundle or add-on we record your name, email address, company (if given), any notes and the order. Payment is handled by Stripe: card details, and Klarna details if you choose Klarna, go directly to them and are never sent to or stored by us. We receive confirmation of the payment and its reference.'],
    ['How long we keep it', 'We keep enquiries only as long as we need them to respond and to manage any project that follows. You can ask us to delete your enquiry at any time.'],
    ['Copying and downloading', 'Copy brief places the text on your device clipboard, and Download brief saves a text file to your device. Neither sends anything to us.'],
    ['Website services', 'Fonts are served from this website, not from a third party. Your light or dark theme choice is saved in your browser’s local storage. The website does not use analytics or advertising trackers. Our hosting provider may keep standard technical logs.'],
    ['Your choices', 'You can ask to see, correct or delete the information you sent us. Please leave passwords, payment details and other sensitive information out of your enquiry.'],
  ],
}

const terms: Notice = {
  title: 'Website terms',
  description: 'Information about using the LegiTech.io website and its illustrative content.',
  intro: 'Information about using this website and its illustrative content.',
  sections: [
    ['Website information', 'This website introduces the services and working approach of LegiTech.io. Descriptions are general information; project scope, fees, timelines, ownership and support are agreed separately before work begins.'],
    ['Illustrative concepts', 'The solution concepts and interface examples are demonstrations. They are not client endorsements, completed-project case studies or claims of measured results. Example data in these interfaces is fictional.'],
    ['Enquiries', 'Sending an enquiry starts a conversation. It does not book a service or create a project agreement.'],
    // TODO(owner): add cancellation and refund terms before taking live payments (UK consumers have a 14-day cancellation right for services bought online). Get them checked.
    ['Online payments', 'Buying a package, bundle or add-on online charges its listed starting price in GBP, processed securely by Stripe. No VAT is charged. After payment we agree the detailed scope with you; anything beyond what the item covers is quoted and agreed before any further payment.'],
    ['Articles and resources', 'Insights provide general product-planning perspectives. The needs of a particular project may differ, and any implementation should be assessed against its own requirements.'],
    ['Third-party services', 'A project may depend on external platforms, tools or licences. Their terms, charges and limitations should be considered as part of the agreed scope.'],
  ],
}

function NoticePage({ notice }: { notice: Notice }) {
  return (
    <>
      <title>{`${notice.title} | LegiTech.io`}</title>
      <meta name="description" content={notice.description} />
      <section className="page-hero section">
        <p className="eyebrow">WEBSITE INFORMATION</p>
        <h1>{notice.title}</h1>
        <p className="intro">{notice.intro}</p>
      </section>
      <section className="section prose notice">
        {notice.sections.map(([heading, body]) => (
          <section key={heading}>
            <h2>{heading}</h2>
            <p>{body}</p>
          </section>
        ))}
      </section>
    </>
  )
}

export const Privacy = () => <NoticePage notice={privacy} />
export const Terms = () => <NoticePage notice={terms} />
