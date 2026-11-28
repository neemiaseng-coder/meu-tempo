import React,{useEffect,useMemo,useState} from 'react';
import{createRoot}from'react-dom/client';
import{createClient}from'@supabase/supabase-js';
import{LayoutDashboard,CalendarCheck,ClipboardList,Sunrise,Briefcase,UserPlus,MessageSquareText,FolderKanban,Settings,Plus,Search,Bell,Check,Clock,ChevronLeft,ChevronRight,Sun,MoreHorizontal,Target,CalendarDays,Menu,X,Filter,Flag,ArrowUpRight,Leaf,Building2,KeyRound,Phone,Copy,Save,Home,Trash2,CalendarX2}from'lucide-react';
import'./style.css';
import { workHolidaysForMonth } from './holidays.js';
import { createWorkCalendar, projectDeadline, loadCalendarEvents } from './workCalendar.js';
import useCalendarDay from './useCalendarDay.js';
import WorkScheduleForm from './WorkScheduleForm.jsx';
import TimeOffDialog from './TimeOffDialog.jsx';
import { createProcessChecklist } from './processChecklists.js';
import { loadTaskOccurrences } from './taskOccurrences.js';
import { activityDeadline, dayActivities, vacancyRemaining } from './dayActivities.js';
import DayFollowUps from './DayFollowUps.jsx';
import RecordViewer from './RecordViewer.jsx';
import { encryptCredential, readCredential } from './CredentialStorage.js';
import TaskDescription from './TaskDescription.jsx';
import ActivityEditor from './ActivityEditor.jsx';
import NeemiasEntryEditor, { EntryActions } from './NeemiasEntryEditor.jsx';
import Meetings from './Meetings.jsx';
import AnelisaWorkspace, { AgendaCalendar, routineOccurs } from './AnelisaWorkspace.jsx';
import { AgendaSidebar, isDeadline, isReminder, isTimeOff, MiniCalendar, ReminderDialog } from './AgendaExtras.jsx';
import './agenda-extras.css';
import { appearances, useAppearance, ThemePicker } from './Appearance.jsx';
import QuickNotes from './QuickNotes.jsx';
import DayProgress from './DayProgress.jsx';
import useModalAccessibility from './useModalAccessibility.js';
import './social-ui.css';
import './pro-ui.css';
import Login from './Login.jsx';
const supabaseUrl=import.meta.env.VITE_SUPABASE_URL;
const supabaseKey=import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase=supabaseUrl&&supabaseKey?createClient(supabaseUrl,supabaseKey):null;
const searchableSections=['Meu Dia','Processos','Mensagens prontas','Cadastros','Reuniões'];
const today=()=>new Date().toLocaleDateString('en-CA');
function weekStart(date){
 const day=new Date(date+'T12:00:00');
 day.setDate(day.getDate()-(day.getDay()+6)%7);
 return day.toLocaleDateString('en-CA');
}
const monthThemes=['Janeiro Branco','Fevereiro Roxo / Laranja','Março Lilás','Abril Azul','Maio Amarelo','Junho Vermelho','Julho Amarelo','Agosto Lilás','Setembro Amarelo','Outubro Rosa','Novembro Azul','Dezembro Vermelho'];


