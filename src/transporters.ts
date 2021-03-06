// tslint:disable:max-classes-per-file

/**
 * transporters
 * @ignore
 */

import * as createDebug from 'debug';
import * as querystring from 'querystring';
import * as request from 'request-promise-native';
// import * as fetch from 'isomorphic-fetch';

import { BadRequestError } from './error/badRequest';

const debug = createDebug('gmo-service:transporters');
// tslint:disable-next-line
const pkg = require('../package.json');

/**
 * transporter abstract class
 * トランスポーター抽象クラス
 * @export
 * @class
 * @abstract
 */
// export abstract class Transporter {
//     public abstract async request(url: string, options: RequestInit): Promise<any>;
// }
export abstract class Transporter {
    public abstract async request(options: request.OptionsWithUrl): Promise<any>;
}

export type IBodyResponseCallback = Promise<any>;

/**
 * RequestError
 * @export
 * @class
 */
export class RequestError extends Error {
    public code: number;
    public errors: Error[];
}

/**
 * stub transporter
 * スタブトランポーター
 * @export
 * @class
 */
// export class StubTransporter implements Transporter {
//     public body: any;
//     constructor(body: any) {
//         this.body = body;
//     }

//     public async request(url: string, options: RequestInit) {
//         debug('requesting...', url, options);

//         return this.body;
//     }
// }
export class StubTransporter implements Transporter {
    public body: any;
    constructor(body: any) {
        this.body = body;
    }

    public async request(options: request.OptionsWithUrl) {
        debug('requesting...', options);

        return this.body;
    }
}

/**
 * DefaultTransporter
 * @export
 * @class
 */
// export class DefaultTransporter implements Transporter {
//     /**
//      * Default user agent.
//      */
//     public static readonly USER_AGENT: string = `gmo-service-nodejs-client/${pkg.version}`;

//     /**
//      * Configures request options before making a request.
//      */
//     public static CONFIGURE(options: RequestInit): RequestInit {
//         // set transporter user agent
//         options.headers = (options.headers !== undefined) ? options.headers : {};
//         // tslint:disable-next-line:no-single-line-block-comment
//         /* istanbul ignore else */
//         if (!(<any>options.headers)['User-Agent']) {
//             (<any>options.headers)['User-Agent'] = DefaultTransporter.USER_AGENT;
//         } else if ((<any>options.headers)['User-Agent'].indexOf(DefaultTransporter.USER_AGENT) === -1) {
//             (<any>options.headers)['User-Agent'] = `${(<any>options.headers)['User-Agent']} ${DefaultTransporter.USER_AGENT}`;
//         }

//         return options;
//     }

//     /**
//      * Makes a request with given options and invokes callback.
//      */
//     public async request(url: string, options: RequestInit) {
//         const fetchOptions = DefaultTransporter.CONFIGURE(options);

//         debug('fetching...', url, fetchOptions);

//         return fetch(url, fetchOptions).then(async (response) => this.wrapCallback(response));
//     }

//     /**
//      * Wraps the response callback.
//      */
//     // tslint:disable-next-line:prefer-function-over-method
//     private async wrapCallback(response: Response): Promise<any> {
//         const err: RequestError = new RequestError('An unexpected error occurred');

//         debug('request processed', response.status);
//         if (Number.isInteger(response.status)) {
//             return response.clone().text();
//         }

//         // if (this.expectedStatusCodes.indexOf(response.status) < 0) {
//         //     // Consider all 4xx and 5xx responses errors.
//         //     let body: any;
//         //     try {
//         //         // Only and only application/json responses should
//         //         // be decoded back to JSON, but there are cases API back-ends
//         //         // responds without proper content-type.
//         //         body = await response.clone().json();
//         //     } catch (error) {
//         //         body = await response.clone().text();
//         //     }

//         //     if (typeof body === 'object' && body.error !== undefined) {
//         //         err = new RequestError(body.error.message);
//         //         err.code = response.status;
//         //         err.errors = body.error.errors;
//         //     } else {
//         //         err = new RequestError(body);
//         //         err.code = response.status;
//         //         err.errors = [];
//         //     }
//         // } else {
//         //     if (response.status === NO_CONTENT) {
//         //         // consider 204
//         //         return;
//         //     } else {
//         //         // consider 200,201
//         //         return response.json();
//         //     }
//         // }

//         throw err;
//     }
// }

/**
 * DefaultTransporter
 * @export
 * @class
 */
export class DefaultTransporter implements Transporter {
    /**
     * Default user agent.
     */
    public static readonly USER_AGENT: string = `gmo-service-nodejs-client/${pkg.version}`;

    public expectedStatusCodes: number[];

    constructor(expectedStatusCodes: number[]) {
        this.expectedStatusCodes = expectedStatusCodes;
    }

    /**
     * Configures request options before making a request.
     */
    public static CONFIGURE(options: request.OptionsWithUrl): request.OptionsWithUrl {
        // set transporter user agent
        options.headers = (options.headers !== undefined) ? options.headers : {};
        if (!options.headers['User-Agent']) {
            options.headers['User-Agent'] = DefaultTransporter.USER_AGENT;
        } else if (options.headers['User-Agent'].indexOf(DefaultTransporter.USER_AGENT) === -1) {
            options.headers['User-Agent'] = `${options.headers['User-Agent']} ${DefaultTransporter.USER_AGENT}`;
        }

        options.resolveWithFullResponse = true;
        options.simple = false;

        return options;
    }

    /**
     * Makes a request with given options and invokes callback.
     */
    public async request(options: request.OptionsWithUrl) {
        const requestOptions = DefaultTransporter.CONFIGURE(options);
        debug('requesting...', requestOptions);

        return request(requestOptions).then((res) => this.wrapCallback(res));
    }

    /**
     * Wraps the response callback.
     */
    private wrapCallback(res: request.FullResponse): any {
        debug('request processed.', res.statusCode, res.body);
        let err: any = new RequestError('An unexpected error occurred');

        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (res.statusCode !== undefined) {
            if (this.expectedStatusCodes.indexOf(res.statusCode) < 0) {
                err = new RequestError(res.body);
                err.code = res.statusCode;
                err.errors = [];
            } else {
                const result = querystring.parse(res.body);
                if (result.ErrCode !== undefined) {
                    // GMOのエラー結果
                    err = new BadRequestError(res.body);
                } else {
                    // 結果をオブジェクトとして返却
                    return result;
                }
            }
        }

        throw err;
    }
}
