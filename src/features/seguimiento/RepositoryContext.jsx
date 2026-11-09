import {createContext,useContext} from 'react';
import {seguimientoRepository} from './repository';
export const FollowupRepositoryContext=createContext(seguimientoRepository);
export function useFollowupRepository(){return useContext(FollowupRepositoryContext);}
