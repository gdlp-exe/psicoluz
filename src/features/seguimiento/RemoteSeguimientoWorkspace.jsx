import {useState} from 'react';
import SeguimientoWorkspace from './SeguimientoWorkspace';
import {createRemoteFollowup} from './remote';
export default function RemoteSeguimientoWorkspace({client,identity,onSignOut}){const[repository]=useState(()=>createRemoteFollowup(client));return <SeguimientoWorkspace connection={{repository,identity,onSignOut}}/>;}
