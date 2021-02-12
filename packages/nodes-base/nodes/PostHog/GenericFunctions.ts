import {
	OptionsWithUri,
} from 'request';

import {
	IExecuteFunctions,
	IExecuteSingleFunctions,
	ILoadOptionsFunctions,
} from 'n8n-core';

import {
	IDataObject,
} from 'n8n-workflow';

export async function posthogApiRequest(this: IExecuteFunctions | ILoadOptionsFunctions, method: string, path: string, body: any = {}, qs: IDataObject = {}, option = {}): Promise<any> { // tslint:disable-line:no-any

	const credentials = this.getCredentials('postHogApi') as IDataObject;

	const base = credentials.url as string;

	body.api_key = credentials.apiKey as string;

	const options: OptionsWithUri = {
		headers: {
			'Content-Type': 'application/json',
		},
		method,
		body,
		qs,
		uri: `${base}${path}`,
		json: true,
	};
	console.log(options);
	try {
		if (Object.keys(body).length === 0) {
			delete options.body;
		}
		//@ts-ignore
		return await this.helpers.request.call(this, options);
	} catch (error) {
		if (error.response && error.response.body && error.response.body.error) {

			const message = error.response.body.error;
			// Try to return the error prettier
			throw new Error(
				`PosHog error response [${error.statusCode}]: ${message}`,
			);
		}
		throw error;
	}
}

export interface IEvent {
	event: string;
	// tslint:disable-next-line: no-any
	properties: { [key: string]: any };
}