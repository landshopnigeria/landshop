'use client';
import {useState} from 'react';
export default function LandshopPrimeFilm(){
 const [playing,setPlaying]=useState(false);
 return <div className="ls33-film-frame">
  {playing?<iframe src="https://www.youtube-nocookie.com/embed/xRGG6aZq120?autoplay=1&rel=0"
    title="Explore Landshop Prime Estates" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>:
   <div className="ls33-film-poster">
    <img src="/owner/2026/famous-completed-homes.webp" alt="Real completed Nigerian estate homes from Landshop's property archive" loading="lazy"/>
    <div className="ls33-film-poster-shade"/><span>WATCH THE FILM / LANDSHOP PRIME</span>
    <button type="button" aria-label="Play Landshop Prime presentation" onClick={()=>setPlaying(true)}>▶</button>
   </div>}
  <a target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/watch?v=xRGG6aZq120">Watch Landshop Prime on YouTube ↗</a>
 </div>
}
