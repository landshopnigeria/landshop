import SiteIcon from './SiteIcon';

/** The single approved short, straight Landshop arrow, sized exactly 22px. */
export default function ApprovedArrow({direction='right'}:{direction?:'right'|'left'}){
 return <SiteIcon name="arrow" size={22} className={'ls-approved-arrow'+(direction==='left'?' ls-approved-arrow--left':'')}/>;
}
