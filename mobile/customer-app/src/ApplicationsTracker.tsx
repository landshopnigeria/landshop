import React,{useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,Linking,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {supabase} from './supabase';
import {BrandIcon} from './BrandIcon';

type Application={id:string;kind:string;status:string;created_at:string};
type ApplicationEvent={id:number;application_id:string;action:string;created_at:string};
const green='#078a6b',ink='#123e33',muted='#5e796c';
const names:Record<string,string>={
 develop_house:'Develop · House',develop_land:'Develop · Land',
 incubate:'Incubate · Investment',beta_mortgage:'Grow · Beta Mortgage',
 mortgage_xtra:'Grow · Mortgage Xtra',inspection:'Property Inspection',thrift:'Thrift'
};
const paths:Record<string,string>={
 develop_house:'develop-house',develop_land:'develop-land',
 incubate:'incubate-investment',beta_mortgage:'beta-mortgage',
 mortgage_xtra:'mortgage-xtra',inspection:'develop-inspection'
};
const portal='https://portal.landshopnigeria.com';
function human(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
export default function ApplicationsTracker({onClose}:{onClose:()=>void}){
 const [loading,setLoading]=useState(true),[error,setError]=useState('');
 const [apps,setApps]=useState<Application[]>([]),[events,setEvents]=useState<ApplicationEvent[]>([]);
 const [eventNotice,setEventNotice]=useState('');
 const load=useCallback(async()=>{
  setLoading(true);setError('');setEventNotice('');
  try{
   const {data:{user},error:authError}=await supabase.auth.getUser();
   if(authError||!user)throw Error('Sign in to access your own application history.');
   const result=await supabase.from('applications')
    .select('id,kind,status,created_at').eq('applicant_id',user.id)
    .order('created_at',{ascending:false}).limit(50);
   if(result.error)throw result.error;
   const items=result.data||[];
   setApps(items);
   if(items.length){
    const activity=await supabase.from('application_events')
     .select('id,application_id,action,created_at').in('application_id',items.map(x=>x.id))
     .order('created_at',{ascending:false}).limit(100);
    if(activity.error){
     // The canonical application status is still valuable if the timeline
     // endpoint is temporarily unavailable. Never fabricate milestones.
     setEvents([]);
     setEventNotice('Some activity events could not be loaded. Your application statuses remain available.');
    }else setEvents(activity.data||[]);
   }else setEvents([]);
  }catch(e){setError(e instanceof Error?e.message:'Your applications are unavailable.');}
  finally{setLoading(false)}
 },[]);
 useEffect(()=>{void load()},[load]);
 return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
  <Pressable onPress={onClose}><Text style={styles.link}>← Customer dashboard</Text></Pressable>
  <Text style={styles.eyebrow}>DEVELOP · INCUBATE · GROW</Text>
  <Text style={styles.title}>My <Text style={{color:green}}>Applications</Text></Text>
  <Text style={styles.description}>Track your genuine application records. Landshop staff review submissions; draft applications can be resumed.</Text>
  <Pressable accessibilityRole="button" onPress={()=>{void load()}} style={styles.refresh}><BrandIcon name="file" size={20}/><Text style={{color:green,fontWeight:'800',fontSize:12}}>Refresh applications</Text></Pressable>
  {!!eventNotice&&<Text accessibilityRole="alert" style={styles.error}>{eventNotice}</Text>}
  {loading?<ActivityIndicator color={green} style={{marginTop:30}}/>:error?<Text accessibilityRole="alert" style={styles.error}>{error}</Text>:
   !apps.length?<View style={styles.card}><Text style={styles.cardTitle}>No applications yet</Text>
    <Text style={styles.description}>Start a Develop, Incubate or Grow application to see your progress here.</Text>
    <Pressable onPress={()=>{void Linking.openURL(portal+'/applications')}}><Text style={styles.link}>Explore Landshop products →</Text></Pressable>
   </View>:apps.map(item=>{
    const editable=item.status==='draft';
    const activity=events.filter(x=>x.application_id===item.id).slice(0,5);
    return <View key={item.id} style={styles.card}>
     <View style={styles.headRow}><View style={{flex:1}}>
      <Text style={styles.kind}>{names[item.kind]||'Property Application'}</Text>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('en-NG',{year:'numeric',month:'short',day:'numeric'})}</Text>
     </View><View style={[styles.pill,editable&&{backgroundColor:'#fff4e6'}]}>
       <Text style={{fontSize:11,fontWeight:'800',color:editable?'#a76514':green}}>{human(item.status)}</Text>
     </View></View>
     <Text selectable style={styles.reference}>Reference: {item.id}</Text>
     <Text style={styles.sectionTitle}>Activity timeline</Text>
     {activity.length?activity.map(event=><View key={event.id} style={styles.event}>
      <View style={styles.dot}/>
      <View style={{flex:1}}><Text style={styles.eventTitle}>{human(event.action)}</Text>
       <Text style={styles.date}>{new Date(event.created_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}</Text>
      </View></View>):
      <Text style={styles.date}>No recorded events yet. Your application status is shown above.</Text>}
     {editable&&paths[item.kind]?<Pressable accessibilityRole="button" style={styles.action} onPress={()=>{void Linking.openURL(portal+'/applications/'+paths[item.kind])}}>
      <Text style={{color:'#fff',fontWeight:'800'}}>Resume Draft on Secure Portal</Text><BrandIcon name="arrow" size={18} color="#fff"/></Pressable>:
      <Text style={styles.review}>This application remains subject to Landshop's review and approval procedures.</Text>}
    </View>
   })}
  <Text style={styles.footer}>Application information is visible only to the authenticated customer. The native app does not change application statuses or approve requests.</Text>
 </ScrollView>
}
const styles=StyleSheet.create({
 page:{padding:18,paddingBottom:60,backgroundColor:'#f2f8f4',flexGrow:1},
 link:{color:green,fontSize:12,fontWeight:'800',marginBottom:16},eyebrow:{color:green,letterSpacing:1.5,fontSize:10,fontWeight:'800'},
 title:{fontSize:31,fontWeight:'800',color:ink,marginVertical:8},description:{color:muted,fontSize:12,lineHeight:20,marginVertical:7},
 refresh:{flexDirection:'row',alignItems:'center',gap:9,backgroundColor:'#e8f5ee',alignSelf:'flex-start',paddingHorizontal:13,paddingVertical:11,borderRadius:12,marginVertical:16},
 cardTitle:{fontSize:17,fontWeight:'800',color:ink,marginBottom:8},
 card:{backgroundColor:'#fff',borderRadius:17,borderColor:'#d8e8dc',borderWidth:1,padding:16,marginVertical:8},
 headRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:8},
 kind:{fontSize:16,fontWeight:'800',color:ink},date:{fontSize:11,color:muted,marginTop:5},
 pill:{borderRadius:99,paddingHorizontal:9,paddingVertical:7,backgroundColor:'#e5f6ec'},
 reference:{fontSize:10,color:muted,marginTop:11,marginBottom:9},
 sectionTitle:{fontSize:12,fontWeight:'800',color:ink,marginTop:9,marginBottom:7},
 event:{flexDirection:'row',alignItems:'center',gap:9,marginVertical:5},
 dot:{width:9,height:9,borderRadius:6,backgroundColor:green},
 eventTitle:{fontSize:12,fontWeight:'700',color:ink},
 action:{backgroundColor:green,borderRadius:11,marginTop:15,padding:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 review:{fontSize:11,color:muted,lineHeight:18,marginTop:12},footer:{color:muted,fontSize:11,lineHeight:17,marginVertical:19},
 error:{color:'#9b4b15',backgroundColor:'#fff1e4',padding:13,borderRadius:10}
});
