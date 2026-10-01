import React from 'react';

const POLICIES = {
  terms: {
    title: 'Terms & Conditions',
    sections: [
      { heading: 'Enquiry-Based Ordering', body: 'This website does not process online payments. All submissions are enquiries only; our team will contact you directly to confirm pricing, availability and payment before dispatch.' },
      { heading: 'Product Safety', body: 'All products comply with applicable fireworks safety regulations. Customers are responsible for using fireworks safely and in accordance with local laws.' },
    ],
  },
  refunds: {
    title: 'Refund Policy',
    body: 'As all orders are confirmed manually after an enquiry, refund terms are agreed upon at the time of order confirmation. Please contact our support team for any refund-related concerns.',
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This Privacy Policy explains how Standard Fireworks collects, uses and protects the personal information you share with us when submitting a product enquiry.',
    sections: [
      { heading: 'Information We Collect', body: "Name, mobile number, email, address and enquiry details submitted via our website's enquiry form." },
      { heading: 'How We Use It', body: 'Solely to process and follow up on your enquiry. We do not sell or share your information with third parties.' },
    ],
  },
  shipping: {
    title: 'Shipping Policy',
    intro: 'We ship Pan India with safe, tested packaging suitable for fireworks transport.',
    sections: [
      { heading: 'Delivery Timelines', body: 'Typical delivery takes 3-7 business days depending on your location, subject to local fireworks transport regulations in your state.' },
    ],
  },
};

export default function PolicyPage({ policy, onHome }) {
  const page = POLICIES[policy] || POLICIES.terms;
  return (
    <main className="policy-page">
      <nav className="policy-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={onHome}>Home</button>
        <span aria-hidden="true">›</span>
        <span>{page.title}</span>
      </nav>
      <article className="policy-content">
        <h1>{page.title}</h1>
        {page.intro && <p>{page.intro}</p>}
        {page.body && <p>{page.body}</p>}
        {page.sections?.map(({ heading, body }) => (
          <section key={heading}>
            <h2>{heading}</h2>
            <p>{body}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
