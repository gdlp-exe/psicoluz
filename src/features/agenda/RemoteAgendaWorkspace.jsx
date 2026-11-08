import {useState} from 'react';
import AgendaWorkspace from './AgendaWorkspace';
import {createRemoteAgenda} from './remote';
export default function RemoteAgendaWorkspace({client,identity,onSignOut}){const [repository]=useState(()=>createRemoteAgenda(client));return <AgendaWorkspace connection={{repository,identity,onSignOut}}/>;}
