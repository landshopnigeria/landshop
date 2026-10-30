import SiteIcon, {IconChip} from '../../components/SiteIcon';
import ContactForm from './ContactForm';
import {MarketFooter} from '../../components/MarketChrome';
import '../properties/property-market.css';
import './contact-premium.css';

export const metadata = {
  title: 'Contact Us | Landshop Nigeria',
  description: 'Contact Landshop in Lekki, Lagos for property, investment, mortgage and customer-care enquiries.'
};

const phone = '+2349169973359';
const email = 'care@landshopnigeria.com';
const office = "3rd Floor, King's Deck, Alternative Route, off Chevron Drive, Lekki, Lagos, Nigeria";
const googleMaps = 'https://maps.app.goo.gl/GLiNo6LfYWhWvJV1A';
const directions = 'https://www.google.com/maps/dir/?' + new URLSearchParams({api: '1', destination: office}).toString();
const mapEmbed = 'https://www.google.com/maps?q=' + encodeURIComponent('Landshop HQ, ' + office) + '&output=embed&z=16';
const businessSchema = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  '@id': 'https://www.landshopnigeria.com/#landshop',
  name: 'Landshop',
  url: 'https://www.landshopnigeria.com',
  telephone: phone,
  email,
  hasMap: googleMaps,
  address: {
    '@type': 'PostalAddress',
    streetAddress: "3rd Floor, King's Deck, Alternative Route, off Chevron Drive",
    addressLocality: 'Lekki',
    addressRegion: 'Lagos',
    addressCountry: 'NG'
  }
};

export default function Contact() {
  return <main className="lc-premium lc-v23">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(businessSchema)}}/>

    <div className="lc-v23-container">
      <section className="lc-v23-hero" aria-labelledby="contact-title">
        <div className="lc-v23-photo">
          <img src="/media/landshop-contact-reception.webp" alt="Landshop reception with company signage, front desk and visitor waiting area" fetchPriority="high" decoding="async"/>
        </div>
        <div className="lc-v23-info">
          <h1 id="contact-title">Contact <em>Us.</em></h1>
          <p className="lc-v23-intro">Have a question about property, investment or financing? Our team is here to help you find the right answer.</p>
          <div className="lc-v23-address">
            <IconChip name="pin"/>
            <div><span className="lc-v23-label">VISIT OUR OFFICE</span><address>{office}</address></div>
          </div>
          <div className="lc-v23-contact-links">
            <div className="lc-v23-contact">
              <IconChip name="phone"/>
              <div><span className="lc-v23-label">PHONE NUMBER</span><a href={'tel:' + phone}>+234 916 997 3359</a></div>
            </div>
            <div className="lc-v23-contact">
              <IconChip name="mail"/>
              <div><span className="lc-v23-label">EMAIL ADDRESS</span><a href={'mailto:' + email}>{email}</a></div>
            </div>
          </div>
        </div>
      </section>

      <section className="lc-v23-form lc-form-col" id="enquiry" aria-labelledby="enquiry-title">
        <div className="lc-v23-form-heading">
          <h2 id="enquiry-title">Send Us a Message</h2>
          <SiteIcon name="mail" size={24}/>
        </div>
        <ContactForm/>
      </section>
    </div>

    <section className="lc-office-map" aria-label="Landshop office map">
      <div className="lc-map-intro">
        <div><span className="lc-kicker">FIND LANDSHOP ON GOOGLE MAPS</span><h2>Visit our Lekki office.</h2><p>{office}</p></div>
        <div className="lc-map-actions">
          <a href={googleMaps} target="_blank" rel="noopener noreferrer"><SiteIcon name="pin" size={20}/> Open Google Maps</a>
          <a className="lc-map-directions" href={directions} target="_blank" rel="noopener noreferrer"><SiteIcon name="compass" size={20}/> Get directions</a>
        </div>
      </div>
      <div className="lc-map-landscape"><iframe src={mapEmbed} title="Google Maps — Landshop HQ, King's Deck, Chevron Drive, Lekki, Lagos" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div>
      <p className="lc-map-note">Google Maps directions open in a separate tab. Please confirm your appointment before visiting.</p>
    </section>

    <div className="lc-footer"><MarketFooter includeUpdates={false}/></div>
  </main>;
}
