'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
export type PublicArticleComment={id:string;body:string;created_at:string};
export default function V22ArticleComments({slug}:{slug:string}){
 const [comments,setComments]=useState<PublicArticleComment[]>([]);
 const [authenticated,setAuthenticated]=useState(false);
 const [loading,setLoading]=useState(true);
 const [comment,setComment]=useState('');
 const [sending,setSending]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const load=useCallback(async()=>{
  try{const [publicResponse,sessionResponse]=await Promise.all([
   fetch('/api/articles/comments?slug='+encodeURIComponent(slug),{cache:'no-store'}),
   fetch('/api/articles/comments?session=1',{cache:'no-store'})
  ]);
  const [publicData,sessionData]=await Promise.all([publicResponse.json(),sessionResponse.json()]);
  if(publicData.ok)setComments(publicData.comments||[]);
  else setError('Comments are temporarily unavailable.');
  setAuthenticated(Boolean(sessionData.authenticated));
  }catch{setError('Comments are temporarily unavailable.');}
  finally{setLoading(false)}
 },[slug]);
 useEffect(()=>{void load()},[load]);
 async function send(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(sending)return;setError('');setMessage('');
  if(!authenticated){setError('Please sign in before posting.');return}
  setSending(true);
  try{const res=await fetch('/api/articles/comments',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({slug,body:comment})});
   const data=await res.json();
   if(!res.ok||!data.ok){if(res.status===401)setAuthenticated(false);throw Error(data.message||'Submission failed')}
   setMessage('Your comment was submitted for moderation. It will appear after approval.');setComment('');
  }catch(e){setError(e instanceof Error?e.message:'Could not submit comment.');}finally{setSending(false)}
 }
 const returnTo='https://www.landshopnigeria.com/insights/'+slug+'#comments';
 const login='https://portal.landshopnigeria.com/?returnTo='+encodeURIComponent(returnTo);
 return <section className="v22-article-comments" id="comments" aria-labelledby="v22-comment-title">
  <span className="v22-eyebrow">CONVERSATION</span><h2 id="v22-comment-title">Join the discussion.</h2>
  <p>Read approved comments and share your perspective. Submissions are reviewed before appearing publicly.</p>
  {loading?<p role="status">Loading comments…</p>:<div className="v22-comment-list" aria-live="polite">
   {comments.length?comments.map(c=><article key={c.id}><strong>Landshop reader</strong><time dateTime={c.created_at}>{new Date(c.created_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}</time><p>{c.body}</p></article>):<p>No approved comments yet. Be the first to contribute.</p>}
  </div>}
  {authenticated?<form onSubmit={send} className="v22-comment-form"><label htmlFor="v22-comment-body">Write a comment</label>
   <textarea id="v22-comment-body" value={comment} onChange={e=>setComment(e.target.value)} minLength={12} maxLength={3000} rows={5} required placeholder="Share a thoughtful, respectful comment…"/>
   <button className="v22-btn" type="submit" disabled={sending||comment.trim().length<12}>{sending?'Submitting…':'Submit Comment ↗'}</button>
  </form>:<div className="v22-signin-prompt"><p>Sign in or create a Landshop account to write a comment.</p><a className="v22-btn" href={login}>Sign In / Sign Up ↗</a></div>}
  {message&&<p role="status" className="v22-comment-success">{message}</p>}
  {error&&<p role="alert" className="v22-comment-error">{error}</p>}
 </section>
}
