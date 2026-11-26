const brHolidays={'01-01':'Confraternização Universal','04-21':'Tiradentes','05-01':'Dia do Trabalho','09-07':'Independência do Brasil','10-12':'Nossa Senhora Aparecida','11-02':'Finados','11-15':'Proclamação da República','11-20':'Consciência Negra','12-25':'Natal'};
function easterDate(y){const a=y%19,b=Math.floor(y/100),cc=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(cc/4),k=cc%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;return new Date(y,mo-1,day)}
export function holidaysForMonth(y,m){const out={};Object.entries(brHolidays).forEach(([md,n])=>{if(Number(md.slice(0,2))===m+1)out[y+'-'+md]=n});const easter=easterDate(y);const offsets=[-2,60];const add=(d,n)=>{const x=new Date(easter);x.setDate(x.getDate()+d);if(x.getMonth()===m)out[x.toLocaleDateString('en-CA')]=n};add(-2,'Paixão de Cristo');add(60,'Corpus Christi');return out}
export function workHolidaysForMonth(year, month) {
 const holidays = holidaysForMonth(year, month);
 const add = (date, title) => {
  if (date.getMonth() === month) holidays[date.toLocaleDateString('en-CA')] = title;
 };
 add(new Date(year, 6, 9, 12), 'Data Magna do Estado de São Paulo');
 add(new Date(year, 11, 8, 12), 'Feriado municipal de Birigui');
 const carnival = easterDate(year);
 carnival.setDate(carnival.getDate() - 47);
 add(carnival, 'Carnaval — Birigui');
 return holidays;
}
