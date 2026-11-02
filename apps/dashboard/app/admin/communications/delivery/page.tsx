import {requireLandshopStaff} from '../../../../lib/admin-access';
import DispatchCenter,{type DeliveryChannel,type DeliveryRule,type DeliveryMessage,type DeliveryTemplate,type DeliveryEvent} from './DispatchCenter';
export const dynamic='force-dynamic';
export const metadata={title:'Outbound Delivery | Landshop Global Command Center',robots:{index:false,follow:false}};
export default async function OutboundDelivery(){
 const {db}=await requireLandshopStaff(['owner','ceo','founder','admin','technology_officer','technology_consultant']);
 const results=await Promise.all([
  db.from('landshop_comm_channels').select('channel,provider,enabled,updated_at').limit(5),
  db.from('landshop_comm_delivery_rules').select('id,event_type,product,template_id,channel,purpose,enabled,delay_seconds,whatsapp_template_name,whatsapp_language').order('event_type').limit(150),
  db.from('landshop_comm_outbox').select('id,contact_id,event_id,channel,template_id,purpose,status,attempts,available_at,provider_message_id,last_error,created_at,accepted_at,delivered_at').order('created_at',{ascending:false}).limit(200),
  db.from('landshop_comm_templates').select('id,subject,state').order('id').limit(100),
  db.from('landshop_comm_delivery_events').select('id,outbox_id,event_name,occurred_at').order('occurred_at',{ascending:false}).limit(200)
 ]);
 return <DispatchCenter channels={(results[0].data||[]) as DeliveryChannel[]} rules={(results[1].data||[]) as DeliveryRule[]}
  messages={(results[2].data||[]) as DeliveryMessage[]} templates={(results[3].data||[]) as DeliveryTemplate[]}
  events={(results[4].data||[]) as DeliveryEvent[]} ready={results.every(r=>!r.error)}/>;
}
