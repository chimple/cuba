export interface CatchErrorOptions {
    catchFunction: CatchCallback;
}

export type CatchCallback = (errMessage?: string, errStack?: string, funcName?: string, className?: string, context?: any, args?: any[]) => void;

type CatchOptions = {
    funcName: string;
    className: string;
}

function logError(errMessage: string, errStack: string, funcName: string, className: string, context: any, args: any[]) {
}

export function catchError<T>(options?: CatchErrorOptions): any {

}

export default catchError;
