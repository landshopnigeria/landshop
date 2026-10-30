'use client';
import {Children, Fragment, isValidElement, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactElement, type ReactNode, type SelectHTMLAttributes} from 'react';
import {createPortal} from 'react-dom';

/**
 * Accessible single-select control. Renders a native select for HTML form data,
 * validation and integration, but never opens the browser/OS blue option popup.
 * The visual option highlight is text-width with an orange brand hover.
 */
type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'multiple' | 'size'>;
type Choice = {value:string; label:string; disabled:boolean; key:string};
const labelText = (node:ReactNode):string => {
  if(node===null||node===undefined||typeof node==='boolean')return '';
  if(typeof node==='string'||typeof node==='number')return String(node);
  if(Array.isArray(node))return node.map(labelText).join('');
  if(isValidElement<{children?:ReactNode}>(node))return labelText(node.props.children);
  return '';
};
function choicesFrom(children:ReactNode):Choice[]{
  const items:Choice[]=[];
  function visit(nodes:ReactNode){
    Children.forEach(nodes,node=>{
      if(!isValidElement<{children?:ReactNode;value?:string|number;disabled?:boolean}>(node))return;
      if(node.type==='option'){
        const label=labelText(node.props.children).trim();
        items.push({value:node.props.value===undefined?label:String(node.props.value),label,disabled:!!node.props.disabled,key:String(node.key??items.length)});
      }else if(node.type==='optgroup'||node.type===Fragment){visit(node.props.children)}
    });
  }
  visit(children);
  return items;
}
export default function BrandedSelect({
  children,value,defaultValue,onChange,onBlur,onFocus,disabled,required,name,id,className='',style,
  ...rest
}:Props){
  const options=useMemo(()=>choicesFrom(children),[children]);
  const initial=defaultValue===undefined?options.find(x=>!x.disabled)?.value||'':String(defaultValue);
  const [internal,setInternal]=useState(initial);
  const [open,setOpen]=useState(false);
  const [active,setActive]=useState(0);
  const [rect,setRect]=useState<{top:number;left:number;width:number;maxHeight:number}|null>(null);
  const buttonRef=useRef<HTMLButtonElement>(null);
  const selectRef=useRef<HTMLSelectElement>(null);
  const listRef=useRef<HTMLDivElement>(null);
  const menuId=useId();
  const controlled=value!==undefined;
  const current=controlled?String(value):internal;
  const selected=options.find(x=>x.value===current)||options.find(x=>!x.disabled);
  const selectedIndex=Math.max(0,options.findIndex(x=>x.value===current));
  const validOptions=options.filter(x=>!x.disabled);
  const display=selected?.label||'Select an option';
  const ariaLabel=rest['aria-label']||name||'Choose an option';
  const positioning=()=>{
    if(!buttonRef.current)return;
    const r=buttonRef.current.getBoundingClientRect();
    const h=Math.max(128,Math.min(320,window.innerHeight-24));
    const roomBelow=window.innerHeight-r.bottom;
    const top=roomBelow>=Math.min(h,220)||roomBelow>=r.top?r.bottom+5:Math.max(8,r.top-h-5);
    setRect({left:Math.max(8,Math.min(r.left,window.innerWidth-160)),top,width:Math.min(Math.max(r.width,175),window.innerWidth-16),maxHeight:Math.min(h,top>r.top?window.innerHeight-top-8:r.top-8)});
  };
  const openMenu=()=>{
    if(disabled||options.length===0)return;
    positioning();setActive(selectedIndex);setOpen(true);
  };
  const closeMenu=(restore=false)=>{
    setOpen(false);
    if(restore)buttonRef.current?.focus();
  };
  const pick=(choice:Choice)=>{
    if(choice.disabled)return;
    if(!controlled)setInternal(choice.value);
    const native=selectRef.current;
    if(native){
      native.value=choice.value;
      // Existing callers use e.target.value; preserve the native select element.
      if(onChange)onChange({target:native,currentTarget:native,type:'change'} as unknown as React.ChangeEvent<HTMLSelectElement>);
    }
    closeMenu(true);
  };
  useEffect(()=>{
    if(!open)return;
    positioning();
    const outside=(e:PointerEvent)=>{
      if(!buttonRef.current?.contains(e.target as Node)&&!listRef.current?.contains(e.target as Node))closeMenu();
    };
    const reposition=()=>positioning();
    document.addEventListener('pointerdown',outside);
    window.addEventListener('scroll',reposition,true);
    window.addEventListener('resize',reposition);
    return()=>{
      document.removeEventListener('pointerdown',outside);
      window.removeEventListener('scroll',reposition,true);
      window.removeEventListener('resize',reposition);
    };
  },[open]);
  useEffect(()=>{
    if(!open)return;
    const target=listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')[active];
    target?.focus({preventScroll:true});
    target?.scrollIntoView({block:'nearest'});
  },[active,open]);
  useEffect(()=>{
    const select=selectRef.current;
    const form=select?.form;
    if(!form||controlled)return;
    const reset=()=>{setInternal(initial);setOpen(false)};
    form.addEventListener('reset',reset);
    return()=>form.removeEventListener('reset',reset);
  },[controlled,initial]);
  const move=(direction:number)=>{
    if(!validOptions.length)return;
    const start=validOptions.findIndex(x=>x.value===options[active]?.value);
    const next=validOptions[(Math.max(start,0)+direction+validOptions.length)%validOptions.length];
    setActive(Math.max(0,options.findIndex(x=>x.value===next.value)));
  };
  const keyHandler=(event:React.KeyboardEvent<HTMLElement>)=>{
    if(event.key==='Escape'){event.preventDefault();closeMenu(true);return}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();
      if(!open){openMenu();return}
      move(event.key==='ArrowDown'?1:-1);
    }else if(event.key==='Home'&&open){event.preventDefault();setActive(Math.max(0,options.findIndex(x=>!x.disabled)))}
    else if(event.key==='End'&&open){event.preventDefault();setActive(options.length-1)}
    else if((event.key==='Enter'||event.key===' ')&&open){event.preventDefault();const o=options[active];if(o)pick(o)}
    else if((event.key==='Enter'||event.key===' ')&&!open){event.preventDefault();openMenu()}
    else if(event.key==='Tab'){closeMenu()}
  };
  const cssStyle=style as CSSProperties|undefined;
  const wrapperStyle:CSSProperties={
    width:cssStyle?.width??'100%',
    maxWidth:cssStyle?.maxWidth,
    minWidth:cssStyle?.minWidth,
    flex:cssStyle?.flex,
    margin:cssStyle?.margin,
    marginTop:cssStyle?.marginTop,
    marginBottom:cssStyle?.marginBottom
  };
  return <span className={'ls-branded-select '+className} style={wrapperStyle}>
    <select
      {...rest}
      aria-hidden="true"
      tabIndex={-1}
      ref={selectRef}
      name={name}
      id={id}
      required={required}
      disabled={disabled}
      value={current}
      onChange={e=>{if(!controlled)setInternal(e.target.value);onChange?.(e)}}
      onBlur={onBlur}
      onFocus={onFocus}
      className="ls-branded-select-native"
    >{children}</select>
    <button type="button" ref={buttonRef}
      className="ls-branded-select-trigger"
      style={{fontSize:cssStyle?.fontSize,borderRadius:cssStyle?.borderRadius,color:cssStyle?.color}}
      aria-label={ariaLabel}
      aria-haspopup="listbox" aria-expanded={open} aria-controls={open?menuId:undefined}
      aria-required={required||undefined} aria-disabled={disabled||undefined}
      disabled={disabled} onClick={()=>open?closeMenu():openMenu()}
      onKeyDown={keyHandler}
    ><span className="ls-branded-select-value">{display}</span><svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
    {open&&rect&&typeof document!=='undefined'&&createPortal(
      <div
        className="ls-branded-select-menu" role="listbox" id={menuId}
        aria-label={ariaLabel} ref={listRef}
        onKeyDown={keyHandler}
        style={{position:'fixed',left:rect.left,top:rect.top,minWidth:rect.width,maxWidth:'min(540px, calc(100vw - 16px))',maxHeight:rect.maxHeight}}
      >{options.map((item,index)=><button
        type="button" role="option" key={item.key+'-'+index}
        aria-selected={item.value===current}
        disabled={item.disabled}
        tabIndex={active===index?0:-1}
        className="ls-branded-select-option"
        onMouseEnter={()=>setActive(index)}
        onClick={()=>pick(item)}
      >{item.label}</button>)}</div>,document.body
    )}
  </span>;
}
