import SiteIcon from '../../components/SiteIcon';
import ContactForm from './ContactForm';
import {MarketFooter} from '../../components/MarketChrome';
import '../properties/property-market.css';
import './contact-premium.css';

export const metadata = {
  title: 'Contact Us | Landshop Nigeria',
  description: 'Contact Landshop in Lekki, Lagos for property, investment, mortgage and customer-care enquiries.'
};

const phone = '+23418880063';
const whatsapp = '2348188866772';
const email = 'care@landshopnigeria.com';
const office = "Landshop Limited, Suite 1, 3rd Floor, King’s Deck, Alternative Route, Chevron Drive, Lekki-Epe Expressway, Lagos";
const googleMaps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(office);
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
    streetAddress: "Suite 1, 3rd Floor, King's Deck, Alternative Route, Chevron Drive, Lekki-Epe Expressway",
    addressLocality: 'Lekki',
    addressRegion: 'Lagos',
    addressCountry: 'NG'
  }
};

export default function Contact() {
  return <main className="lc-premium lc-v24">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(businessSchema)}}/>

    <div className="lc-v24-container">
      <section className="lc-v24-hero" aria-labelledby="contact-title">
        <div className="lc-v24-photo">
          <img src="/media/landshop-contact-reception.webp" alt="Landshop reception, front desk and visitor waiting area" fetchPriority="high" decoding="async"/>
        </div>
        <div className="lc-v24-info">
          <div className="lc-v24-info-inner">
            <h1 id="contact-title">Contact <em>Us</em></h1>
            <p className="lc-v24-intro">Questions about property, investment or financing? Our team is here to help.</p>

            <div className="lc-v24-details" aria-label="Landshop contact details">
              <div className="lc-v24-detail">
                <span className="lc-v24-icon" aria-hidden="true"><SiteIcon name="pin" size={23}/></span>
                <div className="lc-v24-detail-copy">
                  <span className="lc-v24-label">Our office</span>
                  <address>{office}</address>
                </div>
              </div>
              <div className="lc-v24-detail">
                <span className="lc-v24-icon" aria-hidden="true"><SiteIcon name="phone" size={23}/></span>
                <div className="lc-v24-detail-copy">
                  <span className="lc-v24-label">Phone number</span>
                  <a href={'tel:' + phone}>+234 1 888 0063</a>
                </div>
              </div>
              <div className="lc-v24-detail"><span className="lc-v24-icon" aria-hidden="true"><SiteIcon name="phone" size={23}/></span><div className="lc-v24-detail-copy"><span className="lc-v24-label">WhatsApp only</span><a href={'https://wa.me/'+whatsapp} target="_blank" rel="noopener noreferrer">+234 818 886 6772</a></div></div>
              <div className="lc-v24-detail lc-v24-detail--accent">
                <span className="lc-v24-icon" aria-hidden="true"><SiteIcon name="mail" size={23}/></span>
                <div className="lc-v24-detail-copy">
                  <span className="lc-v24-label">Email address</span>
                  <a href={'mailto:' + email}>{email}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lc-v24-form" id="enquiry" aria-labelledby="enquiry-title">
        <div className="lc-v24-form-heading">
          <h2 id="enquiry-title">Send Us a Message</h2>
          <SiteIcon name="mail" size={22}/>
        </div>
        <ContactForm/>
      </section>
    </div>

    <section className="ls26-offices ls26-container" aria-labelledby="branches-title"><span className="ls26-eyebrow">OUR OFFICES</span><h2 id="branches-title">Visit Landshop.</h2><div className="ls26-grid-three"><article className="ls26-aside"><h3>Headquarters · Lagos</h3><p>{office}</p></article><article className="ls26-aside"><h3>Uyo Office</h3><p>Landshop Limited, No. 4 Ibanga Street, Off Oron Road, Uyo, Akwa Ibom State.</p></article><article className="ls26-aside"><h3>Warri Office</h3><p>Landshop Limited, First Floor, 60 Airport Road, opposite Delta State Revenue House, beside Ecobank Nigeria Limited, Warri, Delta State.</p></article><article className="ls26-aside"><h3>Benin Office</h3><p>Landshop Limited, beside House 4, Iriri Road, before ADP Junction, off Airport Road, Benin City, Edo State.</p></article></div></section>
    <section className="lc-office-map" aria-label="Landshop office map">
      <div className="lc-map-intro">
        <div><p>{office}</p></div>
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
