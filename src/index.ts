import { ActionContext, Store } from "vuex";

const useRootNamespace = { root: true };

export function Handler(target: any, key: string) {
    target[key]._vuexKey = key;
}

export type MutationHandler<TModuleState, TPayload> =
    (state: TModuleState, payload: TPayload) => void;
export type PayloadlessMutationHandler<TModuleState> =
    (state: TModuleState) => void;

export type ActionHandler<TModuleState, TRootState, TPayload, TResult> =
    (injectee: ActionContext<TModuleState, TRootState>, payload: TPayload) => void | Promise<TResult>;
export type PayloadlessActionHandler<TModuleState, TRootState, TResult> =
    (injectee: ActionContext<TModuleState, TRootState>) => void | Promise<TResult>;

export type GetterHandler<TModuleState, TRootState, TResult> =
    (state: TModuleState, rootState: TRootState) => TResult;

export type GetAccessor<TModuleState, TRootState, TResult> =
    (store: Store<TRootState> | ActionContext<TModuleState, TRootState>) => TResult;

export type DispatchAccessor<TModuleState, TRootState, TPayload, TResult> =
    (store: Store<TRootState> | ActionContext<TModuleState, TRootState>,
    payload: TPayload) => Promise<TResult>;
export type PayloadlessDispatchAccessor<TModuleState, TRootState, TResult> =
    (store: Store<TRootState> | ActionContext<TModuleState, TRootState>) => Promise<TResult>;

export type CommitAccessor<TModuleState, TRootState, TPayload> =
    (store: Store<TRootState> | ActionContext<TModuleState, TRootState>,
    payload: TPayload) => void;
export type PayloadlessCommitAccessor<TModuleState, TRootState> =
    (store: Store<TRootState> | ActionContext<TModuleState, TRootState>) => void;

export interface StoreAccessors<TModuleState, TRootState> {
    commit<TPayload>(
        handler: MutationHandler<TModuleState, TPayload>):
            CommitAccessor<TModuleState, TRootState, TPayload>;
    commitNoPayload(
        handler: PayloadlessMutationHandler<TModuleState>):
            PayloadlessCommitAccessor<TModuleState, TRootState>;

    dispatch<TPayload, TResult>(
        handler: ActionHandler<TModuleState, TRootState, TPayload, TResult>):
            DispatchAccessor<TModuleState, TRootState, TPayload, TResult>;
    dispatchNoPayload<TResult>(
        handler: PayloadlessActionHandler<TModuleState, TRootState, TResult>):
            PayloadlessDispatchAccessor<TModuleState, TRootState, TResult>;

    read<TResult>(
        handler: GetterHandler<TModuleState, TRootState, TResult>):
            GetAccessor<TModuleState, TRootState, TResult>;
}

export function getStoreAccessors<TModuleState, TRootState>(
    namespace: string): StoreAccessors<TModuleState, TRootState> {
        return {
            commit: <TPayload>(handler: MutationHandler<TModuleState, TPayload>) =>
                commit(handler, namespace),
            commitNoPayload: (handler: PayloadlessMutationHandler<TModuleState>) =>
                commitNoPayload(handler, namespace),

            dispatch: <TPayload, TResult>(handler: ActionHandler<TModuleState, TRootState, TPayload, TResult>) =>
                dispatch(handler, namespace),
            dispatchNoPayload: <TResult>(handler: PayloadlessActionHandler<TModuleState, TRootState, TResult>) =>
                dispatchNoPayload(handler, namespace),
            read: <TResult>(handler: GetterHandler<TModuleState, TRootState, TResult>) =>
                read(handler, namespace),
        };
}

function read<TModuleState, TRootState, TResult>(
    handler: GetterHandler<TModuleState, TRootState, TResult>,
    namespace: string): GetAccessor<TModuleState, TRootState, TResult> {
        const key = qualifyKey(handler, namespace);
        return (store: any) => {
            return store.rootGetters
                ? <TResult>store.rootGetters[key] // ActionContext
                : <TResult>store.getters[key]; // Store
        };
    }

function dispatch<TModuleState, TRootState, TPayload, TResult>(
    handler: ActionHandler<TModuleState, TRootState, TPayload, TResult>,
    namespace: string): DispatchAccessor<TModuleState, TRootState, TPayload, TResult> {
        const key = qualifyKey(handler, namespace);
        return (store, payload) => {
            return <any>store.dispatch(key, payload, useRootNamespace);
        };
}

function dispatchNoPayload<TModuleState, TRootState, TResult>(
    handler: PayloadlessActionHandler<TModuleState, TRootState, TResult>,
    namespace: string): PayloadlessDispatchAccessor<TModuleState, TRootState, TResult> {
        const key = qualifyKey(handler, namespace);
        return (store) => {
            return <any>store.dispatch(key, undefined, useRootNamespace);
        };
}

function commit<TModuleState, TRootState, TPayload>(
    handler: MutationHandler<TModuleState, TPayload>,
    namespace: string): CommitAccessor<TModuleState, TRootState, TPayload> {
        const key = qualifyKey(handler, namespace);
        return (store, payload) => {
            store.commit(key, payload, useRootNamespace);
        };
}

function commitNoPayload<TModuleState, TRootState>(
    handler: PayloadlessMutationHandler<TModuleState>,
    namespace: string): PayloadlessCommitAccessor<TModuleState, TRootState> {
        const key = qualifyKey(handler, namespace);
        return (store) => {
            store.commit(key, undefined, useRootNamespace);
        };
}

function qualifyKey(handler: Function, namespace?: string) {
    const key = (<any>handler).name || (<any>handler)._vuexKey;
    if (!key) {
        throw new Error("Vuex handler functions must not be anonymous. "
            + "Vuex needs a key by which it identifies a handler. "
            + "If you define handler as class member you must decorate it with @Handler.");
    }
    return namespace
        ? `${namespace}/${key}`
        : key;
}
