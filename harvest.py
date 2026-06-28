import asyncio, os, httpx, ghl_client
from sms_config import ALAMO_SLIM as C
B="https://services.leadconnectorhq.com"
LOC=C["ghl_location_id"]; TOK=os.environ[C["ghl_pit_env_var"]]; CH=C["ghl_bot_user_id"]
H={"Authorization":"Bearer "+TOK,"Content-Type":"application/json","Version":"2021-07-28"}
HEALTH=["side effect","is it safe","needle","does it hurt","semaglutide","tirzepatide","ozempic","wegovy","what does it do","the shot do","drug interact","is it dangerous"]
DEFER=["the doctor","your provider","our medical","at your visit","first visit","tony will","with tony","call with tony","tony sees","the physician","give medical","provider will"]
BOOK=["you're all set","is booked","got you booked","you're booked","see you on","got you scheduled","looking forward to seeing","confirmed for","you're set for","got you down for"]
REACT=["circling back","wanted to reach out","checking in","following up","still interested","haven't heard","been a minute","saw you were interested","wanted to follow up","a while back"]
def hh(t,ks): return [k for k in ks if k in t]
def isout(m):
    d=m.get("direction"); return d in (2,"outbound") or str(d).lower().startswith("out")
def isin(m):
    d=m.get("direction"); return d in (1,"inbound") or str(d).lower().startswith("in")
async def get_contacts():
    out=[]; aid=None; aft=None
    async with httpx.AsyncClient(timeout=30) as cl:
        for _ in range(60):
            u=B+"/contacts/?locationId="+LOC+"&limit=100"
            if aid: u+="&startAfterId="+str(aid)
            if aft: u+="&startAfter="+str(aft)
            r=await cl.get(u,headers=H)
            if r.status_code>=300:
                print("CONTACTS LIST FAILED",r.status_code,r.text[:200]); return out
            d=r.json(); b=d.get("contacts",[]) or []
            if not b: break
            out+=[c for c in b if c.get("assignedTo")==CH]
            m=d.get("meta",{}) or {}; aid=m.get("startAfterId") or (b[-1].get("id") if b else None); aft=m.get("startAfter")
            if len(b)<100: break
    return out
async def main():
    cs=await get_contacts(); print(len(cs),"Chloe contacts -> scanning")
    react=[]; defer=[]; book=[]
    for i,c in enumerate(cs):
        cid=c.get("id"); nm=((c.get("firstName") or "")+" "+(c.get("lastName") or "")).strip() or cid
        try: msgs=await ghl_client.get_conversation_messages(C,cid,limit=100)
        except Exception: continue
        seq=sorted([m for m in (msgs or []) if m.get("body")], key=lambda m:m.get("dateAdded") or "")
        if not seq: continue
        ob=" ".join((m.get("body") or "") for m in seq if isout(m)).lower()
        ib=" ".join((m.get("body") or "") for m in seq if isin(m)).lower()
        if isout(seq[0]) and any(isin(m) for m in seq) and hh(ob,REACT): react.append(nm+"  |  "+cid)
        if hh(ib,HEALTH) and hh(ob,DEFER): defer.append(nm+"  |  "+cid)
        if hh(ob,BOOK): book.append(nm+"  |  "+cid)
        if (i+1)%50==0: print(i+1,"scanned")
    print("\n=== REACTIVATION ==="); print("\n".join(react[:12]) or "(none)")
    print("\n=== STAYS-IN-HER-LANE ==="); print("\n".join(defer[:12]) or "(none)")
    print("\n=== BOOKINGS ==="); print("\n".join(book[:12]) or "(none)")
    print("\nTOTALS  react="+str(len(react))+"  lane="+str(len(defer))+"  book="+str(len(book)))
asyncio.run(main())
