import SiteIcon from './SiteIcon';

/** The single approved short, straight Landshop arrow, sized exactly 18.5px. */
export default function ApprovedArrow({direction='right'}:{direction?:'right'|'left'}){
 return <SiteIcon name="arrow" size={18.5} className={'ls-approved-arrow'+(direction==='left'?' ls-approved-arrow--left':'')}/>;
}
