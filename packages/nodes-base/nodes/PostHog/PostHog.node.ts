import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import {
	IEvent,
	posthogApiRequest,
} from './GenericFunctions';

import * as moment from 'moment-timezone';

export class PostHog implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PostHog',
		name: 'postHog',
		icon: 'file:postHog.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume PostHog API.',
		defaults: {
			name: 'PostHog',
			color: '#000000',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'postHogApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Event',
						value: 'event',
					},
				],
				default: 'event',
				description: 'The resource to operate on.',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: [
							'event',
						],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
					},
				],
				default: 'create',
				description: 'The resource to operate on.',
			},
			{
				displayName: 'Event Name',
				name: 'eventName',
				type: 'string',
				displayOptions: {
					show: {
						resource: [
							'event',
						],
						operation: [
							'create',
						],
					},
				},
				default: '',
				description: 'The name of the event',
			},
			{
				displayName: 'Distinct ID',
				name: 'distinctId',
				type: 'string',
				displayOptions: {
					show: {
						resource: [
							'event',
						],
						operation: [
							'create',
						],
					},
				},
				default: '',
				description: `User's distinct id`,
			},
			{
				displayName: 'Properties',
				name: 'propertiesUi',
				type: 'fixedCollection',
				placeholder: 'Add Property',
				default: {},
				displayOptions: {
					show: {
						resource: [
							'event',
						],
						operation: [
							'create',
						],
					},
				},
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						displayName: 'Property',
						name: 'propertyValues',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: [
							'event',
						],
						operation: [
							'create',
						],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Timestamp',
						name: 'timestamp',
						type: 'dateTime',
						default: '',
						description: 'Timestamp of the event',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const length = (items.length as unknown) as number;
		const qs: IDataObject = {};
		let responseData;
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		for (let i = 0; i < length; i++) {

			if (resource === 'event') {
				if (operation === 'create') {
					const eventName = this.getNodeParameter('eventName', i) as string;

					const distinctId = this.getNodeParameter('distinctId', i) as string;

					const properties = (this.getNodeParameter('propertiesUi', i) as IDataObject || {}).propertyValues as IDataObject[] || [];

					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const body: IEvent = {
						event: eventName,
						properties: properties.reduce((obj, value) => Object.assign(obj, { [`${value.key}`]: value.value }), {}),
					};

					body.properties['distinct_id'] = distinctId;

					Object.assign(body, additionalFields);

					if (additionalFields.timestamp) {
						additionalFields.timestamp = moment(additionalFields.timestamp as string).toISOString();
					}

					responseData = await posthogApiRequest.call(this, 'POST', '/capture', body);
				}
			}
			if (Array.isArray(responseData)) {
				returnData.push.apply(returnData, responseData as IDataObject[]);

			} else if (responseData !== undefined) {
				returnData.push(responseData as IDataObject);
			}
		}
		return [this.helpers.returnJsonArray(returnData)];
	}
}