function App(){
 const dateToday=useCalendarDay();
 const [section,setSection]=useState('Meu Dia'),[taskRecords,setTasks]=useState([]),[occurrences,setOccurrences]=useState([]),[busy,setBusy]=useState(true),[user,setUser]=useState(null),[sessionReady,setSessionReady]=useState(false),[query,setQuery]=useState(''),[showAdd,setShowAdd]=useState(false),[title,setTitle]=useState(''),[taskType,setTaskType]=useState('demand'),[due,setDue]=useState(today()),[recurrence,setRecurrence]=useState('daily'),[recurrenceDays,setRecurrenceDays]=useState([new Date().getDay()]),[monthDay,setMonthDay]=useState(Number(today().slice(-2))),[toast,setToast]=useState(''),[mobile,setMobile]=useState(false),[templates,setTemplates]=useState([]),[records,setRecords]=useState([]),[templateTitle,setTemplateTitle]=useState(''),[templateBody,setTemplateBody]=useState(''),[templateHasDate,setTemplateHasDate]=useState(false),[selectedTemplateId,setSelectedTemplateId]=useState(null),[recipient,setRecipient]=useState(''),[sendDate,setSendDate]=useState(today()),[generated,setGenerated]=useState(''),[showTemplateForm,setShowTemplateForm]=useState(false),[showRecordForm,setShowRecordForm]=useState(false),[recordType,setRecordType]=useState('company'),[recordTitle,setRecordTitle]=useState(''),[recordDescription,setRecordDescription]=useState(''),[company,setCompany]=useState({razao:'',fantasia:'',cnpj:'',ie:'',cep:'',street:'',number:'',complement:'',district:'',city:'',state:'',phone:'',email:'',responsible:''}),[contact,setContact]=useState({phone:'',name:'',email:''}),[login,setLogin]=useState({username:'',password:'',other:''});
 const [theme,setTheme]=useAppearance(user?.id);
 const [mobileTools,setMobileTools]=useState(false);
 const [searchOpen,setSearchOpen]=useState(false);
 useModalAccessibility();
 const {Brand:ThemeBrand,Task:ThemeTask,Routine:ThemeRoutine,Meeting:ThemeMeeting,Alert:ThemeAlert}=appearances[theme];
 const [vacancyTarget,setVacancyTarget]=useState('');
 const [historyError,setHistoryError]=useState('');
 const [viewingRecord,setViewingRecord]=useState(null);
 const [deadlineDays,setDeadlineDays]=useState([]);
 const [savingDeadline,setSavingDeadline]=useState(false);
 const [deadlineError,setDeadlineError]=useState('');
 const [savingVacancy,setSavingVacancy]=useState(false);
 const [vacancyError,setVacancyError]=useState('');
 const [meetingSelection,setMeetingSelection]=useState(null);
 const [editingActivity,setEditingActivity]=useState(null);
 const [editingEntry,setEditingEntry]=useState(null);
 const [loadedUserId,setLoadedUserId]=useState(null);
 const [agendaView,setAgendaView]=useState('list');
 const [calendarSelection,setCalendarSelection]=useState(null);
 const [reminder,setReminder]=useState(null);
 const [meetings,setMeetings]=useState([]),[eventRecords,setDeadlineEvents]=useState([]);
 const [showDeadlineForm,setShowDeadlineForm]=useState(false),[editingDeadlineId,setEditingDeadlineId]=useState(null),[deadlineTitle,setDeadlineTitle]=useState(''),[deadlineDate,setDeadlineDate]=useState(today()),[deadlineType,setDeadlineType]=useState('payment'),[deadlineDescription,setDeadlineDescription]=useState(''),[deadlineRecurrence,setDeadlineRecurrence]=useState('none'),[deadlineEnd,setDeadlineEnd]=useState('');
 const [processRecords,setProcesses]=useState([]),[vacancyRecords,setVacancies]=useState([]),[showVacancyForm,setShowVacancyForm]=useState(false),[vacancyTitle,setVacancyTitle]=useState(''),[vacancyUnit,setVacancyUnit]=useState(''),[vacancyDepartment,setVacancyDepartment]=useState(''),[vacancyContractType,setVacancyContractType]=useState('CLT'),[vacancyQuantity,setVacancyQuantity]=useState('1'),[vacancyNotes,setVacancyNotes]=useState(''),[processVacancyId,setProcessVacancyId]=useState(''),[showProcessForm,setShowProcessForm]=useState(false),[processType,setProcessType]=useState('admission'),[processName,setProcessName]=useState(''),[processRole,setProcessRole]=useState(''),[processUnit,setProcessUnit]=useState(''),[processDue,setProcessDue]=useState(today()),[processNotes,setProcessNotes]=useState(''),[profileOpen,setProfileOpen]=useState(false),[notificationOpen,setNotificationOpen]=useState(false),[profilePhoto,setProfilePhoto]=useState('');
 const [showTimeOff,setShowTimeOff]=useState(false);
 const calendarEnabled=Boolean(user);
 const storedWorkSchedule=user?.user_metadata?.work_calendar||{};
 const workSchedule={
  work_saturday:storedWorkSchedule.work_saturday===true,
  work_sunday:storedWorkSchedule.work_sunday===true,
  work_holidays:storedWorkSchedule.work_holidays===true,
 };
 const workCalendar=createWorkCalendar(workHolidaysForMonth,eventRecords.filter(isTimeOff),workSchedule);
 const tasks=calendarEnabled?taskRecords.map(task=>task.task_type==='routine'?task:projectDeadline(task,'due_date',workCalendar,task.scheduled_date)):taskRecords;
 const processes=calendarEnabled?processRecords.map(process=>projectDeadline(process,'due_date',workCalendar)):processRecords;
 const vacancies=calendarEnabled?vacancyRecords.map(vacancy=>projectDeadline(vacancy,'target_date',workCalendar)):vacancyRecords;
 const deadlineEvents=eventRecords;
 const routineRule=(task,date)=>calendarEnabled?workCalendar.routineDates(task,date,routineOccurs).length>0:routineOccurs(task,date);
 useEffect(()=>{if(!supabase){setBusy(false);setSessionReady(true);return}
 let active=true;
 const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('Tempo limite ao conectar com a autenticação.')),12000));
 Promise.race([supabase.auth.getSession(),timeout]).then(({data})=>{if(!active)return;setUser(data.session?.user||null);setSessionReady(true)}).catch(error=>{if(!active)return;setBusy(false);setSessionReady(true);setToast(error.message||'Não foi possível conectar. Atualize a página.')});
 const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>{if(active)setUser(s?.user||null)});
 return()=>{active=false;subscription.unsubscribe()}
 },[]);
 const load=async(isCurrent)=>{if(!supabase||!user){setLoadedUserId(null);setBusy(false);return}
 setBusy(true);
 setHistoryError('');
 try{
  const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('Tempo limite ao carregar os dados. Verifique a conexão com o Supabase.')),15000));
  const results=await Promise.race([Promise.all([supabase.from('tasks').select('*').order('created_at',{ascending:false}),supabase.from('message_templates').select('*').order('created_at',{ascending:false}),supabase.from('quick_records').select('*').order('created_at',{ascending:false}),loadTaskOccurrences(supabase,user.id,today()),supabase.from('meetings').select('*').order('meeting_date',{ascending:true}),loadCalendarEvents(supabase,user.id),supabase.from('hr_processes').select('*').order('created_at',{ascending:false}),supabase.from('vacancies').select('*').order('created_at',{ascending:false}),supabase.auth.getUser()]),timeout]);
  if(!isCurrent())return;
  const [a,b,c,d,e,f,g,h,profile]=results;
  if(profile.error||!profile.data?.user)throw profile.error||new Error('Não foi possível carregar o perfil.');
  setUser(profile.data.user);
  if(a.error){setTasks([]);notify(a.error.message)}else setTasks(a.data||[]);
  if(b.error){setTemplates([]);notify(b.error.message)}else{setTemplates(b.data||[]);setSelectedTemplateId(b.data?.[0]?.id||null)}
  if(c.error){setRecords([]);notify(c.error.message)}else setRecords(c.data||[]);
  if(d.error){
   setOccurrences([]);
   setHistoryError('Não foi possível carregar o histórico de conclusões. Atualize para tentar novamente.');
  }else setOccurrences(d.data||[]);
  if(e.error){setMeetings([]);notify(e.error.message)}else setMeetings(e.data||[]);
  if(f.error){
   setDeadlineEvents([]);
   if(calendarEnabled)setHistoryError('Não foi possível carregar o calendário de trabalho. Atualize para tentar novamente.');
   notify(f.error.message);
  }else setDeadlineEvents(f.data||[]);
  if(g.error){setProcesses([]);notify(g.error.message)}else setProcesses(g.data||[]);
  if(h.error){setVacancies([]);notify(h.error.message)}else setVacancies(h.data||[]);
 }catch(error){if(isCurrent()){
  setHistoryError('Não foi possível carregar os dados do sistema. Atualize para tentar novamente.');
  setTasks([]);setTemplates([]);setRecords([]);setOccurrences([]);
  setMeetings([]);setDeadlineEvents([]);setProcesses([]);setVacancies([]);
  notify(error.message||'Falha ao carregar os dados.');
 }}
 finally{if(isCurrent()){setLoadedUserId(user.id);setBusy(false)}}
 };
 useEffect(()=>{
  let current=true;
  setEditingActivity(null);setEditingEntry(null);setMeetingSelection(null);setViewingRecord(null);setShowTimeOff(false);
  if(sessionReady)load(()=>current);
  return()=>{current=false};
 },[user?.id,sessionReady]);
 useEffect(()=>{
  if(!profileOpen&&!notificationOpen&&!query&&!searchOpen)return;
  const dismiss=()=>{setProfileOpen(false);setNotificationOpen(false);setQuery('');setSearchOpen(false)};
  const onPointer=event=>{if(!event.target.closest?.('.neemias-main .top-actions'))dismiss()};
  const onKey=event=>{if(event.key==='Escape')dismiss()};
  document.addEventListener('pointerdown',onPointer);
  document.addEventListener('keydown',onKey);
  return()=>{document.removeEventListener('pointerdown',onPointer);document.removeEventListener('keydown',onKey)};
 },[profileOpen,notificationOpen,query,searchOpen]);
 useEffect(()=>{if(searchOpen)document.querySelector('.search-live input')?.focus()},[searchOpen]);
 const notify=t=>{setToast(t);setTimeout(()=>setToast(''),3500)};
 const isWorkingDayToday=!calendarEnabled||workCalendar.isWorkday(dateToday);
 const todayTasks=isWorkingDayToday?dayActivities(tasks,dateToday,routineRule):[];
 const overdueTasks=todayTasks.filter(task=>task.task_type!=='routine'&&task.status!=='completed'&&activityDeadline(task)&&activityDeadline(task)<dateToday);
 const todayMeetings=meetings.filter(m=>m.meeting_date===dateToday);
 const todayEvents=deadlineEvents.filter(e=>isReminder(e)&&eventOccursOn(e,dateToday));
 const isDone=t=>t.recurrence_type && t.recurrence_type!=='none'
  ?occurrences.some(o=>o.task_id===t.id&&occurrenceDays(t,t.occurrenceDay||dateToday).includes(o.occurrence_date)&&o.status==='completed')
  :t.status==='completed';
 const completed=todayTasks.filter(isDone).length;
 const progress=todayTasks.length?Math.round(completed/todayTasks.length*100):0;

 function openReminder(day,event,kind){setReminder({day,event,kind})}
 async function saveReminder(id,day,description){
  const table=supabase.from('deadline_events');
  const values={title:description,event_date:day,description,entry_kind:'reminder'};
  const result=id?await table.update(values).eq('id',id).eq('user_id',user.id).select().single()
    :await table.insert({...values,user_id:user.id,event_type:'other',recurrence_type:'none'}).select().single();
  if(result.error)throw result.error;
  setDeadlineEvents(old=>[...old.filter(item=>item.id!==result.data.id),result.data]);
 }
 async function deleteReminder(id){
  const result=await supabase.from('deadline_events').delete().eq('id',id).eq('user_id',user.id);
  if(result.error)throw result.error;
  setDeadlineEvents(old=>old.filter(item=>item.id!==id));
 }
 async function deleteDeadline(ev){if(!window.confirm('Excluir este lançamento do calendário?'))return;const{error}=await supabase.from('deadline_events').delete().eq('id',ev.id).eq('user_id',user.id);if(error){notify(error.message);return}setDeadlineEvents(old=>old.filter(x=>x.id!==ev.id));closeDeadlineForm();notify('Lançamento excluído')}
 function openDeadlineEditor(ev){setEditingDeadlineId(ev.id);setDeadlineTitle(ev.title||'');setDeadlineDate(ev.event_date||today());setDeadlineType(ev.event_type||'other');setDeadlineDescription(ev.description||'');setDeadlineRecurrence(ev.recurrence_type||'none');setDeadlineDays(ev.recurrence_days?.length?ev.recurrence_days:[new Date(ev.event_date+'T12:00:00').getDay()]);setDeadlineError('');setDeadlineEnd(ev.recurrence_end||'');setShowDeadlineForm(true)}
 function closeDeadlineForm(){if(savingDeadline)return;setDeadlineDays([]);setDeadlineError('');setShowDeadlineForm(false);setEditingDeadlineId(null);setDeadlineTitle('');setDeadlineDescription('');setDeadlineRecurrence('none');setDeadlineEnd('')}
 async function saveDeadline(event){
  event.preventDefault();
  if(savingDeadline)return;
  if(!deadlineTitle.trim()){setDeadlineError('Informe a descrição do prazo.');return;}
  if(deadlineRecurrence==='weekly'&&!deadlineDays.length){setDeadlineError('Selecione pelo menos um dia da semana.');return;}
  if(deadlineRecurrence!=='none'&&deadlineEnd&&deadlineEnd<deadlineDate){setDeadlineError('A data final deve ser igual ou posterior à data inicial.');return;}
  if(editingDeadlineId&&!window.confirm('Salvar as alterações neste lançamento?'))return;
  setSavingDeadline(true);
  setDeadlineError('');
  try{
   const payload={
    title:deadlineTitle.trim(),event_date:deadlineDate,event_type:deadlineType,description:deadlineDescription,entry_kind:'deadline',
    recurrence_type:deadlineRecurrence,recurrence_days:deadlineRecurrence==='weekly'?deadlineDays:[],
    recurrence_end:deadlineRecurrence==='none'?null:(deadlineEnd||null)
   };
   const table=supabase.from('deadline_events');
   const request=editingDeadlineId?table.update(payload).eq('id',editingDeadlineId).eq('user_id',user.id)
    :table.insert({...payload,user_id:user.id});
   const {data,error}=await request.select().single();
   if(error)throw error;
   setDeadlineEvents(old=>editingDeadlineId?old.map(item=>item.id===editingDeadlineId?data:item):[...old,data]);
   setShowDeadlineForm(false);setEditingDeadlineId(null);setDeadlineTitle('');setDeadlineDescription('');
   setDeadlineRecurrence('none');setDeadlineEnd('');setDeadlineDays([]);
   notify(editingDeadlineId?'Alteração confirmada':'Prazo salvo no calendário');
  }catch(error){setDeadlineError(error.message);}
  finally{setSavingDeadline(false);}
 }
 function rawEventOccursOn(event,day){
  if(day<event.event_date||(event.recurrence_end&&day>event.recurrence_end))return false;
  const start=new Date(event.event_date+'T12:00:00');
  const current=new Date(day+'T12:00:00');
  if(event.recurrence_type==='weekly'){
   const days=event.recurrence_days?.length?event.recurrence_days:[start.getDay()];
   return days.includes(current.getDay());
  }
  if(day===event.event_date)return true;
  return event.recurrence_type==='monthly'&&start.getDate()===current.getDate();
 }
 function eventOccursOn(event,day){
  if(isTimeOff(event))return event.event_date<=day&&day<=(event.end_date||event.event_date);
  return calendarEnabled&&isDeadline(event)
   ?workCalendar.eventOccurs(event,day,rawEventOccursOn):rawEventOccursOn(event,day);
 }
 function occurrenceDays(task,day){
  return calendarEnabled
   ?[...new Set([day,...workCalendar.routineDates(task,day,routineOccurs)])]:[day];
 }
 async function saveWorkSchedule(schedule){
  const {data,error}=await supabase.auth.updateUser({data:{work_calendar:schedule}});
  if(error)throw error;
  setUser(data.user);
 }
 async function saveTimeOff(entry,values){
  const payload={...values,entry_kind:'time_off',event_type:'other',recurrence_type:'none',recurrence_days:[],recurrence_end:null};
  const table=supabase.from('deadline_events');
  const request=entry?table.update(payload).eq('id',entry.id).eq('user_id',user.id):table.insert({...payload,user_id:user.id});
  const {data,error}=await request.select().single();
  if(error)throw error;
  setDeadlineEvents(old=>[...old.filter(item=>item.id!==data.id),data]);
 }
 async function deleteTimeOff(id){
  const {error}=await supabase.from('deadline_events').delete().eq('id',id).eq('user_id',user.id).select('id').single();
  if(error)throw error;
  setDeadlineEvents(old=>old.filter(item=>item.id!==id));
 }
 async function saveActivity(id,values){
  const {data,error}=await supabase.from('tasks').update(values).eq('id',id).eq('user_id',user.id).select().single();
  if(error)throw error;
  setTasks(old=>old.map(task=>task.id===id?data:task));
 }
 async function removeActivity(task){
  if(!window.confirm('Excluir a atividade “'+task.title+'”?'))return false;
  await saveActivity(task.id,{is_active:false,status:'cancelled'});
  return true;
 }
 const entrySetters={message_templates:setTemplates,quick_records:setRecords,vacancies:setVacancies,hr_processes:setProcesses};
 async function saveEntry(table,entry,values){
  const {data,error}=await supabase.from(table).update(values).eq('id',entry.id).eq('user_id',user.id).select().single();
  if(error)throw error;
  entrySetters[table](old=>old.map(item=>item.id===entry.id?data:item));
  if(table==='message_templates')setGenerated('');
 }
 async function removeEntry(table,entry){
  if(!window.confirm('Excluir o lançamento “'+(entry.title||entry.person_name)+'”?'))return false;
  const {data,error}=await supabase.from(table).delete().eq('id',entry.id).eq('user_id',user.id).select('id').single();
  if(error)throw error;
  entrySetters[table](old=>old.filter(item=>item.id!==data.id));
  if(table==='vacancies')setProcesses(old=>old.map(process=>process.vacancy_id===data.id?{...process,vacancy_id:null}:process));
  if(table==='message_templates'&&selectedTemplateId===entry.id){setSelectedTemplateId(null);setGenerated('');}
  return true;
 }
 function entryActions(table,entry){
  return <EntryActions label={entry.title||entry.person_name} onEdit={()=>setEditingEntry({table,entry})}
   onDelete={async()=>{try{await removeEntry(table,entry)}catch(error){notify(error.message)}}}/>;
 }
 function activityActions(task){
  return <EntryActions label={task.title} onEdit={()=>setEditingActivity(task)}
   onDelete={async()=>{try{await removeActivity(task)}catch(error){notify(error.message)}}}/>;
 }
 async function addTask(e){e.preventDefault();if(!title.trim())return;const item={title:title.trim(),task_type:taskType, due_date:due, scheduled_date:due, status:'pending', user_id:user.id, recurrence_type:taskType==='routine'?recurrence:'none', recurrence_days:taskType==='routine'&&recurrence==='weekly'?recurrenceDays:taskType==='routine'&&recurrence==='monthly'?[monthDay]:[]};const{data,error}=await supabase.from('tasks').insert(item).select().single();if(error){notify(error.message);return}setTasks(old=>[data,...old]);if(anelisa)setSection(taskType==='routine'?'Rotinas':'Tarefas');setTitle('');setShowAdd(false);notify('Atividade adicionada')}
 async function toggle(task,day=dateToday){
  if(task.recurrence_type&&task.recurrence_type!=='none'){
   const days=occurrenceDays(task,day);
   const done=occurrences.some(item=>item.task_id===task.id&&days.includes(item.occurrence_date)&&item.status==='completed');
   const status=done?'pending':'completed';
   const values=days.map(date=>({user_id:user.id,task_id:task.id,occurrence_date:date,status,completed_at:done?null:new Date().toISOString()}));
   const {data,error}=await supabase.from('task_occurrences').upsert(values,{onConflict:'task_id,occurrence_date'}).select();
   if(error){notify(error.message);return;}
   setOccurrences(old=>[...old.filter(item=>item.task_id!==task.id||!days.includes(item.occurrence_date)),...data]);
   return;
  }
  const status=task.status==='completed'?'pending':'completed';
  const completed_at=status==='completed'?new Date().toISOString():null;
  const {error}=await supabase.from('tasks').update({status,completed_at}).eq('id',task.id).eq('user_id',user.id);
  if(error){notify(error.message);return;}
  setTasks(old=>old.map(item=>item.id===task.id?{...item,status,completed_at}:item));
 }

 async function saveTemplate(e){e.preventDefault();if(!templateTitle.trim()||!templateBody.trim())return;const variables=['nome',...(templateHasDate?['data']:[])];const{data,error}=await supabase.from('message_templates').insert({user_id:user.id,title:templateTitle.trim(),body:templateBody,variables}).select().single();if(error){notify(error.message);return}setTemplates([data,...templates]);setSelectedTemplateId(data.id);setTemplateTitle('');setTemplateBody('');setTemplateHasDate(false);setShowTemplateForm(false);notify('Modelo salvo')}
 function makeMessage(t){const msg=t.body.replaceAll('{{nome}}',recipient.trim()).replaceAll('{{data}}',new Date(sendDate+'T12:00:00').toLocaleDateString('pt-BR'));setGenerated(msg)}
 async function saveRecord(e){e.preventDefault();if(!recordTitle.trim())return;let content='',metadata={description:recordDescription};let encrypted_payload=null;if(recordType==='company')content=JSON.stringify(company);if(recordType==='contact')content=JSON.stringify(contact);if(recordType==='credential'){if(!login.password){notify('Preencha a senha');return}metadata={...metadata,login:login.username,other:login.other,credential_encryption:'account-v1'};try{encrypted_payload=await encryptCredential(supabase,user.id,login.password)}catch(error){notify(error.message);return}}
 const{data,error}=await supabase.from('quick_records').insert({user_id:user.id,record_type:recordType,title:recordTitle.trim(),content,metadata,encrypted_payload}).select().single();if(error){notify(error.message);return}setRecords([data,...records]);setRecordTitle('');setRecordDescription('');setCompany({razao:'',fantasia:'',cnpj:'',ie:'',cep:'',street:'',number:'',complement:'',district:'',city:'',state:'',phone:'',email:'',responsible:''});setContact({phone:'',name:'',email:''});setLogin({username:'',password:'',other:''});setShowRecordForm(false);notify('Cadastro salvo')}

 function mask(value,type){let v=value.replace(/\D/g,'');if(type==='cnpj')return v.slice(0,14).replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2');if(type==='cep')return v.slice(0,8).replace(/^(\d{5})(\d)/,'$1-$2');if(type==='phone'){v=v.slice(0,11);return v.length>10?v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/,'($1) $2-$3'):v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/,'($1) $2-$3')}return value}
 async function copyValue(value){try{await navigator.clipboard.writeText(value);notify('Copiado para a área de transferência')}catch{notify('Não foi possível copiar')}}
 const searchItems=useMemo(()=>[...tasks.map(x=>({label:x.title,detail:'Atividade',section:'Meu Dia',search:x.title+' '+(x.description||'')})),...meetings.map(x=>({label:x.title,detail:'Reunião',section:'Reuniões',search:x.title+' '+(x.agenda||'')})),...deadlineEvents.filter(x=>isReminder(x)).map(x=>({label:x.title,detail:'Calendário',section:'Meu Dia',search:x.title+' '+(x.description||'')})),...templates.map(x=>({label:x.title,detail:'Mensagem pronta',section:'Mensagens prontas',search:x.title+' '+x.body})),...records.filter(x=>!['profile_photo','credential_key'].includes(x.metadata?.kind)).map(x=>({label:x.title,detail:'Cadastro',section:'Cadastros',search:x.title+' '+(x.metadata?.description||'')})),...processes.map(x=>({label:x.person_name,detail:x.process_type==='admission'?'Admissão':'Rescisão',section:'Processos',search:x.person_name+' '+(x.role||'')+' '+(x.unit||'')})),...searchableSections.map(label=>({label,detail:'Seção',section:label,search:label}))].filter(x=>query.trim()&&x.search.toLowerCase().includes(query.toLowerCase())).slice(0,8),[query,tasks,meetings,deadlineEvents,templates,records,processes]);
 const overdueNotifications=[...overdueTasks.map(t=>({title:t.title,detail:'Atividade em atraso',date:t.due_date,section:'Meu Dia'})),...deadlineEvents.filter(e=>isReminder(e)&&e.event_date<dateToday).map(e=>({title:e.title,detail:'Lançamento do calendário em atraso',date:e.event_date,section:'Meu Dia'})),...processes.filter(p=>p.status!=='completed'&&p.due_date&&p.due_date<dateToday).map(p=>({title:p.person_name,detail:'Processo com prazo vencido',date:p.due_date,section:'Processos'}))];
 const meetingNotifications=meetings.filter(m=>m.meeting_date>=dateToday&&m.meeting_date<=new Date(Date.now()+86400000).toLocaleDateString('en-CA')).map(m=>({title:m.title,detail:'Lembrete de reunião',date:m.meeting_date,section:'Reuniões'}));
 const notifications=[...overdueNotifications,...meetingNotifications];

 const quotes=['Comece pelo que importa.','Um passo de cada vez também leva longe.','Constância transforma pequenos esforços em resultados.','Faça o possível hoje; o progresso vem da continuidade.','Organização abre espaço para boas escolhas.','O foco de hoje constrói o resultado de amanhã.','Avance no seu ritmo, sem perder a direção.'];
 const dailyQuote=quotes[Math.floor(new Date(dateToday+'T12:00:00').getTime()/86400000)%quotes.length];
 const defaultProcessChecklist=process=>createProcessChecklist(
  process.process_type, vacancies.find(vacancy=>vacancy.id===process.vacancy_id)?.contract_type||'CLT'
 );
 const processProgress=process=>{
  const steps=process.checklist||defaultProcessChecklist(process);
  return Math.round(steps.filter(step=>step.done).length/Math.max(steps.length,1)*100);
 };
 const vacancyOpenCount=vacancy=>vacancyRemaining(vacancy,processes);
 const openVacancies=vacancies.filter(v=>v.status==='open'&&vacancyOpenCount(v)>0);
 const hasFollowUps=openVacancies.length>0||processes.some(process=>!['completed','cancelled'].includes(process.status));
 async function createVacancy(event){
  event.preventDefault();
  if(savingVacancy)return;
  if(!vacancyTitle.trim()){setVacancyError('Informe o cargo da vaga.');return;}
  setSavingVacancy(true);
  setVacancyError('');
  try{
   const {data,error}=await supabase.from('vacancies').insert({
    user_id:user.id,title:vacancyTitle.trim(),unit:vacancyUnit.trim(),department:vacancyDepartment.trim(),
    contract_type:vacancyContractType,quantity:Math.max(1,Number(vacancyQuantity)||1),status:'open',notes:vacancyNotes,target_date:vacancyTarget||null
   }).select().single();
   if(error)throw error;
   setVacancies(old=>[data,...old]);
   setVacancyTitle('');setVacancyUnit('');setVacancyDepartment('');setVacancyContractType('CLT');
   setVacancyQuantity('1');setVacancyNotes('');setVacancyTarget('');setShowVacancyForm(false);
   notify('Vaga aberta');
  }catch(error){setVacancyError(error.message);}
  finally{setSavingVacancy(false);}
 }
 function openVacancy(){
  setVacancyError('');
  setShowVacancyForm(true);
 }

 async function createProcess(e){e.preventDefault();const{data,error}=await supabase.from('hr_processes').insert({user_id:user.id,process_type:processType,person_name:processName.trim(),role:processRole,unit:processUnit,status:'open',due_date:processDue,vacancy_id:processType==='admission'?(processVacancyId||null):null,checklist:defaultProcessChecklist({process_type:processType,vacancy_id:processVacancyId}),notes:processNotes}).select().single();if(error){notify(error.message);return}setProcesses(old=>[data,...old]);setProcessName('');setProcessRole('');setProcessUnit('');setProcessNotes('');setProcessVacancyId('');setShowProcessForm(false);notify('Processo cadastrado');}
 async function updateProcess(p,checklist){if(!window.confirm('Salvar a alteração desta etapa?'))return;const{data,error}=await supabase.from('hr_processes').update({checklist,status:checklist.every(x=>x.done)?'completed':'open'}).eq('id',p.id).select().single();if(error){notify(error.message);return}setProcesses(old=>old.map(x=>x.id===p.id?data:x))}
 const dateLabel=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
 if(!sessionReady||busy||(user&&loadedUserId!==user.id))return <div className="loading"><div className="brand-mark"><Leaf/></div><span>Preparando seu espaço...</span></div>;
 if(!supabase)return <main className="setup"><h1>Meu Tempo</h1><p>Configure as variáveis do Supabase para iniciar.</p><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_ANON_KEY</code></main>;
 if(!user)return <Login client={supabase} connectionError={toast}/>;
 if(historyError)return <main className="setup">
  <h1>Carregamento incompleto</h1><p role="alert">{historyError}</p>
  <button className="primary" onClick={()=>window.location.reload()}>Recarregar</button>
 </main>;
 const anelisa=user.app_metadata?.meu_tempo_workspace==='anelisa';
 const renderMeetings=(initialMeetingId=null,mode)=> <Meetings key={user.id+':' +(mode||'')+':' +(initialMeetingId||'')} mode={mode} initialMeetingId={initialMeetingId} client={supabase} userId={user.id} today={dateToday}
   meetings={meetings} tasks={tasks}
   onMeeting={meeting=>setMeetings(old=>[...old.filter(item=>item.id!==meeting.id),meeting]
     .sort((a,b)=>a.meeting_date.localeCompare(b.meeting_date)))}
   canManage={!anelisa} onDeleteMeeting={async(id)=>{
    const {error}=await supabase.from('meetings').delete().eq('id',id).eq('user_id',user.id).select('id').single();
    if(error)throw error;
    setMeetings(old=>old.filter(meeting=>meeting.id!==id));
   }}
   onTask={task=>setTasks(old=>[task,...old.filter(item=>item.id!==task.id)])}/>;
 const timeOffDialog=showTimeOff&&<TimeOffDialog events={eventRecords.filter(isTimeOff)} today={dateToday}
   onSave={saveTimeOff} onDelete={deleteTimeOff} onClose={()=>setShowTimeOff(false)}/>;
 const reminderDialog=reminder&&<ReminderDialog reminder={reminder} onSave={saveReminder}
   onDelete={deleteReminder} onClose={()=>setReminder(null)}/>;
 const shortcuts=[
  [ThemeTask,'Incluir tarefa',()=>{setTaskType('demand');setShowAdd(true)}],
  [ThemeRoutine,'Incluir rotina',()=>{setTaskType('routine');setShowAdd(true)}],
  [ThemeMeeting,'Reuniões',()=>setSection('Reuniões')],
  [ThemeAlert,'Incluir lembrete',()=>openReminder(dateToday)],
  [Flag,'Incluir prazo',()=>{closeDeadlineForm();setDeadlineDate(dateToday);setShowDeadlineForm(true)}],
  [UserPlus,'Abrir vaga',openVacancy],
  [CalendarX2,'Sem expediente',()=>setShowTimeOff(true)],
  [Briefcase,'Processos',()=>setSection('Processos')],
  [MessageSquareText,'Mensagens prontas',()=>setSection('Mensagens prontas')],
  [FolderKanban,'Cadastros',()=>setSection('Cadastros')],
 ];
 return <div className={`app theme-${theme}${anelisa?' aw-app':''}`} data-ui-theme={theme} data-aw-theme={theme} data-mobile-tools={mobileTools || undefined}>
 {anelisa?<AnelisaWorkspace holidaysForMonth={workHolidaysForMonth} theme={theme} onSelectTheme={setTheme} key={user.id} userId={user.id} email={user.email} tasks={tasks} date={dateToday}
   isDone={isDone} toggle={toggle} meetings={meetings} renderMeetings={renderMeetings}
   weekStart={weekStart(dateToday)} occurrences={occurrences}
   accountPhoto={records.find(record=>record.id===user.id&&record.metadata?.kind==='profile_photo')?.content}
   onSavePhoto={async(content)=>{
    const {data,error}=await supabase.from('quick_records').upsert({
      id:user.id,user_id:user.id,record_type:'snippet',title:'Foto de perfil',content,metadata:{kind:'profile_photo'}
    }).select().single();
    if(error)throw error;
    setRecords(old=>[data,...old.filter(record=>record.id!==data.id)]);
   }}
   onDeleteActivity={async(id)=>{
    const {data,error}=await supabase.from('tasks').update({is_active:false,status:'cancelled'})
      .eq('id',id).eq('user_id',user.id).select().single();
    if(error)throw error;
    setTasks(old=>old.map(item=>item.id===id?data:item));
   }}
   events={deadlineEvents} occursOn={eventOccursOn} onReminder={openReminder} reminderDialog={reminderDialog}
   workCalendar={workCalendar} routineRule={routineRule} workSchedule={workSchedule} onSaveWorkSchedule={saveWorkSchedule}
   onTimeOff={()=>setShowTimeOff(true)} timeOffDialog={timeOffDialog}
   contacts={records.filter(record=>record.record_type==='contact')}
   onSaveContact={async(contact)=>{
    const {data,error}=await supabase.from('quick_records').insert({user_id:user.id,record_type:'contact',
      title:contact.name,content:JSON.stringify(contact),metadata:{}}).select().single();
    if(error)throw error;
    setRecords(old=>[data,...old]);
   }}
   onSaveActivity={async(id,values)=>{
    const table=supabase.from('tasks');
    const request=id?table.update(values).eq('id',id).eq('user_id',user.id):table.insert({...values,user_id:user.id});
    const {data,error}=await request.select().single();
    if(error)throw error;
    setTasks(old=>id?old.map(item=>item.id===id?data:item):[data,...old]);
   }}
   signOut={async()=>{await supabase.auth.signOut();setSection('Meu Dia');setShowAdd(false)}}/>:<>
 <main className="main neemias-main"><header className="topbar" data-search-open={searchOpen || undefined}><div className="top-left"><button className="home-button" onClick={()=>{setMobileTools(false);setSection('Meu Dia')}}><ThemeBrand size={20}/><span>Meu Tempo</span></button><b>{section}</b></div><div className="top-actions"><button className="social-search-toggle icon-btn" aria-label={searchOpen?'Fechar busca':'Abrir busca'} aria-expanded={searchOpen} onClick={()=>{setSearchOpen(value=>!value);setProfileOpen(false);setNotificationOpen(false)}}>{searchOpen?<X size={20}/>:<Search size={20}/>}</button><div className="search search-live"><Search size={17}/><input aria-label="Buscar no Meu Tempo" value={query} onFocus={()=>{setProfileOpen(false);setNotificationOpen(false)}} onChange={e=>setQuery(e.target.value)} placeholder="Buscar em todo o sistema..."/>{query&&<button aria-label="Limpar busca" className="search-clear" onClick={()=>setQuery('')}><X size={14}/></button>}{query.trim()&&!searchItems.length&&<div className="search-results social-search-empty" role="status">Nenhum resultado para “{query}”.</div>}{searchItems.length>0&&<div className="search-results">{searchItems.map((item,i)=><button key={i} onClick={()=>{setMobileTools(false);setSection(item.section);setQuery('');setSearchOpen(false)}}><b>{item.label}</b><small>{item.detail}</small></button>)}</div>}</div><div className="header-pop"><button className="icon-btn" aria-label="Notificações" title="Notificações" aria-expanded={notificationOpen} onClick={()=>{setNotificationOpen(!notificationOpen);setProfileOpen(false);setQuery('')}}><ThemeAlert size={20}/>{notifications.length>0&&<i/>}</button>{notificationOpen&&<div className="header-dropdown notification-dropdown"><b>Notificações</b>{notifications.length?notifications.map((n,i)=><button key={i} onClick={()=>{setMobileTools(false);setSection(n.section);setNotificationOpen(false)}}><strong>{n.title}</strong><small>{n.detail} · {new Date(n.date+'T12:00:00').toLocaleDateString('pt-BR')}</small></button>):<small>Você não tem notificações no momento.</small>}</div>}</div><div className="header-pop"><button className="avatar avatar-button" aria-label="Minha conta" aria-expanded={profileOpen} onClick={()=>{setProfileOpen(!profileOpen);setNotificationOpen(false);setQuery('')}}>{profilePhoto?<img src={profilePhoto} alt="Foto do perfil"/>:(user.email||'U')[0].toUpperCase()}</button>{profileOpen&&<div className="header-dropdown profile-dropdown"><b>Minha conta</b><label className="photo-upload">Incluir foto<input type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file){const reader=new FileReader();reader.onload=()=>setProfilePhoto(reader.result);reader.readAsDataURL(file)}}}/></label><button onClick={()=>{setMobileTools(false);setSection('Meus dados');setProfileOpen(false)}}>Meus dados de cadastro</button><ThemePicker theme={theme} onChange={setTheme}/><button onClick={async()=>{await supabase.auth.signOut();setProfileOpen(false)}}>Sair</button></div>}</div></div></header>
 <div className="agenda-layout neemias-layout">
 <nav className="neemias-desktop-menu" aria-label="Navegação do Meu Tempo">
  <button className="neemias-menu-home" aria-current={section==='Meu Dia'?'page':undefined}
   onClick={()=>{setMobileTools(false);setSection('Meu Dia');setAgendaView('list')}}><ThemeBrand size={20}/> Meu Dia</button>
  <div className="neemias-shortcuts">
   {shortcuts.map(([Icon,label,action],index)=><button key={label} data-tone={index}
    aria-current={section===label?'page':undefined} onClick={()=>{setMobileTools(false);action()}}>
    <span className="neemias-shortcut-icon"><Icon size={20} aria-hidden="true"/></span><span>{label}</span>
   </button>)}
  </div>
  <QuickNotes userId={user.id}/>
 </nav>
 <div className="content"><div className="welcome"><div><p className="eyebrow">{dateLabel.toUpperCase()}</p><h1>{section}</h1></div></div>
 {section==='Meu Dia'&&<>
  <div className="agenda-view-switch" role="group" aria-label="Visualização da agenda">
   <button className="secondary" aria-pressed={agendaView==='list'} onClick={()=>setAgendaView('list')}><ClipboardList size={16}/> Lista</button>
   <button className="secondary" aria-pressed={agendaView==='calendar'} onClick={()=>setAgendaView('calendar')}><CalendarDays size={16}/> Calendário</button>
  </div>
  {agendaView==='calendar'&&<AgendaCalendar key={calendarSelection?.version} date={dateToday} initialDate={calendarSelection?.day} tasks={tasks.filter(t=>t.is_active!==false&&t.status!=='cancelled')}
   meetings={meetings} holidaysForMonth={workHolidaysForMonth} routineRule={routineRule} events={deadlineEvents.filter(isReminder)} occursOn={eventOccursOn}
   onReminder={openReminder} onMeeting={id=>{setMeetingSelection(id);setSection('Reuniões')}} onEvent={openDeadlineEditor} onEdit={setEditingActivity} renderTaskDescription={task=><TaskDescription description={task.description}/>}/>}
 </>}
 {section==='Meu Dia'&&agendaView==='list'&&isWorkingDayToday&&<section className="myday-shell"><DayProgress completed={completed} total={todayTasks.length}/><div className="myday-list-head"><div><h2>Minha lista de hoje</h2><p>Atividades em atraso aparecem destacadas em vermelho.</p></div><span className="myday-count">{todayTasks.length-completed} pendentes</span></div><div className="myday-list">{[...overdueTasks,...todayTasks.filter(t=>!overdueTasks.some(o=>o.id===t.id))].map((t,i)=><div key={t.id} className={`myday-task ${isDone(t)?'is-done':''} ${!isDone(t)&&activityDeadline(t)<dateToday&&t.task_type!=='routine'?'is-overdue':''}`}><button className={`myday-check ${isDone(t)?'checked':''}`} onClick={()=>toggle(t)} aria-pressed={isDone(t)} aria-label={(isDone(t)?'Desmarcar: ':'Concluir: ')+t.title}>{isDone(t)?<Check size={17}/>:null}</button><span className={`myday-task-icon task-tone-${i%6}`}>{t.task_type==='routine'?<ThemeRoutine size={19}/>:<ThemeTask size={19}/>}</span><div className="myday-task-copy"><b>{t.title}</b><small>{t.task_type==='routine'?'Rotina':'Tarefa'} · {t.recurrence_type==='daily'?'Diária':t.recurrence_type==='weekly'?'Semanal':t.recurrence_type==='monthly'?'Mensal':activityDeadline(t)?'Prazo '+new Date(activityDeadline(t)+'T12:00:00').toLocaleDateString('pt-BR'):'Sem prazo'}</small><TaskDescription description={t.description}/></div><span className="myday-task-status">{isDone(t)?'Concluída':activityDeadline(t)<dateToday&&t.task_type!=='routine'?'Em atraso':activityDeadline(t)>dateToday?'Prazo futuro':'A fazer'}</span>{activityActions(t)}</div>)}{!todayTasks.length&&!overdueTasks.length&&!hasFollowUps&&<div className="myday-empty"><span><Check size={26}/></span><b>Sua lista está livre!</b><p>Adicione uma rotina ou demanda para organizar seu dia.</p><button className="primary" onClick={()=>setShowAdd(true)}><Plus size={16}/> Adicionar atividade</button></div>}</div><div className="day-agenda"><h2>Agenda de hoje</h2>{todayMeetings.map(m=><div className="agenda-item meeting" key={m.id}><CalendarDays/><div><b>{m.title}</b><small>Reunião · {m.agenda||'Sem pauta'}</small><button className="secondary" onClick={()=>{setMeetingSelection(m.id);setSection('Reuniões')}}>Abrir reunião</button></div></div>)}{todayEvents.map(ev=><div className="agenda-item" key={ev.id}><CalendarCheck/><div>
 {ev.event_type==='other'?<button className="agenda-reminder-link" onClick={()=>openReminder(dateToday,ev)}>{ev.description||ev.title}</button>:<><b>{ev.title}</b><small>{ev.description||ev.event_type}</small></>}
 </div>{ev.event_type!=='other'&&<EntryActions label={ev.title} onEdit={()=>openDeadlineEditor(ev)} onDelete={()=>deleteDeadline(ev)}/>}</div>)}{!todayMeetings.length&&!todayEvents.length&&<p className="muted">Nenhum compromisso adicional para hoje.</p>}</div></section>}
 {section==='Meu Dia'&&isWorkingDayToday&&<DayFollowUps vacancies={openVacancies} processes={processes} date={dateToday}
  vacancyOpenCount={vacancyOpenCount} processProgress={processProgress}
  onVacancy={entry=>setEditingEntry({table:'vacancies',entry})}
  onProcess={process=>{
   setSection('Processos');
   requestAnimationFrame(()=>document.getElementById('process-'+process.id)?.scrollIntoView({block:'nearest'}));
  }}/>}
 {section==='Meu Dia'&&!isWorkingDayToday&&<section className="task-panel no-work-banner">
  <CalendarX2 size={22}/><div><h2>Sem expediente hoje</h2><p>{workCalendar.dayOffLabel(dateToday)}</p></div>
 </section>}
 {section==='Meu Dia'&&<details className="task-panel neemias-all-activities">
  <summary>Todas as tarefas e rotinas</summary>
  {tasks.filter(task=>task.is_active!==false&&task.status!=='cancelled').map(task=><div className="task-row" key={task.id}>
   <div className="task-info"><b>{task.title}</b><small>{task.task_type==='routine'?'Rotina':'Tarefa'} · {task.status==='completed'?'Concluída':task.due_date||'Sem prazo'}</small><TaskDescription description={task.description}/></div>
   {activityActions(task)}
  </div>)}
 </details>}
 {section==='Processos'&&<section className="task-panel processes-panel"><div className="panel-head"><div><h2>Processos de RH</h2><p className="muted">Acompanhe admissões e rescisões por etapas e gerencie as vagas abertas.</p></div><div className="process-actions"><button className="secondary" onClick={openVacancy}><Plus size={16}/> Abrir vaga</button><button className="primary" onClick={()=>{setProcessType('admission');setProcessVacancyId('');setShowProcessForm(true)}}><Plus size={17}/> Novo processo</button></div></div><div className="vacancy-board"><div className="vacancy-board-head"><b>Vagas em aberto</b><small>{openVacancies.reduce((n,v)=>n+vacancyOpenCount(v),0)} posição(ões) disponível(is)</small></div>{openVacancies.length?openVacancies.map(v=><div className="vacancy-row" key={v.id}><span className="vacancy-pulse"/><div><b>{v.title} - {v.unit||'Unidade não informada'}</b><small>{v.department||'Área não informada'} · {v.contract_type||'CLT'} · {v.quantity} prevista(s)</small></div><strong>{vacancyOpenCount(v)} aberta(s)</strong>{entryActions('vacancies',v)}</div>):<p className="vacancy-empty">Nenhuma vaga aberta no momento. Use “Abrir vaga” para cadastrar.</p>}</div><details className="neemias-all-activities"><summary>Todas as vagas</summary>
 {vacancies.map(v=><div className="task-row" key={v.id}><div className="task-info"><b>{v.title}</b><small>{v.unit} · {v.status}</small></div>{entryActions('vacancies',v)}</div>)}
 </details><div className="process-tabs"><span>{processes.filter(p=>p.process_type==='admission'&&p.status!=='completed').length} Admissões abertas</span><span>{processes.filter(p=>p.process_type==='termination'&&p.status!=='completed').length} Rescisões abertas</span><span>{processes.filter(p=>p.status==='completed').length} Concluídos</span></div>{processes.length?processes.map(p=>{const steps=p.checklist||defaultProcessChecklist(p);const pct=processProgress(p);return <article className="process-card" id={'process-'+p.id} key={p.id}><div className="process-card-head"><div><span className={'process-type '+(p.process_type==='termination'?'termination':'')}>{p.process_type==='termination'?'Rescisão':'Admissão'}</span><h3>{p.person_name}</h3><small>{[p.role,p.unit].filter(Boolean).join(' · ')||'Cargo/unidade não informados'}</small></div><b>{pct}%</b></div><div className="process-progress"><i style={{width:pct+'%'}}/></div><div className="process-checklist">{steps.map((step,i)=><div className="process-step" key={i}>
 <label>
  <input type="checkbox" checked={!!step.done} onChange={e=>updateProcess(p,steps.map((x,j)=>j===i?{...x,done:e.target.checked}:x))}/>
  <span className="process-step-copy"><span>{step.label}</span>
   {step.detail&&<span className="process-step-detail">{step.detail}</span>}
  </span>
 </label>
 </div>)}</div>{p.due_date&&<small className="process-deadline">Prazo previsto: {new Date(p.due_date+'T12:00:00').toLocaleDateString('pt-BR')}</small>}{p.notes&&<p className="process-notes">{p.notes}</p>}{entryActions('hr_processes',p)}</article>}) : <div className="empty"><b>Nenhum processo cadastrado</b><p>Use “Novo processo” para incluir uma admissão ou rescisão.</p><button className="primary" onClick={()=>setShowProcessForm(true)}><Plus size={16}/> Incluir primeiro processo</button></div>}</section>}
 {section==='Meus dados'&&<section className="task-panel profile-data"><div className="panel-head"><div><h2>Meus dados de cadastro</h2><p className="muted">Informações da conta utilizada no Meu Tempo.</p></div></div><div className="profile-data-body"><div className="profile-large">{profilePhoto?<img src={profilePhoto} alt="Foto do perfil"/>:((user.email||'U')[0].toUpperCase())}</div><div><b>{user.email}</b><small>Conta autenticada</small></div><label className="photo-upload">Alterar foto de perfil<input type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file){const reader=new FileReader();reader.onload=()=>setProfilePhoto(reader.result);reader.readAsDataURL(file)}}}/></label></div><ThemePicker theme={theme} onChange={setTheme}/><WorkScheduleForm schedule={workSchedule} onSave={saveWorkSchedule}/></section>}
 {section==='Reuniões'&&renderMeetings(meetingSelection)}
 {section==='Mensagens prontas'&&<div className="task-panel"><div className="panel-head"><div><h2>Modelos de mensagens</h2><p className="muted">Preencha os dados e gere o texto para copiar</p></div><button className="primary" onClick={()=>setShowTemplateForm(true)}><Plus size={16}/> Novo modelo</button></div><div className="template-workspace"><div className="template-list">{templates.map(t=><button key={t.id} className={selectedTemplateId===t.id?'template-option selected':'template-option'} onClick={()=>{setSelectedTemplateId(t.id);setGenerated('');setRecipient('')}}><MessageSquareText/><span><b>{t.title}</b><small>{t.body.slice(0,70)}{t.body.length>70?'…':''}</small></span></button>)}{!templates.length&&<p className="muted">Nenhum modelo cadastrado.</p>}</div>{templates.filter(t=>t.id===selectedTemplateId).map(t=><section className="template-editor" key={t.id}><h3>{t.title}</h3>{entryActions('message_templates',t)}<label>Nome de quem vai receber<input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Nome do destinatário"/></label>{(t.variables||[]).includes('data')&&<label>Data do agendamento<input type="date" value={sendDate} onChange={e=>setSendDate(e.target.value)}/></label>}<button className="primary" onClick={()=>makeMessage(t)}>Gerar mensagem</button>{generated&&<><label>Mensagem gerada<textarea rows="6" value={generated} readOnly/></label><button className="secondary" onClick={()=>copyValue(generated)}><Copy size={16}/> Copiar mensagem</button></>}</section>)}</div></div>}
 {section==='Cadastros'&&<div className="task-panel"><div className="panel-head"><div><h2>Central de cadastros</h2><p className="muted">Organize empresas, acessos e contatos</p></div></div><div className="record-grid"><button className="record-category" onClick={()=>{setRecordType('company');setShowRecordForm(true)}}><Building2/><b>Empresas</b><small>{records.filter(r=>r.record_type==='company').length} cadastradas</small></button><button className="record-category" onClick={()=>{setRecordType('credential');setShowRecordForm(true)}}><KeyRound/><b>Logins e senhas</b><small>{records.filter(r=>r.record_type==='credential').length} cadastrados</small></button><button className="record-category" onClick={()=>{setRecordType('contact');setShowRecordForm(true)}}><Phone/><b>Contatos</b><small>{records.filter(r=>r.record_type==='contact').length} cadastrados</small></button></div><div className="task-list">{records.filter(r=>!['profile_photo','credential_key'].includes(r.metadata?.kind)).map(r=><div className="task-row" key={r.id}><div className="task-info"><b>{r.title}</b><small>{r.record_type==='company'?'Empresa':r.record_type==='credential'?'Login':'Contato'} · {r.metadata?.description||''}</small></div><button className="secondary" onClick={()=>setViewingRecord(r)}>Visualizar</button>{entryActions('quick_records',r)}</div>)}</div>{!records.length&&<div className="empty"><b>Nenhum cadastro realizado</b><p>Escolha uma categoria acima para começar.</p></div>}</div>}
 </div>
 <AgendaSidebar processes={<section className="agenda-sidebar-processes">
  <h2><Briefcase size={17}/> Processos</h2>
  {processes.filter(process=>process.status!=='cancelled').length?<div className="sidebar-process-list">
   {processes.filter(process=>process.status!=='cancelled').map(process=>{
    const percent=processProgress(process);
    return <button className="sidebar-process-item" key={process.id} onClick={()=>{
     setMobileTools(false);setSection('Processos');
     requestAnimationFrame(()=>document.getElementById('process-'+process.id)?.scrollIntoView({block:'nearest'}));
    }}>
     <span className="sidebar-process-top"><span>{process.person_name}</span><span className="sidebar-process-percent">{percent}%</span></span>
     <small>{process.process_type==='termination'?'Rescisão':'Admissão'} · {percent===100?'Concluído':'Em andamento'}</small>
     <progress aria-label={'Andamento do processo de '+process.person_name} value={percent} max="100">{percent}%</progress>
    </button>;
   })}
  </div>:<p>Nenhum processo cadastrado.</p>}
 </section>} events={deadlineEvents} date={dateToday} occursOn={eventOccursOn} onReminder={openReminder}
  calendar={<MiniCalendar today={dateToday} selected={agendaView==='calendar'&&section==='Meu Dia'?calendarSelection?.day:null}
   holidaysForMonth={workHolidaysForMonth} dayOff={workCalendar.dayOffLabel} events={deadlineEvents.filter(isDeadline)} occursOn={eventOccursOn} onEvent={openDeadlineEditor}
   hasEvent={day=>deadlineEvents.some(event=>isDeadline(event)&&eventOccursOn(event,day))}
   onSelect={day=>{
    setMobileTools(false);setCalendarSelection(old=>({day,version:(old?.version??0)+1}));
    setAgendaView('calendar');setSection('Meu Dia');
   }}/>}>
  {openVacancies.length? <ul>{openVacancies.slice(0,8).map(v=><li key={v.id}><span>{v.title}{v.unit?' · '+v.unit:''}</span><small>{vacancyOpenCount(v)} vaga(s)</small></li>)}</ul>
   :<p>Nenhuma vaga em aberto no momento.</p>}
  <button className="secondary" onClick={()=>{setSection('Processos');openVacancy()}}><Plus size={15}/> Abrir vaga</button>
 </AgendaSidebar>
 </div>
 <nav className="social-mobile-nav" aria-label="Navegação principal">
  <button aria-current={!mobileTools&&section==='Meu Dia'?'page':undefined} onClick={()=>{setMobileTools(false);setSection('Meu Dia')}}><ThemeBrand/><span>Meu dia</span></button>
  <button onClick={()=>{setTaskType('demand');setShowAdd(true)}}><ThemeTask/><span>Nova tarefa</span></button>
  <button onClick={()=>{setTaskType('routine');setShowAdd(true)}}><ThemeRoutine/><span>Nova rotina</span></button>
  <button aria-current={!mobileTools&&section==='Reuniões'?'page':undefined} onClick={()=>{setMobileTools(false);setSection('Reuniões')}}><ThemeMeeting/><span>Reuniões</span></button>
  <button aria-current={mobileTools?'page':undefined} onClick={()=>{setMobileTools(value=>!value);window.scrollTo({top:0})}}><Menu/><span>Mais</span></button>
 </nav></main>
 {reminderDialog}

 {!anelisa&&timeOffDialog}
 {showVacancyForm&&<div className="overlay" onClick={()=>{if(!savingVacancy)setShowVacancyForm(false)}}>
  <form className="modal" role="dialog" aria-modal="true" aria-labelledby="vacancy-form-title"
   onClick={event=>event.stopPropagation()} onSubmit={createVacancy}>
   <div className="modal-head"><h2 id="vacancy-form-title">Abrir vaga</h2>
    <button type="button" className="icon-btn" aria-label="Fechar vaga" disabled={savingVacancy} onClick={()=>setShowVacancyForm(false)}><X/></button>
   </div>
   <fieldset disabled={savingVacancy} className="vacancy-form-fields">
    <label>Cargo<input autoFocus value={vacancyTitle} onChange={event=>setVacancyTitle(event.target.value)} required/></label>
    <div className="form-grid">
     <label>Unidade<input value={vacancyUnit} onChange={event=>setVacancyUnit(event.target.value)} placeholder="Ex.: Birigui"/></label>
     <label>Área ou setor<input value={vacancyDepartment} onChange={event=>setVacancyDepartment(event.target.value)}/></label>
    </div>
    <div className="form-grid">
     <label>Tipo de contrato<select value={vacancyContractType} onChange={event=>setVacancyContractType(event.target.value)}>
      <option value="CLT">CLT</option><option value="Free">Free</option>
     </select></label>
     <label>Quantidade<input type="number" min="1" step="1" value={vacancyQuantity} onChange={event=>setVacancyQuantity(event.target.value)} required/></label>
    </div>
    <label>Prazo da contratação<input type="date" value={vacancyTarget} onChange={event=>setVacancyTarget(event.target.value)}/></label>
    <label>Observações<textarea rows="3" value={vacancyNotes} onChange={event=>setVacancyNotes(event.target.value)}/></label>
   </fieldset>
   {vacancyError&&<p role="alert">{vacancyError}</p>}
   <div className="modal-actions">
    <button type="button" className="secondary" disabled={savingVacancy} onClick={()=>setShowVacancyForm(false)}>Cancelar</button>
    <button className="primary" disabled={savingVacancy}><Save size={16}/>{savingVacancy?'Salvando…':'Salvar vaga'}</button>
   </div>
  </form>
 </div>}
 {showProcessForm&&<div className="overlay" onClick={()=>setShowProcessForm(false)}><form className="modal" onClick={e=>e.stopPropagation()} onSubmit={createProcess}><div className="modal-head"><div><p className="eyebrow">PROCESSOS DE RH</p><h2>Novo processo</h2></div><button type="button" className="icon-btn" onClick={()=>setShowProcessForm(false)}><X/></button></div><label>Tipo<select value={processType} onChange={e=>setProcessType(e.target.value)}><option value="admission">Admissão</option><option value="termination">Rescisão</option></select></label><label>Nome da pessoa<input value={processName} onChange={e=>setProcessName(e.target.value)} required/></label>{processType==='admission'&&<label>Vaga vinculada<select value={processVacancyId} onChange={e=>{setProcessVacancyId(e.target.value);const v=vacancies.find(x=>x.id===e.target.value);if(v){setProcessRole(v.title);setProcessUnit(v.unit||'')}}}><option value="">Admissão sem vaga vinculada</option>{openVacancies.map(v=><option key={v.id} value={v.id}>{v.title} - {v.unit||'Sem unidade'} ({vacancyOpenCount(v)} disponível)</option>)}</select></label>}<div className="form-grid"><label>Cargo<input value={processRole} onChange={e=>setProcessRole(e.target.value)}/></label><label>Unidade<input value={processUnit} onChange={e=>setProcessUnit(e.target.value)}/></label></div><label>Prazo previsto<input type="date" value={processDue} onChange={e=>setProcessDue(e.target.value)}/></label><label>Observações<textarea rows="3" value={processNotes} onChange={e=>setProcessNotes(e.target.value)}/></label><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setShowProcessForm(false)}>Cancelar</button><button className="primary"><Save size={16}/> Criar processo</button></div></form></div>}
 {showDeadlineForm&&<div className="overlay" onClick={closeDeadlineForm}><form className="modal" onClick={e=>e.stopPropagation()} onSubmit={saveDeadline}><div className="modal-head"><div><p className="eyebrow">CALENDÁRIO DE PRAZOS</p><h2>{editingDeadlineId?'Editar lançamento':'Novo lançamento'}</h2></div><button type="button" className="icon-btn" onClick={closeDeadlineForm}><X/></button></div><label>Descrição<input value={deadlineTitle} onChange={e=>setDeadlineTitle(e.target.value)} placeholder="Ex.: Pagamento de aluguel" required/></label><div className="form-grid"><label>Data<input type="date" value={deadlineDate} onChange={e=>setDeadlineDate(e.target.value)} required/></label>{calendarEnabled&&workCalendar.adjustDeadline(deadlineDate)!==deadlineDate&&<p className="deadline-adjustment">Prazo antecipado para {new Date(workCalendar.adjustDeadline(deadlineDate)+'T12:00:00').toLocaleDateString('pt-BR')}</p>}<label>Tipo<select value={deadlineType} onChange={e=>setDeadlineType(e.target.value)}><option value="payment">Pagamento</option><option value="commitment">Compromisso</option><option value="task">Tarefa</option><option value="other">Outro</option></select></label></div><label>Recorrência<select disabled={savingDeadline} value={deadlineRecurrence} onChange={event=>{
 setDeadlineRecurrence(event.target.value);
 if(event.target.value==='weekly'&&!deadlineDays.length)setDeadlineDays([new Date(deadlineDate+'T12:00:00').getDay()]);
 }}><option value="none">Não se repete</option><option value="weekly">Semanal</option><option value="monthly">Mensal</option></select></label>{deadlineRecurrence==='weekly'&&<fieldset className="deadline-weekdays" disabled={savingDeadline}>
 <legend>Dias da semana</legend>
 <div>{[['Domingo',0],['Segunda',1],['Terça',2],['Quarta',3],['Quinta',4],['Sexta',5],['Sábado',6]].map(([label,day])=>
  <label key={day}><input type="checkbox" checked={deadlineDays.includes(day)}
   onChange={event=>setDeadlineDays(old=>event.target.checked?[...old,day]:old.filter(item=>item!==day))}/>{label}</label>)}</div>
 </fieldset>}
 {deadlineRecurrence!=='none'&&<label>Repetir até (opcional)<input type="date" min={deadlineDate} value={deadlineEnd} onChange={e=>setDeadlineEnd(e.target.value)}/></label>}<label>Observações<textarea rows="3" value={deadlineDescription} onChange={e=>setDeadlineDescription(e.target.value)} placeholder="Detalhes adicionais"/></label><p role="alert">{deadlineError}</p><div className="modal-actions">{editingDeadlineId&&<button type="button" className="secondary" disabled={savingDeadline} onClick={async()=>{const ev=deadlineEvents.find(item=>item.id===editingDeadlineId);if(ev)await deleteDeadline(ev)}}>Excluir</button>}<button type="button" className="secondary" onClick={closeDeadlineForm}>Cancelar</button><button className="primary" disabled={savingDeadline}><Save size={16}/> {savingDeadline?'Salvando…':editingDeadlineId?'Confirmar alteração':'Salvar prazo'}</button></div></form></div>}{showTemplateForm&&<div className="overlay" onClick={()=>setShowTemplateForm(false)}><form className="modal" onClick={e=>e.stopPropagation()} onSubmit={saveTemplate}><div className="modal-head"><div><p className="eyebrow">MENSAGENS PRONTAS</p><h2>Criar modelo</h2></div><button type="button" className="icon-btn" onClick={()=>setShowTemplateForm(false)}><X/></button></div><label>Nome do modelo<input value={templateTitle} onChange={e=>setTemplateTitle(e.target.value)} placeholder="Ex.: Agendamento de exame" required/></label><label>Texto da mensagem<textarea rows="7" value={templateBody} onChange={e=>setTemplateBody(e.target.value)} placeholder="Olá, {{nome}}! Seu exame está agendado para {{data}}." required/></label><label className="weekday"><input type="checkbox" checked={templateHasDate} onChange={e=>setTemplateHasDate(e.target.checked)}/> Usar campo de data variável</label><p className="muted">Use {'{{nome}}'} no texto. Quando a data for necessária, marque a opção e use {'{{data}}'}.</p><div className="modal-actions">{editingDeadlineId&&<button type="button" className="secondary" onClick={async()=>{const ev=deadlineEvents.find(item=>item.id===editingDeadlineId);if(ev)await deleteDeadline(ev)}}>Excluir</button>}<button type="button" className="secondary" onClick={()=>setShowTemplateForm(false)}>Cancelar</button><button className="primary">Salvar modelo</button></div></form></div>}
 {showRecordForm&&<div className="overlay" onClick={()=>setShowRecordForm(false)}><form className="modal modal-wide" onClick={e=>e.stopPropagation()} onSubmit={saveRecord}><div className="modal-head"><div><p className="eyebrow">CADASTROS</p><h2>{recordType==='company'?'Cadastro completo de empresa':recordType==='credential'?'Novo login': 'Novo contato'}</h2></div><button type="button" className="icon-btn" onClick={()=>setShowRecordForm(false)}><X/></button></div><label>Descrição / identificação<input value={recordTitle} onChange={e=>setRecordTitle(e.target.value)} placeholder={recordType==='company'?'Nome da empresa':recordType==='credential'?'Ex.: Sistema de ponto':'Ex.: Contato financeiro'} required/></label><label>Descrição complementar<input value={recordDescription} onChange={e=>setRecordDescription(e.target.value)} placeholder="Observações"/></label>{recordType==='company'&&<><div className="form-grid"><label>Razão social<input value={company.razao} onChange={e=>setCompany({...company,razao:e.target.value})}/></label><label>Nome fantasia<input value={company.fantasia} onChange={e=>setCompany({...company,fantasia:e.target.value})}/></label></div><div className="form-grid"><label>CNPJ<input value={company.cnpj} onChange={e=>setCompany({...company,cnpj:mask(e.target.value,'cnpj')})} placeholder="00.000.000/0000-00"/></label><label>Inscrição estadual<input value={company.ie} onChange={e=>setCompany({...company,ie:e.target.value})}/></label></div><div className="form-grid"><label>CEP<input value={company.cep} onChange={e=>setCompany({...company,cep:mask(e.target.value,'cep')})} placeholder="00000-000"/></label><label>Rua / Avenida<input value={company.street} onChange={e=>setCompany({...company,street:e.target.value})}/></label></div><div className="form-grid"><label>Número<input value={company.number} onChange={e=>setCompany({...company,number:e.target.value})}/></label><label>Complemento<input value={company.complement} onChange={e=>setCompany({...company,complement:e.target.value})}/></label></div><div className="form-grid"><label>Bairro<input value={company.district} onChange={e=>setCompany({...company,district:e.target.value})}/></label><label>Cidade<input value={company.city} onChange={e=>setCompany({...company,city:e.target.value})}/></label></div><div className="form-grid"><label>Estado<input value={company.state} onChange={e=>setCompany({...company,state:e.target.value.toUpperCase().slice(0,2)})}/></label><label>Telefone<input value={company.phone} onChange={e=>setCompany({...company,phone:mask(e.target.value,'phone')})} placeholder="(00) 00000-0000"/></label></div><div className="form-grid"><label>E-mail<input type="email" value={company.email} onChange={e=>setCompany({...company,email:e.target.value})}/></label><label>Responsável<input value={company.responsible} onChange={e=>setCompany({...company,responsible:e.target.value})}/></label></div></>}{recordType==='contact'&&<><label>Nome do contato<input value={contact.name} onChange={e=>setContact({...contact,name:e.target.value})}/></label><label>Telefone<input value={contact.phone} onChange={e=>setContact({...contact,phone:mask(e.target.value,'phone')})} placeholder="(00) 00000-0000"/></label><label>E-mail<input type="email" value={contact.email} onChange={e=>setContact({...contact,email:e.target.value})}/></label></>}{recordType==='credential'&&<><label>Login<input value={login.username} onChange={e=>setLogin({...login,username:e.target.value})}/></label><label>Senha<input type="password" value={login.password} onChange={e=>setLogin({...login,password:e.target.value})} required/></label><label>Outros dados<input value={login.other} onChange={e=>setLogin({...login,other:e.target.value})} placeholder="URL, usuário adicional, observações..."/></label></>}<div className="modal-actions"><button type="button" className="secondary" onClick={()=>setShowRecordForm(false)}>Cancelar</button><button className="primary"><Save size={16}/> Salvar cadastro</button></div></form></div>}
 </>}
 {!anelisa&&viewingRecord&&<RecordViewer key={viewingRecord.id} record={viewingRecord}
  readPassword={master=>readCredential(supabase,user.id,viewingRecord,master)}
  onClose={()=>setViewingRecord(null)}
  onEdit={()=>{setEditingEntry({table:'quick_records',entry:viewingRecord});setViewingRecord(null)}}/>}
 {!anelisa&&editingActivity&&<ActivityEditor key={editingActivity.id} task={editingActivity} date={dateToday}
  workdaysOnly onSave={saveActivity} onDelete={()=>removeActivity(editingActivity)} onClose={()=>setEditingActivity(null)}/>}
 {!anelisa&&editingEntry&&<NeemiasEntryEditor key={editingEntry.entry.id} {...editingEntry}
  encryptValue={password=>encryptCredential(supabase,user.id,password)} onSave={values=>saveEntry(editingEntry.table,editingEntry.entry,values)}
  onDelete={()=>removeEntry(editingEntry.table,editingEntry.entry)} onClose={()=>setEditingEntry(null)}/>}
 {showAdd&&<div className="overlay" onClick={()=>setShowAdd(false)}><form className="modal" onClick={e=>e.stopPropagation()} onSubmit={addTask}><div className="modal-head"><div><p className="eyebrow">NOVA ATIVIDADE</p><h2>O que precisa ser feito?</h2></div><button type="button" className="icon-btn" onClick={()=>setShowAdd(false)}><X/></button></div><label>Título<input autoFocus value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex.: Revisar planejamento da semana" required/></label><div className="form-grid"><label>Tipo<select value={taskType} onChange={e=>setTaskType(e.target.value)}><option value="demand">Demanda</option><option value="routine">Rotina</option></select></label><label>{taskType==='routine'?'Data de início':'Prazo de conclusão'}<input type="date" value={due} onChange={e=>setDue(e.target.value)} required/></label></div>{taskType==='routine'&&<><label>Periodicidade<select value={recurrence} onChange={e=>setRecurrence(e.target.value)}><option value="daily">{calendarEnabled?'Todos os dias de trabalho':'Todos os dias'}</option><option value="weekly">Dias da semana</option><option value="monthly">Mensal</option></select></label>{recurrence==='monthly'&&<label>Dia do mês<select value={monthDay} onChange={e=>setMonthDay(Number(e.target.value))}>{Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>{d}º dia</option>)}</select><small className="field-hint">A rotina será programada para o dia {monthDay} de cada mês.</small></label>}{recurrence==='weekly'&&<div className="weekday-picker"><span>Dias da semana</span><div>{[['Dom',0],['Seg',1],['Ter',2],['Qua',3],['Qui',4],['Sex',5],['Sáb',6]].map(([day,n])=><label key={n} className="weekday"><input type="checkbox" checked={recurrenceDays.includes(n)} onChange={e=>setRecurrenceDays(e.target.checked?[...recurrenceDays,n]:recurrenceDays.filter(x=>x!==n))}/>{day}</label>)}</div></div>}</>}<div className="modal-actions"><button type="button" className="secondary" onClick={()=>setShowAdd(false)}>Cancelar</button><button className="primary">Salvar atividade</button></div></form></div>}
 {toast&&<div className="toast" role="status">{toast}</div>}</div>
}
createRoot(document.getElementById('root')).render(<App/>);