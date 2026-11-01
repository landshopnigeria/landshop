import SiteIcon from './SiteIcon';

/** The single approved short, straight Landshop arrow, sized exactly 23px. */
export default function ApprovedArrow({direction='right'}:{direction?:'right'|'left'}){
 return <SiteIcon name="arrow" size={23} className={'ls-approved-arrow'+(direction==='left'?' ls-approved-arrow--left':'')}/>;
}
