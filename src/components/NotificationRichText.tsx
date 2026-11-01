import React from "react";
function Inline({text}:{text:string}) {
 const parts=text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
 return <>{parts.map((p,i)=>p.startsWith("**")?<strong key={i}>{p.slice(2,-2)}</strong>:p.startsWith("*")?<em key={i}>{p.slice(1,-1)}</em>:p)}</>;
}
export default function NotificationRichText({body}:{body:string}) {
 return <div className="notice-rich">{body.split("\n").map((line,i)=>{
  if(line.startsWith("### "))return <h3 key={i}><Inline text={line.slice(4)}/></h3>;
  if(line.startsWith("## ")||line.startsWith("# "))return <h2 key={i}><Inline text={line.replace(/^#{1,2} /,"")}/></h2>;
  if(line.startsWith("- ")||line.startsWith("* "))return <p className="notice-bullet" key={i}>• <Inline text={line.slice(2)}/></p>;
  if(/^https:\/\//.test(line.trim()))return <p key={i}><a href={line.trim()} target="_blank" rel="noopener noreferrer">{line.trim()}</a></p>;
  return line?<p key={i}><Inline text={line}/>:<div className="notice-space" key={i}/>;
 })}</div>;
}
