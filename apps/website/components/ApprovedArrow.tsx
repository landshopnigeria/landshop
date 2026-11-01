import SiteIcon from './SiteIcon';

/** The single approved short, straight Landshop arrow, sized exactly 27px. */
export default function ApprovedArrow({direction='right'}:{direction?:'right'|'left'}){
 return <SiteIcon name="arrow" size={27} className={'ls-approved-arrow'+(direction==='left'?' ls-approved-arrow--left':'')}/>;
}
